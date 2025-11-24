import React, { createContext, useContext, useEffect, useState } from "react";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import axios from "axios";

import storePushTokenDirectly from "../utils/storePushTokenDirectly";

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const router = useRouter();

	const [user, setUser] = useState(null);
	const [justSignup, setJustSignup] = useState(false);
	const [role, setRole] = useState(null);
	const [isCandidate, setIsCandidate] = useState(null); // Ces états semblent être pour la redirection, pas pour le rôle direct
	const [isCompany, setIsCompany] = useState(null);
	const [accessToken, setAccessToken] = useState(null);
	const [loading, setLoading] = useState(true); // Vrai initialement
	const [userProfile, setUserProfile] = useState(null); // Pour les candidats
	const [userCompany, setUserCompany] = useState(null); // Pour les entreprises (l'objet complet de la compagnie)
	const [hasSubscription, setHasSubscription] = useState(false);

	useEffect(() => {
		console.warn("AuthContext - role changed:", role);
	}, [role]);

	const saveSession = async ({ access_token, refresh_token, user }) => {
		await SecureStore.setItemAsync("access_token", access_token);
		await SecureStore.setItemAsync("refresh_token", refresh_token);
		setAccessToken(access_token);
		setUser(user);
	};

	const getUserRole = async (userId, token) => {
		try {
			const profileRes = await axios.get(
				`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						apikey: SUPABASE_API_KEY,
					},
				}
			);
			if (profileRes.data.length > 0) return "candidat";

			const companyRes = await axios.get(
				`${SUPABASE_URL}/rest/v1/companies?id=eq.${userId}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						apikey: SUPABASE_API_KEY,
					},
				}
			);
			if (companyRes.data.length > 0) return "pro";

			return "unknown";
		} catch (err) {
			console.error("Erreur lors du check rôle:", err);
			return "error";
		}
	};

	// --- Modifié: fetchProfileFromSession pour retourner les données ---
	const fetchProfileFromSession = async (userId, token) => {
		try {
			const res = await axios.get(
				`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*,procards(*)`,
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						Authorization: `Bearer ${token}`,
					},
				}
			);
			console.warn("Profile user data:", res.data[0]);
			if (res.data.length === 0) {
				console.warn("Profile not found for user:", userId);
				return null;
			}
			return res.data[0];
		} catch (error) {
			console.error("Error fetching profile from session:", error);
			return null;
		}
	};

	const fetchCompanyFromSession = async (userId, token) => {
		try {
			const res = await axios.get(
				`${SUPABASE_URL}/rest/v1/companies?id=eq.${userId}&select=*`,
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (res.data.length === 0) {
				console.warn("Company not found for user:", userId);
				return null;
			}
			return res.data[0];
		} catch (error) {
			console.error("Error fetching company from session:", error);
			return null;
		}
	};

	const signIn = async (email, password) => {
		setLoading(true);
		try {
			const { data } = await axios.post(
				`${SUPABASE_URL}/auth/v1/token?grant_type=password`,
				{ email, password },
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						"Content-Type": "application/json",
					},
				}
			);

			await saveSession(data);

			await loadUserData(data.user.id, data.access_token);

			// const userCompanyId = await loadUserData(
			// 	data.user.id,
			// 	data.access_token
			// );
			console.log("User company ID after sign-in:", data.user.id);

			// --- NOUVELLE ÉTAPE : Stocker le Push Token ---
			// const userId = data.user.id;

			// if (userId) {
			// 	await storePushTokenDirectly(userId, data.access_token);
			// } else {
			// 	console.warn(
			// 		"Skipping push token storage: Missing user ID or company ID after sign-in."
			// 	);
			// }
			// --- FIN NOUVELLE ÉTAPE ---

			console.log("Connexion OK.");
		} catch (err) {
			console.error(
				"Erreur connexion:",
				err?.response?.data || err.message
			);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	const signUp = async (email, password, isCandidateFlag, isCompanyFlag) => {
		// Renommé les args pour éviter confusion
		setLoading(true); // Mettre loading à true au début du signup
		try {
			const { data } = await axios.post(
				`${SUPABASE_URL}/auth/v1/signup`,
				{ email, password },
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						"Content-Type": "application/json",
					},
				}
			);
			if (data) {
				console.log(
					"Sign up data.id :",
					data?.user,
					data?.user?.id,
					data?.user?.app_metadata?.id
				);
				setUser(data.user);
				setAccessToken(data.access_token);
			}
			if (!data?.access_token || !data?.user?.id) {
				throw new Error("Inscription échouée ou données incomplètes.");
			}

			// setUser(data.app_metadata);
			setJustSignup(true); // Indique qu'on vient de s'inscrire

			await saveSession(data); // Sauvegarde le token et l'utilisateur de base

			// Après avoir sauvegardé la session, rechargez toutes les données de l'utilisateur
			// C'est ici que le rôle et le profil/entreprise seront déterminés
			await loadUserData(data.user.id, data.access_token);

			// Redirection basée sur le rôle détecté après le chargement complet des données
			if (isCompanyFlag) {
				router.replace("/createcompany"); // Redirige après l'inscription
			} else if (isCandidateFlag) {
				router.replace("/createprofile"); // Redirige après l'inscription
			}
		} catch (error) {
			console.error(
				"Erreur lors de l'inscription :",
				error.response?.data || error.message
			);
			throw error;
		} finally {
			setLoading(false); // Mettre loading à false à la fin du signup
		}
	};

	const signOut = async () => {
		await SecureStore.deleteItemAsync("access_token");
		await SecureStore.deleteItemAsync("refresh_token");
		setUser(null);
		setRole(null);
		setAccessToken(null);
		setUserProfile(null); // Réinitialiser
		setUserCompany(null); // Réinitialiser
		setHasSubscription(false); // Réinitialiser
		setLoading(false); // Pas de chargement après déconnexion
		console.log("sign out ok !");
		router.replace("/signin");
	};

	const refreshToken = async () => {
		const refresh_token = await SecureStore.getItemAsync("refresh_token");
		if (!refresh_token) throw new Error("No refresh token found");

		const { data } = await axios.post(
			`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
			{ refresh_token },
			{
				headers: {
					apikey: SUPABASE_API_KEY,
					"Content-Type": "application/json",
				},
			}
		);

		await saveSession(data);
		return data.access_token;
	};

	const buildQueryString = (column, value) => {
		return `${column}=eq.${value}`;
	};

	// --- NOUVEAU: Fonction pour charger toutes les données de l'utilisateur ---
	const loadUserData = async (userId, token) => {
		if (!userId || !token) {
			console.warn("loadUserData called without userId or token.");
			setUser(null);
			setRole(null);
			setUserProfile(null);
			setUserCompany(null);
			setHasSubscription(false);
			return;
		}

		try {
			// 1. Obtenir le rôle
			const detectedRole = await getUserRole(userId, token);
			setRole(detectedRole);

			// 2. Récupérer le profil ou l'entreprise en fonction du rôle
			if (detectedRole === "candidat") {
				const profile = await fetchProfileFromSession(userId, token);
				setUserProfile(profile);
				setUserCompany(null); // S'assurer que l'autre est null
				if (profile) {
					setIsCandidate(true); // Pour la redirection si nécessaire
					setIsCompany(false);
				}
			} else if (detectedRole === "pro") {
				console.warn("iscompany in authcontext");
				const companyData = await fetchCompanyFromSession(
					userId,
					token
				);
				console.log("companyData in authcontext:", companyData);
				setUserCompany(companyData); // Ceci est l'objet complet de la compagnie
				setUserProfile(null); // S'assurer que l'autre est null
				if (companyData) {
					setIsCompany(true); // Pour la redirection si nécessaire
					setIsCandidate(false);
					// Vérifier l'abonnement ici si companyData est disponible
					const hasSub = await checkSubscription(
						companyData.id,
						token
					); // Passer l'accessToken
					setHasSubscription(hasSub);
				}
			} else {
				console.warn("Rôle utilisateur inconnu ou non géré.");
				setUserProfile(null);
				setUserCompany(null);
				setHasSubscription(false);
			}
			console.log("Données utilisateur chargées. Rôle:", detectedRole);
			setLoading(false);
		} catch (error) {
			console.error(
				"Erreur lors du chargement des données utilisateur:",
				error
			);
			// Gérer les erreurs de chargement de données ici
		}
	};

	// --- Modifié: loadSession pour utiliser loadUserData ---
	const loadSession = async () => {
		setLoading(true); // Assurez-vous que loading est true au début
		const token = await SecureStore.getItemAsync("access_token");
		const refresh_token = await SecureStore.getItemAsync("refresh_token");

		if (token) {
			try {
				// Récupérer les données de l'utilisateur de base via l'API Supabase Auth
				const { data: userData } = await axios.get(
					`${SUPABASE_URL}/auth/v1/user`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
							apikey: SUPABASE_API_KEY,
						},
					}
				);

				setUser(userData); // Définir l'utilisateur de base
				setAccessToken(token);

				// Charger toutes les données supplémentaires (rôle, profil/entreprise, abonnement)
				await loadUserData(userData.id, token);
			} catch (err) {
				if (err.response?.status === 401 && refresh_token) {
					try {
						const newAccessToken = await refreshToken();
						// Après refresh, recharger les données de l'utilisateur avec le nouveau token
						const { data: newUserData } = await axios.get(
							`${SUPABASE_URL}/auth/v1/user`,
							{
								headers: {
									Authorization: `Bearer ${newAccessToken}`,
									apikey: SUPABASE_API_KEY,
								},
							}
						);
						setUser(newUserData);
						setAccessToken(newAccessToken);
						await loadUserData(newUserData.id, newAccessToken);
					} catch (refreshErr) {
						console.error(
							"Erreur lors du rafraîchissement du token:",
							refreshErr
						);
						await signOut(); // Déconnexion si refresh échoue
					}
				} else {
					console.error(
						"Erreur de chargement de session ou token invalide:",
						err
					);
					await signOut(); // Déconnexion si le token est invalide
				}
			}
		} else {
			setUser(null); // Pas de token, pas d'utilisateur
			setRole(null);
			setUserProfile(null);
			setUserCompany(null);
			setHasSubscription(false);
		}
		setLoading(false); // Le chargement est terminé
	};

	useEffect(() => {
		loadSession();
	}, []);

	// --- Modifié: checkSubscription pour prendre company_id et token en arguments ---
	const checkSubscription = async (company_id, token) => {
		if (!company_id || !token) {
			console.warn(
				"checkSubscription called without company_id or token."
			);
			return false;
		}
		try {
			const { data } = await axios.get(
				`${SUPABASE_URL}/rest/v1/subscriptions`,
				{
					headers: {
						apikey: SUPABASE_API_KEY,
						Authorization: `Bearer ${token}`,
					},
					params: {
						select: "*",
						order: "created_at.desc",
						company_id: `eq.${company_id}`, // Filtrer par company_id
						status: "in.(active,canceled)", // Filtrer par statut si RLS ne le fait pas déjà
					},
				}
			);
			console.log("check subs data :", data);

			if (data.length > 0) {
				const latestSubscription = data[0];
				// Vérifier si l'abonnement est actif (non annulé et période non expirée)
				const isActive =
					latestSubscription.status === "active" ||
					(latestSubscription.status === "canceled" &&
						new Date(latestSubscription.current_period_end) >
							new Date());

				console.log("🔐 Abonnement actif (isValid) :", isActive);
				setHasSubscription(isActive);
				return isActive;
			}
			return false;
		} catch (err) {
			console.error(
				"❌ Erreur lors de la vérification de l’abonnement :",
				err.message
			);
			return false;
		}
	};

	useEffect(() => {
		if (justSignup) {
			console.log("User just signed up, loading data...");
			loadUserData(user.id, accessToken);
			setJustSignup(false);
		}
	}, [justSignup]);

	return (
		<AuthContext.Provider
			value={{
				accessToken,
				user,
				role,
				setRole,
				userProfile,
				userCompany,
				accessToken,
				loading,
				signIn,
				signUp,
				signOut,
				refreshToken,
				loadUserData,
				loadSession,
				setJustSignup,
				checkSubscription,
				hasSubscription,
			}}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);

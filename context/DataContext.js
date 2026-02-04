// context/DataContext.jsx
import React, {
	createContext,
	useContext,
	useState,
	useMemo,
	useCallback,
} from "react";
// import dotenv from "dotenv";
import Constants from "expo-constants";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { sendApplicationEmail } from "../utils/sendApplicationEmail";

// dotenv.config();

const { SUPABASE_URL, SUPABASE_API_KEY } = Constants.expoConfig.extra;

const DataContext = createContext();

export const DataProvider = ({ children }) => {
	const { accessToken, user } = useAuth();

	const [isLoading, setIsLoading] = useState(false);

	// const accessToken = session?.access_token;

	const axiosInstance = useMemo(
		() =>
			axios.create({
				baseURL: `${SUPABASE_URL}/rest/v1`,
				headers: {
					apikey: SUPABASE_API_KEY,
					Authorization: accessToken
						? `Bearer ${accessToken}`
						: undefined,
					"Content-Type": "application/json",
				},
			}),
		[accessToken],
	);

	const isJobInWishlist = async (jobId, userId) => {
		try {
			const res = await axiosInstance.get(
				`/wishlists?job_id=eq.${jobId}&profile_id=eq.${userId}&select=wish_id`,
			);
			return res.data.length > 0;
		} catch (err) {
			console.error(
				"Error checking if job is in wishlist:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const toggleWishlistJob = async (jobId, userId) => {
		try {
			// 1. Check if the job is already in the wishlist
			const res = await axiosInstance.get(
				`/wishlists?job_id=eq.${jobId}&profile_id=eq.${userId}`,
			);
			console.log("wishlist res :", res.data, res.data.length);

			if (res.data.length > 0) {
				const wishId = res.data[0].wish_id;

				// 2. DELETE — ensure correct headers and filter by primary key
				const deleteRes = await axiosInstance.delete(
					`/wishlists?wish_id=eq.${wishId}`,
					{
						headers: {
							Prefer: "return=representation", // so you get a response back
						},
					},
				);
				console.log("deleteWish :", deleteRes.data);
				return false; // now NOT in wishlist
			} else {
				// 3. If not exists, add it
				const addWish = await axiosInstance.post(`/wishlists`, {
					job_id: jobId,
					profile_id: userId,
				});
				console.log("addWish :", addWish.data);
				return true; // now in wishlist
			}
		} catch (err) {
			console.error(
				"Error toggling wishlist:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const getWishlistJobs = async (userId) => {
		try {
			const res = await axiosInstance.get(
				`/wishlists?profile_id=eq.${userId}&select=jobs(*)`,
			);

			// Each item in res.data contains a related job
			const jobs = res.data.map((item) => item.jobs);
			return jobs;
		} catch (err) {
			console.error(
				"Error fetching wishlist jobs:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const applyToJob = async (
		candidateId,
		jobId,
		companyId,
		companyName,
		companyEmail,
		offerTitle,
		applicantName,
		applicantEmail,
	) => {
		console.log(
			"try Apply to job:",
			candidateId,
			jobId,
			companyId,
			companyName,
			companyEmail,
			offerTitle,
			applicantName,
			applicantEmail,
		);
		try {
			// 1. Créer la candidature dans /applies
			const applyRes = await axiosInstance.post(
				`/applies`,
				{
					candidate_id: candidateId,
					job_id: jobId,
					company_id: companyId,
					current_status: "applied",
				},
				{
					headers: {
						Prefer: "return=representation",
					},
				},
			);
			console.log("Applied to job:", applyRes.data);

			// 2. Créer l'événement de statut dans /application_status_events
			const applicationId = applyRes.data[0]?.id;
			if (applicationId) {
				const statusEventRes = await axiosInstance.post(
					`/application_status_events`,
					{
						application_id: applicationId,
						status: "applied",
						updated_by: "candidate",
					},
					{
						headers: {
							Prefer: "return=representation",
						},
					},
				);
				console.log("Status event created:", statusEventRes.data);
			}

			// 3. Envoyer l'email de confirmation
			console.log("Paramètres pour sendApplicationEmail:", {
				applicantName,
				applicantEmail,
				offerTitle,
				companyEmail,
				companyName,
			});
			const emailResult = await sendApplicationEmail(
				applicantName,
				applicantEmail,
				offerTitle,
				companyEmail,
				companyName,
			);
			console.log("Email send result:", emailResult);
			return applyRes.data;
		} catch (err) {
			console.error(
				"Error applying to job:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const isJobApplied = async (candidateId, jobId) => {
		try {
			const res = await axiosInstance.get(
				`/applies?candidate_id=eq.${candidateId}&job_id=eq.${jobId}&select=id`,
			);
			return res.data.length > 0; // true if applied
		} catch (err) {
			console.error(
				"Error checking job application:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const updateApplicationStatus = async (
		applicationId,
		newStatus,
		updatedBy,
	) => {
		console.log(
			"Updating application status:",
			applicationId,
			newStatus,
			updatedBy,
		);
		try {
			// 1. Mettre à jour le statut dans /applies
			const updateRes = await axiosInstance.patch(
				`/applies?id=eq.${applicationId}`,
				{
					current_status: newStatus,
				},
				{
					headers: {
						Prefer: "return=representation",
					},
				},
			);
			console.log("Application status updated:", updateRes.data);

			// 2. Créer un événement de statut dans /application_status_events
			const statusEventRes = await axiosInstance.post(
				`/application_status_events`,
				{
					application_id: applicationId,
					status: newStatus,
					updated_by: updatedBy,
				},
				{
					headers: {
						Prefer: "return=representation",
					},
				},
			);
			console.log("Status event created:", statusEventRes.data);

			return updateRes.data;
		} catch (err) {
			console.error(
				"Error updating application status:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const archiveJob = async (jobId) => {
		console.log("jobID for archive :", jobId);
		try {
			const res = await axiosInstance.patch(
				`/jobs?id=eq.${jobId}`,
				{
					isArchived: true,
				},
				{
					headers: {
						Prefer: "return=representation", // Optional, but helpful for confirmation
					},
				},
			);
			console.log("Archived job:", res.data);
			return res.data;
		} catch (err) {
			console.error(
				"Error archiving to job:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const isJobArchived = async (jobId) => {
		try {
			const res = await axiosInstance.get(
				`/jobs?id=eq.${jobId}&isArchived=eq.true`,
			);

			return res.data.length > 0; // true if applied
		} catch (err) {
			console.error(
				"Error checking job archives:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const confirmApplication = async (applicationId) => {
		console.warn("Confirmation applicationId :", applicationId);
		try {
			const res = await axiosInstance.patch(
				`/applies?id=eq.${applicationId}`,
				{
					isConfirmed: true,
					isRefused: false,
				},
				{
					headers: {
						Prefer: "return=representation", // Optional, but helpful for confirmation
					},
				},
			);
			console.log("Confirmed application :", res.data);
			return res.data;
		} catch (err) {
			console.error(
				"Error confirm application:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const selectApplication = async (applicationId, bool) => {
		console.warn("Selected applicationId :", applicationId);
		try {
			const res = await axiosInstance.patch(
				`/applies?id=eq.${applicationId}`,
				{
					isSelected: bool,
				},
				{
					headers: {
						Prefer: "return=representation", // Optional, but helpful for confirmation
					},
				},
			);
			console.log("Selected application :", res.data);
			return res.data;
		} catch (err) {
			console.error(
				"Error Select application:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const refuseApplication = async (applicationId) => {
		console.warn("Selected applicationId :", applicationId);
		try {
			const res = await axiosInstance.patch(
				`/applies?id=eq.${applicationId}`,
				{
					isRefused: true,
					isConfirmed: false,
				},
				{
					headers: {
						Prefer: "return=representation", // Optional, but helpful for confirmation
					},
				},
			);
			console.log("Refused application :", res.data);
			return res.data;
		} catch (err) {
			console.error(
				"Error Refuse application:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const proCardDelete = async (cardId) => {
		try {
			const res = await axiosInstance.patch(
				`/procards?id=eq.${cardId}`,
				{
					isDeleted: true,
				},
				{
					headers: {
						Prefer: "return=representation", // Optional, but helpful for confirmation
					},
				},
			);

			console.log("Deleted procard :", res.data);
			return res.data;
		} catch (err) {
			console.error(
				"Error delete pro card:",
				err.response?.data || err.message,
			);
			throw err;
		}
	};

	const getAll = useCallback(
		async (
			table,
			select = "*",
			filters = "",
			page = 1,
			limit = 10,
			order,
		) => {
			setIsLoading(true);
			try {
				const from = (page - 1) * limit;
				const to = from + limit - 1;

				const query = `/${table}?select=${select}${filters}&order=${order}&offset=${from}&limit=${limit}`;

				const res = await axiosInstance.get(query, {
					headers: {
						Prefer: "count=exact",
					},
				});

				const contentRange = res.headers["content-range"];
				const totalCount = contentRange
					? parseInt(contentRange.split("/")[1], 10)
					: res.data.length;
				// console.log(
				// 	"getAll data fetched successfully:",
				// 	table,
				// 	res.data,
				// );
				return { data: res.data, totalCount };
			} catch (error) {
				console.error(
					"Error fetching data:",
					error.response?.data || error.message,
				);
				throw error;
			} finally {
				setIsLoading(false);
			}
		},
		[axiosInstance],
	);

	// const getById = async (table, id, select) => {
	// 	const res = await axiosInstance.get(
	// 		`/${table}?id=eq.${id}&select=${select}`
	// 	);
	// 	return res.data[0] || null;
	// };

	const getById = async (table, id, select) => {
		try {
			console.log(
				`Fetching data by ID from table: ${table}, ID: ${id}, Select: ${select}`,
			);
			const res = await axiosInstance.get(
				`/${table}?id=eq.${id}&select=${select}`,
			);
			console.log("Data fetched successfully:", res.data[0]);
			return res.data[0] || null;
		} catch (error) {
			console.error(
				"Error fetching data by ID:",
				error.response?.data || error.message,
			);
			throw error; // Relancer l'erreur pour permettre un traitement ultérieur
		}
	};

	const create = async (table, data) => {
		console.log("create token :", accessToken);
		try {
			console.log(
				"create data :",
				table,
				data,
				accessToken,
				SUPABASE_API_KEY,
			);
			const res = await axiosInstance.post(`/${table}`, data);
			// console.log("res status:", res);
			// console.log("res.data :", res.data);
			return res;
		} catch (error) {
			console.error(
				"Error creating data:",
				error.response?.data || error.message,
			);
			console.error("Create failed", error.message);
			console.error("Full error:", error.toJSON?.() || error);
			console.log("BASE_URL:", axiosInstance.defaults.baseURL);
			console.log("Headers:", axiosInstance.defaults.headers);

			throw error;
		}
	};

	const update = async (table, id, data) => {
		console.log(`Updating data in table: ${table}, ID: ${id}, Data:`, data);
		try {
			const res = await axiosInstance.patch(
				`/${table}?id=eq.${id}`,
				data,
			);
			console.log("Data updated successfully:", res.data);
			return res.data;
		} catch (error) {
			console.error(
				"Error updating data:",
				error.response?.data || error.message,
			);
			console.error("Update failed", error.message);
			console.error("Full error:", error.toJSON?.() || error);
			console.log("BASE_URL:", axiosInstance.defaults.baseURL);
			console.log("Headers:", axiosInstance.defaults.headers);

			throw error;
		}
	};

	// const remove = async (table, id) => {
	// 	const res = await axiosInstance.delete(`/${table}?id=eq.${id}`);
	// 	return res.data;
	// };

	const remove = async (table, id) => {
		try {
			console.log(`Removing data from table: ${table}, ID: ${id}`);
			const res = await axiosInstance.delete(`/${table}?id=eq.${id}`);
			console.log("Data removed successfully:", res.data);
			return res.data;
		} catch (error) {
			console.error(
				"Error removing data:",
				error.response?.data || error.message,
			);
			console.error("Remove failed", error.message);
			console.error("Full error:", error.toJSON?.() || error);
			console.log("BASE_URL:", axiosInstance.defaults.baseURL);
			console.log("Headers:", axiosInstance.defaults.headers);

			throw error; // Relancer l'erreur pour permettre un traitement ultérieur
		}
	};

	const createNotification = async ({
		recipientId,
		actorId,
		type,
		title,
		body,
		entityType = null,
		entityId = null,
		metadata = null,
	}) => {
		try {
			const payload = {
				recipient_id: recipientId,
				actor_id: actorId,
				type,
				title,
				body,
				entity_type: entityType,
				entity_id: entityId,
				metadata,
			};

			console.log("Creating notification:", payload);

			const res = await create("notifications", payload);

			return res;
		} catch (error) {
			console.error(
				"Error creating notification:",
				error.response?.data || error.message,
			);
			throw error;
		}
	};

	return (
		<DataContext.Provider
			value={{
				getAll,
				getById,
				create,
				update,
				remove,
				isLoading,
				toggleWishlistJob,
				getWishlistJobs,
				isJobInWishlist,
				applyToJob,
				isJobApplied,
				updateApplicationStatus,
				archiveJob,
				isJobArchived,
				confirmApplication,
				selectApplication,
				refuseApplication,
				proCardDelete,
				createNotification,
			}}>
			{children}
		</DataContext.Provider>
	);
};

export const useDataContext = () => useContext(DataContext);

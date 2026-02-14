import React, { useState, useEffect, useRef } from "react";
import {
	View,
	ScrollView,
	Platform,
	Animated,
	Easing,
	Keyboard,
} from "react-native";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Check, MessageCircle, AlertCircle } from "lucide-react-native";
import { width } from "dom-helpers";

// Animation de points pour l'indicateur de saisie
const TypingAnimation = () => {
	const dot1Opacity = useRef(new Animated.Value(0)).current;
	const dot2Opacity = useRef(new Animated.Value(0)).current;
	const dot3Opacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const animateDot = (dotOpacity, delay) => {
			return Animated.sequence([
				Animated.delay(delay),
				Animated.timing(dotOpacity, {
					toValue: 1,
					duration: 300,
					easing: Easing.ease,
					useNativeDriver: true,
				}),
				Animated.timing(dotOpacity, {
					toValue: 0,
					duration: 300,
					easing: Easing.ease,
					useNativeDriver: true,
				}),
			]);
		};

		const animation = Animated.loop(
			Animated.parallel([
				animateDot(dot1Opacity, 0),
				animateDot(dot2Opacity, 200),
				animateDot(dot3Opacity, 400),
			]),
		);

		animation.start();

		return () => animation.stop();
	}, []);

	return (
		<View style={{ flexDirection: "row", alignItems: "center" }}>
			<Animated.View
				style={{
					width: 6,
					height: 6,
					borderRadius: 3,
					backgroundColor: "#667eea",
					marginHorizontal: 2,
					opacity: dot1Opacity,
				}}
			/>
			<Animated.View
				style={{
					width: 6,
					height: 6,
					borderRadius: 3,
					backgroundColor: "#667eea",
					marginHorizontal: 2,
					opacity: dot2Opacity,
				}}
			/>
			<Animated.View
				style={{
					width: 6,
					height: 6,
					borderRadius: 3,
					backgroundColor: "#667eea",
					marginHorizontal: 2,
					opacity: dot3Opacity,
				}}
			/>
		</View>
	);
};

// Animation des checks de lecture
const MessageChecks = ({ messageId, isRead, createdAt }) => {
	const check1Opacity = useRef(new Animated.Value(0)).current;
	const check2Opacity = useRef(new Animated.Value(0)).current;
	const [checkColor, setCheckColor] = useState("#9ca3af");

	useEffect(() => {
		// Animation du premier check (envoyé) - immédiat
		Animated.timing(check1Opacity, {
			toValue: 1,
			duration: 200,
			delay: 100,
			easing: Easing.ease,
			useNativeDriver: true,
		}).start();

		// Animation du deuxième check (délivré) - après 300ms
		Animated.timing(check2Opacity, {
			toValue: 1,
			duration: 200,
			delay: 400,
			easing: Easing.ease,
			useNativeDriver: true,
		}).start();
	}, [messageId]);

	useEffect(() => {
		// Changement de couleur quand lu
		if (isRead) {
			setTimeout(() => {
				setCheckColor("#4ade80");
			}, 200);
		}
	}, [isRead]);

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				marginLeft: 4,
			}}>
			<Animated.View style={{ opacity: check1Opacity }}>
				<Check size={14} color={checkColor} strokeWidth={2.5} />
			</Animated.View>
			<Animated.View style={{ opacity: check2Opacity, marginLeft: -10 }}>
				<Check size={14} color={checkColor} strokeWidth={2.5} />
			</Animated.View>
		</View>
	);
};

const MessageThread = ({
	applyId,
	isReadOnly = false,
	otherPartyName,
	onTypingChange,
}) => {
	const { user, accessToken, role } = useAuth();
	const { isDark } = useTheme();
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [consecutiveCandidateMessages, setConsecutiveCandidateMessages] =
		useState(0);
	const [transitionMessage, setTransitionMessage] = useState(null);
	const [showTransitionTime, setShowTransitionTime] = useState(false);
	const [textareaHeight, setTextareaHeight] = useState(40);
	const scrollViewRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	const presenceChannelRef = useRef(null);
	const presenceIntervalRef = useRef(null);
	const typingIndicatorAnim = useRef(new Animated.Value(0)).current;

	// Scroller automatiquement quand le clavier s'ouvre
	useEffect(() => {
		const keyboardDidShowListener = Keyboard.addListener(
			"keyboardDidShow",
			() => {
				setTimeout(() => {
					scrollViewRef.current?.scrollToEnd({ animated: true });
				}, 100);
			},
		);

		return () => {
			keyboardDidShowListener.remove();
		};
	}, []);

	// Mettre à jour la présence régulièrement
	useEffect(() => {
		if (!applyId || !accessToken || !user?.id) return;

		const updatePresence = async () => {
			const supabase = createSupabaseClient(accessToken);
			await supabase.from("user_presence").upsert({
				user_id: user.id,
				apply_id: applyId,
				last_seen: new Date().toISOString(),
			});
		};

		// Mettre à jour immédiatement
		updatePresence();

		// Puis mettre à jour toutes les 3 secondes
		presenceIntervalRef.current = setInterval(updatePresence, 3000);

		return () => {
			if (presenceIntervalRef.current) {
				clearInterval(presenceIntervalRef.current);
			}
		};
	}, [applyId, accessToken, user?.id]);

	// Log les changements de isTyping
	useEffect(() => {
		console.log("🎯 [STATE] isTyping changé en:", isTyping);
		if (onTypingChange) {
			onTypingChange(isTyping);
		}

		// Animation de l'indicateur
		if (isTyping) {
			Animated.spring(typingIndicatorAnim, {
				toValue: 1,
				useNativeDriver: true,
				friction: 8,
			}).start();
			// Scroller vers le bas pour voir la bulle
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 100);
		} else {
			Animated.timing(typingIndicatorAnim, {
				toValue: 0,
				duration: 300,
				easing: Easing.ease,
				useNativeDriver: true,
			}).start();
		}
	}, [isTyping, onTypingChange, typingIndicatorAnim]);

	// Calculer le nombre de messages consécutifs du candidat
	useEffect(() => {
		if (messages.length === 0 || role !== "candidat") {
			setConsecutiveCandidateMessages(0);
			return;
		}

		// Compter les messages consécutifs du candidat depuis le dernier message du pro
		let count = 0;
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].sender_id === user.id) {
				count++;
			} else {
				// Dès qu'on trouve un message du pro, on arrête
				break;
			}
		}
		setConsecutiveCandidateMessages(count);
		console.log("📊 Messages consécutifs du candidat:", count);
	}, [messages, user.id, role]);

	// Charger les messages
	const loadMessages = async () => {
		if (!applyId || !accessToken) return;

		try {
			const supabase = createSupabaseClient(accessToken);

			// Mettre à jour la présence de l'utilisateur sur cette conversation
			await supabase.from("user_presence").upsert({
				user_id: user.id,
				apply_id: applyId,
				last_seen: new Date().toISOString(),
			});

			const { data, error } = await supabase
				.from("messages")
				.select("*")
				.eq("apply_id", applyId)
				.order("created_at", { ascending: true });

			if (error) {
				console.error("Erreur chargement messages:", error);
				return;
			}

			const newMessages = data || [];

			// Détecter si un nouveau message de l'autre personne arrive pendant qu'il tape
			if (isTyping && newMessages.length > messages.length) {
				const latestMessage = newMessages[newMessages.length - 1];
				if (latestMessage.sender_id !== user.id) {
					// Message de l'autre personne → transition
					setTransitionMessage(latestMessage);
					setShowTransitionTime(false);

					// Afficher l'heure après 300ms
					setTimeout(() => {
						setShowTransitionTime(true);
					}, 300);

					// Désactiver isTyping et transition après 800ms
					setTimeout(() => {
						setIsTyping(false);
						setTransitionMessage(null);
						setMessages(newMessages);
					}, 800);
					return;
				}
			}

			setMessages(newMessages);

			// Marquer les messages comme lus
			const unreadMessages = data?.filter(
				(msg) => msg.sender_id !== user.id && !msg.is_read,
			);
			if (unreadMessages && unreadMessages.length > 0) {
				await supabase
					.from("messages")
					.update({ is_read: true })
					.in(
						"id",
						unreadMessages.map((m) => m.id),
					);
			}

			// Marquer les notifications de cette conversation comme lues
			const { data: messageNotifications } = await supabase
				.from("notifications")
				.select("id")
				.eq("recipient_id", user.id)
				.eq("entity_type", "message")
				.eq("entity_id", applyId)
				.eq("is_read", false);

			if (messageNotifications && messageNotifications.length > 0) {
				await supabase
					.from("notifications")
					.update({
						is_read: true,
						read_at: new Date().toISOString(),
					})
					.in(
						"id",
						messageNotifications.map((n) => n.id),
					);
				console.log(
					"🔔 Notifications marquées comme lues:",
					messageNotifications.length,
				);
			}
		} catch (error) {
			console.error("Erreur:", error);
		}
	};

	// Envoyer un message
	const sendMessage = async () => {
		if (!newMessage.trim() || loading || isReadOnly) return;

		// Vérifier les restrictions pour les candidats
		if (role === "candidat") {
			// Si aucun message, le candidat ne peut pas initier la conversation
			if (messages.length === 0) {
				console.log(
					"⚠️ Le candidat ne peut pas initier la conversation",
				);
				return;
			}
			// Si déjà 3 messages consécutifs, bloquer
			if (consecutiveCandidateMessages >= 3) {
				console.log("⚠️ Limite de 3 messages consécutifs atteinte");
				return;
			}
		}

		setLoading(true);
		try {
			const supabase = createSupabaseClient(accessToken);

			// Arrêter l'indicateur de saisie ET le timeout
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}

			if (presenceChannelRef.current) {
				console.log("📤 [SEND] Arrêt de l'indicateur de saisie");
				await presenceChannelRef.current.track({
					typing: false,
					user_id: user.id,
				});
			} else {
				console.log("⚠️ [SEND] Pas de channel Presence disponible");
			}

			const { data: insertedMessage, error } = await supabase
				.from("messages")
				.insert({
					apply_id: applyId,
					sender_id: user.id,
					content: newMessage.trim(),
				})
				.select()
				.single();

			if (error) {
				console.error("❌ Erreur envoi message:", error);
				return;
			}

			// Mettre à jour updated_at de la candidature
			await supabase
				.from("applies")
				.update({ updated_at: new Date().toISOString() })
				.eq("id", applyId);

			// Vider l'input immédiatement après l'envoi réussi
			// Ne déclenche pas handleTyping car on a déjà envoyé typing=false
			setNewMessage("");

			// Récupérer l'apply pour trouver le destinataire
			const { data: applyData, error: applyError } = await supabase
				.from("applies")
				.select(
					"candidate_id, job:jobs(company_id, title), candidate:profiles!candidate_id(firstname, lastname)",
				)
				.eq("id", applyId)
				.single();

			if (applyError || !applyData) {
				console.error("❌ Erreur récupération apply:", applyError);
				return;
			}

			const receiverId =
				user.id === applyData.candidate_id
					? applyData.job.company_id
					: applyData.candidate_id;

			const jobTitle = applyData?.job?.title || "Offre d'emploi";
			const candidateName = applyData?.candidate
				? `${applyData.candidate.firstname || ""} ${applyData.candidate.lastname || ""}`.trim()
				: "Candidat";

			// Titre différent selon le destinataire
			const notificationTitle =
				receiverId === applyData.candidate_id
					? jobTitle // Pour le candidat : titre du poste
					: `${candidateName} - ${jobTitle}`; // Pour le pro : nom du candidat - titre du poste

			// Créer ou mettre à jour une notification groupée
			try {
				// Vérifier la présence du destinataire via une table de présence
				const { data: presenceData } = await supabase
					.from("user_presence")
					.select("apply_id")
					.eq("user_id", receiverId)
					.eq("apply_id", applyId)
					.gte("last_seen", new Date(Date.now() - 5000).toISOString()) // Actif dans les 5 dernières secondes
					.single();

				// Si le destinataire est actif sur cette conversation, ne pas créer de notification
				if (presenceData) {
					console.log(
						"⏩ Notification ignorée - destinataire actif sur la conversation",
					);
					return;
				}

				// Supprimer toutes les anciennes notifications de cette conversation
				// Utiliser RPC pour contourner les restrictions RLS
				const { error: deleteAllError } = await supabase.rpc(
					"delete_conversation_notifications",
					{
						p_recipient_id: receiverId,
						p_apply_id: applyId,
					},
				);

				if (deleteAllError) {
					console.error(
						"❌ Erreur suppression anciennes notifications:",
						deleteAllError,
					);
				} else {
					console.log(
						"🗑️ Anciennes notifications supprimées pour cette conversation",
					);
				}

				// Compter les messages NON LUS de l'expéditeur dans cette conversation
				const { data: unreadMessages } = await supabase
					.from("messages")
					.select("id, created_at, is_read")
					.eq("apply_id", applyId)
					.eq("sender_id", user.id)
					.or("is_read.is.false,is_read.is.null")
					.order("created_at", { ascending: false });

				const messageCount = unreadMessages?.length || 0;

				const notificationBody =
					messageCount > 1
						? `${messageCount} nouveaux messages`
						: "Nouveau message";

				console.log("📊 Messages non lus:", messageCount);

				// Créer une nouvelle notification
				const { data: newNotif, error: insertError } = await supabase
					.from("notifications")
					.insert({
						recipient_id: receiverId,
						type: "message",
						title: notificationTitle,
						entity_type: "message",
						entity_id: applyId,
						body: notificationBody,
						is_read: false,
					})
					.select();

				if (insertError) {
					console.error(
						"❌ Erreur création notification:",
						insertError,
					);
				} else {
					console.log(
						"🔔 Notification créée:",
						notificationBody,
						newNotif,
					);
				}
			} catch (notifError) {
				console.error("⚠️ Erreur notification:", notifError);
				// Ne pas bloquer l'envoi du message si la notification échoue
			}

			// Ne pas recharger - le realtime va ajouter le message automatiquement
		} catch (error) {
			console.error("Erreur:", error);
		} finally {
			setLoading(false);
		}
	};

	// Signaler qu'on est en train d'écrire
	const handleTyping = (text) => {
		setNewMessage(text);

		if (isReadOnly) {
			console.log("⚠️ [TYPING] Mode lecture seule - pas de tracking");
			return;
		}

		if (!presenceChannelRef.current) {
			console.log("⚠️ [TYPING] Channel Presence non disponible");
			return;
		}

		// Si le texte est vide et qu'il n'y a pas de timeout actif, c'est probablement après un envoi
		// Ne pas envoyer typing=false car on l'a déjà fait dans sendMessage
		if (text.length === 0 && !typingTimeoutRef.current) {
			console.log("🛑 [TYPING] Champ vidé après envoi - pas d'action");
			return;
		}

		// Signaler qu'on écrit
		if (text.length > 0) {
			console.log("⌨️ [TYPING] Envoi typing=true, user_id:", user.id);
			presenceChannelRef.current
				.track({
					typing: true,
					user_id: user.id,
				})
				.catch((err) =>
					console.error("❌ [TYPING] Erreur track:", err),
				);

			// Arrêter l'indicateur après 3 secondes d'inactivité
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
			}
			typingTimeoutRef.current = setTimeout(() => {
				if (presenceChannelRef.current) {
					console.log("⏱️ [TYPING] Timeout - envoi typing=false");
					presenceChannelRef.current.track({
						typing: false,
						user_id: user.id,
					});
				}
				typingTimeoutRef.current = null;
			}, 3000);
		} else {
			// L'utilisateur a supprimé tout le texte manuellement
			console.log(
				"🛑 [TYPING] Champ vide manuellement - envoi typing=false",
			);
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = null;
			}
			presenceChannelRef.current.track({
				typing: false,
				user_id: user.id,
			});
		}
	};

	// Écouter les nouveaux messages en temps réel
	useEffect(() => {
		if (!applyId || !accessToken) return;

		loadMessages();

		const supabase = createSupabaseClient(accessToken);
		const channel = supabase
			.channel(`messages:${applyId}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "messages",
					filter: `apply_id=eq.${applyId}`,
				},
				async (payload) => {
					console.log("Nouveau message reçu:", payload);
					const newMsg = payload.new;

					// Si c'est un message de l'autre personne, désactiver immédiatement l'indicateur de saisie
					if (newMsg.sender_id !== user.id) {
						console.log("📨 Message reçu → désactivation isTyping");
						setIsTyping(false);
						if (typingTimeoutRef.current) {
							clearTimeout(typingTimeoutRef.current);
						}
					}

					// Si le message n'est pas de moi et n'est pas déjà lu, le marquer comme lu
					if (newMsg.sender_id !== user.id && !newMsg.is_read) {
						await supabase
							.from("messages")
							.update({ is_read: true })
							.eq("id", newMsg.id);

						// Ajouter le message avec is_read = true
						setMessages((prevMessages) => [
							...prevMessages,
							{ ...newMsg, is_read: true },
						]);
					} else {
						// Ajouter le nouveau message directement au state
						setMessages((prevMessages) => [
							...prevMessages,
							newMsg,
						]);
					}
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "messages",
					filter: `apply_id=eq.${applyId}`,
				},
				(payload) => {
					console.log("Message mis à jour:", payload);
					// Mettre à jour le message dans le state
					setMessages((prevMessages) =>
						prevMessages.map((msg) =>
							msg.id === payload.new.id ? payload.new : msg,
						),
					);
				},
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [applyId, accessToken, user.id]);

	// Écouter l'indicateur de saisie
	useEffect(() => {
		if (!applyId || !accessToken) {
			console.log("⚠️ [PRESENCE] Manque applyId ou accessToken");
			return;
		}

		console.log(
			"🔌 [PRESENCE] Initialisation channel pour apply_id:",
			applyId,
		);
		console.log("👤 [PRESENCE] Mon user_id:", user.id);

		const supabase = createSupabaseClient(accessToken);
		const presenceChannel = supabase.channel(`presence:${applyId}`);

		presenceChannel
			.on("presence", { event: "sync" }, () => {
				const state = presenceChannel.presenceState();
				console.log(
					"👥 [PRESENCE SYNC] État complet:",
					JSON.stringify(state, null, 2),
				);

				// Vérifier si quelqu'un d'autre est en train d'écrire
				const someoneTyping = Object.values(state).some((presences) =>
					presences.some((presence) => {
						const isOtherUser = presence.user_id !== user.id;
						const isTyping = presence.typing === true;
						if (isOtherUser && isTyping) {
							console.log(
								"✍️ [PRESENCE] Autre utilisateur est en train d'écrire:",
								presence.user_id,
							);
						}
						return isTyping && isOtherUser;
					}),
				);
				console.log(
					someoneTyping
						? "✅ [PRESENCE] Affichage indicateur"
						: "❌ [PRESENCE] Pas d'indicateur",
				);
				setIsTyping(someoneTyping);
			})
			.subscribe(async (status) => {
				console.log("📡 [PRESENCE] Status:", status);
				if (status === "SUBSCRIBED") {
					console.log(
						"✅ [PRESENCE] Souscription réussie - stockage du channel",
					);
					// Stocker le channel dans la ref une fois souscrit
					presenceChannelRef.current = presenceChannel;
					const trackResult = await presenceChannel.track({
						typing: false,
						user_id: user.id,
					});
					console.log("📍 [PRESENCE] Track initial:", trackResult);
				} else if (status === "CHANNEL_ERROR") {
					console.error("❌ [PRESENCE] Erreur de channel");
				} else if (status === "TIMED_OUT") {
					console.error("⏰ [PRESENCE] Timeout");
				} else if (status === "CLOSED") {
					console.log("🔒 [PRESENCE] Channel fermé");
				}
			});

		return () => {
			console.log("🧹 [PRESENCE] Nettoyage du channel");
			presenceChannelRef.current = null;
			supabase.removeChannel(presenceChannel);
		};
	}, [applyId, accessToken, user.id]);

	// Auto-scroll au dernier message
	useEffect(() => {
		if (messages.length > 0) {
			setTimeout(() => {
				scrollViewRef.current?.scrollToEnd({ animated: true });
			}, 100);
		}
	}, [messages]);

	const formatTime = (date) => {
		const d = new Date(date);
		const today = new Date();
		const isToday = d.toDateString() === today.toDateString();

		if (isToday) {
			return d.toLocaleTimeString("fr-FR", {
				hour: "2-digit",
				minute: "2-digit",
			});
		}
		return d.toLocaleDateString("fr-FR", {
			day: "2-digit",
			month: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<VStack style={{ flex: 1 }}>
			{/* Liste des messages */}
			<ScrollView
				ref={scrollViewRef}
				style={{
					flex: 1,
					backgroundColor: isDark ? "#1f2937" : "#f9fafb",
				}}
				contentContainerStyle={{ padding: 16, flexGrow: 1 }}
				keyboardShouldPersistTaps='handled'
				onContentSizeChange={() => {
					scrollViewRef.current?.scrollToEnd({ animated: true });
				}}>
				{messages.length === 0 ? (
					<Box
						style={{
							flex: 1,
							justifyContent: "center",
							alignItems: "center",
							padding: 20,
						}}>
						<Box
							style={{
								width: 80,
								height: 80,
								borderRadius: 40,
								backgroundColor: isDark ? "#374151" : "#e0e7ff",
								justifyContent: "center",
								alignItems: "center",
								marginBottom: 16,
							}}>
							<Icon
								as={MessageCircle}
								size={40}
								color={isDark ? "#9ca3af" : "#6366f1"}
							/>
						</Box>
						<Heading
							size='md'
							style={{
								color: isDark ? "#f3f4f6" : "#111827",
								marginBottom: 8,
								textAlign: "center",
							}}>
							Aucun message
						</Heading>
						<Text
							size='sm'
							style={{
								color: isDark ? "#9ca3af" : "#6b7280",
								textAlign: "center",
							}}>
							{!isReadOnly
								? `Commencez la conversation avec ${otherPartyName} !`
								: "Aucun message pour le moment."}
						</Text>
					</Box>
				) : (
					messages.map((message) => {
						const isMyMessage = message.sender_id === user.id;
						return (
							<View
								key={message.id}
								style={{
									marginBottom: 12,
									maxWidth: "80%",
									alignSelf: isMyMessage
										? "flex-end"
										: "flex-start",
									justifyContent: "center",
									alignItems: isMyMessage
										? "flex-end"
										: "flex-start",
									flexDirection: "column",
								}}>
								<Card
									style={{
										width: "100%",
										paddingHorizontal: 12,
										paddingVertical: 8,
										borderRadius: 16,
										backgroundColor: isMyMessage
											? "#6366f1"
											: isDark
												? "#374151"
												: "#ffffff",
										borderWidth: isMyMessage ? 0 : 1,
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
									}}>
									<Text
										size='md'
										style={{
											color: isMyMessage
												? "#ffffff"
												: isDark
													? "#f3f4f6"
													: "#111827",
											lineHeight: 20,
										}}>
										{message.content}
									</Text>
								</Card>
								<HStack
									space='xs'
									style={{
										paddingHorizontal: 4,
										marginTop: 4,
										flexDirection: isMyMessage
											? "row-reverse"
											: "row",
										alignItems: "center",
										justifyContent: isMyMessage
											? "flex-end"
											: "flex-start",
									}}>
									<Text
										size='xs'
										style={{
											color: isDark
												? "#9ca3af"
												: "#6b7280",
										}}>
										{formatTime(message.created_at)}
									</Text>
									{isMyMessage && (
										<MessageChecks
											messageId={message.id}
											isRead={message.is_read}
											createdAt={message.created_at}
										/>
									)}
								</HStack>
							</View>
						);
					})
				)}
				{/* Indicateur de saisie animé */}
				{isTyping && !isReadOnly && (
					<Animated.View
						style={{
							marginBottom: 12,
							maxWidth: "80%",
							alignSelf: "flex-start",
							opacity: typingIndicatorAnim,
							transform: [
								{
									translateY: typingIndicatorAnim.interpolate(
										{
											inputRange: [0, 1],
											outputRange: [20, 0],
										},
									),
								},
							],
						}}>
						<Card
							style={{
								paddingHorizontal: 12,
								paddingVertical: 8,
								borderRadius: 16,
								backgroundColor: isDark ? "#374151" : "#ffffff",
								borderWidth: 1,
								borderColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<HStack space='xs' style={{ alignItems: "center" }}>
								<Text
									size='md'
									style={{
										color: isDark ? "#f3f4f6" : "#111827",
									}}>
									{transitionMessage
										? transitionMessage.content
										: "en train d'écrire"}
								</Text>
								{!transitionMessage && <TypingAnimation />}
							</HStack>
						</Card>
						{transitionMessage && showTransitionTime && (
							<HStack
								space='xs'
								style={{
									paddingHorizontal: 4,
									marginTop: 4,
								}}>
								<Text
									size='xs'
									style={{
										color: isDark ? "#9ca3af" : "#6b7280",
									}}>
									{formatTime(transitionMessage.created_at)}
								</Text>
							</HStack>
						)}
					</Animated.View>
				)}
				{console.log(
					"🖼️ [RENDER] isTyping:",
					isTyping,
					"isReadOnly:",
					isReadOnly,
					"Affichage indicateur:",
					isTyping && !isReadOnly,
				)}
			</ScrollView>

			{/* Zone de saisie */}
			{!isReadOnly &&
				(() => {
					// Candidat sans messages : attendre que le pro initie
					if (role === "candidat" && messages.length === 0) {
						return (
							<Card
								style={{
									padding: 16,
									margin: 16,
									backgroundColor: isDark
										? "#374151"
										: "#fef3c7",
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#fbbf24",
									borderRadius: 12,
								}}>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Icon
										as={AlertCircle}
										size={20}
										color={isDark ? "#fbbf24" : "#d97706"}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#fbbf24"
												: "#d97706",
											flex: 1,
										}}>
										En attente que le recruteur ouvre la
										discussion...
									</Text>
								</HStack>
							</Card>
						);
					}

					// Candidat ayant atteint la limite de 3 messages
					if (
						role === "candidat" &&
						consecutiveCandidateMessages >= 3
					) {
						return (
							<Card
								style={{
									padding: 16,
									margin: 16,
									backgroundColor: isDark
										? "#374151"
										: "#fef3c7",
									borderWidth: 1,
									borderColor: isDark ? "#4b5563" : "#fbbf24",
									borderRadius: 12,
								}}>
								<HStack
									space='sm'
									style={{ alignItems: "center" }}>
									<Icon
										as={AlertCircle}
										size={20}
										color={isDark ? "#fbbf24" : "#d97706"}
									/>
									<Text
										size='sm'
										style={{
											color: isDark
												? "#fbbf24"
												: "#d97706",
											flex: 1,
										}}>
										Vous avez envoyé 3 messages. Veuillez
										attendre la réponse du recruteur.
									</Text>
								</HStack>
							</Card>
						);
					}

					// Zone de saisie normale
					return (
						<Box
							style={{
								padding: 16,
								backgroundColor: isDark ? "#1f2937" : "#ffffff",
								borderTopWidth: 1,
								borderTopColor: isDark ? "#4b5563" : "#e5e7eb",
							}}>
							<Box style={{ position: "relative" }}>
								<Input
									size='lg'
									style={{
										width: "100%",
										backgroundColor: isDark
											? "#374151"
											: "#f9fafb",
										borderColor: isDark
											? "#4b5563"
											: "#e5e7eb",
										paddingRight: 56,
										borderRadius: 18,
									}}>
									<InputField
										placeholder='Écrivez votre message...'
										value={newMessage}
										onChangeText={handleTyping}
										maxLength={500}
										onSubmitEditing={sendMessage}
										style={{
											color: isDark
												? "#f3f4f6"
												: "#111827",
										}}
									/>
								</Input>
								<Button
									size='sm'
									onPress={sendMessage}
									isDisabled={!newMessage.trim() || loading}
									style={{
										position: "absolute",
										right: 4,
										top: "50%",
										transform: [{ translateY: -17 }],
										backgroundColor:
											!newMessage.trim() || loading
												? isDark
													? "#4b5563"
													: "#e5e7eb"
												: "#6366f1",
										width: 32,
										height: 32,
										borderRadius: 15,
										minWidth: 32,
									}}>
									<ButtonIcon
										as={Send}
										size='xs'
										color='#ffffff'
									/>
								</Button>
							</Box>
						</Box>
					);
				})()}

			{isReadOnly && (
				<Card
					style={{
						padding: 16,
						margin: 16,
						backgroundColor: isDark ? "#374151" : "#fee2e2",
						borderWidth: 1,
						borderColor: isDark ? "#4b5563" : "#fca5a5",
						borderRadius: 12,
					}}>
					<HStack space='sm' style={{ alignItems: "center" }}>
						<Icon
							as={AlertCircle}
							size={20}
							color={isDark ? "#ef4444" : "#dc2626"}
						/>
						<Text
							size='sm'
							style={{
								color: isDark ? "#ef4444" : "#dc2626",
								flex: 1,
							}}>
							Cette conversation est en lecture seule car la
							candidature a été refusée.
						</Text>
					</HStack>
				</Card>
			)}
		</VStack>
	);
};

export default MessageThread;

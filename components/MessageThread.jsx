import React, { useState, useEffect, useRef } from "react";
import {
	View,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	Animated,
	Easing,
} from "react-native";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send, Check } from "lucide-react-native";

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
	const { user, accessToken } = useAuth();
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const scrollViewRef = useRef(null);
	const typingTimeoutRef = useRef(null);
	const presenceChannelRef = useRef(null);

	// Log les changements de isTyping
	useEffect(() => {
		console.log("🎯 [STATE] isTyping changé en:", isTyping);
		if (onTypingChange) {
			onTypingChange(isTyping);
		}
	}, [isTyping, onTypingChange]);

	// Charger les messages
	const loadMessages = async () => {
		if (!applyId || !accessToken) return;

		try {
			const supabase = createSupabaseClient(accessToken);
			const { data, error } = await supabase
				.from("messages")
				.select("*")
				.eq("apply_id", applyId)
				.order("created_at", { ascending: true });

			if (error) {
				console.error("Erreur chargement messages:", error);
				return;
			}

			setMessages(data || []);

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

			// Marquer les notifications de messages comme lues
			const { data: messageNotifications } = await supabase
				.from("notifications")
				.select("id")
				.eq("recipient_id", user.id)
				.eq("entity_type", "message")
				.eq("is_read", false)
				.in("entity_id", data?.map((m) => m.id) || []);

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

		setLoading(true);
		try {
			const supabase = createSupabaseClient(accessToken);

			// Arrêter l'indicateur de saisie
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

			// Récupérer l'apply pour trouver le destinataire
			const { data: applyData } = await supabase
				.from("applies")
				.select("candidate_id, job:jobs(company_id)")
				.eq("id", applyId)
				.single();

			const receiverId =
				user.id === applyData.candidate_id
					? applyData.job.company_id
					: applyData.candidate_id;

			// Appeler l'Edge Function pour créer la notification
			try {
				const { data: edgeFunctionData } =
					await supabase.functions.invoke(
						"send-message-notification",
						{
							body: {
								message_id: insertedMessage.id,
								sender_id: user.id,
								receiver_id: receiverId,
								apply_id: applyId,
								message_content: newMessage.trim(),
							},
						},
					);
				console.log("🔔 Notification envoyée:", edgeFunctionData);
			} catch (notifError) {
				console.error("⚠️ Erreur notification:", notifError);
				// Ne pas bloquer l'envoi du message si la notification échoue
			}

			setNewMessage("");
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
			}, 3000);
		} else {
			console.log("🛑 [TYPING] Champ vide - envoi typing=false");
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
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}>
			<VStack style={{ flex: 1, height: 400 }}>
				{/* Liste des messages */}
				<ScrollView
					ref={scrollViewRef}
					style={styles.messagesContainer}
					contentContainerStyle={styles.messagesContent}>
					{messages.length === 0 ? (
						<View style={styles.emptyState}>
							<Text className='text-typography-500 text-center'>
								Aucun message pour le moment.
								{!isReadOnly &&
									"\nCommencez la conversation avec " +
										otherPartyName +
										" !"}
							</Text>
						</View>
					) : (
						messages.map((message) => {
							const isMyMessage = message.sender_id === user.id;
							return (
								<View
									key={message.id}
									style={[
										styles.messageWrapper,
										isMyMessage
											? styles.myMessageWrapper
											: styles.otherMessageWrapper,
									]}>
									<Card
										style={[
											styles.messageCard,
											isMyMessage
												? styles.myMessage
												: styles.otherMessage,
										]}>
										<Text
											style={[
												styles.messageText,
												isMyMessage && {
													color: "#fff",
												},
											]}>
											{message.content}
										</Text>
									</Card>
									<HStack
										justifyContent='space-between'
										style={{
											paddingHorizontal: 4,
											flexDirection: isMyMessage
												? "row-reverse"
												: "row",
										}}>
										<Text style={[styles.messageTime]}>
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
				{!isReadOnly && (
					<HStack
						space='sm'
						className='p-3 bg-background-0 border-t border-outline-200'>
						<Input className='flex-1'>
							<InputField
								placeholder='Écrivez votre message...'
								value={newMessage}
								onChangeText={handleTyping}
								multiline
								maxLength={500}
								onSubmitEditing={sendMessage}
							/>
						</Input>
						<Button
							size='md'
							onPress={sendMessage}
							isDisabled={!newMessage.trim() || loading}>
							<ButtonIcon as={Send} />
						</Button>
					</HStack>
				)}

				{isReadOnly && (
					<View className='p-3 bg-warning-100 border-t border-warning-300'>
						<Text className='text-warning-700 text-center text-sm'>
							Cette conversation est en lecture seule car la
							candidature a été refusée.
						</Text>
					</View>
				)}
			</VStack>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	messagesContainer: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	messagesContent: {
		padding: 12,
		flexGrow: 1,
	},
	emptyState: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	messageWrapper: {
		marginBottom: 8,
		maxWidth: "80%",
	},
	myMessageWrapper: {
		alignSelf: "flex-end",
	},
	otherMessageWrapper: {
		alignSelf: "flex-start",
	},
	messageCard: {
		padding: 12,
		borderRadius: 12,
	},
	myMessage: {
		backgroundColor: "#667eea",
	},
	otherMessage: {
		backgroundColor: "#ffffff",
	},
	messageText: {
		fontSize: 15,
		lineHeight: 20,
		color: "#333",
	},
	messageTime: {
		fontSize: 11,
		marginTop: 4,
		color: "#999",
	},
	checkContainer: {
		flexDirection: "row",
		alignItems: "center",
		marginLeft: 4,
	},
});

export default MessageThread;

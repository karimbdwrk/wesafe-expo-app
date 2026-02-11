import React, { useState, useEffect, useRef } from "react";
import {
	View,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
} from "react-native";
import { createSupabaseClient } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Button, ButtonText, ButtonIcon } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react-native";

const MessageThread = ({ applyId, isReadOnly = false, otherPartyName }) => {
	const { user, accessToken } = useAuth();
	const [messages, setMessages] = useState([]);
	const [newMessage, setNewMessage] = useState("");
	const [loading, setLoading] = useState(false);
	const scrollViewRef = useRef(null);

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
			const { error } = await supabase.from("messages").insert({
				apply_id: applyId,
				sender_id: user.id,
				content: newMessage.trim(),
			});

			if (error) {
				console.error("Erreur envoi message:", error);
				return;
			}

			setNewMessage("");
			// Ne pas recharger - le realtime va ajouter le message automatiquement
		} catch (error) {
			console.error("Erreur:", error);
		} finally {
			setLoading(false);
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

	// Auto-scroll vers le bas
	useEffect(() => {
		if (messages.length > 0 && scrollViewRef.current) {
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
							console.log(
								"Message:",
								message,
								"isMyMessage:",
								isMyMessage,
							);
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
											<Text style={[styles.messageTime]}>
												{message.is_read
													? "Lu"
													: "Non lu"}
											</Text>
										)}
									</HStack>
								</View>
							);
						})
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
								onChangeText={setNewMessage}
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
});

export default MessageThread;

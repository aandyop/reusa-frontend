import { apiRequest } from "./apiClient";

export const chatService = {
  getConversations(token) {
    return apiRequest("/conversations", { token });
  },

  getUnreadCount(token) {
    return apiRequest("/conversations/unread-count", { token });
  },

  getMessages(conversationId, token) {
    return apiRequest(`/conversations/${conversationId}/messages`, { token });
  },

  sendMessage(conversationId, body, token) {
    return apiRequest(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { body },
      token,
    });
  },

  markAsRead(conversationId, token) {
    return apiRequest(`/conversations/${conversationId}/read`, {
      method: "POST",
      token,
    });
  },
};
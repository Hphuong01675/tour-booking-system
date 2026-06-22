import axiosInstance from "./axiosInstance";

export const getConversations = async () => {
  const response = await axiosInstance.get("/api/chat/conversations");
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await axiosInstance.get(`/api/chat/messages/${conversationId}`);
  return response.data;
};

export const uploadChatMedia = async (formData) => {
  const response = await axiosInstance.post("/api/chat/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return response.data;
};

export const getCustomerChatHistory = async (customerId) => {
  const response = await axiosInstance.get(`/api/chat/customers/${customerId}/history`);
  return response.data;
};

export const reopenCustomerConversation = async (customerId, conversationId) => {
  const response = await axiosInstance.post(`/api/chat/customers/${customerId}/reopen`, {
    conversationId,
  });
  return response.data;
};

export const initGuestChat = async (sessionKey) => {
  const response = await axiosInstance.post("/api/chat/guest/init", { sessionKey });
  return response.data;
};

export const resolveChatSession = async ({ sessionKey, claimGuest = false, startNew = false }) => {
  const response = await axiosInstance.post("/api/chat/session/resolve", {
    sessionKey,
    claimGuest,
    startNew,
  });
  return response.data;
};

export const acceptConversation = async (conversationId) => {
  const response = await axiosInstance.patch(`/api/chat/conversations/${conversationId}/accept`);
  return response.data;
};

export const closeConversation = async (conversationId) => {
  const response = await axiosInstance.patch(`/api/chat/conversations/${conversationId}/close`);
  return response.data;
};

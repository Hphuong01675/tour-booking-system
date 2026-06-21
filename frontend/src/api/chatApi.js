import axiosInstance from "./axiosInstance";

export const getConversations = async () => {
  const response = await axiosInstance.get("/api/chat/conversations");
  return response.data;
};

export const getMessages = async (conversationId) => {
  const response = await axiosInstance.get(`/api/chat/messages/${conversationId}`);
  return response.data;
};

export const initGuestChat = async (sessionKey) => {
  const response = await axiosInstance.post("/api/chat/guest/init", { sessionKey });
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

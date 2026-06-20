import axiosInstance from "./axiosInstance";

const chatApi = {
    getConversations: () => {
        return axiosInstance.get("/api/chat/conversations");
    },
    getMessages: (conversationId) => {
        return axiosInstance.get(`/api/chat/messages/${conversationId}`);
    },
    acceptConversation: (conversationId) => {
        return axiosInstance.patch(`/api/chat/conversations/${conversationId}/accept`);
    },
    closeConversation: (conversationId) => {
        return axiosInstance.patch(`/api/chat/conversations/${conversationId}/close`);
    }
};

export default chatApi;

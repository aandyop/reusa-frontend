import { apiRequest } from "./apiClient";

export const authService = {
  login(credentials, token = null) {
    return apiRequest("/auth/login", { method: "POST", body: credentials, token });
  },

  register(userData, token = null) {
    return apiRequest("/auth/register", { method: "POST", body: userData, token });
  },

  submitVerification(formData, token) {
    return apiRequest("/users/me/verification", {
      method: "POST",
      body: formData,
      token,
      isFormData: true,
    });
  },

  getTrustProfile(userId, token) {
    return apiRequest(`/users/${userId}/trust-profile`, { token });
  },
};
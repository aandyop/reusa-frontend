import { apiRequest } from "./apiClient";

export const donationCentersService = {
  getAll(token = null) {
    return apiRequest("/centers", { token });
  },

  create(payload, token = null) {
    return apiRequest("/centers", {
      method: "POST",
      body: payload,
      token,
    });
  },
};

export const centersService = donationCentersService;

export const eventsService = {
  getAll(token = null) {
    return apiRequest("/events", { token });
  },

  create(payload, token = null) {
    return apiRequest("/events", {
      method: "POST",
      body: payload,
      token,
    });
  },

  join(eventId, participationRole, token = null) {
    return apiRequest(`/events/${eventId}/join`, {
      method: "POST",
      body: { participation_role: participationRole },
      token,
    });
  },
};

export const blogService = {
  getAll(token = null) {
    return apiRequest("/blog", { token });
  },

  create(payload, token = null) {
    return apiRequest("/blog", {
      method: "POST",
      body: payload,
      token,
    });
  },

  addComment(postId, content, token = null) {
    return apiRequest(`/blog/${postId}/comments`, {
      method: "POST",
      body: { content },
      token,
    });
  },
};
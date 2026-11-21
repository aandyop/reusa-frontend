import { apiRequest } from "./apiClient";

export const centersService = {
  getAll(token = null) {
    return apiRequest("/donation-centers", { token });
  },
};

export const eventsService = {
  getAll(token = null) {
    return apiRequest("/events", { token });
  },

  getById(id, token = null) {
    return apiRequest(`/events/${id}`, { token });
  },

  // Solo ReLeader
  create(payload, token) {
    return apiRequest("/events", { method: "POST", body: payload, token });
  },

  // Solo ReLeader
  update(id, payload, token) {
    return apiRequest(`/events/${id}`, { method: "PUT", body: payload, token });
  },

  // roleInEvent: "assistant" | "donor"
  join(id, roleInEvent, token) {
    return apiRequest(`/events/${id}/join`, {
      method: "POST",
      body: { roleInEvent },
      token,
    });
  },
};

export const blogService = {
  getAll(token = null) {
    return apiRequest("/blog", { token });
  },

  getById(id, token = null) {
    return apiRequest(`/blog/${id}`, { token });
  },

  // Solo ReLeader
  create(payload, token) {
    return apiRequest("/blog", { method: "POST", body: payload, token });
  },

  // Solo ReLeader
  update(id, payload, token) {
    return apiRequest(`/blog/${id}`, { method: "PUT", body: payload, token });
  },
};
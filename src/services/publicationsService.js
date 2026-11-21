import { apiRequest } from "./apiClient";

export const publicationsService = {
  // Lista publicaciones DISPONIBLE y RESERVADO (excluye ENTREGADO)
  getFeed(filters = {}, token = null) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, value);
      }
    });
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest(`/publications${query}`, { token });
  },

  // Detalle de una publicación (incluye ENTREGADO en modo lectura desde perfil)
  getById(id, token = null) {
    return apiRequest(`/publications/${id}`, { token });
  },

  // Publicaciones vinculadas a un usuario (incluye ENTREGADO para el historial)
  getUserPublications(userId, token = null) {
    return apiRequest(`/users/${userId}/publications`, { token });
  },

  // Crear publicación (requiere usuario verificado)
  create(payload, token) {
    return apiRequest("/publications", { method: "POST", body: payload, token });
  },

  // Enviar solicitud de reserva con mensaje inicial
  createRequest(publicationId, message, token) {
    return apiRequest(`/publications/${publicationId}/requests`, {
      method: "POST",
      body: { message },
      token,
    });
  },

  // Ver solicitudes recibidas en una publicación (para que el donante revise perfiles)
  getRequests(publicationId, token) {
    return apiRequest(`/publications/${publicationId}/requests`, { token });
  },

  // Aprobar solicitud de un interesado -> pasa a RESERVADO y habilita chat
  approveRequest(requestId, token) {
    return apiRequest(`/requests/${requestId}/approve`, { method: "POST", token });
  },

  // Rechazar solicitud
  rejectRequest(requestId, token) {
    return apiRequest(`/requests/${requestId}/reject`, { method: "POST", token });
  },

  // Cancelar reserva activa -> vuelve a DISPONIBLE
  cancelReservation(publicationId, token) {
    return apiRequest(`/publications/${publicationId}/cancel-reservation`, {
      method: "POST",
      token,
    });
  },

  // Confirmar entrega -> pasa a ENTREGADO, suma RePoints y evalúa ascenso a ReLeader
  confirmDelivery(publicationId, token) {
    return apiRequest(`/publications/${publicationId}/confirm-delivery`, {
      method: "POST",
      token,
    });
  },
};
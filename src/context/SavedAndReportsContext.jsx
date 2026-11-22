import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

const SAVED_BY_USER_KEY = "reusa_saved_publications_by_user_v1";
const REPORTS_STORAGE_KEY = "reusa_publication_reports_v1";

function readStorageObject(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function readStorageArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const SavedAndReportsContext = createContext(null);

export function SavedAndReportsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [savedByUser, setSavedByUser] = useState(() =>
    readStorageObject(SAVED_BY_USER_KEY, {})
  );
  const [reports, setReports] = useState(() =>
    readStorageArray(REPORTS_STORAGE_KEY, [])
  );
  const [reportTargetPub, setReportTargetPub] = useState(null);

  const userKey = useMemo(() => {
    return user?.id || user?.nickname || "guest";
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_BY_USER_KEY, JSON.stringify(savedByUser));
    } catch {
      // Ignorar errores de cuota o almacenamiento
    }
  }, [savedByUser]);

  useEffect(() => {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // Ignorar errores de cuota o almacenamiento
    }
  }, [reports]);

  const savedPublicationIds = useMemo(() => {
    if (!isAuthenticated || !userKey || userKey === "guest") return [];
    const list = savedByUser[userKey];
    return Array.isArray(list) ? list : [];
  }, [isAuthenticated, userKey, savedByUser]);

  const isPublicationSaved = useCallback(
    (pubId) => {
      if (!isAuthenticated || !pubId) return false;
      return savedPublicationIds.includes(pubId);
    },
    [isAuthenticated, savedPublicationIds]
  );

  // Solo permite guardar si el usuario tiene sesión iniciada
  const toggleSavePublication = useCallback(
    (publication, onRequireAuth) => {
      if (!isAuthenticated) {
        onRequireAuth?.();
        return { status: "auth_required", saved: false };
      }

      const pubId = publication?.id;
      if (!pubId) return { status: "error", saved: false };

      let nowSaved = false;
      setSavedByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        const exists = currentList.includes(pubId);
        const nextList = exists
          ? currentList.filter((id) => id !== pubId)
          : [pubId, ...currentList];
        nowSaved = !exists;

        return {
          ...prev,
          [userKey]: nextList,
        };
      });

      return { status: "ok", saved: nowSaved };
    },
    [isAuthenticated, userKey]
  );

  const removeSavedPublication = useCallback(
    (pubId) => {
      if (!isAuthenticated || !pubId) return;
      setSavedByUser((prev) => {
        const currentList = Array.isArray(prev[userKey]) ? prev[userKey] : [];
        return {
          ...prev,
          [userKey]: currentList.filter((id) => id !== pubId),
        };
      });
    },
    [isAuthenticated, userKey]
  );

  // Solo permite abrir el modal de reporte si el usuario tiene sesión iniciada
  const openReportModal = useCallback(
    (publication, onRequireAuth) => {
      if (!isAuthenticated) {
        onRequireAuth?.();
        return false;
      }
      if (!publication?.id) return false;
      setReportTargetPub(publication);
      return true;
    },
    [isAuthenticated]
  );

  const closeReportModal = useCallback(() => {
    setReportTargetPub(null);
  }, []);

  const submitPublicationReport = useCallback(
    ({ publicationId, publicationTitle, reason, details }) => {
      if (!isAuthenticated || !publicationId) return null;

      const entry = {
        id: `rep-${Date.now()}`,
        publication_id: publicationId,
        publication_title: publicationTitle || "Publicación",
        reporter_id: user?.id || userKey,
        reporter_nickname: user?.nickname || "vecino",
        reason: reason || "Otro motivo",
        details: (details || "").trim(),
        created_at: new Date().toISOString(),
      };

      setReports((prev) => [entry, ...prev]);
      setReportTargetPub(null);
      return entry;
    },
    [isAuthenticated, user, userKey]
  );

  // Filtra las publicaciones guardadas excluyendo las que ya han sido entregadas
  const getVisibleSavedPublications = useCallback(
    (allPublications = []) => {
      if (!isAuthenticated || savedPublicationIds.length === 0) return [];
      const pubMap = new Map(
        (Array.isArray(allPublications) ? allPublications : []).map((p) => [
          p.id,
          p,
        ])
      );

      return savedPublicationIds
        .map((id) => pubMap.get(id))
        .filter((pub) => pub && pub.status !== "ENTREGADO");
    },
    [isAuthenticated, savedPublicationIds]
  );

  const value = useMemo(
    () => ({
      savedPublicationIds,
      isPublicationSaved,
      toggleSavePublication,
      removeSavedPublication,
      getVisibleSavedPublications,
      reports,
      reportTargetPub,
      openReportModal,
      closeReportModal,
      submitPublicationReport,
    }),
    [
      savedPublicationIds,
      isPublicationSaved,
      toggleSavePublication,
      removeSavedPublication,
      getVisibleSavedPublications,
      reports,
      reportTargetPub,
      openReportModal,
      closeReportModal,
      submitPublicationReport,
    ]
  );

  return (
    <SavedAndReportsContext.Provider value={value}>
      {children}
    </SavedAndReportsContext.Provider>
  );
}

export function useSavedAndReports() {
  const ctx = useContext(SavedAndReportsContext);
  if (!ctx) {
    throw new Error(
      "useSavedAndReports debe usarse dentro de un SavedAndReportsProvider"
    );
  }
  return ctx;
}
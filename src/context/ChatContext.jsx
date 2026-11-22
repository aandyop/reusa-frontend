import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const CHAT_THREADS_STORAGE_KEY = "reusa_chat_threads_v2";
const CHAT_REQUESTS_STORAGE_KEY = "reusa_chat_requests_v1";

const INITIAL_THREADS = [
  {
    id: "thread-101",
    publication_id: "pub-101",
    publication_title: "Sofá de dos puestos en tela gris",
    peer_id: "usr-002",
    peer_nickname: "LiderSostenible",
    peer_avatar: null,
    peer_zone: "Centro de Valera",
    unreadCount: 2,
    messages: [
      {
        id: "m-1",
        sender: "LiderSostenible",
        text: "¡Hola! El sofá está disponible en el centro de Valera.",
        timestamp: "2026-11-21T16:10:00Z",
        read: false,
        fromPeer: true,
      },
      {
        id: "m-2",
        sender: "LiderSostenible",
        text: "¿Te acomoda coordinar la entrega por la tarde?",
        timestamp: "2026-11-21T16:12:00Z",
        read: false,
        fromPeer: true,
      },
    ],
  },
  {
    id: "thread-102",
    publication_id: "pub-102",
    publication_title: "Mesa auxiliar de madera y lámpara de pie",
    peer_id: "usr-001",
    peer_nickname: "NomadaVerde",
    peer_avatar: null,
    peer_zone: "Las Acacias · Valera",
    unreadCount: 1,
    messages: [
      {
        id: "m-3",
        sender: "NomadaVerde",
        text: "La mesa está lista para trueque, avísame cuando puedas.",
        timestamp: "2026-11-21T18:05:00Z",
        read: false,
        fromPeer: true,
      },
    ],
  },
];

const INITIAL_MESSAGE_REQUESTS = [
  {
    id: "req-msg-01",
    publication_id: "pub-103",
    publication_title: "Tablones de pino y bisagras para restaurar",
    requester_id: "usr-005",
    requester_nickname: "HogarSegundoCiclo",
    requester_avatar: null,
    requester_zone: "El Country · Valera",
    note: "Hola, me interesa coordinar el retiro esta semana con vehículo propio.",
    created_at: "2026-11-21T19:20:00Z",
  },
];

function loadArray(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [threads, setThreads] = useState(() =>
    loadArray(CHAT_THREADS_STORAGE_KEY, INITIAL_THREADS)
  );
  const [messageRequests, setMessageRequests] = useState(() =>
    loadArray(CHAT_REQUESTS_STORAGE_KEY, INITIAL_MESSAGE_REQUESTS)
  );
  const [activeThreadId, setActiveThreadId] = useState(
    () => loadArray(CHAT_THREADS_STORAGE_KEY, INITIAL_THREADS)[0]?.id || null
  );
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_THREADS_STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [threads]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CHAT_REQUESTS_STORAGE_KEY,
        JSON.stringify(messageRequests)
      );
    } catch {
      // Ignorar errores de almacenamiento
    }
  }, [messageRequests]);

  const totalUnreadCount = useMemo(() => {
    return threads.reduce((acc, thread) => {
      const count =
        typeof thread.unreadCount === "number"
          ? thread.unreadCount
          : Array.isArray(thread.messages)
          ? thread.messages.filter((msg) => !msg.read && msg.fromPeer).length
          : 0;
      return acc + Math.max(0, count);
    }, 0);
  }, [threads]);

  const markThreadAsRead = useCallback((threadId) => {
    if (!threadId) return;
    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== threadId) return thread;
        const updatedMessages = Array.isArray(thread.messages)
          ? thread.messages.map((msg) => ({ ...msg, read: true }))
          : [];
        return {
          ...thread,
          unreadCount: 0,
          messages: updatedMessages,
        };
      })
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setThreads((prev) =>
      prev.map((thread) => ({
        ...thread,
        unreadCount: 0,
        messages: Array.isArray(thread.messages)
          ? thread.messages.map((msg) => ({ ...msg, read: true }))
          : [],
      }))
    );
  }, []);

  const openChat = useCallback(
    (threadId = null) => {
      setIsChatOpen(true);
      const targetId = threadId || activeThreadId || threads[0]?.id || null;
      if (targetId) {
        setActiveThreadId(targetId);
        markThreadAsRead(targetId);
      }
    },
    [activeThreadId, threads, markThreadAsRead]
  );

  const closeChat = useCallback(() => {
    setIsChatOpen(false);
  }, []);

  const selectThread = useCallback(
    (threadId) => {
      setActiveThreadId(threadId);
      markThreadAsRead(threadId);
    },
    [markThreadAsRead]
  );

  const sendMessage = useCallback(
    (text, currentNickname = "yo", threadIdOverride = null) => {
      const targetThreadId = threadIdOverride || activeThreadId;
      const cleanText = text?.trim();
      if (!cleanText || !targetThreadId) return;

      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: currentNickname,
        text: cleanText,
        timestamp: new Date().toISOString(),
        read: true,
        fromPeer: false,
      };

      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== targetThreadId) return thread;
          return {
            ...thread,
            unreadCount: 0,
            messages: [...(thread.messages || []), newMsg],
          };
        })
      );
    },
    [activeThreadId]
  );

  const acceptMessageRequest = useCallback((requestId) => {
    setMessageRequests((prev) => {
      const target = prev.find((r) => r.id === requestId);
      if (!target) return prev;

      const createdThreadId = `thread-${Date.now()}`;
      const newThread = {
        id: createdThreadId,
        publication_id: target.publication_id,
        publication_title: target.publication_title,
        peer_id: target.requester_id,
        peer_nickname: target.requester_nickname,
        peer_avatar: target.requester_avatar || null,
        peer_zone: target.requester_zone || "Valera, Trujillo",
        unreadCount: 0,
        messages: [
          {
            id: `msg-req-${Date.now()}`,
            sender: target.requester_nickname,
            text: target.note,
            timestamp: target.created_at || new Date().toISOString(),
            read: true,
            fromPeer: true,
          },
        ],
      };

      setThreads((oldThreads) => [newThread, ...oldThreads]);
      setActiveThreadId(createdThreadId);
      return prev.filter((r) => r.id !== requestId);
    });
  }, []);

  const declineMessageRequest = useCallback((requestId) => {
    setMessageRequests((prev) => prev.filter((r) => r.id !== requestId));
  }, []);

  const value = useMemo(
    () => ({
      threads,
      messageRequests,
      activeThreadId,
      isChatOpen,
      totalUnreadCount,
      openChat,
      closeChat,
      selectThread,
      markThreadAsRead,
      markAllAsRead,
      sendMessage,
      acceptMessageRequest,
      declineMessageRequest,
    }),
    [
      threads,
      messageRequests,
      activeThreadId,
      isChatOpen,
      totalUnreadCount,
      openChat,
      closeChat,
      selectThread,
      markThreadAsRead,
      markAllAsRead,
      sendMessage,
      acceptMessageRequest,
      declineMessageRequest,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat debe usarse dentro de un ChatProvider");
  }
  return ctx;
}
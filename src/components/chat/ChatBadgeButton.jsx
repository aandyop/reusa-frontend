import { MessageSquare } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";

const TERRACOTTA_NOTIFICATION = "#E76F51";

export default function ChatBadgeButton({
  threadId = null,
  onClick,
  className = "",
}) {
  const { isAuthenticated } = useAuth();
  const { totalUnreadCount, openChat } = useChat();

  if (!isAuthenticated) return null;

  const displayCount = totalUnreadCount > 99 ? "99+" : totalUnreadCount;

  const handlePress = () => {
    openChat(threadId);
    onClick?.(threadId);
  };

  return (
    <button
      type="button"
      onClick={handlePress}
      aria-label={
        totalUnreadCount > 0
          ? `Chat (${totalUnreadCount} mensajes no leídos)`
          : "Chat"
      }
      title="Chat"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-[#FAF9F6] text-stone-700 transition hover:border-[#2d6a4f] hover:text-[#2d6a4f] ${className}`}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />

      {totalUnreadCount > 0 && (
        <span
          data-testid="chat-unread-badge"
          style={{ backgroundColor: TERRACOTTA_NOTIFICATION }}
          className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-extrabold leading-none text-white shadow-xs"
        >
          {displayCount}
        </span>
      )}
    </button>
  );
}
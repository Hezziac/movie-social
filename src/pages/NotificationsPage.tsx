import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase-client";
import { useAuth } from "../context/AuthContext";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { 
  ChatBubble, 
  Favorite, 
  PersonAdd, 
  NotificationsNone,
  DoneAll,
  AccountCircle
} from "@mui/icons-material";
import { Link } from "react-router";

export function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // 1. Fetch Notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          *,
          actor:profiles!actor_id(username, avatar_url)
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // 2. Mark all as read mutation
  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id)
        .eq("is_read", false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'chat': return <ChatBubble className="text-blue-400" fontSize="small" />;
      case 'like': return <Favorite className="text-red-500" fontSize="small" />;
      case 'follow': return <PersonAdd className="text-purple-500" fontSize="small" />;
      default: return <NotificationsNone className="text-gray-400" fontSize="small" />;
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading alerts...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {notifications && notifications.some(n => !n.is_read) && (
            <button 
              onClick={() => markAllRead.mutate()}
              className="text-xs flex items-center gap-1 text-purple-400 hover:text-purple-300 transition"
            >
              <DoneAll sx={{ fontSize: 16 }} /> Mark all as read
            </button>
          )}
        </div>

        {notifications?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-900/30 rounded-3xl border border-white/5">
            <NotificationsNone sx={{ fontSize: 48 }} className="text-gray-700 mb-4" />
            <p className="text-gray-500">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications?.map((n) => (
              <Link
                key={n.id}
                to={n.type === 'chat' ? `/community/${n.target_id}` : `/profile/${n.actor?.username}`}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                  n.is_read ? 'bg-transparent border-transparent opacity-60' : 'bg-white/5 border-white/5 shadow-lg'
                } hover:bg-white/10`}
              >
                {/* Actor Avatar / Fallback */}
              <div className="relative flex-shrink-0">
                {n.actor?.avatar_url ? (
                  <img 
                    src={n.actor.avatar_url} 
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                    alt={`${n.actor.username}'s avatar`}
                    // Error handling just in case the URL exists but is broken
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement!.classList.add('broken-img');
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                    <AccountCircle className="text-gray-500" sx={{ fontSize: 32 }} />
                  </div>
                )}
                {/* Notification Type Icon Badge */}
                  <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-1 border border-white/10 shadow-sm flex items-center justify-center">
                    {getIcon(n.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-bold">{n.actor?.username}</span> 
                    {" "}{n.content}
                  </p>
                  <span className="text-[10px] text-gray-500 uppercase tracking-tighter">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>

                {/* Unread Indicator */}
                {!n.is_read && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
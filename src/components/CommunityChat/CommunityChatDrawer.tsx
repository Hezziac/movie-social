import { Close, Send } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabase-client";

interface ChatProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: number;
  communityName: string;
  userRole: 'member' | 'admin' | 'owner';
}

export const CommunityChatDrawer = ({ isOpen, onClose, communityId, communityName, userRole }: ChatProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. FETCH INITIAL MESSAGES & SUBSCRIBE TO REALTIME
  useEffect(() => {
    if (!isOpen) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("community_messages")
        .select("*")
        .eq("community_id", communityId)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };

    fetchMessages();

    // LISTEN FOR NEW MESSAGES (The "Realtime" magic)
    const channel = supabase
      .channel(`community-chat-${communityId}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'community_messages',
          filter: `community_id=eq.${communityId}` 
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, communityId]);

  // 2. AUTO-SCROLL TO BOTTOM
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 3. SEND MESSAGE FUNCTION
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // First, fetch user profile for the denormalized data
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();

    const messageData = {
      community_id: communityId,
      user_id: user.id,
      content: newMessage,
      author_username: profile?.username || "Anonymous",
      author_avatar_url: profile?.avatar_url || null,
    };

    const { error } = await supabase.from("community_messages").insert(messageData);
    if (error) console.error("Error sending:", error);
    setNewMessage("");
  };

  return (
    <>
      {/* Dark Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* The Drawer Panel */}
      <div className={`fixed top-0 right-0 h-full w-full md:w-[400px] bg-gray-900 z-[101] shadow-2xl transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div>
            <h3 className="text-white font-bold text-lg">{communityName} Chat</h3>
            <span className="text-xs text-purple-400 uppercase tracking-widest font-bold">
              Your Role: {userRole}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <Close />
          </button>
        </div>

        {/* Message Area (Mocking for now) */}
        <div className="flex-1 h-[calc(100vh-140px)] overflow-y-auto p-4 space-y-4 flex flex-col">
          <div className="text-center text-gray-500 text-sm my-4">
            Welcome to the {communityName} chat!
          </div>
          
          {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.user_id === user?.id ? 'items-end' : 'items-start'}`}>
            <span className="text-[10px] text-gray-500 mb-1 px-2">
              {msg.author_username} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className={`p-3 rounded-2xl max-w-[85%] ${
              msg.user_id === user?.id ? 'bg-purple-600 rounded-tr-none text-white' : 'bg-gray-800 rounded-tl-none text-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

        {/* Input Field */}
        <form onSubmit={handleSendMessage} className="absolute bottom-0 left-0 right-0 p-4 bg-black/40 border-t border-white/10">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message the community..."
              className="flex-1 bg-gray-800 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-purple-500"
              style={{ 
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' // 👈 This adds the safe space + extra breathing room
              }}
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full transition">
              <Send fontSize="small" />
            </button>
          </div>
        </form>


      </div>
    </>
  );
};
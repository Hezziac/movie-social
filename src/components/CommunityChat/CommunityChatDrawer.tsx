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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleUpdateMessage = async (msgId: string) => {
    if (!editContent.trim()) return;

    const { error } = await supabase
      .from("community_messages")
      .update({ content: editContent })
      .eq("id", msgId);

    if (error) {
      console.error("Error updating:", error);
    } else {
      setEditingId(null); // Close editor on success
    }
  };

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
          event: '*', 
          schema: 'public', 
          table: 'community_messages',
          filter: `community_id=eq.${communityId}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setMessages((prev) => [...prev, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          setMessages((prev) => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
        }
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
      <div 
        className={`fixed top-0 right-0 w-full md:w-[400px] bg-gray-900 z-[101] shadow-2xl transition-transform duration-300 transform ${
    isOpen ? "translate-x-0" : "translate-x-full"
  } flex flex-col h-[100dvh]`}
        style={{ 
          height: '100%', // Use 100% of the parent which is already locked
        }}
      >
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 flex-shrink-0">
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

        {/* Message Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col overscroll-contain touch-pan-y"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '1rem', // 👈 Adds extra space at the bottom of the list
          }}>
          <div className="text-center text-gray-500 text-sm my-4">
            Welcome to the {communityName} chat!
          </div>
          
          {messages.map((msg) => {
            const isMe = msg.user_id === user?.id;
            const isEditing = editingId === msg.id;

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                {/* Author Name & Time */}
                <span className="text-[10px] text-gray-500 mb-1 px-2">
                  {msg.author_username} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {msg.updated_at && (
                    <span className="ml-1 text-purple-400 italic"> (edited)</span>
                  )}
                </span>

                <div className={`flex items-center gap-2 max-w-[85%] ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Action Buttons: Visible on hover (Desktop) or always visible for 'Me' on mobile */}
                  {isMe && !isEditing && !msg.is_deleted && (
                    <div className="md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingId(msg.id);
                          setEditContent(msg.content);
                        }}
                        className="text-[10px] bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-md text-purple-400 font-bold"
                      >
                        Edit
                      </button>
                    </div>
                  )}

                  {/* Message Bubble or Editor */}
                  <div className={`p-3 rounded-2xl ${
                    isMe ? 'bg-purple-600 rounded-tr-none text-white' : 'bg-gray-800 rounded-tl-none text-gray-200'
                  } ${isEditing ? 'w-full min-w-[200px]' : ''}`}>
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-black/20 border border-white/20 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-white/40 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[10px] uppercase font-bold text-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleUpdateMessage(msg.id)}
                            className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-1 rounded"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

        {/* Input Field */}
        <form 
          onSubmit={handleSendMessage} 
          className="p-4 bg-gray-900 border-t border-white/10 z-20 flex-shrink-0"
          style={{ 
            paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' // 👈 Adds 1rem PLUS the iPhone home bar height
          }}
          >
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Message the community..."
              className="flex-1 bg-gray-800 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-purple-500"
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
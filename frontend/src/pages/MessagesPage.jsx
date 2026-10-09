import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Send,
  MessageSquare,
  User,
  MapPin,
  ExternalLink,
  Clock,
  Sparkles
} from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import Avatar from '../components/Avatar';

export default function MessagesPage() {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeListing, setActiveListing] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch all conversation summaries
  const fetchConversations = async () => {
    try {
      const res = await API.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch thread messages for active user
  const fetchThread = async (userId) => {
    try {
      const res = await API.get(`/messages/thread/${userId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
        scrollToBottom();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated]);

  // Handle URL query parameters (e.g. /messages?user=2&listing=5)
  useEffect(() => {
    const targetUserId = searchParams.get('user');
    const targetListingId = searchParams.get('listing');

    if (targetUserId) {
      const uId = parseInt(targetUserId);
      API.get(`/auth/user/${uId}`)
        .then((res) => {
          if (res.data.success) {
            setActiveUser(res.data.profile);
            fetchThread(uId);
          }
        })
        .catch(console.error);

      if (targetListingId) {
        API.get(`/listings/${targetListingId}`)
          .then((res) => {
            if (res.data.success) {
              setActiveListing(res.data.listing);
            }
          })
          .catch(console.error);
      }
    }
  }, [searchParams]);

  // Periodic polling for new messages in active thread
  useEffect(() => {
    if (!activeUser) return;
    const interval = setInterval(() => {
      fetchThread(activeUser.id);
    }, 4000);
    return () => clearInterval(interval);
  }, [activeUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeUser) return;

    setSending(true);
    try {
      const res = await API.post('/messages', {
        receiverId: activeUser.id,
        listingId: activeListing?.id || null,
        content: newMessage.trim(),
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);
        setNewMessage('');
        scrollToBottom();
        fetchConversations();
      }
    } catch (err) {
      showToast('Failed to send message.', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden h-[750px] flex flex-col md:flex-row">
        
        {/* Left: Conversations Sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50">
          
          <div className="p-4 border-b border-slate-200 bg-white">
            <h2 className="font-black text-slate-900 text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-600" /> Campus Chat
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Direct chat for safe meetup coordination</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading chats...</div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No chat conversations yet.</p>
                <p className="text-[11px]">Click "Chat with Student" on any marketplace listing to begin.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeUser?.id === conv.user.id;
                return (
                  <div
                    key={conv.user.id}
                    onClick={() => {
                      setActiveUser(conv.user);
                      setActiveListing(conv.lastMessage.listing || null);
                      setSearchParams({ user: conv.user.id });
                      fetchThread(conv.user.id);
                    }}
                    className={`p-3.5 hover:bg-slate-100/80 cursor-pointer transition-colors flex items-center gap-3 ${
                      isSelected ? 'bg-brand-50/80 border-l-4 border-brand-600' : ''
                    }`}
                  >
                    <Avatar
                      src={conv.user.avatar}
                      alt={conv.user.name}
                      className="w-11 h-11 rounded-2xl ring-1 ring-slate-200"
                      iconClassName="w-6 h-6"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {conv.user.name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {conv.lastMessage.content}
                      </p>

                      {conv.lastMessage.listing && (
                        <span className="text-[10px] text-brand-600 font-semibold truncate block mt-0.5">
                          🏷️ {conv.lastMessage.listing.title}
                        </span>
                      )}
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Active Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {activeUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white z-10 shadow-2xs">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={activeUser.avatar}
                    alt={activeUser.name}
                    className="w-10 h-10 rounded-xl ring-1 ring-slate-200"
                    iconClassName="w-5 h-5"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      {activeUser.name}
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-100 text-brand-700">
                        Student
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">{activeUser.campus || 'Main Campus'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/auth/user/${activeUser.id}`}
                    className="text-xs text-brand-600 font-bold hover:underline"
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Listing Context Banner if present */}
              {activeListing && (
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={activeListing.imageUrl}
                      alt={activeListing.title}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">
                        {activeListing.title}
                      </span>
                      <span className="text-brand-600 font-black">₹{activeListing.price}</span>
                    </div>
                  </div>

                  <Link
                    to={`/listings/${activeListing.id}`}
                    className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-bold text-[11px] text-slate-700 shrink-0 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> View Item
                  </Link>
                </div>
              )}

              {/* Chat Message History */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs space-y-1">
                    <p className="font-bold text-slate-600">Start the conversation!</p>
                    <p>Discuss pickup time, preferred library steps meetup, or product questions.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-brand-600 text-white rounded-br-xs shadow-xs'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form
                onSubmit={handleSendMessage}
                className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder={`Message ${activeUser.name}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 text-xs sm:text-sm bg-slate-100 rounded-2xl px-4 py-2.5 focus:bg-white border border-transparent focus:border-brand-500 focus:outline-none text-slate-900"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl shadow-sm transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300" />
              <h3 className="font-bold text-slate-700 text-base">Select a conversation</h3>
              <p className="text-xs max-w-sm">
                Connect directly with peers to arrange safe exchanges and inspect items on campus.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

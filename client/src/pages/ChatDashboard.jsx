import { useState, useEffect } from 'react';
import NavigationSidebar from '../components/NavigationSidebar';
import ChatSidebar from '../components/ChatSidebar';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import ContactsPanel from '../components/ContactsPanel';
import NotificationPanel from '../components/NotificationPanel';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { imageUpload } from '../utils/upload';

const ChatDashboard = () => {
  const { user, socket } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messagesMap, setMessagesMap] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [isMobileChatView, setIsMobileChatView] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState('chats');

  // Real active user is the one in participants who is not me
  const getActiveUser = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find(p => p._id !== user.id) || conv.participants[0];
  };

  const activeUser = getActiveUser(activeConversation);
  const currentMessages = activeConversation ? (messagesMap[activeConversation.id] || []) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchConversations();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = (msg) => {
        const convId = msg.conversationId;
        
        // Update messagesMap
        setMessagesMap(prev => {
          const prevMsgs = prev[convId] || [];
          if (prevMsgs.find(m => m.id === msg._id || m.id === msg.id)) return prev; 
          // Format msg for map if needed, keeping original structure
          const newMsg = { ...msg, id: msg._id || msg.id };
          return { ...prev, [convId]: [...prevMsgs, newMsg] };
        });

        // Update conversation last message
        setConversations(prev => {
          const convExists = prev.find(c => c.id === convId);
          if (convExists) {
            return prev.map(c => c.id === convId ? { 
              ...c, 
              lastMessage: msg.messageType === 'Text' ? msg.content : msg.messageType, 
              lastMessageAt: msg.createdAt,
              unreadCount: (activeConversation?.id !== convId && (msg.receiverId === user.id || msg.receiver === user.id)) 
                ? (c.unreadCount || 0) + 1 
                : (c.unreadCount || 0)
            } : c).sort((a,b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
          } else {
            fetchConversations(); 
            return prev;
          }
        });

        // Emit read if this is the active conversation
        if (activeConversation && activeConversation.id === convId && (msg.receiverId === user.id || msg.receiver === user.id)) {
          socket.emit('mark_messages_read', { conversationId: convId });
        }
      };

      const handleMessageStatusUpdated = (data) => {
        setMessagesMap(prev => {
          const prevMsgs = prev[data.conversationId] || [];
          const newMsgs = prevMsgs.map(m => (m.id === data.messageId || m._id === data.messageId) ? { ...m, status: data.status } : m);
          return { ...prev, [data.conversationId]: newMsgs };
        });
      };

      const handleUserStatusChanged = (data) => {
        setConversations(prev => prev.map(c => {
          const updatedParts = c.participants.map(p => p._id === data.userId ? { ...p, status: data.status, lastSeen: data.lastSeen } : p);
          return { ...c, participants: updatedParts };
        }));
        
        if (activeConversation) {
          setActiveConversation(prev => {
            if (!prev) return prev;
            const updatedParts = prev.participants.map(p => p._id === data.userId ? { ...p, status: data.status, lastSeen: data.lastSeen } : p);
            return { ...prev, participants: updatedParts };
          });
        }
      };

      const handleUserTyping = (data) => {
        if (activeConversation && activeConversation.id === data.conversationId) {
          setActiveConversation(prev => {
            if (!prev) return prev;
            const updatedParts = prev.participants.map(p => p._id === data.userId ? { ...p, isTyping: true } : p);
            return { ...prev, participants: updatedParts };
          });
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (activeConversation && activeConversation.id === data.conversationId) {
          setActiveConversation(prev => {
            if (!prev) return prev;
            const updatedParts = prev.participants.map(p => p._id === data.userId ? { ...p, isTyping: false } : p);
            return { ...prev, participants: updatedParts };
          });
        }
      };

      const handleNewNotification = () => {
        fetchNotifications();
      };

      const handleMessageDeleted = (data) => {
        const { messageId, conversationId } = data;
        setMessagesMap(prev => {
          const prevMsgs = prev[conversationId] || [];
          const newMsgs = prevMsgs.filter(m => m.id !== messageId && m._id !== messageId);
          return { ...prev, [conversationId]: newMsgs };
        });
      };

      socket.on('receive_message', handleReceiveMessage);
      socket.on('message_status_updated', handleMessageStatusUpdated);
      socket.on('user_status_changed', handleUserStatusChanged);
      socket.on('new_notification', handleNewNotification);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('message_deleted', handleMessageDeleted);

      return () => {
        socket.off('receive_message', handleReceiveMessage);
        socket.off('message_status_updated', handleMessageStatusUpdated);
        socket.off('user_status_changed', handleUserStatusChanged);
        socket.off('new_notification', handleNewNotification);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
        socket.off('message_deleted', handleMessageDeleted);
      };
    }
  }, [socket, activeConversation, user]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      if (res.success) {
        setConversations(res.conversations);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=500');
      if (res.success) {
        const formatted = res.notifications.map(n => ({
          id: n._id,
          text: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.isRead,
          icon: n.senderId?.name ? n.senderId.name.charAt(0).toUpperCase() : '🔔'
        }));
        setNotifications(formatted);
      }
    } catch(err) {}
  };

  const loadMessages = async (convId) => {
    try {
      const res = await api.get(`/messages/${convId}`);
      if (res.success) {
        setMessagesMap(prev => ({ ...prev, [convId]: res.messages }));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSelectConversation = async (userIdOrConvId) => {
    let conv = conversations.find(c => c.id === userIdOrConvId);
    
    if (!conv) {
      try {
        const res = await api.post('/conversations', { userId: userIdOrConvId });
        if (res.success) {
          conv = res.conversation;
          setConversations(prev => {
            const exists = prev.find(c => c.id === conv.id);
            if (exists) return prev;
            return [conv, ...prev];
          });
        }
      } catch (err) {
        console.error(err);
        return;
      }
    }

    if (conv) {
      setActiveConversation(conv);
      setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
      setIsMobileChatView(true);
      if (!messagesMap[conv.id]) {
        loadMessages(conv.id);
      }
      if (socket) {
        socket.emit('mark_messages_read', { conversationId: conv.id });
      }
    }
  };

  const handleBackToList = () => {
    setIsMobileChatView(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch(err) {}
  };

  const handleNotificationClick = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch(err) {}
  };

  const handleDeleteMessage = (messageId) => {
    if (socket && activeConversation) {
      socket.emit('delete_message', {
        messageId,
        conversationId: activeConversation.id
      });
    }
  };

  const handleSendMessage = async (content, fileData) => {
    if (!activeConversation || !activeUser) return;

    // Send file if attached
    if (fileData) {
      try {
        const secure_url = await imageUpload(fileData);
        
        socket.emit('send_message', {
          conversationId: activeConversation.id,
          receiverId: activeUser._id,
          content: secure_url,
          messageType: fileData.type?.startsWith('image/') ? 'Image' : 'File'
        }, (ack) => {
          if (!ack || !ack.success) {
             console.error("Failed to send file via socket", ack?.message);
          }
        });
      } catch(err) {
        console.error("Upload error:", err);
      }
    }
    
    // Send text if present
    if (content && content.trim()) {
      socket.emit('send_message', {
        conversationId: activeConversation.id,
        receiverId: activeUser._id,
        content
      }, (ack) => {
        if (!ack || !ack.success) {
           console.error("Failed to send message via socket", ack?.message);
        }
      });
    }
  };

  return (
    <div className="dashboard-container">
      <NavigationSidebar 
        activeTab={activeSidebarTab}
        onTabChange={setActiveSidebarTab}
        unreadCount={unreadCount} 
        notifications={notifications} 
        onMarkAllRead={handleMarkAllRead} 
      />

      <div className={`dashboard-main-content ${isMobileChatView ? 'show-chat' : 'show-sidebar'}`}>
        
        {activeSidebarTab === 'chats' && (
          <ChatSidebar 
            conversations={conversations.map(c => {
              const otherPart = c.participants.find(p => p._id !== user.id) || c.participants[0];
              return {
                id: c.id,
                name: otherPart?.name || 'Unknown',
                status: otherPart?.status,
                lastMessage: c.lastMessage,
                time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                unread: c.unreadCount || 0, 
                online: otherPart?.status === 'Online',
                profileImage: otherPart?.profileImage
              }
            })}
            selectedId={activeConversation?.id} 
            onSelectConversation={(id) => {
              handleSelectConversation(id);
              if (isMobileChatView) setIsMobileChatView(true);
            }} 
          />
        )}

        {activeSidebarTab === 'contacts' && (
          <div className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
            <ContactsPanel 
              onClose={() => setActiveSidebarTab('chats')}
              onSelectContact={(id) => {
                handleSelectConversation(id);
                setActiveSidebarTab('chats');
              }}
            />
          </div>
        )}

        {activeSidebarTab === 'notifications' && (
          <div className="chat-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
            <NotificationPanel 
              notifications={notifications} 
              onMarkAllRead={handleMarkAllRead}
              onNotificationClick={handleNotificationClick}
              onClose={() => setActiveSidebarTab('chats')}
            />
          </div>
        )}

        <div className="chat-main">
          {activeUser ? (
            <>
              <ChatHeader user={{ ...activeUser, online: activeUser.status === 'Online' }} onBack={handleBackToList} />
              {currentMessages.length > 0 ? (
                <MessageList messages={currentMessages.map(m => ({
                  id: m.id || m._id,
                  type: (m.sender === user.id || m.senderId === user.id || (m.sender && m.sender._id === user.id) || (m.senderId && m.senderId._id === user.id)) ? 'sent' : 'received',
                  text: m.content || m.text,
                  time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (m.time || ''),
                  status: m.status?.toLowerCase(),
                  messageType: m.messageType
                }))} onDeleteMessage={handleDeleteMessage} />
              ) : (
                <div className="empty-chat">
                  <div style={{ fontSize: '3rem' }}>👋</div>
                  <h3>Start a conversation</h3>
                  <p>Send a message to start chatting with {activeUser.name}.</p>
                </div>
              )}
              <MessageInput onSendMessage={handleSendMessage} onTyping={(isTyping) => {
                if (!socket || !activeUser || !activeConversation) return;
                if (isTyping) {
                  socket.emit('typing_start', { receiverId: activeUser._id, conversationId: activeConversation.id });
                } else {
                  socket.emit('typing_stop', { receiverId: activeUser._id, conversationId: activeConversation.id });
                }
              }} />
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', backgroundColor: 'var(--bg-main)', textAlign: 'center', padding: '2rem' }}>
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--very-light-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--primary-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
              </div>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: '600', marginBottom: '0.75rem' }}>Welcome to ChatMsg</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '350px', lineHeight: '1.5' }}>
                Select a conversation from the sidebar to start chatting or search for friends to begin a new connection.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatDashboard;

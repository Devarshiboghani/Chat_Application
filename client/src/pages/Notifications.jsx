import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { socket } = useAuth();

  useEffect(() => {
    fetchNotifications();
    
    if (socket) {
      socket.on('new_notification', () => {
        fetchNotifications();
      });
      return () => {
        socket.off('new_notification');
      };
    }
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.success) {
        // Backend returns notifications populated with senderId
        const formatted = res.notifications.map(n => ({
          id: n._id,
          text: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: n.isRead,
          icon: n.senderId?.name ? n.senderId.name.charAt(0).toUpperCase() : '🔔'
        }));
        setNotifications(formatted);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifs = notifications.filter(n => filter === 'all' || !n.read);

  const markAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && notif.read) return;
    
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await api.put(`/notifications/${id}/read`);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await api.put('/notifications/read-all');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <Link to="/chat" className="icon-btn" style={{ marginRight: '1rem', color: 'var(--primary-dark)' }}>← Back to Chat</Link>
        <h1>Notifications</h1>
      </div>

      <div className="notifications-page-layout">
        <div className="profile-card" style={{ padding: '0', overflow: 'hidden' }}>
          
          <div style={{ padding: '1.5rem 1.5rem 0' }}>
            <div className="notifications-filter" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </button>
              </div>
              <button className="mark-read-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            </div>
          </div>

          <div className="notification-list-full">
            {filteredNotifs.length > 0 ? (
              filteredNotifs.map(notif => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                  style={{ padding: '1.5rem' }}
                >
                  <div className="notification-icon" style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}>
                    {notif.icon || '🔔'}
                  </div>
                  <div className="notification-content">
                    <div className="notification-text" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>{notif.text}</div>
                    <div className="notification-time">{notif.time}</div>
                  </div>
                  {!notif.read && (
                    <div style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary-green)', borderRadius: '50%', alignSelf: 'center' }}></div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No notifications to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

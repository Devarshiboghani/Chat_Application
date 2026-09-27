import { Link } from 'react-router-dom';

const NotificationPanel = ({ notifications, onMarkAllRead, onNotificationClick, onClose }) => {
  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <h3>Notifications</h3>
        <button className="mark-read-btn" onClick={onMarkAllRead}>
          Mark all as read
        </button>
      </div>
      
      <div className="notification-list-mini">
        {notifications.length > 0 ? (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`notification-item ${!notif.read ? 'unread' : ''}`}
              onClick={() => {
                if (!notif.read && onNotificationClick) {
                  onNotificationClick(notif.id);
                }
              }}
            >
              <div className="notification-icon">
                {notif.icon || '🔔'}
              </div>
              <div className="notification-content">
                <div className="notification-text">{notif.text}</div>
                <div className="notification-time">{notif.time}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No new notifications
          </div>
        )}
      </div>

    </div>
  );
};

export default NotificationPanel;

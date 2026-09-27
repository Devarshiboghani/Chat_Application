import { useState, useEffect } from 'react';
import { api } from '../services/api';

const ContactsPanel = ({ onClose, onSelectContact }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await api.get('/users/search?q='); // Empty query gets all users now
        if (res.success) {
          setContacts(res.users);
        }
      } catch (err) {
        console.error("Error fetching contacts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  return (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <h3>All Contacts</h3>
        <button className="mark-read-btn" onClick={onClose} aria-label="Close Contacts">
          Close
        </button>
      </div>
      <div className="notification-list-mini">
        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        ) : contacts.length > 0 ? (
          contacts.map(user => (
            <div 
              key={user.id} 
              className="notification-item" 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => {
                onSelectContact(user.id);
                onClose();
              }}
            >
              <div className="notification-icon" style={{ padding: 0, backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="conv-avatar-wrapper" style={{ margin: 0 }}>
                  <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem', overflow: 'hidden' }}>
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  {user.status === 'Online' && <div className="online-indicator"></div>}
                </div>
              </div>
              <div className="notification-content">
                <div className="notification-text" style={{ fontWeight: '500' }}>{user.name}</div>
                <div className="notification-time">{user.status}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No contacts found</div>
        )}
      </div>
    </div>
  );
};

export default ContactsPanel;

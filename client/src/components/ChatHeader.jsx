const ChatHeader = ({ user, onBack }) => {
  if (!user) return null;

  const formatLastSeen = (dateString) => {
    if (!dateString) return 'Offline';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).getDate() === date.getDate();
    
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `last seen today at ${time}`;
    if (isYesterday) return `last seen yesterday at ${time}`;
    return `last seen on ${date.toLocaleDateString()} at ${time}`;
  };

  return (
    <div className="chat-header">
      <div className="chat-header-user">
        <button className="back-btn" onClick={onBack} aria-label="Back to conversations">
          ←
        </button>
        <div className="conv-avatar-wrapper">
          <div className="avatar" style={{ overflow: 'hidden' }}>
            {user.profileImage ? (
              <img src={user.profileImage} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user.name.charAt(0)
            )}
          </div>
          {user.online && <div className="online-indicator"></div>}
        </div>
        <div className="profile-info">
          <div className="profile-name">{user.name}</div>
          <div className="profile-status" style={{ color: user.online || user.isTyping ? 'var(--primary-green)' : 'var(--text-muted)' }}>
            {user.isTyping ? 'Typing...' : (
              user.online ? 'Online' : formatLastSeen(user.lastSeen)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;

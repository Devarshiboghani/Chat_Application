const ConversationItem = ({ conversation, isActive, onClick }) => {
  return (
    <li className={`conversation-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      <div className="conv-avatar-wrapper">
        <div className="avatar" style={{ overflow: 'hidden' }}>
          {conversation.profileImage ? (
            <img src={conversation.profileImage} alt={conversation.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            conversation.name.charAt(0)
          )}
        </div>
        {conversation.online && <div className="online-indicator"></div>}
      </div>
      
      <div className="conv-details">
        <div className="conv-header">
          <span className="conv-name">{conversation.name}</span>
          <span className="conv-time">{conversation.time}</span>
        </div>
        <div className="conv-footer">
          <span className="conv-message">{conversation.lastMessage}</span>
          {conversation.unread > 0 && (
            <span className="unread-badge">{conversation.unread}</span>
          )}
        </div>
      </div>
    </li>
  );
};

export default ConversationItem;

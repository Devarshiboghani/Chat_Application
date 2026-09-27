import { useState } from 'react';

const MessageBubble = ({ message, onDelete }) => {
  const isSent = message.type === 'sent';
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const getFileUrl = (path) => {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    return `${baseUrl}${path}`;
  };

  const renderContent = () => {
    if (message.messageType === 'Image') {
      return (
        <div className="message-image">
          <img 
            src={getFileUrl(message.text)} 
            alt="Uploaded" 
            className="chat-image" 
            onClick={() => setIsPreviewOpen(true)}
            style={{ cursor: 'pointer' }}
          />
        </div>
      );
    } else if (message.messageType === 'File') {
      const filename = message.text.split('/').pop();
      return (
        <div className="message-file" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.5rem' }}>📄</span>
          <a href={getFileUrl(message.text)} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
            {filename}
          </a>
        </div>
      );
    } else {
      return <div className="message-text">{message.text}</div>;
    }
  };

  return (
    <>
      <div 
        className={`message-wrapper ${isSent ? 'sent' : 'received'}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        {isSent && isHovered && (
          <button 
            onClick={() => onDelete && onDelete()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s',
            }}
            title="Delete Message"
            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        )}
        
        <div className={`message-bubble ${message.messageType === 'Image' ? 'is-image' : ''}`}>
          <div className="message-content">{renderContent()}</div>
          <div className="message-meta">
            <span className="message-time">{message.time}</span>
            {isSent && (
              <span className="message-status">
                {message.status === 'read' ? '✓✓' : message.status === 'delivered' ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Full-size Image Preview Modal */}
      {isPreviewOpen && (
        <div 
          className="image-preview-modal" 
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="image-preview-close" onClick={() => setIsPreviewOpen(false)}>✕</div>
          <img 
            src={getFileUrl(message.text)} 
            alt="Full size preview" 
            className="image-preview-content"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
};

export default MessageBubble;

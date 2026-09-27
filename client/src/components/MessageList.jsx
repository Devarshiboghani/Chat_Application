import MessageBubble from './MessageBubble';
import { useEffect, useRef } from 'react';

const MessageList = ({ messages, onDeleteMessage }) => {
  const listRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="message-list" ref={listRef}>
      {messages.length > 0 ? (
        messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} onDelete={() => onDeleteMessage(msg.id)} />
        ))
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>
          No messages yet. Send a message to start the conversation!
        </div>
      )}
    </div>
  );
};

export default MessageList;

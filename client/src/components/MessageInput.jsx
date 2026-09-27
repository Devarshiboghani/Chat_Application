import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    
    if (onTyping) {
      onTyping(true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onEmojiClick = (emojiObject) => {
    setText((prevText) => prevText + emojiObject.emoji);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() || selectedFile) {
      onSendMessage(text, selectedFile);
      setText('');
      clearFile();
      setShowEmojiPicker(false);
      if (onTyping) onTyping(false);
    }
  };

  return (
    <div className="message-input-container" style={{ position: 'relative' }}>
      {showEmojiPicker && (
        <div ref={emojiPickerRef} style={{ position: 'absolute', bottom: '100%', right: '20px', zIndex: 100, marginBottom: '10px' }}>
          <EmojiPicker onEmojiClick={onEmojiClick} autoFocusSearch={false} />
        </div>
      )}
      {selectedFile && (
        <div style={{ padding: '0.5rem', backgroundColor: '#f0f0f0', borderRadius: '4px', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          <span>Selected: {selectedFile.name}</span>
          <button type="button" onClick={clearFile} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>✖</button>
        </div>
      )}
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
        />
        <button 
          type="button" 
          className="icon-btn" 
          aria-label="Attach file"
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
          </svg>
        </button>
        <input 
          type="text" 
          className="message-input-field" 
          placeholder="Type a message..." 
          value={text}
          onChange={handleTextChange}
        />
        <button 
          type="button" 
          className="icon-btn" 
          aria-label="Add emoji"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
        >
          😊
        </button>
        <button 
          type="submit" 
          className="send-btn" 
          disabled={!text.trim() && !selectedFile}
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default MessageInput;

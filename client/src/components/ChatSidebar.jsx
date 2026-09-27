import { useState, useRef, useEffect } from 'react';
import { api } from '../services/api';
import ConversationItem from './ConversationItem';

const ChatSidebar = ({ conversations, selectedId, onSelectConversation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim()) {
        setIsSearching(true);
        try {
          const res = await api.get(`/users/search?q=${searchQuery}`);
          if (res.success) {
            setSearchResults(res.users);
          }
        } catch (err) {
          console.error("Search error:", err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchResultClick = (userId) => {
    onSelectConversation(userId);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.5px' }}>ChatMsg</h2>
        <button className="icon-btn" aria-label="More options">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <circle cx="12" cy="5" r="2"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <circle cx="12" cy="19" r="2"></circle>
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container" ref={searchRef}>
        <div className="search-input-wrapper">
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} aria-label="Clear search">
              ×
            </button>
          )}

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="search-results-dropdown">
              {isSearching ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div 
                    key={user.id} 
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(user.id)}
                  >
                    <div className="conv-avatar-wrapper">
                      <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
                      {user.status === 'Online' && <div className="online-indicator"></div>}
                    </div>
                    <div className="search-result-info">
                      <div className="search-result-name">{user.name}</div>
                      <div className="search-result-role">
                        {user.status}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No users found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <ul className="conversation-list">
        {conversations.length > 0 ? (
          conversations.map(conv => (
            <ConversationItem 
              key={conv.id} 
              conversation={conv} 
              isActive={selectedId === conv.id}
              onClick={() => onSelectConversation(conv.id)}
            />
          ))
        ) : (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No conversations yet
          </div>
        )}
      </ul>
    </div>
  );
};

export default ChatSidebar;

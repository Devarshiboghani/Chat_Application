import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const NavigationSidebar = ({ activeTab, onTabChange, unreadCount, notifications, onMarkAllRead }) => {
  const navigate = useNavigate();

  return (
    <div className="navigation-sidebar">
      <div className="nav-menu">
        <div 
          className={`nav-item-wrapper ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => onTabChange('chats')}
        >
          <button className="nav-icon-btn" aria-label="Chats">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          </button>
          <span className="nav-label">Chats</span>
        </div>


        <div 
          className={`nav-item-wrapper ${activeTab === 'contacts' ? 'active' : ''}`}
          onClick={() => onTabChange('contacts')}
        >
          <button className="nav-icon-btn" aria-label="Contacts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <span className="nav-label">Contacts</span>
        </div>
        
        <div 
          className={`nav-item-wrapper ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => onTabChange('notifications')}
        >
          <button className="nav-icon-btn" aria-label="Alerts">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadCount > 0 && (
              <div className="notification-badge">{unreadCount}</div>
            )}
          </button>
          <span className="nav-label">Notification</span>
        </div>
      </div>

      <div className="nav-bottom">

        <div 
          className="nav-item-wrapper" 
          onClick={() => navigate('/profile')}
          style={{ cursor: 'pointer' }}
        >
          <button className="nav-icon-btn" aria-label="Profile">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </button>
          <span className="nav-label">Profile</span>
        </div>
      </div>
    </div>
  );
};

export default NavigationSidebar;

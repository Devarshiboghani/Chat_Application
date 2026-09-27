import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { imageUpload } from '../utils/upload';
import { useRef } from 'react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    status: user?.status || 'Offline',
    profileImage: user?.profileImage || '',
  });
  
  const fileInputRef = useRef(null);

  const [editFormData, setEditFormData] = useState({ ...profileData });
  
  // Keep form data in sync if user updates
  useEffect(() => {
    if (user) {
      const newProfileData = {
        name: user.name || '',
        email: user.email || '',
        status: user.status || 'Offline',
        profileImage: user.profileImage || '',
      };
      setProfileData(newProfileData);
      setEditFormData(newProfileData);
    }
  }, [user]);

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.put('/users/profile', { name: editFormData.name });
      if (res.success) {
        setProfileData({ ...profileData, name: res.user.name, profileImage: res.user.profileImage });
        setUser(prev => ({ ...prev, name: res.user.name, profileImage: res.user.profileImage }));
        setIsEditing(false);
        showSuccess('Profile updated successfully');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoading(true);
    try {
      const secure_url = await imageUpload(file);
      const res = await api.put('/users/profile', { profileImage: secure_url });
      
      if (res.success) {
        setProfileData(prev => ({ ...prev, profileImage: secure_url }));
        setUser(prev => ({ ...prev, profileImage: secure_url }));
        showSuccess('Profile photo updated successfully');
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageDelete = async () => {
    setLoading(true);
    try {
      const res = await api.put('/users/profile', { profileImage: '' });
      if (res.success) {
        setProfileData(prev => ({ ...prev, profileImage: '' }));
        setUser(prev => ({ ...prev, profileImage: '' }));
        showSuccess('Profile photo removed');
      }
    } catch (err) {
      setError('Failed to remove image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="page-container" style={{ backgroundColor: '#f0f9f8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      
      {error && (
        <div className="error-message" style={{ maxWidth: '450px', width: '100%', margin: '0 0 1rem 0', color: '#dc3545', backgroundColor: '#f8d7da', padding: '1rem', borderRadius: '8px' }}>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="success-message" style={{ maxWidth: '450px', width: '100%', margin: '0 0 1rem 0', backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: '8px' }}>
          ✓ {successMessage}
        </div>
      )}

      <div style={{ maxWidth: '450px', width: '100%', backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', position: 'relative' }}>
        
        {/* Top Header Section inside card */}
        <div style={{ position: 'relative', padding: '2rem 2rem 0 2rem' }}>
          {/* Decorative wavy background */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '220px', backgroundColor: '#e6f5f3', borderBottomLeftRadius: '50% 20%', borderBottomRightRadius: '50% 20%', zIndex: 0 }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem' }}>
            <Link to="/chat" style={{ color: 'var(--primary-dark)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Chat
            </Link>
            <h1 style={{ color: 'var(--primary-dark)', margin: 0, fontSize: '1.6rem', fontWeight: 'bold' }}>My Profile</h1>
          </div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ position: 'relative', marginBottom: '1rem', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
              <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#d1ece9', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {profileData.profileImage ? (
                  <img src={profileData.profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profileData.name ? profileData.name.charAt(0).toUpperCase() : '?'
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', width: '28px', height: '28px', backgroundColor: 'var(--primary-dark)', border: '2px solid white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
              </div>
            </div>
            
            {profileData.profileImage && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleImageDelete(); }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ef4444', 
                  fontSize: '0.85rem', 
                  fontWeight: '500',
                  cursor: 'pointer', 
                  marginBottom: '1rem',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  textDecoration: 'none'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.textDecoration = 'underline';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.textDecoration = 'none';
                }}
              >
                Remove Photo
              </button>
            )}
            
            <h2 style={{ color: 'var(--primary-dark)', margin: '0 0 0.25rem 0', fontSize: '1.3rem', fontWeight: 'bold' }}>{profileData.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: profileData.status === 'Online' ? '#10b981' : '#9ca3af' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: profileData.status === 'Online' ? '#10b981' : '#9ca3af' }}></span>
              {profileData.status}
            </div>
          </div>
        </div>

        {/* Form/Info Section */}
        <div style={{ padding: '2.5rem 2rem 2rem 2rem', position: 'relative', zIndex: 1 }}>
          {!isEditing ? (
            <>
              <h3 style={{ color: 'var(--primary-dark)', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1.5rem 0' }}>Profile Information</h3>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <div style={{ flex: 1, borderBottom: '1px solid #f3f4f6', paddingBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.2rem' }}>Full Name</div>
                  <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{profileData.name}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '2.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e6f5f3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div style={{ flex: 1, borderBottom: '1px solid #f3f4f6', paddingBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '0.2rem' }}>Email</div>
                  <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{profileData.email}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={() => { setIsEditing(true); setEditFormData({ ...profileData }); }} 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => e.target.style.opacity = '0.9'}
                  onMouseOut={(e) => e.target.style.opacity = '1'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  Edit Profile
                </button>
                <button 
                  onClick={handleLogout} 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', backgroundColor: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#fef2f2'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={saveProfile}>
              <h3 style={{ color: 'var(--primary-dark)', fontSize: '1rem', fontWeight: 'bold', margin: '0 0 1.5rem 0' }}>Edit Profile</h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={editFormData.name} 
                  onChange={handleEditChange} 
                  required 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '0.95rem', color: '#1f2937', outline: 'none' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-green)'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
              </div>
              
              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                <input 
                  type="email" 
                  name="email" 
                  value={editFormData.email} 
                  disabled 
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '0.95rem', color: '#9ca3af', backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
                />
                <small style={{ display: 'block', marginTop: '0.5rem', color: '#9ca3af', fontSize: '0.75rem' }}>Email cannot be changed.</small>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ flex: 1, padding: '0.8rem', backgroundColor: 'var(--primary-dark)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'all 0.2s' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  disabled={loading}
                  style={{ flex: 1, padding: '0.8rem', backgroundColor: 'white', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.target.style.backgroundColor = '#f9fafb'; }}
                  onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

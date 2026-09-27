import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { io } from 'socket.io-client';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await api.get('/auth/me');
          if (data.success) {
            setUser(data.user);
            connectSocket(token);
          }
        } catch (error) {
          console.error("Auth init failed:", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    initAuth();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const connectSocket = (token) => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket connection error:", err.message);
      if (err.message.includes('Authentication error')) {
        logout();
      }
    });

    setSocket(newSocket);
  };

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setUser(data.user);
      connectSocket(data.token);
      navigate('/chat');
      return true;
    }
    return false;
  };

  const register = async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password });
    if (data.success) {
      // Auto-login after successful registration
      return await login(email, password);
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    navigate('/login');
  };

  const value = {
    user,
    setUser,
    socket,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

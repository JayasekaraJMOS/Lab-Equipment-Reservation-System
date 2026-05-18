import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('lab_reserve_token');
    if (token) {
      api.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('lab_reserve_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('lab_reserve_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password, department) => {
    const res = await api.post('/auth/register', { name, email, password, department });
    localStorage.setItem('lab_reserve_token', res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('lab_reserve_token');
    setUser(null);
  };

  const demoLogin = async (roleType) => {
    const credentials = {
      student: { email: 'student@university.edu', password: 'student123' },
      tech: { email: 'tech@university.edu', password: 'tech123' },
      admin: { email: 'admin@university.edu', password: 'admin123' }
    };
    const creds = credentials[roleType] || credentials.student;
    return login(creds.email, creds.password);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

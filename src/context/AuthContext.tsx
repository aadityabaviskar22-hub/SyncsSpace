import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types/index.js';
import { INITIAL_USERS } from '../services/mockData.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (name: string, email: string, department: string, role?: UserRole) => Promise<boolean>;
  logout: () => void;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Read persisted role from localStorage with graceful fallback
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const savedRole = localStorage.getItem('syncspace_active_role') as UserRole;
    if (savedRole && ['Admin', 'Manager', 'Member'].includes(savedRole)) {
      return savedRole;
    }
    const savedUser = localStorage.getItem('hub_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role) return parsed.role;
      } catch (e) {
        // Fallback below
      }
    }
    return 'Manager'; // Default active role
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedRole = localStorage.getItem('syncspace_active_role') as UserRole;
    const targetRole = savedRole && ['Admin', 'Manager', 'Member'].includes(savedRole) ? savedRole : 'Manager';

    const savedUser = localStorage.getItem('hub_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return { ...parsed, role: targetRole };
      } catch (e) {
        // Fall through
      }
    }
    const persona = INITIAL_USERS.find((u) => u.role === targetRole) || INITIAL_USERS[0];
    return { ...persona, role: targetRole };
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hub_token') || 'mock_jwt_token_for_syncspace';
  });

  // Sync user changes to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('hub_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hub_user');
    }
  }, [user]);

  // Sync token to localStorage
  useEffect(() => {
    if (token) {
      localStorage.setItem('hub_token', token);
    } else {
      localStorage.removeItem('hub_token');
    }
  }, [token]);

  // Set active role globally and persist across page refresh
  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('syncspace_active_role', role);
    } catch (e) {
      console.warn('Failed to persist active role to localStorage', e);
    }

    // Switch or update active persona to guarantee accurate task assignment & permissions
    setUser((prevUser) => {
      // Find matching user persona for the role
      const matchedPersona = INITIAL_USERS.find((u) => u.role === role);
      let updatedUser: User;
      if (matchedPersona) {
        updatedUser = { ...matchedPersona, role };
      } else if (prevUser) {
        updatedUser = { ...prevUser, role };
      } else {
        updatedUser = { ...INITIAL_USERS[0], role };
      }
      try {
        localStorage.setItem('hub_user', JSON.stringify(updatedUser));
      } catch (e) {}
      return updatedUser;
    });
  }, []);

  const login = async (email: string): Promise<boolean> => {
    const matchedUser = INITIAL_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (matchedUser) {
      setUser(matchedUser);
      setCurrentRole(matchedUser.role);
      localStorage.setItem('syncspace_active_role', matchedUser.role);
      setToken(`jwt_token_${matchedUser._id}_${Date.now()}`);
      return true;
    }
    const newUser: User = {
      _id: `u_${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: currentRole,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      department: 'Engineering',
      isOnline: true,
    };
    setUser(newUser);
    setToken(`jwt_token_${newUser._id}_${Date.now()}`);
    return true;
  };

  const register = async (name: string, email: string, department: string, role: UserRole = 'Member'): Promise<boolean> => {
    const newUser: User = {
      _id: `u_${Date.now()}`,
      name,
      email,
      role,
      department,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isOnline: true,
    };
    setUser(newUser);
    setCurrentRole(role);
    localStorage.setItem('syncspace_active_role', role);
    setToken(`jwt_token_${newUser._id}_${Date.now()}`);
    return true;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hub_user');
    localStorage.removeItem('hub_token');
  };

  const switchUser = (userId: string) => {
    const targetUser = INITIAL_USERS.find((u) => u._id === userId);
    if (targetUser) {
      setUser(targetUser);
      setCurrentRole(targetUser.role);
      localStorage.setItem('syncspace_active_role', targetUser.role);
      setToken(`jwt_token_${targetUser._id}_switched`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        currentRole,
        setRole,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface User {
  sub: string;
  email?: string;
  name?: string;
  nickname?: string;
  picture?: string;
  [key: string]: any; // For custom claims like roles
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    try {
      // Clear local state first
      setUser(null);
      setError(null);
      
      // Then call the API to clear server-side cookies
      await fetch('/api/auth/logout', { method: 'GET' });
      
      // Force a page reload to ensure all state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if the API call fails, clear local state
      setUser(null);
      setError(null);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    const loadUser = () => {
      try {
        // Try to get user info from cookies
        const userInfoCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user-info='));

        if (userInfoCookie) {
          const userInfo = userInfoCookie.split('=')[1];
          const decodedUserInfo = decodeURIComponent(userInfo);
          const user = JSON.parse(decodedUserInfo);
          setUser(user);
        } else {
          setUser(null); // Clear user if no cookie
        }
      } catch (err) {
        console.error('Failed to load user from cookies:', err);
        setError('Failed to load user information');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();

    // Re-check cookies when window regains focus (e.g., after logout redirect)
    const handleFocus = () => {
      loadUser();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <UserContext.Provider value={{ user, isLoading, error, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
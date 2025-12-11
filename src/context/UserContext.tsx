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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <UserContext.Provider value={{ user, isLoading, error }}>
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
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

const AuthContext = createContext({
  user: null,
  role: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Local Mock Auth listener/restore
      const cookies = document.cookie.split('; ').reduce((acc, c) => {
        const [k, v] = c.split('=');
        acc[k] = v;
        return acc;
      }, {});

      if (cookies.fe_token && cookies.fe_role) {
        const mockEmail = cookies.fe_role === 'admin' 
          ? 'admin@fe.com' 
          : cookies.fe_role === 'delivery' 
          ? 'delivery@fe.com' 
          : 'employee@fe.com';
          
        const mockName = cookies.fe_role === 'admin' 
          ? 'Admin Demo User' 
          : cookies.fe_role === 'delivery' 
          ? 'Delivery Agent Kumar' 
          : 'Booking Desk Staff';

        setUser({
          email: mockEmail,
          uid: `mock-uid-${cookies.fe_role}`,
          getIdToken: async () => 'mock-token',
        });
        setRole(cookies.fe_role);
        setProfile({
          name: mockName,
          email: mockEmail,
          role: cookies.fe_role,
        });
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfile(userData);
            setRole(userData.role || 'employee');
            
            const token = await firebaseUser.getIdToken();
            document.cookie = `fe_token=${token}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `fe_role=${userData.role || 'employee'}; path=/; max-age=86400; SameSite=Lax`;
          } else {
            setProfile({ name: firebaseUser.displayName || firebaseUser.email, email: firebaseUser.email, role: 'employee' });
            setRole('employee');
            const token = await firebaseUser.getIdToken();
            document.cookie = `fe_token=${token}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `fe_role=employee; path=/; max-age=86400; SameSite=Lax`;
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(null);
          setRole(null);
          setProfile(null);
        }
      } else {
        setUser(null);
        setRole(null);
        setProfile(null);
        document.cookie = "fe_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
        document.cookie = "fe_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      // Offline Simulated Login check
      let userRole = 'employee';
      let userName = 'Booking Desk Staff';
      
      const emailLower = email.toLowerCase();
      if (emailLower.includes('admin')) {
        userRole = 'admin';
        userName = 'Admin Demo User';
      } else if (emailLower.includes('delivery')) {
        userRole = 'delivery';
        userName = 'Delivery Agent Kumar';
      }

      // Simulate a short loading delay for realistic feel
      await new Promise((resolve) => setTimeout(resolve, 600));

      const mockUser = {
        email,
        uid: `mock-uid-${userRole}`,
        getIdToken: async () => 'mock-token',
      };

      setUser(mockUser);
      setRole(userRole);
      setProfile({
        name: userName,
        email: email,
        role: userRole,
      });

      document.cookie = `fe_token=mock-token; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `fe_role=${userRole}; path=/; max-age=86400; SameSite=Lax`;
      setLoading(false);
      return mockUser;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    if (!isFirebaseConfigured) {
      setUser(null);
      setRole(null);
      setProfile(null);
      document.cookie = "fe_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      document.cookie = "fe_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
      setLoading(false);
      return;
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);

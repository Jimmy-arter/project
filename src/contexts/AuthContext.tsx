import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, enableNetwork, disableNetwork } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isOnline: boolean;
  retryConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      enableNetwork(db).catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
      disableNetwork(db).catch(console.error);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          // Try to get user role from local storage first
          const cachedRole = localStorage.getItem(`userRole_${user.uid}`);
          if (cachedRole) {
            setUserRole(cachedRole);
          }

          // Only try to fetch from Firestore if we're online
          if (navigator.onLine) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const role = userDoc.data().role;
              setUserRole(role);
              // Cache the role
              localStorage.setItem(`userRole_${user.uid}`, role);
            }
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          // If there's an error, try to use cached role
          const cachedRole = localStorage.getItem(`userRole_${user.uid}`);
          if (cachedRole) {
            setUserRole(cachedRole);
          }
        }
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const retryConnection = async () => {
    try {
      await enableNetwork(db);
      setIsOnline(true);
      
      // Retry fetching user role if we have a user
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setUserRole(role);
          localStorage.setItem(`userRole_${currentUser.uid}`, role);
        }
      }
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  const signup = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
    // Clear cached role on logout
    if (currentUser) {
      localStorage.removeItem(`userRole_${currentUser.uid}`);
    }
  };

  const value = {
    currentUser,
    userRole,
    login,
    signup,
    logout,
    loading,
    isOnline,
    retryConnection
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
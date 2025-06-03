
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Auth, onAuthStateChanged, type User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { createUserProfile, type CreateUserProfileData } from '@/services/userService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: CreateUserProfileData) => Promise<User | null>;
  logIn: (email: string, pass: string) => Promise<User | null>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: CreateUserProfileData): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email || data.email, // Use auth email if available
          displayName: data.displayName,
        });
        toast({ title: 'Sign Up Successful', description: `Welcome, ${data.displayName || data.email}!` });
        router.push('/'); // Redirect to dashboard
        return userCredential.user;
      }
      return null;
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast({ variant: "destructive", title: "Sign Up Failed", description: error.message || "Could not create account." });
      setLoading(false);
      return null;
    }
  };

  const logIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      toast({ title: 'Login Successful', description: `Welcome back, ${userCredential.user.email}!` });
      router.push('/'); // Redirect to dashboard
      return userCredential.user;
    } catch (error: any) {
      console.error("Error logging in:", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Invalid email or password." });
      setLoading(false);
      return null;
    }
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login'); // Redirect to login page
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

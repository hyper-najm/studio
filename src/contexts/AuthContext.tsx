
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type Auth, 
  onAuthStateChanged, 
  type User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo,
  type AuthProvider as FirebaseAuthProvider
} from 'firebase/auth';
import { auth } from '@/lib/firebaseConfig';
import { createUserProfile, type CreateUserProfileData, updateUserLastLogin } from '@/services/userService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (data: CreateUserProfileData) => Promise<User | null>;
  logIn: (email: string, pass: string) => Promise<User | null>;
  logOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
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
    if (!data.displayName) {
        toast({ variant: "destructive", title: "Sign Up Failed", description: "Display name is required." });
        return null;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: data.displayName });
      
      await createUserProfile(user.uid, {
        email: user.email!,
        displayName: data.displayName,
      });
      
      toast({ title: 'Sign Up Successful', description: `Welcome, ${data.displayName}!` });
      router.push('/');
      return user;
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
      await updateUserLastLogin(userCredential.user.uid);
      toast({ title: 'Login Successful', description: `Welcome back, ${userCredential.user.displayName || userCredential.user.email}!` });
      router.push('/');
      return userCredential.user;
    } catch (error: any) {
      console.error("Error logging in:", error);
      toast({ variant: "destructive", title: "Login Failed", description: error.message || "Invalid email or password." });
      setLoading(false);
      return null;
    }
  };
  
  const signInWithProvider = async (provider: FirebaseAuthProvider, providerName: string) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        // If it's a new user, create a profile in Firestore
        await createUserProfile(user.uid, {
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
        });
        toast({ title: 'Sign Up Successful', description: `Welcome, ${user.displayName || user.email}!` });
      } else {
        // If it's a returning user, just update their last login time
        await updateUserLastLogin(user.uid);
        toast({ title: 'Login Successful', description: `Welcome back, ${user.displayName || user.email}!` });
      }
      
      router.push('/');
    } catch (error: any) {
      console.error(`Error signing in with ${providerName}:`, error);
      let description = error.message || `Could not sign in with ${providerName}.`;
      // Handle common errors for better UX
      if (error.code === 'auth/account-exists-with-different-credential') {
        description = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
      }
      toast({ variant: "destructive", title: `${providerName} Sign-In Failed`, description });
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await signInWithProvider(new GoogleAuthProvider(), "Google");
  };

  const signInWithGitHub = async () => {
    await signInWithProvider(new GithubAuthProvider(), "GitHub");
  };

  const logOut = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: error.message || "Could not log out." });
    } finally {
        // setLoading(false) is handled by onAuthStateChanged
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, signInWithGoogle, signInWithGitHub }}>
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

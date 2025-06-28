
'use client';

import type { ReactNode } from 'react';
import React, from 'react';
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
  logIn: (email: string, pass:string) => Promise<User | null>;
  logOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (data: CreateUserProfileData): Promise<User | null> => {
    if (!data.displayName || data.displayName.trim() === '') {
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
      return null;
    } finally {
      setLoading(false);
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
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const signInWithProvider = async (provider: FirebaseAuthProvider, providerName: string) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalInfo = getAdditionalUserInfo(result);

      if (additionalInfo?.isNewUser) {
        await createUserProfile(user.uid, {
          email: user.email!,
          displayName: user.displayName || user.email!.split('@')[0],
        });
        toast({ title: 'Sign Up Successful', description: `Welcome, ${user.displayName || user.email}!` });
      } else {
        await updateUserLastLogin(user.uid);
        toast({ title: 'Login Successful', description: `Welcome back, ${user.displayName || user.email}!` });
      }
      
      router.push('/');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup closed by user.');
      } else {
        console.error(`Error signing in with ${providerName}:`, error);
        let description = error.message || `Could not sign in with ${providerName}.`;
        if (error.code === 'auth/account-exists-with-different-credential') {
          description = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
        }
        toast({ variant: "destructive", title: `${providerName} Sign-In Failed`, description });
      }
    } finally {
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
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, logIn, logOut, signInWithGoogle, signInWithGitHub }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

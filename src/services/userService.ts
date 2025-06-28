
// src/services/userService.ts
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
}

export interface CreateUserProfileData {
  email: string;
  password?: string; // Password is for auth, not stored directly in profile
  displayName: string;
}


export async function createUserProfile(uid: string, data: Omit<CreateUserProfileData, 'password'>): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    
    // Check if the document already exists to avoid overwriting createdAt
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      const userProfile: Partial<UserProfile> = {
        uid,
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0], // Default display name
        createdAt: serverTimestamp() as Timestamp, // Set creation time only for new users
        lastLogin: serverTimestamp() as Timestamp,
      };
      await setDoc(userDocRef, userProfile);
      console.log(`User profile created for UID: ${uid}`);
    } else {
       console.log(`User profile already exists for UID: ${uid}. Last login will be updated.`);
       await updateUserLastLogin(uid);
    }
  } catch (error: any) {
    console.error("Error creating user profile: ", error);
    // Check for a specific Firestore permission error
    if (error.code === 'permission-denied') {
      throw new Error("Permission Denied: Your Firestore security rules are preventing user profile creation. Please update your rules to allow authenticated users to write to their own document in the 'users' collection.");
    }
    // Fallback for other errors
    throw new Error("Failed to create user profile in the database.");
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile: ", error);
    throw new Error("Failed to fetch user profile.");
  }
}

export async function updateUserLastLogin(uid: string): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
  } catch (error: any) {
    // Log a more specific warning for permission issues without stopping the login flow
    if (error.code === 'permission-denied') {
      console.warn(`Permission denied when updating last login for user ${uid}. Check Firestore security rules.`);
    } else {
      console.error("Error updating last login: ", error);
    }
    // Gracefully handle, as this is not critical path for login
  }
}

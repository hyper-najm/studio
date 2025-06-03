
// src/services/userService.ts
import { db } from '@/lib/firebaseConfig';
import { doc, setDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore';

const USERS_COLLECTION = 'users';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Timestamp | Date; // Allow Date for creation, will be Timestamp in DB
  lastLogin?: Timestamp | Date;
}

export interface CreateUserProfileData {
  email: string;
  password?: string; // Password is for auth, not stored directly in profile
  displayName?: string;
}


export async function createUserProfile(uid: string, data: Omit<CreateUserProfileData, 'password'>): Promise<void> {
  try {
    const userDocRef = doc(db, USERS_COLLECTION, uid);
    const userProfile: Partial<UserProfile> = {
      uid,
      email: data.email,
      displayName: data.displayName || data.email.split('@')[0], // Default display name
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    };
    await setDoc(userDocRef, userProfile, { merge: true }); // Use merge:true if you plan to update partially
    console.log(`User profile created/updated for UID: ${uid}`);
  } catch (error) {
    console.error("Error creating user profile: ", error);
    // Depending on your error handling strategy, you might want to re-throw or handle differently
    throw new Error("Failed to create user profile.");
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
  } catch (error) {
    console.error("Error updating last login: ", error);
    // Gracefully handle, as this is not critical path for login
  }
}

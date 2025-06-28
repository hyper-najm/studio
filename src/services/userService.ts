
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

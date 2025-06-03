
// src/services/settingsService.ts
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, type Timestamp } from 'firebase/firestore';

export interface UserSettings {
  profileName: string;
  profileEmail: string; // This might be redundant if using Firebase Auth email primarily
  is2FAEnabled: boolean;
  emailCriticalAlerts: boolean;
  inAppSystemUpdates: boolean;
  lastUpdated?: Timestamp; 
}

const USER_SETTINGS_COLLECTION = 'userSettings';

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  if (!userId) {
    console.warn("getUserSettings called without userId.");
    return null; 
  }
  try {
    const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    } else {
      console.log(`No settings document for user ${userId}!`);
      return null; 
    }
  } catch (error) {
    console.error(`Error getting user settings for ${userId}: `, error);
    throw new Error("Failed to fetch user settings.");
  }
}

export async function saveUserSettings(userId: string, settings: Partial<Omit<UserSettings, 'lastUpdated'>>): Promise<void> {
  if (!userId) {
    console.error("saveUserSettings called without userId.");
    throw new Error("User ID is required to save settings.");
  }
  try {
    const docRef = doc(db, USER_SETTINGS_COLLECTION, userId);
    await setDoc(docRef, { 
      ...settings, 
      lastUpdated: serverTimestamp() 
    }, { merge: true });
    console.log(`User settings saved successfully for ${userId}.`);
  } catch (error) {
    console.error(`Error saving user settings for ${userId}: `, error);
    throw new Error("Failed to save user settings.");
  }
}


// src/services/settingsService.ts
import { db } from '@/lib/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserSettings {
  profileName: string;
  profileEmail: string;
  is2FAEnabled: boolean;
  emailCriticalAlerts: boolean;
  inAppSystemUpdates: boolean;
  lastUpdated?: any; // Firestore serverTimestamp
}

const USER_SETTINGS_COLLECTION = 'userSettings';
// For simplicity, using a hardcoded user ID. In a real app, this would be dynamic.
const DEFAULT_USER_ID = 'defaultUser'; 

export async function getUserSettings(): Promise<UserSettings | null> {
  try {
    const docRef = doc(db, USER_SETTINGS_COLLECTION, DEFAULT_USER_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    } else {
      console.log("No such document! Returning null or default settings.");
      // Optionally, return default settings or handle this case upstream
      return null; 
    }
  } catch (error) {
    console.error("Error getting user settings: ", error);
    throw new Error("Failed to fetch user settings.");
  }
}

export async function saveUserSettings(settings: Partial<UserSettings>): Promise<void> {
  try {
    const docRef = doc(db, USER_SETTINGS_COLLECTION, DEFAULT_USER_ID);
    // Use setDoc with merge: true to update existing fields or create the document if it doesn't exist.
    await setDoc(docRef, { 
      ...settings, 
      lastUpdated: serverTimestamp() 
    }, { merge: true });
    console.log("User settings saved successfully.");
  } catch (error) {
    console.error("Error saving user settings: ", error);
    throw new Error("Failed to save user settings.");
  }
}

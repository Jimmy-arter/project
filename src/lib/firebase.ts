import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB2w1xV8T4yIkJwE4FEL4RvvGbRXs2o6r8",
  authDomain: "health-system-17ed8.firebaseapp.com",
  projectId: "health-system-17ed8",
  storageBucket: "health-system-17ed8.firebasestorage.app",
  messagingSenderId: "962320155528",
  appId: "1:962320155528:web:16d9890e5b3078e758303d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with settings for better offline support
export const db = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence for authentication
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.error("Auth persistence error:", error);
  });

// Enable offline persistence for Firestore with retry mechanism
const enablePersistence = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await enableIndexedDbPersistence(db);
      console.log("Firestore persistence enabled successfully");
      break;
    } catch (error: any) {
      if (error.code === 'failed-precondition') {
        console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
        break; // Don't retry for this error
      } else if (error.code === 'unimplemented') {
        console.warn("The current browser doesn't support all of the features required to enable persistence");
        break; // Don't retry for this error
      } else if (i === retries - 1) {
        console.error("Failed to enable persistence after multiple attempts:", error);
      } else {
        console.warn(`Attempt ${i + 1} to enable persistence failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
      }
    }
  }
};

// Initialize persistence
enablePersistence();

// If in development, use emulator
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('Connected to Firestore emulator');
  } catch (error) {
    console.warn('Failed to connect to Firestore emulator:', error);
  }
}

export { app };
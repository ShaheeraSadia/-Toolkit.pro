import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Setup Google Auth Provider with Google Drive scopes
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.file");

// Auth State Cache and Flags
let isSigningIn = false;
let cachedAccessToken: string | null = null;

/**
 * Initializes the Firebase Auth observer.
 * Call this at the root of your application.
 */
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If there is a user but no cached token (e.g. page reload), 
        // we might need to prompt signing in with popup again to get the accessToken,
        // or clear the session so they can click sign in.
        cachedAccessToken = null;
        onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure();
    }
  });
};

/**
 * Trigger Google Pop-up authentication to fetch credentials and Drive scopes.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get Google API access token from authentication.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Google Authentication error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Retrieve cached access token in-memory.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out the current user and flush in-memory tokens.
 */
export const logout = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

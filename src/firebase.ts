import { initializeApp } from "firebase/app";
import { getAuth, User } from "firebase/auth";

// Initialize Firebase using the hardcoded config
const firebaseConfig = {
  apiKey: "AIzaSyDcJ1nBQ1HgVk7-Qz8wcoruskfZ8M2Jno8",
  authDomain: "symmetric-ray-tg02f.firebaseapp.com",
  projectId: "symmetric-ray-tg02f",
  storageBucket: "symmetric-ray-tg02f.firebasestorage.app",
  messagingSenderId: "974556276539",
  appId: "1:974556276539:web:ab7a056f957218601c791e",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth State Cache and Flags
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let cachedUser: any = null;

/**
 * Initializes the Auth observer.
 * Call this at the root of your application.
 */
export const initAuth = (
  onAuthSuccess: (user: User, token: string) => void,
  onAuthFailure: () => void
) => {
  // Check localStorage for a saved session
  const savedToken = localStorage.getItem("google_oauth_token");
  const savedUserStr = localStorage.getItem("google_oauth_user");

  if (savedToken && savedUserStr) {
    try {
      const user = JSON.parse(savedUserStr);
      cachedAccessToken = savedToken;
      cachedUser = user;
      onAuthSuccess(user as User, savedToken);
    } catch (e) {
      console.error("Failed to parse saved google_oauth_user:", e);
      localStorage.removeItem("google_oauth_token");
      localStorage.removeItem("google_oauth_user");
      onAuthFailure();
    }
  } else {
    onAuthFailure();
  }

  // Return unsubscribe dummy
  return () => {};
};

/**
 * Trigger Google Pop-up authentication directly to get Drive scopes,
 * bypassing Firebase Auth popups to avoid auth/unauthorized-domain errors in iframe contexts.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  return new Promise((resolve, reject) => {
    isSigningIn = true;

    // Use OAuth Client ID from user configuration
    const clientId = "902695205105-92e8tiqfa4uu7uvl1o7pkgpbg6phgciv.apps.googleusercontent.com";
    const redirectUri = window.location.origin.endsWith("/") ? window.location.origin : window.location.origin + "/";
    const scope = "https://www.googleapis.com/auth/drive.file email profile openid";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=consent`;

    const width = 600;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top}`
    );

    if (!popup) {
      isSigningIn = false;
      reject(new Error("Popup was blocked by the browser. Please allow popups for this site."));
      return;
    }

    const messageListener = async (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("vercel.app")) {
        return;
      }

      if (event.data?.type === "GOOGLE_OAUTH_SUCCESS" && event.data?.hash) {
        window.removeEventListener("message", messageListener);
        clearInterval(checkClosedInterval);

        try {
          const hash = event.data.hash;
          const params = new URLSearchParams(hash.substring(1)); // remove '#'
          const accessToken = params.get("access_token");

          if (!accessToken) {
            throw new Error("No access token found in redirect hash.");
          }

          // Fetch user info using the access token
          const userinfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
          });

          if (!userinfoRes.ok) {
            throw new Error("Failed to fetch user profile information from Google.");
          }

          const userInfo = await userinfoRes.json();

          // Construct a Firebase-compatible User object structure
          const userObj = {
            uid: userInfo.sub,
            displayName: userInfo.name,
            email: userInfo.email,
            photoURL: userInfo.picture,
            emailVerified: userInfo.email_verified,
          };

          cachedAccessToken = accessToken;
          cachedUser = userObj;

          // Save session in localStorage for page refreshes
          localStorage.setItem("google_oauth_token", accessToken);
          localStorage.setItem("google_oauth_user", JSON.stringify(userObj));

          isSigningIn = false;
          resolve({ user: userObj as User, accessToken });
        } catch (err: any) {
          isSigningIn = false;
          reject(err);
        }
      }
    };

    window.addEventListener("message", messageListener);

    // Watch for popup manual closure by user
    const checkClosedInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosedInterval);
        window.removeEventListener("message", messageListener);
        isSigningIn = false;
        resolve(null);
      }
    }, 1000);
  });
};

/**
 * Retrieve cached access token in-memory.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || localStorage.getItem("google_oauth_token");
};

/**
 * Sign out the current user and flush saved tokens.
 */
export const logout = async (): Promise<void> => {
  localStorage.removeItem("google_oauth_token");
  localStorage.removeItem("google_oauth_user");
  cachedAccessToken = null;
  cachedUser = null;
};

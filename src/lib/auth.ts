import { auth } from "../../firebase/Client";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/Client";

// Register user
export const registerUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set user role as admin in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      role: "admin",
      createdAt: new Date().toISOString()
    });
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase registration error:", error);
    throw error;
  }
};

// Login user
export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Verify if the user is an admin
    const isUserAdmin = await isAdmin(userCredential.user.uid);
    if (!isUserAdmin) {
      throw new Error("Access denied: User is not an admin");
    }
    
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase login error:", error);
    // Enhance error message for common Firebase auth errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error("Invalid email or password");
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error("Too many failed login attempts. Please try again later.");
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error("Network error. Please check your connection.");
    }
    throw error;
  }
};

// Logout
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};

// Check if user is admin
export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.role === "admin";
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Get current user
export const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};
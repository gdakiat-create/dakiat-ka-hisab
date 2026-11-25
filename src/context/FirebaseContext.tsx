import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import type { CurrencyCode, LanguageMode, UserProfile } from '../types/expense';
import { FIELD_LIMITS } from '../types/expense';

interface FirebaseContextValue {
  user: User | null;
  profile: UserProfile | null;
  authReady: boolean;
  profileReady: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserPreferences: (updates: {
    preferredLanguage?: LanguageMode;
    currency?: CurrencyCode;
  }) => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      setAuthError(null);

      if (!firebaseUser) {
        setProfile(null);
        setProfileReady(false);
        return;
      }

      const userPath = `users/${firebaseUser.uid}`;
      const userRef = doc(db, 'users', firebaseUser.uid);

      try {
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          const cleanName = (firebaseUser.displayName || 'Hisaab User')
            .trim()
            .slice(0, FIELD_LIMITS.DISPLAY_NAME_MAX) || 'Hisaab User';

          const newProfile: Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
            createdAt: ReturnType<typeof serverTimestamp>;
            updatedAt: ReturnType<typeof serverTimestamp>;
          } = {
            uid: firebaseUser.uid,
            displayName: cleanName,
            preferredLanguage: 'both',
            currency: 'PKR',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(userRef, newProfile);
          const createdSnap = await getDoc(userRef);
          setProfile((createdSnap.data() as UserProfile) || {
            uid: firebaseUser.uid,
            displayName: cleanName,
            preferredLanguage: 'both',
            currency: 'PKR',
          });
        }
        setProfileReady(true);
      } catch (error) {
        setProfileReady(false);
        handleFirestoreError(error, OperationType.WRITE, userPath);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Sign in failed';
      if (!msg.includes('popup-closed-by-user')) {
        setAuthError('Login mukammal nahi ho saka. Dobara koshish karein · Could not sign in. Please try again.');
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const updateUserPreferences = useCallback(
    async (updates: { preferredLanguage?: LanguageMode; currency?: CurrencyCode }) => {
      if (!user || !profile) return;
      const userPath = `users/${user.uid}`;
      const userRef = doc(db, 'users', user.uid);

      const nextLanguage = updates.preferredLanguage ?? profile.preferredLanguage;
      const nextCurrency = updates.currency ?? profile.currency;

      setProfile((prev) =>
        prev
          ? { ...prev, preferredLanguage: nextLanguage, currency: nextCurrency }
          : prev,
      );

      try {
        await updateDoc(userRef, {
          preferredLanguage: nextLanguage,
          currency: nextCurrency,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, userPath);
      }
    },
    [user, profile],
  );

  return (
    <FirebaseContext.Provider
      value={{
        user,
        profile,
        authReady,
        profileReady,
        authError,
        signInWithGoogle,
        signOutUser,
        updateUserPreferences,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextValue {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used inside FirebaseProvider');
  }
  return ctx;
}

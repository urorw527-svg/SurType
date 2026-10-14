import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  deleteField
} from 'firebase/firestore';
import { UserProfile, MultiplayerRoom, RoomPlayer, SongTrack } from '../types';

export const firebaseConfig = {
  apiKey: "AIzaSyDLKRxMwxuYr4-O49P5l7ObX4nQ8SzvegI",
  authDomain: "surtype-276ec.firebaseapp.com",
  projectId: "surtype-276ec",
  storageBucket: "surtype-276ec.firebasestorage.app",
  messagingSenderId: "321605338253",
  appId: "1:321605338253:web:f4eea31e3a738501ebcec4",
  measurementId: "G-0CB5QG9X2P"
};

// Initialize Firebase App singleton
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export interface LoginResult {
  profile: UserProfile;
  warning?: string;
}

/**
 * Sign in with Google Popup
 * If Google Provider is not enabled in Firebase Console (e.g. auth/configuration-not-found),
 * gracefully falls back to Guest Mode with an informative notification instead of crashing.
 */
export async function loginWithGoogle(): Promise<LoginResult> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    const user = cred.user;
    
    // Sync or retrieve user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef).catch(() => null);
    
    let xp = 0;
    let level = 1;
    if (snap && snap.exists()) {
      const data = snap.data();
      xp = data.xp || 0;
      level = data.level || 1;
    } else {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Typist',
        email: user.email || '',
        photoURL: user.photoURL || '',
        isAnonymous: false,
        xp: 0,
        level: 1,
        createdAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }

    const profile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'SurType Typist',
      email: user.email,
      photoURL: user.photoURL,
      isAnonymous: false,
      xp,
      level
    };

    localStorage.setItem('surtype_user_profile', JSON.stringify(profile));
    return { profile };
  } catch (error: any) {
    const errorCode = error?.code || '';
    console.warn('Google Sign-In notice:', errorCode, error?.message);

    // Google Sign-In not enabled in Firebase Console or domain not authorized
    if (
      errorCode === 'auth/configuration-not-found' ||
      errorCode === 'auth/operation-not-allowed' ||
      errorCode === 'auth/unauthorized-domain' ||
      errorCode === 'auth/admin-restricted-operation'
    ) {
      const guestProfile = await loginAsGuest('SurType Typist');
      return {
        profile: guestProfile,
        warning: 'Google Sign-in is not yet enabled in your Firebase Console (surtype-276ec). You have been logged in as Guest so you can create & join 4-digit multiplayer rooms immediately!'
      };
    }

    // User closed popup window
    if (errorCode === 'auth/popup-closed-by-user' || errorCode === 'auth/cancelled-popup-request') {
      const stored = localStorage.getItem('surtype_user_profile');
      if (stored) {
        return { profile: JSON.parse(stored) };
      }
      const guestProfile = await loginAsGuest('Guest Player');
      return { profile: guestProfile };
    }

    // Generic fallback to Guest mode
    const guestProfile = await loginAsGuest('Guest Player');
    return {
      profile: guestProfile,
      warning: error?.message ? `Notice: ${error.message}. Switched to Guest mode.` : undefined
    };
  }
}

/**
 * Sign in as Guest (Anonymous Firebase Auth with local fallback)
 */
export async function loginAsGuest(guestName?: string): Promise<UserProfile> {
  const chosenName = guestName || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    // Try anonymous sign-in in Firebase
    const cred = await signInAnonymously(auth);
    const user = cred.user;
    const profile: UserProfile = {
      uid: user.uid,
      displayName: chosenName,
      email: null,
      photoURL: null,
      isAnonymous: true,
      xp: 0,
      level: 1
    };
    localStorage.setItem('surtype_user_profile', JSON.stringify(profile));
    return profile;
  } catch (err) {
    console.warn('Anonymous Firebase auth disabled or restricted; using offline guest profile:', err);
    // Offline / Mock guest session fallback so users can always test immediately
    const fallbackUid = `guest-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const profile: UserProfile = {
      uid: fallbackUid,
      displayName: chosenName,
      email: null,
      photoURL: null,
      isAnonymous: true,
      xp: 0,
      level: 1
    };
    localStorage.setItem('surtype_user_profile', JSON.stringify(profile));
    return profile;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch {
    // ignore
  } finally {
    localStorage.removeItem('surtype_user_profile');
  }
}

/**
 * Subscribe to Auth state changes
 */
export function onAuthUserChanged(callback: (user: UserProfile | null) => void): () => void {
  return onAuthStateChanged(auth, async (fbUser: User | null) => {
    if (fbUser) {
      // Check stored or Firestore profile
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef).catch(() => null);
      let xp = 0;
      let level = 1;
      if (snap && snap.exists()) {
        const d = snap.data();
        xp = d.xp || 0;
        level = d.level || 1;
      }
      const profile: UserProfile = {
        uid: fbUser.uid,
        displayName: fbUser.displayName || (fbUser.isAnonymous ? 'Guest Player' : fbUser.email?.split('@')[0] || 'Player'),
        email: fbUser.email,
        photoURL: fbUser.photoURL,
        isAnonymous: fbUser.isAnonymous,
        xp,
        level
      };
      localStorage.setItem('surtype_user_profile', JSON.stringify(profile));
      callback(profile);
    } else {
      const saved = localStorage.getItem('surtype_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.isAnonymous) {
            callback(parsed);
            return;
          }
        } catch {}
      }
      callback(null);
    }
  });
}

// ---------------------------------------------------------------------------
// MULTIPLAYER ROOMS (FIRESTORE)
// ---------------------------------------------------------------------------

/**
 * Generate a 4-digit numeric room code (e.g., "4343")
 */
export function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/**
 * Create a Firestore-backed room with 4-digit code
 * The creator is the Host and the ONLY one allowed to select the song.
 */
export async function createMultiplayerRoom(
  host: UserProfile,
  track: SongTrack,
  passageText: string,
  passageTitle: string,
  duration: 30 | 60 = 60,
  customCode?: string
): Promise<MultiplayerRoom> {
  const roomCode = customCode && /^\d{4}$/.test(customCode) ? customCode : generateRoomCode();
  const roomRef = doc(db, 'rooms', roomCode);

  const initialPlayer: RoomPlayer = {
    uid: host.uid,
    displayName: host.displayName,
    photoURL: host.photoURL,
    isHost: true,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    lastActive: Date.now()
  };

  const roomData: MultiplayerRoom = {
    id: roomCode,
    hostUid: host.uid,
    hostName: host.displayName,
    status: 'waiting',
    currentTrack: track,
    passageText,
    passageTitle,
    duration,
    createdAt: Date.now(),
    players: {
      [host.uid]: initialPlayer
    }
  };

  await setDoc(roomRef, roomData);
  return roomData;
}

/**
 * Join an existing Multiplayer room with 4-digit code
 */
export async function joinMultiplayerRoom(
  roomCode: string,
  user: UserProfile
): Promise<MultiplayerRoom> {
  const code = roomCode.trim();
  if (!code || code.length !== 4) {
    throw new Error('Please enter a valid 4-digit room code.');
  }

  const roomRef = doc(db, 'rooms', code);
  const snap = await getDoc(roomRef);

  if (!snap.exists()) {
    throw new Error(`Room "${code}" not found. Please double check the 4-digit code or ask host to create one.`);
  }

  const data = snap.data() as MultiplayerRoom;

  const playerObj: RoomPlayer = {
    uid: user.uid,
    displayName: user.displayName,
    photoURL: user.photoURL,
    isHost: data.hostUid === user.uid,
    progress: 0,
    wpm: 0,
    accuracy: 100,
    finished: false,
    lastActive: Date.now()
  };

  await updateDoc(roomRef, {
    [`players.${user.uid}`]: playerObj
  });

  data.players[user.uid] = playerObj;
  return data;
}

/**
 * Leave a Multiplayer room
 */
export async function leaveMultiplayerRoom(roomCode: string, uid: string): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return;

    const data = snap.data() as MultiplayerRoom;
    if (data.hostUid === uid) {
      // If host leaves and only host is in room, delete room
      const playerUids = Object.keys(data.players || {});
      if (playerUids.length <= 1) {
        await deleteDoc(roomRef);
        return;
      }
      // Reassign host to next available player
      const nextHostUid = playerUids.find(id => id !== uid);
      if (nextHostUid && data.players[nextHostUid]) {
        await updateDoc(roomRef, {
          hostUid: nextHostUid,
          hostName: data.players[nextHostUid].displayName,
          [`players.${nextHostUid}.isHost`]: true,
          [`players.${uid}`]: deleteField()
        });
        return;
      }
    }

    await updateDoc(roomRef, {
      [`players.${uid}`]: deleteField()
    });
  } catch (err) {
    console.warn('Error leaving room:', err);
  }
}

/**
 * Host only: Update the selected song for the entire room
 * Other players cannot change the song.
 */
export async function updateRoomSong(
  roomCode: string,
  userUid: string,
  track: SongTrack
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Room not found');

  const data = snap.data() as MultiplayerRoom;
  if (data.hostUid !== userUid) {
    throw new Error('Only the room creator (host) is allowed to select the song!');
  }

  await updateDoc(roomRef, {
    currentTrack: track
  });
}

/**
 * Host only: Start the countdown & race
 */
export async function startRoomRace(roomCode: string, userUid: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Room not found');

  const data = snap.data() as MultiplayerRoom;
  if (data.hostUid !== userUid) {
    throw new Error('Only the room host can start the race!');
  }

  // Reset players' scores for new race
  const resetPlayers = { ...data.players };
  Object.keys(resetPlayers).forEach(id => {
    resetPlayers[id] = {
      ...resetPlayers[id],
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: undefined,
      lastActive: Date.now()
    };
  });

  await updateDoc(roomRef, {
    status: 'countdown',
    countdownStart: Date.now(),
    players: resetPlayers
  });

  // After 4-second countdown, transition to in_progress
  setTimeout(async () => {
    try {
      await updateDoc(roomRef, {
        status: 'in_progress',
        raceStartTime: Date.now()
      });
    } catch {}
  }, 4000);
}

/**
 * Host only: Reset room back to waiting state
 */
export async function resetRoomToLobby(roomCode: string, userUid: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomCode);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;
  const data = snap.data() as MultiplayerRoom;
  if (data.hostUid !== userUid) return;

  const resetPlayers = { ...data.players };
  Object.keys(resetPlayers).forEach(id => {
    resetPlayers[id] = {
      ...resetPlayers[id],
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: undefined,
      lastActive: Date.now()
    };
  });

  await updateDoc(roomRef, {
    status: 'waiting',
    countdownStart: deleteField(),
    raceStartTime: deleteField(),
    players: resetPlayers
  });
}

/**
 * Any player: Update their real-time race progress (progress %, WPM, accuracy, finished status)
 */
export async function updatePlayerRoomProgress(
  roomCode: string,
  uid: string,
  progress: number,
  wpm: number,
  accuracy: number,
  finished: boolean
): Promise<void> {
  try {
    const roomRef = doc(db, 'rooms', roomCode);
    const updates: Record<string, any> = {
      [`players.${uid}.progress`]: Math.min(100, Math.max(0, Math.round(progress))),
      [`players.${uid}.wpm`]: Math.max(0, Math.round(wpm)),
      [`players.${uid}.accuracy`]: Math.min(100, Math.max(0, Math.round(accuracy))),
      [`players.${uid}.finished`]: finished,
      [`players.${uid}.lastActive`]: Date.now()
    };
    if (finished) {
      updates[`players.${uid}.finishTime`] = Date.now();
    }
    await updateDoc(roomRef, updates);
  } catch (err) {
    // Non-blocking for smooth typing experience
  }
}

/**
 * Real-time listener for multiplayer room changes
 */
export function listenToRoom(
  roomCode: string,
  onUpdate: (room: MultiplayerRoom | null) => void,
  onError?: (err: Error) => void
): () => void {
  const roomRef = doc(db, 'rooms', roomCode);
  return onSnapshot(
    roomRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as MultiplayerRoom);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.warn('Room listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Add XP and update user level in Firestore and LocalStorage
 */
export async function addXPToUser(uid: string, xpGained: number): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
  let curXP = 0;
  let curLevel = 1;
  const stored = localStorage.getItem('surtype_user_profile');
  if (stored) {
    try {
      const p = JSON.parse(stored);
      curXP = p.xp || 0;
      curLevel = p.level || 1;
    } catch {}
  }

  const newXP = curXP + xpGained;
  // Each level requires 200 XP
  const newLevel = Math.max(1, Math.floor(newXP / 200) + 1);
  const leveledUp = newLevel > curLevel;

  const updatedProfile: UserProfile = {
    ...(stored ? JSON.parse(stored) : { uid, displayName: 'Player', isAnonymous: true }),
    xp: newXP,
    level: newLevel
  };
  localStorage.setItem('surtype_user_profile', JSON.stringify(updatedProfile));

  // Sync to Firestore if authenticated
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      xp: newXP,
      level: newLevel,
      lastUpdated: serverTimestamp()
    });
  } catch {}

  return { newXP, newLevel, leveledUp };
}

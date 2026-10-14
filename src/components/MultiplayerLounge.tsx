import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, 
  Play, 
  Crown, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Music, 
  Sparkles, 
  RotateCcw, 
  LogOut, 
  ChevronRight, 
  Zap, 
  Trophy, 
  Clock, 
  Radio, 
  Flame,
  Volume2
} from 'lucide-react';
import { SongTrack, UserProfile, MultiplayerRoom, RoomPlayer } from '../types';
import { CURATED_TRACKS } from '../data/musicTracks';
import { TYPING_PASSAGES, getRandomPassage } from '../data/typingPassages';
import { 
  createMultiplayerRoom, 
  joinMultiplayerRoom, 
  leaveMultiplayerRoom, 
  listenToRoom, 
  startRoomRace, 
  updateRoomSong, 
  updatePlayerRoomProgress,
  resetRoomToLobby,
  generateRoomCode,
  addXPToUser
} from '../utils/firebase';
import { playKeySound, playSuccessChime, playErrorSound } from '../utils/soundEffects';

interface MultiplayerLoungeProps {
  user: UserProfile | null;
  onRequireLogin: () => void;
  currentTrack: SongTrack;
  onTrackSelect: (track: SongTrack) => void;
  onPlaySong: () => void;
}

export const MultiplayerLounge: React.FC<MultiplayerLoungeProps> = ({
  user,
  onRequireLogin,
  currentTrack,
  onTrackSelect,
  onPlaySong,
}) => {
  // Lobby state
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [customCreateCode, setCustomCreateCode] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<30 | 60>(60);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active room state
  const [currentRoom, setCurrentRoom] = useState<MultiplayerRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showSongPicker, setShowSongPicker] = useState(false);

  // In-race typing state
  const [countdown, setCountdown] = useState<number | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentWordInput, setCurrentWordInput] = useState('');
  const [typedHistory, setTypedHistory] = useState<string[]>([]);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [hasFinishedRace, setHasFinishedRace] = useState(false);
  const [elapsedRaceTime, setElapsedRaceTime] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60);

  const inputRef = useRef<HTMLInputElement>(null);
  const roomListenerUnsubRef = useRef<(() => void) | null>(null);
  const lastProgressUpdateRef = useRef<number>(0);

  // Clean room code
  const isHost = currentRoom && user && currentRoom.hostUid === user.uid;

  // Subscribe to room updates
  useEffect(() => {
    if (!currentRoom?.id) return;

    if (roomListenerUnsubRef.current) {
      roomListenerUnsubRef.current();
    }

    const unsub = listenToRoom(
      currentRoom.id,
      (updatedRoom) => {
        if (!updatedRoom) {
          setErrorMsg('The room was closed by the host.');
          setCurrentRoom(null);
          return;
        }

        setCurrentRoom(updatedRoom);

        // Sync song with host's selection if changed
        if (updatedRoom.currentTrack && updatedRoom.currentTrack.youtubeId !== currentTrack.youtubeId) {
          onTrackSelect(updatedRoom.currentTrack);
        }

        // Handle countdown transition
        if (updatedRoom.status === 'countdown' && updatedRoom.countdownStart) {
          const now = Date.now();
          const elapsed = (now - updatedRoom.countdownStart) / 1000;
          const remaining = Math.max(0, Math.ceil(4 - elapsed));
          setCountdown(remaining);
        } else {
          setCountdown(null);
        }

        // Handle race start
        if (updatedRoom.status === 'in_progress') {
          setIsTypingActive(true);
        } else if (updatedRoom.status === 'waiting') {
          setIsTypingActive(false);
          setHasFinishedRace(false);
          setCurrentWordIndex(0);
          setCurrentWordInput('');
          setTypedHistory([]);
          setElapsedRaceTime(0);
        }
      },
      (err) => {
        console.warn('Room listener notice:', err);
      }
    );

    roomListenerUnsubRef.current = unsub;

    return () => {
      if (roomListenerUnsubRef.current) {
        roomListenerUnsubRef.current();
        roomListenerUnsubRef.current = null;
      }
    };
  }, [currentRoom?.id, currentTrack.youtubeId, onTrackSelect]);

  // Countdown clock tick
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Words list for room passage
  const words = useMemo(() => {
    if (!currentRoom?.passageText) return [];
    return currentRoom.passageText.trim().split(/\s+/);
  }, [currentRoom?.passageText]);

  // Compute live local stats
  const { correctChars, incorrectChars, totalCharsTyped, currentWpm, currentAccuracy, progressPercent } = useMemo(() => {
    let correct = 0;
    let incorrect = 0;

    typedHistory.forEach((typed, idx) => {
      const target = words[idx] || '';
      for (let i = 0; i < typed.length; i++) {
        if (i < target.length) {
          if (typed[i] === target[i]) correct++;
          else incorrect++;
        } else {
          incorrect++;
        }
      }
      if (idx < currentWordIndex) correct++;
    });

    const targetWord = words[currentWordIndex] || '';
    for (let i = 0; i < currentWordInput.length; i++) {
      if (i < targetWord.length) {
        if (currentWordInput[i] === targetWord[i]) correct++;
        else incorrect++;
      } else {
        incorrect++;
      }
    }

    const total = correct + incorrect;
    const minutes = Math.max(elapsedRaceTime, 1) / 60;
    const netWpm = Math.min(Math.round((correct / 5) / minutes), 160);
    const acc = total > 0 ? Math.round((correct / total) * 100) : 100;
    const progress = words.length > 0 ? Math.min(100, Math.round((currentWordIndex / words.length) * 100)) : 0;

    return {
      correctChars: correct,
      incorrectChars: incorrect,
      totalCharsTyped: total,
      currentWpm: Math.max(netWpm, 0),
      currentAccuracy: Math.min(Math.max(acc, 0), 100),
      progressPercent: progress
    };
  }, [typedHistory, currentWordInput, currentWordIndex, words, elapsedRaceTime]);

  // Race timer
  useEffect(() => {
    if (!isTypingActive || hasFinishedRace || !currentRoom) return;

    const timer = setInterval(() => {
      setElapsedRaceTime(prev => {
        const next = prev + 1;
        const dur = currentRoom.duration || 60;
        if (next >= dur) {
          handleFinishRace();
          return dur;
        }
        return next;
      });
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [isTypingActive, hasFinishedRace, currentRoom]);

  // Sync typing progress with Firestore
  const syncProgressToFirestore = (finished = false) => {
    if (!currentRoom || !user) return;
    const now = Date.now();
    if (!finished && now - lastProgressUpdateRef.current < 400) return;
    lastProgressUpdateRef.current = now;

    updatePlayerRoomProgress(
      currentRoom.id,
      user.uid,
      progressPercent,
      currentWpm,
      currentAccuracy,
      finished
    );
  };

  const handleFinishRace = () => {
    if (hasFinishedRace) return;
    setHasFinishedRace(true);
    setIsTypingActive(false);
    playSuccessChime(0.6);
    syncProgressToFirestore(true);

    if (user) {
      // Award XP for completing multiplayer race
      addXPToUser(user.uid, 50);
    }
  };

  // Actions
  const handleCreateRoom = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    setIsCreating(true);
    setErrorMsg(null);
    try {
      const passage = getRandomPassage();
      const code = customCreateCode.trim().length === 4 ? customCreateCode.trim() : generateRoomCode();
      const room = await createMultiplayerRoom(
        user,
        currentTrack,
        passage.text,
        passage.title,
        selectedDuration,
        code
      );
      setCurrentRoom(room);
      setTimeRemaining(selectedDuration);
      onPlaySong();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!user) {
      onRequireLogin();
      return;
    }

    const code = roomCodeInput.trim();
    if (code.length !== 4) {
      setErrorMsg('Please enter a 4-digit numeric room code (e.g., 4343).');
      return;
    }

    setIsJoining(true);
    setErrorMsg(null);
    try {
      const room = await joinMultiplayerRoom(code, user);
      setCurrentRoom(room);
      setTimeRemaining(room.duration || 60);
      if (room.currentTrack) {
        onTrackSelect(room.currentTrack);
      }
      onPlaySong();
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not join room. Check code and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (currentRoom && user) {
      await leaveMultiplayerRoom(currentRoom.id, user.uid);
    }
    setCurrentRoom(null);
    setHasFinishedRace(false);
    setIsTypingActive(false);
  };

  const handleStartRace = async () => {
    if (!currentRoom || !user || !isHost) return;
    try {
      await startRoomRace(currentRoom.id, user.uid);
      setHasFinishedRace(false);
      setCurrentWordIndex(0);
      setCurrentWordInput('');
      setTypedHistory([]);
      setElapsedRaceTime(0);
      setTimeRemaining(currentRoom.duration || 60);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 4200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not start race.');
    }
  };

  const handleSelectSongAsHost = async (track: SongTrack) => {
    if (!currentRoom || !user || !isHost) return;
    try {
      await updateRoomSong(currentRoom.id, user.uid, track);
      onTrackSelect(track);
      setShowSongPicker(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Only the host can change the song.');
    }
  };

  const handleCopyCode = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.id);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Keyboard typing input in room
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isTypingActive || hasFinishedRace) return;

    if (e.key === ' ') {
      e.preventDefault();
      if (currentWordInput.trim() === '' && currentWordIndex === 0) return;

      const targetWord = words[currentWordIndex] || '';
      if (currentWordInput !== targetWord) {
        playErrorSound(0.5);
      } else {
        playKeySound('creamy', 0.5, true);
      }

      setTypedHistory(prev => [...prev, currentWordInput]);
      setCurrentWordInput('');

      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);

      if (nextIndex >= words.length) {
        handleFinishRace();
      } else {
        syncProgressToFirestore();
      }
    } else if (e.key.length === 1) {
      playKeySound('creamy', 0.5, false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTypingActive || hasFinishedRace) return;
    const val = e.target.value;
    if (val.endsWith(' ')) return;
    setCurrentWordInput(val);
    syncProgressToFirestore();
  };

  // Players list sorted by progress / WPM
  const sortedPlayers = useMemo(() => {
    if (!currentRoom?.players) return [];
    return Object.values(currentRoom.players).sort((a, b) => {
      if (a.finished && !b.finished) return -1;
      if (!a.finished && b.finished) return 1;
      if (a.progress !== b.progress) return b.progress - a.progress;
      return b.wpm - a.wpm;
    });
  }, [currentRoom?.players]);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">

      {/* LOBBY / ROOM FINDER VIEW */}
      {!currentRoom ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
                <Users className="w-3.5 h-3.5 text-amber-400" />
                <span>Synchronized Real-Time Multiplayer</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
                Race Live with Friends to Curated Hindi Beats
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                Create a 4-digit room code, invite your friends, and race side-by-side. The room creator controls the music while everyone types the same rhythm synchronized in real-time.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white font-bold ml-4">✕</button>
            </div>
          )}

          {/* Create & Join Dual Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* CARD 1: CREATE ROOM */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-bold text-slate-100">Create New Room</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                    You Are Host
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 mb-5">
                  Generate a 4-digit code. As host, only you hold the keys to select songs and start the countdown for everyone.
                </p>

                {/* Test Duration Setting */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Race Duration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(30)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedDuration === 30 
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      30 Seconds Sprint
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDuration(60)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        selectedDuration === 60 
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold' 
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      60 Seconds Standard
                    </button>
                  </div>
                </div>

                {/* Optional Custom 4-digit Code */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Custom 4-Digit Code (Optional)</span>
                    <span className="text-[10px] text-slate-500">e.g. 4343</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={customCreateCode}
                    onChange={(e) => setCustomCreateCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Leave empty for auto-code"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-400 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                  />
                </div>

                {/* Current Host Selected Song Preview */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 mb-5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 overflow-hidden shrink-0 flex items-center justify-center">
                    {currentTrack.thumbnail ? (
                      <img src={currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Music className="w-5 h-5 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-amber-400 font-semibold block">Host Starting Song</span>
                    <h5 className="text-xs font-semibold text-slate-200 truncate">{currentTrack.title}</h5>
                    <span className="text-[10px] text-slate-400 truncate block">{currentTrack.artist}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={isCreating}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isCreating ? (
                  <span className="animate-pulse">Creating Room in Firestore...</span>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    <span>Create 4-Digit Room</span>
                  </>
                )}
              </button>
            </div>

            {/* CARD 2: JOIN ROOM */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-slate-100">Join With 4-Digit Code</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Instant Join
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-6">
                  Got a code from a friend? Enter their 4-digit room code below to jump right into their live lobby.
                </p>

                {/* 4-Digit Code Big Input */}
                <div className="mb-6">
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Enter 4-Digit Room Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={4}
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="4343"
                      className="w-full px-4 py-3.5 bg-slate-950 border-2 border-slate-700/80 focus:border-amber-400 rounded-xl text-2xl font-mono tracking-widest text-center text-amber-400 placeholder-slate-700 font-bold focus:outline-none transition-colors"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-2 block text-center">
                    The host will synchronize the Hindi track for you automatically.
                  </span>
                </div>

                {/* Rule notice */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-6 flex items-start gap-2.5 text-xs text-slate-400">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200 block mb-0.5">Host Music Control:</strong>
                    Only the room host can select or switch songs. Other joined racers type along to the host's selected track.
                  </div>
                </div>
              </div>

              <button
                onClick={handleJoinRoom}
                disabled={isJoining || roomCodeInput.length !== 4}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                {isJoining ? (
                  <span className="animate-pulse">Finding Room...</span>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    <span>Join Room {roomCodeInput ? `(${roomCodeInput})` : ''}</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      ) : (

        /* ACTIVE ROOM VIEW (SYNCHRONIZED REAL-TIME RACING) */
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Top Room Bar: Code, Status, Song, Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left: 4-Digit Code & Status */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-2 bg-slate-950 border border-amber-500/30 rounded-xl flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Room</span>
                <span className="text-lg font-mono font-extrabold text-amber-400 tracking-wider">
                  {currentRoom.id}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
                  title="Copy 4-digit code"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${
                    currentRoom.status === 'in_progress' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                    {currentRoom.status === 'waiting' && 'Lobby: Waiting for Race'}
                    {currentRoom.status === 'countdown' && 'Countdown Starting!'}
                    {currentRoom.status === 'in_progress' && 'Race in Progress!'}
                    {currentRoom.status === 'finished' && 'Race Complete'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Host: <strong className="text-slate-300">{currentRoom.hostName}</strong> {isHost && '(You)'} · {currentRoom.duration}s Race
                </span>
              </div>
            </div>

            {/* Center: Selected Song (Host only control) */}
            <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 min-w-0 max-w-md">
              <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                {currentRoom.currentTrack?.thumbnail ? (
                  <img src={currentRoom.currentTrack.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-amber-400 m-2" />
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {isHost ? (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Unlock className="w-2.5 h-2.5" /> Host Controls Song
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-400" /> Locked to Host
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-100 truncate" title={currentRoom.currentTrack?.title}>
                  {currentRoom.currentTrack?.title}
                </h4>
              </div>

              {isHost && currentRoom.status === 'waiting' && (
                <button
                  onClick={() => setShowSongPicker(prev => !prev)}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg shrink-0 cursor-pointer transition-colors"
                >
                  Change Song
                </button>
              )}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {isHost && currentRoom.status === 'waiting' && (
                <button
                  onClick={handleStartRace}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Start Live Race</span>
                </button>
              )}

              {isHost && currentRoom.status === 'finished' && (
                <button
                  onClick={() => resetRoomToLobby(currentRoom.id, user!.uid)}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  New Round
                </button>
              )}

              <button
                onClick={handleLeaveRoom}
                className="px-3 py-2 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 rounded-xl text-xs transition-colors cursor-pointer"
                title="Leave room"
              >
                Leave
              </button>
            </div>
          </div>

          {/* Host Song Picker Dropdown Modal */}
          {showSongPicker && isHost && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">
                  Select Room Track (Synchronized to all players)
                </span>
                <button onClick={() => setShowSongPicker(false)} className="text-xs text-slate-400 hover:text-white">✕ Close</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {CURATED_TRACKS.map(track => {
                  const isCur = track.youtubeId === currentRoom.currentTrack?.youtubeId;
                  return (
                    <div
                      key={track.id}
                      onClick={() => handleSelectSongAsHost(track)}
                      className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-colors ${
                        isCur 
                          ? 'bg-amber-400/15 border-amber-400 text-amber-200 font-bold' 
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                        <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="truncate font-semibold">{track.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{track.artist}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* LIVE RACE TRACK / PLAYER LANES */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Live Racer Lanes ({sortedPlayers.length} Players)
              </span>
              <span className="text-slate-400 font-mono">
                {currentRoom.status === 'in_progress' ? `${timeRemaining}s left` : 'Waiting for Start'}
              </span>
            </div>

            <div className="space-y-2.5">
              {sortedPlayers.map((player, rankIdx) => {
                const isMe = user && player.uid === user.uid;
                return (
                  <div 
                    key={player.uid}
                    className={`p-3 rounded-xl border transition-all ${
                      isMe 
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-sm' 
                        : 'bg-slate-950/70 border-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          rankIdx === 0 ? 'bg-amber-400 text-slate-950' :
                          rankIdx === 1 ? 'bg-slate-300 text-slate-950' :
                          rankIdx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {rankIdx + 1}
                        </span>
                        
                        <span className="font-bold text-slate-200">
                          {player.displayName} {isMe && '(You)'}
                        </span>

                        {player.isHost && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded text-[9px] font-mono">
                            Host
                          </span>
                        )}

                        {player.finished && (
                          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] font-semibold">
                            Finished
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-amber-400 font-bold">{player.wpm} WPM</span>
                        <span className="text-slate-400">{player.accuracy}% Acc</span>
                        <span className="text-slate-300 font-semibold">{player.progress}%</span>
                      </div>
                    </div>

                    {/* Racer Progress Bar with Moving Avatar */}
                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800 relative">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isMe 
                            ? 'bg-gradient-to-r from-amber-500 to-amber-400' 
                            : 'bg-gradient-to-r from-slate-600 to-emerald-400'
                        }`}
                        style={{ width: `${Math.max(player.progress, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DRAMATIC COUNTDOWN OVERLAY */}
          {countdown !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
              <div className="text-center animate-bounce">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 block mb-2">
                  Get Your Fingers On The Keyboard!
                </span>
                <div className="text-8xl sm:text-9xl font-black text-amber-400 font-mono drop-shadow-[0_0_40px_rgba(245,158,11,0.6)]">
                  {countdown > 0 ? countdown : 'GO!'}
                </div>
                <span className="text-sm font-semibold text-slate-300 mt-4 block">
                  Synchronizing {currentRoom.currentTrack?.title}...
                </span>
              </div>
            </div>
          )}

          {/* ACTIVE RACE TYPING ENGINE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">{currentRoom.passageTitle}</span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span>Speed: <strong className="text-amber-400">{currentWpm}</strong> WPM</span>
                <span>Accuracy: <strong className="text-slate-200">{currentAccuracy}%</strong></span>
              </div>
            </div>

            {/* Passage Word Display */}
            <div 
              onClick={() => inputRef.current?.focus()}
              className="font-mono text-lg md:text-xl leading-relaxed tracking-wide select-none text-slate-400 flex flex-wrap gap-x-2 gap-y-3 min-h-[140px] max-h-[220px] overflow-y-auto pr-1 cursor-text mb-4"
            >
              {words.map((word, idx) => {
                const isCurrent = idx === currentWordIndex;
                const isPast = idx < currentWordIndex;
                const pastTyped = typedHistory[idx] || '';
                const isPastCorrect = isPast && pastTyped === word;

                return (
                  <span
                    key={`${idx}-${word}`}
                    className={`relative px-1 py-0.5 rounded transition-colors ${
                      isCurrent 
                        ? 'bg-amber-400/15 border-b-2 border-amber-400 text-slate-100 font-medium' 
                        : isPast 
                        ? isPastCorrect 
                          ? 'text-slate-300' 
                          : 'text-rose-400 underline decoration-rose-500' 
                        : 'text-slate-500'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        {word.split('').map((char, charIdx) => {
                          const typedChar = currentWordInput[charIdx];
                          const isTyped = typedChar !== undefined;
                          const isCorrect = isTyped && typedChar === char;
                          const isWrong = isTyped && typedChar !== char;
                          return (
                            <span 
                              key={charIdx}
                              className={isCorrect ? 'text-emerald-400 font-semibold' : isWrong ? 'text-rose-400 bg-rose-950/80' : 'text-slate-300'}
                            >
                              {char}
                            </span>
                          );
                        })}
                        {currentWordInput.length > word.length && (
                          <span className="text-rose-400 underline">{currentWordInput.slice(word.length)}</span>
                        )}
                      </>
                    ) : (
                      word
                    )}
                  </span>
                );
              })}
            </div>

            {/* Input Field */}
            <div className="pt-3 border-t border-slate-800">
              <input
                ref={inputRef}
                type="text"
                value={currentWordInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={!isTypingActive || hasFinishedRace}
                placeholder={
                  hasFinishedRace 
                    ? "Race Finished! Check the rankings above!" 
                    : isTypingActive 
                    ? "Type the word, then press SPACE..." 
                    : "Waiting for host to start race..."
                }
                className="w-full px-4 py-3 text-base md:text-lg font-mono bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

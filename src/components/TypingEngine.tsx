import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  RotateCcw, 
  Flame, 
  Maximize2, 
  Minimize2, 
  Target, 
  Gauge, 
  BookOpen, 
  Clock
} from 'lucide-react';
import { 
  TypingResult, 
  TypingStatsSnapshot, 
  TypingSettings, 
  TargetWpmGoal 
} from '../types';
import { TypingPassage, getRandomPassage } from '../data/typingPassages';
import { playKeySound, playErrorSound, playSuccessChime } from '../utils/soundEffects';

interface TypingEngineProps {
  onCompleteTest: (result: TypingResult) => void;
  onFirstKeyStroke?: () => void;
  currentSongTitle?: string;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  settings: TypingSettings;
  onUpdateSettings: (newSettings: Partial<TypingSettings>) => void;
  testKey?: number;
}

export const TypingEngine: React.FC<TypingEngineProps> = ({
  onCompleteTest,
  onFirstKeyStroke,
  currentSongTitle,
  focusMode,
  onToggleFocusMode,
  settings,
  onUpdateSettings,
  testKey,
}) => {
  // Duration: 30 seconds or 1 minute (60s)
  const [testDuration, setTestDuration] = useState<30 | 60>(60);
  const [currentPassage, setCurrentPassage] = useState<TypingPassage>(() => getRandomPassage());
  const [words, setWords] = useState<string[]>(() => getRandomPassage().text.trim().split(/\s+/));
  const [targetPace, setTargetPace] = useState<TargetWpmGoal>(settings.targetWpmGoal || 50);

  // Active typing state
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentWordInput, setCurrentWordInput] = useState<string>('');
  const [typedHistory, setTypedHistory] = useState<string[]>([]);
  
  // Timing & status
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  // Live timeline stats
  const [timeline, setTimeline] = useState<TypingStatsSnapshot[]>([]);
  const [streak, setStreak] = useState<number>(0);

  // Custom text input modal
  const [customText, setCustomText] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const hasTriggeredMusicRef = useRef<boolean>(false);
  const isFinishingRef = useRef<boolean>(false);

  // Stats ref to prevent race conditions during timer completion
  const statsRef = useRef({
    correctChars: 0,
    totalCharsTyped: 0,
    incorrectChars: 0,
    elapsedTime: 0,
    timeline: [] as TypingStatsSnapshot[],
  });

  // Reset / Initialize test
  const initializeTest = useCallback((newPassage?: TypingPassage) => {
    isFinishingRef.current = false;
    setIsActive(false);
    setIsFinished(false);
    setCurrentWordIndex(0);
    setCurrentWordInput('');
    setTypedHistory([]);
    setStreak(0);
    setTimeline([]);
    setElapsedTime(0);
    setTimeRemaining(testDuration);
    hasTriggeredMusicRef.current = false;

    const p = newPassage || getRandomPassage();
    setCurrentPassage(p);
    // Prepare words with a fallback buffer so words never run out during the 30s or 60s
    setWords(p.text.trim().split(/\s+/));

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 40);
  }, [testDuration]);

  const handleNextPassage = () => {
    const next = getRandomPassage();
    initializeTest(next);
  };

  useEffect(() => {
    initializeTest();
  }, [initializeTest, testKey]);

  // Keep active word in comfortable view
  useEffect(() => {
    const el = document.getElementById('active-typing-word');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentWordIndex]);

  // Real Word Measurement (TypingTest.com Standard):
  // 1 Word = 5 Keystrokes
  // Live calculation: Smoothly ramped during first 2-3 seconds to prevent unrealistic 300-400 spikes
  const { correctChars, incorrectChars, totalCharsTyped, currentWpm, currentRawWpm, currentAccuracy } = useMemo(() => {
    let correct = 0;
    let incorrect = 0;

    // Completed words
    typedHistory.forEach((typed, idx) => {
      const target = words[idx] || '';
      for (let i = 0; i < typed.length; i++) {
        if (i < target.length) {
          if (typed[i] === target[i]) {
            correct++;
          } else {
            incorrect++;
          }
        } else {
          incorrect++;
        }
      }
      if (idx < currentWordIndex) {
        correct++; // space between words
      }
    });

    // Current word
    const targetWord = words[currentWordIndex] || '';
    for (let i = 0; i < currentWordInput.length; i++) {
      if (i < targetWord.length) {
        if (currentWordInput[i] === targetWord[i]) {
          correct++;
        } else {
          incorrect++;
        }
      } else {
        incorrect++;
      }
    }

    const totalChars = correct + incorrect;

    let netWpm = 0;
    let rawWpm = 0;

    if (elapsedTime <= 0 || totalChars === 0) {
      netWpm = 0;
      rawWpm = 0;
    } else if (elapsedTime < 3) {
      // Normalizes start so it shows realistic speeds (e.g. 25-50 WPM)
      const smoothedMinutes = Math.max(elapsedTime, 3) / 60;
      netWpm = Math.min(Math.round((correct / 5) / smoothedMinutes), 65);
      rawWpm = Math.min(Math.round((totalChars / 5) / smoothedMinutes), 75);
    } else {
      const timeInMinutes = elapsedTime / 60;
      netWpm = Math.round((correct / 5) / timeInMinutes);
      rawWpm = Math.round((totalChars / 5) / timeInMinutes);
      netWpm = Math.min(Math.max(netWpm, 0), 160);
      rawWpm = Math.min(Math.max(rawWpm, 0), 180);
    }

    const accuracy = totalChars > 0 ? Math.round((correct / totalChars) * 100) : 100;

    return {
      correctChars: correct,
      incorrectChars: incorrect,
      totalCharsTyped: totalChars,
      currentWpm: Math.max(netWpm, 0),
      currentRawWpm: Math.max(rawWpm, 0),
      currentAccuracy: Math.min(Math.max(accuracy, 0), 100),
    };
  }, [typedHistory, currentWordInput, currentWordIndex, words, elapsedTime]);

  // Keep stats synced
  statsRef.current = {
    correctChars,
    totalCharsTyped,
    incorrectChars,
    elapsedTime,
    timeline,
  };

  // Finish test callback (strictly dispatches when time is up)
  const finishTest = useCallback((finalElapsed?: number) => {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsActive(false);
    setIsFinished(true);

    playSuccessChime(settings.soundVolume);

    const safeElapsed = Math.max(finalElapsed ?? statsRef.current.elapsedTime, 1);
    const { correctChars: curCorrect, totalCharsTyped: curTotal, incorrectChars: curIncorrect, timeline: curTimeline } = statsRef.current;
    
    // Official test duration used for net calculation (30s or 60s)
    const timeInMinutes = safeElapsed / 60;
    const finalWpm = Math.min(Math.round((curCorrect / 5) / timeInMinutes), 160);
    const finalRawWpm = Math.min(Math.round((curTotal / 5) / timeInMinutes), 180);
    const finalCpm = Math.round(curCorrect / timeInMinutes);
    const finalAccuracy = curTotal > 0 ? Math.round((curCorrect / curTotal) * 100) : 100;

    const getBenchmark = (wpm: number): TypingResult['benchmarkPassed'] => {
      if (wpm >= 80) return '80+ WPM (Master)';
      if (wpm >= 60) return '60 WPM (Pro)';
      if (wpm >= 50) return '50 WPM (Fluent)';
      if (wpm >= 40) return '40 WPM (Average)';
      return 'Under 40 WPM';
    };

    const result: TypingResult = {
      id: `test-${Date.now()}`,
      timestamp: Date.now(),
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      cpm: finalCpm,
      accuracy: finalAccuracy,
      mode: 'time',
      modeParam: `${testDuration}s`,
      elapsedSeconds: safeElapsed,
      correctChars: curCorrect,
      incorrectChars: curIncorrect,
      extraChars: 0,
      missedChars: Math.max(0, currentPassage.text.length - curTotal),
      soundTheme: settings.soundTheme,
      songListened: currentSongTitle,
      timeline: curTimeline.length > 0 ? curTimeline : [
        { second: safeElapsed, wpm: finalWpm, rawWpm: finalRawWpm, errors: curIncorrect }
      ],
      targetGoal: targetPace,
      benchmarkPassed: getBenchmark(finalWpm),
    };

    setTimeout(() => {
      onCompleteTest(result);
    }, 0);
  }, [
    currentPassage.text,
    testDuration,
    settings.soundTheme,
    settings.soundVolume,
    currentSongTitle,
    targetPace,
    onCompleteTest
  ]);

  // 1-Second Timer Loop
  useEffect(() => {
    if (!isActive || isFinished) return;

    timerRef.current = window.setInterval(() => {
      setTimeRemaining(prev => Math.max(prev - 1, 0));
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive, isFinished]);

  // CRITICAL REQUIREMENT: Test strictly ends when time runs out!
  // It does NOT wait for the user to complete the text, and does not stop early.
  useEffect(() => {
    if (isActive && !isFinished && timeRemaining === 0) {
      finishTest(elapsedTime);
    }
  }, [isActive, isFinished, timeRemaining, elapsedTime, finishTest]);

  // Record timeline snapshots safely
  useEffect(() => {
    if (!isActive || isFinished || elapsedTime <= 0) return;
    const timeInMin = Math.max(elapsedTime, 3) / 60;
    const liveWpm = Math.min(Math.round((correctChars / 5) / timeInMin), 150);
    const liveRaw = Math.min(Math.round((totalCharsTyped / 5) / timeInMin), 160);
    setTimeline(prev => [
      ...prev,
      { second: elapsedTime, wpm: liveWpm, rawWpm: liveRaw, errors: incorrectChars }
    ]);
  }, [elapsedTime, isActive, isFinished, correctChars, totalCharsTyped, incorrectChars]);

  // Handle Input Keydown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      initializeTest();
      return;
    }

    if (e.key === 'Escape') {
      initializeTest();
      return;
    }

    if (settings.confidenceMode && e.key === 'Backspace') {
      e.preventDefault();
      playErrorSound(settings.soundVolume);
      return;
    }

    // Start countdown timer on first stroke
    if (!isActive && !isFinished && e.key.length === 1) {
      setIsActive(true);
      if (!hasTriggeredMusicRef.current && settings.autoPlayMusicOnType && onFirstKeyStroke) {
        hasTriggeredMusicRef.current = true;
        onFirstKeyStroke();
      }
    }

    const isSpaceOrEnter = e.key === ' ' || e.key === 'Enter';
    playKeySound(settings.soundTheme, settings.soundVolume, isSpaceOrEnter);

    // Space advances to next word
    if (e.key === ' ') {
      e.preventDefault();
      if (currentWordInput.trim() === '' && currentWordIndex === 0) return;

      const targetWord = words[currentWordIndex] || '';
      if (currentWordInput === targetWord) {
        setStreak(s => s + 1);
      } else {
        setStreak(0);
        playErrorSound(settings.soundVolume);
      }

      setTypedHistory(prev => [...prev, currentWordInput]);
      setCurrentWordInput('');

      // If user reaches near the end of words before 30s/60s expires,
      // seamlessly append more words so they can keep typing!
      if (currentWordIndex + 10 >= words.length) {
        const nextWords = getRandomPassage().text.trim().split(/\s+/);
        setWords(prev => [...prev, ...nextWords]);
      }

      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(' ')) return; // Handled by space keydown

    const targetWord = words[currentWordIndex] || '';
    const lastCharIdx = val.length - 1;
    if (lastCharIdx >= 0 && val[lastCharIdx] !== targetWord[lastCharIdx]) {
      setStreak(0);
      playErrorSound(settings.soundVolume);
    }

    setCurrentWordInput(val);
  };

  // Milestone passes
  const is40Passed = currentWpm >= 40;
  const is50Passed = currentWpm >= 50;
  const is60Passed = currentWpm >= 60;
  const paceDelta = targetPace > 0 && isActive ? currentWpm - targetPace : null;

  return (
    <div className="w-full flex flex-col items-center">
      
      {/* Test Duration & Target Selector */}
      {!focusMode && (
        <div className="w-full max-w-4xl bg-slate-900/70 border border-slate-800 rounded-xl p-3 mb-4 backdrop-blur-sm flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Prominent 30 Sec / 1 Min Duration Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Time Option:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => {
                  setTestDuration(30);
                  setTimeRemaining(30);
                  initializeTest();
                }}
                className={`px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  testDuration === 30
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                30 Sec
              </button>
              <button
                onClick={() => {
                  setTestDuration(60);
                  setTimeRemaining(60);
                  initializeTest();
                }}
                className={`px-3.5 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                  testDuration === 60
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1 Min (60s)
              </button>
            </div>
          </div>

          {/* Pace Target */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium hidden sm:inline">Pace Goal:</span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {([0, 40, 50, 60] as TargetWpmGoal[]).map(goal => (
                <button
                  key={goal}
                  onClick={() => {
                    setTargetPace(goal);
                    onUpdateSettings({ targetWpmGoal: goal });
                  }}
                  className={`px-2 py-1 rounded font-mono font-medium transition-colors cursor-pointer text-xs ${
                    targetPace === goal
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {goal === 0 ? 'Free' : `${goal} WPM`}
                </button>
              ))}
            </div>
          </div>

          {/* Passage Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNextPassage}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
              title="Load a different story paragraph"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>New Story</span>
            </button>

            <button
              onClick={() => setShowCustomModal(true)}
              className="px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Custom
            </button>

            <button
              onClick={onToggleFocusMode}
              className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              title="Toggle Full Focus Mode"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Official 40, 50, 60 WPM Measurement Milestone Gauge */}
      <div className="w-full max-w-4xl bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 mb-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">Word Speed Measurement</span>
            <span className="text-slate-400">· Ends automatically when {testDuration}s expires</span>
          </div>

          <div className="flex items-center gap-3 font-mono">
            {isActive && paceDelta !== null && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                paceDelta >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {paceDelta >= 0 ? `+${paceDelta} WPM ahead of ${targetPace} target` : `${paceDelta} WPM behind ${targetPace} target`}
              </span>
            )}
            <span className="text-slate-400">
              Live: <strong className="text-amber-400 font-bold text-base">{currentWpm}</strong> WPM
            </span>
          </div>
        </div>

        {/* Milestone Markers */}
        <div className="relative pt-1 pb-4">
          <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
            <div 
              className="h-full bg-gradient-to-r from-amber-500/50 via-amber-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${Math.min(Math.max((currentWpm / 80) * 100, 0), 100)}%` }}
            />
          </div>

          <div className="relative w-full flex justify-between text-[11px] font-mono mt-1.5 select-none">
            <div className="text-slate-500">0</div>

            {/* 40 WPM */}
            <div 
              className="absolute -translate-x-1/2 flex flex-col items-center cursor-pointer"
              style={{ left: `${(40 / 80) * 100}%` }}
              onClick={() => setTargetPace(40)}
            >
              <div className={`w-0.5 h-2 -mt-3.5 mb-1 ${is40Passed ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                is40Passed 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 bg-slate-950 border border-slate-800'
              }`}>
                40 WPM
              </span>
              <span className="text-[9px] text-slate-500 font-sans mt-0.5">Average</span>
            </div>

            {/* 50 WPM */}
            <div 
              className="absolute -translate-x-1/2 flex flex-col items-center cursor-pointer"
              style={{ left: `${(50 / 80) * 100}%` }}
              onClick={() => setTargetPace(50)}
            >
              <div className={`w-0.5 h-2 -mt-3.5 mb-1 ${is50Passed ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                is50Passed 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'text-slate-400 bg-slate-950 border border-slate-800'
              }`}>
                50 WPM
              </span>
              <span className="text-[9px] text-slate-500 font-sans mt-0.5">Fluent</span>
            </div>

            {/* 60 WPM */}
            <div 
              className="absolute -translate-x-1/2 flex flex-col items-center cursor-pointer"
              style={{ left: `${(60 / 80) * 100}%` }}
              onClick={() => setTargetPace(60)}
            >
              <div className={`w-0.5 h-2 -mt-3.5 mb-1 ${is60Passed ? 'bg-emerald-400' : 'bg-slate-700'}`} />
              <span className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                is60Passed 
                  ? 'bg-amber-400 text-slate-950 font-bold shadow' 
                  : 'text-slate-400 bg-slate-950 border border-slate-800'
              }`}>
                60 WPM
              </span>
              <span className="text-[9px] text-slate-500 font-sans mt-0.5">Pro Speed</span>
            </div>

            <div className="text-right text-slate-500">
              <span className="text-[10px]">80+ Master</span>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown HUD & Word Count */}
      <div className="w-full max-w-4xl flex items-center justify-between px-2 mb-2 text-slate-400 font-mono text-xs tabular-nums select-none">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold ${timeRemaining <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
              {timeRemaining}
            </span>
            <span className="text-slate-400 text-xs font-sans">seconds left</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-slate-200 text-sm font-semibold">
              Word {currentWordIndex + 1}
            </span>
          </div>

          {isActive && (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-slate-100">{currentAccuracy}%</span>
              <span className="text-slate-400 text-xs font-sans">accuracy</span>
            </div>
          )}
        </div>

        {streak > 5 && (
          <div className="flex items-center gap-1 text-amber-400 font-sans font-medium text-xs">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>{streak} streak</span>
          </div>
        )}
      </div>

      {/* Stable Full Paragraph Display Box */}
      <div 
        onClick={() => inputRef.current?.focus()}
        className="w-full max-w-4xl bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800 rounded-2xl p-6 md:p-8 cursor-text transition-colors shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 pb-3 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">{currentPassage.title}</span>
            <span className="text-slate-400">· {testDuration}s Timed Test</span>
          </div>
          <span className="text-amber-400/90 font-medium">
            {isActive ? 'Counting down...' : 'Starts on first keystroke'}
          </span>
        </div>

        {/* Stable Text Display: Words do NOT disappear behind */}
        <div className="font-mono text-lg md:text-xl leading-relaxed tracking-wide select-none text-slate-400 flex flex-wrap gap-x-2 gap-y-3 min-h-[140px] max-h-[240px] overflow-y-auto pr-1">
          {words.map((word, actualIndex) => {
            const isCurrent = actualIndex === currentWordIndex;
            const isPast = actualIndex < currentWordIndex;
            const pastTyped = typedHistory[actualIndex] || '';
            const isPastCorrect = isPast && pastTyped === word;

            return (
              <span 
                key={`${actualIndex}-${word}`}
                id={isCurrent ? 'active-typing-word' : undefined}
                className={`relative px-1 py-0.5 rounded transition-colors ${
                  isCurrent 
                    ? 'bg-amber-400/15 border-b-2 border-amber-400 text-slate-100 font-medium' 
                    : isPast 
                    ? isPastCorrect 
                      ? 'text-slate-300' 
                      : 'text-rose-400 underline decoration-rose-500/80' 
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
                          className={`relative ${
                            isCorrect 
                              ? 'text-emerald-400 font-semibold' 
                              : isWrong 
                              ? 'text-rose-400 bg-rose-950/80 rounded-xs' 
                              : 'text-slate-300'
                          }`}
                        >
                          {charIdx === currentWordInput.length && (
                            <span className="absolute -left-[1.5px] top-0 bottom-0 w-[2.5px] bg-amber-400 rounded-full animate-caret shadow-sm shadow-amber-400/50" />
                          )}
                          {char}
                        </span>
                      );
                    })}

                    {currentWordInput.length > word.length && (
                      <span className="text-rose-400 opacity-90 underline decoration-rose-500">
                        {currentWordInput.slice(word.length)}
                      </span>
                    )}

                    {currentWordInput.length >= word.length && (
                      <span className="inline-block relative">
                        <span className="absolute -left-[1.5px] top-0 bottom-0 w-[2.5px] bg-amber-400 rounded-full animate-caret shadow-sm shadow-amber-400/50" />
                      </span>
                    )}
                  </>
                ) : (
                  word
                )}
              </span>
            );
          })}
        </div>

        {/* Input Field (TypingTest.com) */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={currentWordInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isActive ? "Type the current word, then press SPACE..." : "Click here and start typing to begin..."}
              className="w-full px-4 py-3 text-base md:text-lg font-mono bg-slate-950 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
              autoFocus
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => initializeTest()}
              className="flex items-center gap-1.5 px-4 py-3 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Restart Test (Tab)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Restart (Tab)</span>
            </button>
          </div>
        </div>

        {/* Note */}
        {!isActive && !isFinished && (
          <div className="mt-3 text-xs text-slate-400 flex items-center justify-between">
            <span>Timer starts when you press the first key. Results are measured when {testDuration}s runs out.</span>
            <span className="text-amber-400 font-medium">Press Space to advance words</span>
          </div>
        )}
      </div>

      {/* Custom Text Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-semibold text-slate-100 mb-2">
              Custom Practice Paragraph
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Paste your own English paragraph to test your speed for {testDuration} seconds.
            </p>
            <textarea
              rows={5}
              placeholder="Paste custom text here..."
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full p-3 text-sm font-mono bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 resize-none"
            />
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCustomModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (customText.trim()) {
                    const customPassage: TypingPassage = {
                      id: `custom-${Date.now()}`,
                      title: 'Custom Paragraph',
                      category: 'User Text',
                      text: customText.trim(),
                      wordCount: customText.trim().split(/\s+/).length,
                    };
                    initializeTest(customPassage);
                  }
                  setShowCustomModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Load Custom Paragraph
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

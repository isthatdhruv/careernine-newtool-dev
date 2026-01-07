"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Asset Paths
const SCENE_SRC = "/game-scenes/2nd/game-scene-2nd.png";
const RABBIT_SRC = "/game-scenes/2nd/rabbit-nobg.png";

export type Phase = "ready" | "show" | "input" | "feedback" | "paused" | "trial_done" | "done";

export type StonePos = {
  id: number;
  xPct: number;
  yPct: number;
  rPct: number;
  rabbitScale?: number;
};

export type RoundResult = {
    round: number; // 0-indexed
    sequence: number[];
    input: number[];
    correct: boolean;
};

interface RabbitRiverGameProps {
    studentName: string;
    className: string;
    totalRounds?: number;
    // The core logic function: given current state, return the next sequence of Stone IDs
    sequenceGenerator: (
        stones: StonePos[],
        roundIndex: number,
        history: RoundResult[]
    ) => number[];
    // Optional overrides
    isTrialEnabled?: boolean;
}

const DEFAULT_STONES: StonePos[] = [
  { "id": 0, "xPct": 21.4, "yPct": 81.3, "rPct": 4, "rabbitScale": 3.5 },
  { "id": 1, "xPct": 47.1, "yPct": 77.3, "rPct": 4.8, "rabbitScale": 2.1 },
  { "id": 2, "xPct": 36.2, "yPct": 70.9, "rPct": 4, "rabbitScale": 2.1 },
  { "id": 3, "xPct": 53.3, "yPct": 68, "rPct": 4.4, "rabbitScale": 2 },
  { "id": 4, "xPct": 43.9, "yPct": 59.8, "rPct": 4, "rabbitScale": 1.8 },
  { "id": 5, "xPct": 69, "yPct": 62.8, "rPct": 3.5, "rabbitScale": 1.4 },
  { "id": 6, "xPct": 58.5, "yPct": 55.3, "rPct": 3.9, "rabbitScale": 1.5 },
  { "id": 7, "xPct": 76.3, "yPct": 56, "rPct": 3.1, "rabbitScale": 1.5 },
  { "id": 8, "xPct": 67.8, "yPct": 50.6, "rPct": 3.1, "rabbitScale": 1.5 },
  { "id": 9, "xPct": 82.5, "yPct": 51, "rPct": 2.3, "rabbitScale": 0.9 },
  { "id": 10, "xPct": 74.7, "yPct": 49, "rPct": 2, "rabbitScale": 1 },
  { "id": 11, "xPct": 81.6, "yPct": 40.5, "rPct": 4, "rabbitScale": 0 }
];

const ROUND_SHOW_MS = 10_000;
const ROUND_INPUT_MS = 20_000;
const BUFFER_MS = 10_000;
const GAME_MAX_TIME_MS = 150_000;
const HOME_POS = { xPct: 21.4, yPct: 81.3 };

// Helper to shuffle trials or simple sequences if needed by the generator
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function RabbitRiverGame({
    studentName,
    className,
    totalRounds = 12,
    sequenceGenerator,
    isTrialEnabled = true
}: RabbitRiverGameProps) {
  
  // Video State
  const [showVideo, setShowVideo] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Editor State
  const [stonesState, setStonesState] = useState<StonePos[]>(DEFAULT_STONES);
  const [isEditing, setIsEditing] = useState(false);
  const [isDev, setIsDev] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Game State
  const [phase, setPhase] = useState<Phase>("ready");
  const [isTrial, setIsTrial] = useState(isTrialEnabled);
  const [trialRound, setTrialRound] = useState(0); 
  const [round, setRound] = useState(0); 
  const [score, setScore] = useState(0);
  
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerInput, setPlayerInput] = useState<number[]>([]);
  const [activeStone, setActiveStone] = useState<number | null>(null);
  const [bufferActivated, setBufferActivated] = useState(false);

  // History Tracking for Logic
  const [history, setHistory] = useState<RoundResult[]>([]);
  
  // Refs
  const sequenceRef = useRef<number[]>([]);
  const inputRef = useRef<number[]>([]);
  const timers = useRef<number[]>([]);
  const router = useRouter();

  // Rabbit Visuals
  const [rabbitPos, setRabbitPos] = useState({ x: HOME_POS.xPct, y: HOME_POS.yPct });
  const [rabbitScale, setRabbitScale] = useState(1);
  const [rabbitVisible, setRabbitVisible] = useState(true);

  // Timers
  const [phaseMsLeft, setPhaseMsLeft] = useState(0);
  const [gameMsLeft, setGameMsLeft] = useState(GAME_MAX_TIME_MS);
  const [lastResult, setLastResult] = useState<"correct" | "wrong" | null>(null);
  
  const [debugNumbers, setDebugNumbers] = useState(false);

  // Lifecycle
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hostname === "localhost") {
       setIsDev(true);
    }
    // Load config from local storage
    const saved = localStorage.getItem("rabbit-stones-config");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                 // Migrations (End/Start stones)
                 const hasEnd = parsed.some((s: any) => s.id === 11);
                 if (!hasEnd) {
                     const endStone = DEFAULT_STONES.find(s => s.id === 11);
                     if (endStone) parsed.push(endStone);
                 }
                 const hasStart = parsed.some((s: any) => s.id === 0);
                 if (!hasStart) {
                      const startStone = DEFAULT_STONES.find(s => s.id === 0);
                      if (startStone) parsed.unshift(startStone);
                 }
                 setStonesState(parsed);
            }
        } catch (e) {
            console.error(e);
        }
    }
  }, []);

  useEffect(() => {
    if (isEditing) {
        localStorage.setItem("rabbit-stones-config", JSON.stringify(stonesState));
    }
  }, [stonesState, isEditing]);

  const clearTimers = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };

  const handleVideoEnd = () => setVideoEnded(true);
  const handleStartGameClick = () => setShowVideo(false);

  const moveRabbitTo = (stoneId: number | null) => {
      if (stoneId === 0 || stoneId === null) {
          const s = stonesState.find(x => x.id === 0) || DEFAULT_STONES[0];
          setRabbitPos({ x: s.xPct, y: s.yPct - 5 });
          setRabbitScale(s.rabbitScale ?? 1.2);
          setRabbitVisible(true);
          return;
      }
      if (stoneId === 11) {
          const s = stonesState.find(x => x.id === 11);
          if (s) {
             setRabbitPos({ x: s.xPct, y: s.yPct - 5 });
             setRabbitScale(s.rabbitScale ?? 0);
             setRabbitVisible(true); 
          }
          return;
      }
      const s = stonesState.find(x => x.id === stoneId);
      if (s) {
          setRabbitPos({ x: s.xPct, y: s.yPct - 5 });
          setRabbitScale(s.rabbitScale ?? 1);
          setRabbitVisible(true);
      }
  };

  const startRound = (nextRoundIndex: number) => {
    clearTimers();
    setLastResult(null);
    setPlayerInput([]);
    inputRef.current = [];
    setBufferActivated(false);
    moveRabbitTo(0);

    // GENERATE SEQUENCE
    // If trial, we might want a simple random sequence? Or use the generator?
    // Let's assume generator handles trial logic if we pass a flag or negative index?
    // Or just use a simple internal default for trials?
    // The requirement was: "random sequence for each trial round".
    // Let's implement simple trial logic here or ask the generator to handle it.
    // Ideally, the generator is the brain. Let's pass 'isTrial' context via roundIndex?
    // Or just simple explicit logic for trials here.
    
    let seq: number[] = [];
    if (isTrial) {
        // Simple random sequence of length 3 for trials
        const allIds = stonesState.filter(s => s.id !== 0 && s.id !== 11).map(s => s.id);
        const sub = shuffle(allIds).slice(0, 3);
        seq = sub.sort((a,b) => a - b);
    } else {
        seq = sequenceGenerator(stonesState, nextRoundIndex, history);
    }

    setSequence(seq);
    sequenceRef.current = seq;

    setPhase("show");
    setPhaseMsLeft(ROUND_SHOW_MS);

    // Animation Timing
    const stepMs = Math.floor(ROUND_SHOW_MS / (seq.length + 2));
    
    timers.current.push(window.setTimeout(() => moveRabbitTo(0), 100));

    seq.forEach((stoneId, idx) => {
        timers.current.push(window.setTimeout(() => {
            setActiveStone(stoneId);
            moveRabbitTo(stoneId);
        }, (idx + 1) * stepMs));
    });

    // Jump to End
    timers.current.push(window.setTimeout(() => {
        setActiveStone(null);
        moveRabbitTo(11);
    }, (seq.length + 1) * stepMs));

    // Input Phase
    timers.current.push(window.setTimeout(() => {
        setPhase("input");
        setPhaseMsLeft(ROUND_INPUT_MS);
        setActiveStone(null);
        moveRabbitTo(0);
    }, ROUND_SHOW_MS));

    // Auto-End Input
    timers.current.push(window.setTimeout(() => {
        finishInputAndScore();
    }, ROUND_SHOW_MS + ROUND_INPUT_MS));

    if (!isTrial) {
        setRound(nextRoundIndex);
    } else {
        setTrialRound(nextRoundIndex);
    }
  };

  const finishInputAndScore = () => {
    setPhase((prev) => {
      if (prev !== "input") return prev;

      const input = inputRef.current;
      const seq = sequenceRef.current;

      // Case A: No Input -> PAUSE
      if (input.length === 0) {
           clearTimers();
           return "paused";
      }

      // Case B: Partial Correct -> BUFFER
      const isPartialCorrect = input.length > 0 && input.every((v, i) => v === seq[i]);
      if (isPartialCorrect && !bufferActivated) {
          setBufferActivated(true);
          setPhaseMsLeft(BUFFER_MS);
          timers.current.push(window.setTimeout(() => finishAfterBuffer(), BUFFER_MS));
          return "input";
      }

      // Case C: Finish
      evaluateAndAdvance(input, seq);
      return "feedback";
    });
  };

  const finishAfterBuffer = () => {
     setPhase(prev => {
         if (prev !== "input") return prev;
         evaluateAndAdvance(inputRef.current, sequenceRef.current);
         return "feedback";
     });
  };
  
  const evaluateAndAdvance = (input: number[], seq: number[]) => {
      const correct = input.length === seq.length && input.every((v, i) => v === seq[i]);
      setLastResult(correct ? "correct" : "wrong");

      if (correct) {
          if (!isTrial) setScore(s => s + 1);
          moveRabbitTo(11);
      }

      // Record History (Only for non-trials)
      if (!isTrial) {
          setHistory(prev => [...prev, {
              round: round,
              sequence: seq,
              input: input,
              correct: correct
          }]);
      }

      clearTimers();
      
      if (isTrial && !correct) {
          // If Trial is wrong, retry the SAME round (do not advance)
          timers.current.push(window.setTimeout(() => startRound(trialRound), 1500));
      } else {
          // Advance if correct OR if it's the main game (main game always advances)
          timers.current.push(window.setTimeout(() => handleNextRound(), correct ? 1000 : 700));
      }
  };

  const handleNextRound = () => {
      if (isTrial) {
          setTrialRound(prev => {
              const next = prev + 1;
              if (next >= 2) {
                  setPhase("trial_done");
                  setPhaseMsLeft(0);
                  return prev;
              } else {
                   setTimeout(() => startRound(next), 0);
                   return next;
              }
          });
          return;
      }

      setRound(prevRound => {
          const next = prevRound + 1;
          if (next >= totalRounds) {
              setPhase("done");
              setPhaseMsLeft(0);
              return prevRound;
          } else {
              setTimeout(() => startRound(next), 0);
              return next;
          }
      });
  };

  const onStoneClick = (stoneId: number) => {
    if (phase !== "input" || isEditing) return;
    if (stoneId === 0 || stoneId === 11) return;

    moveRabbitTo(stoneId);
    const nextInput = [...inputRef.current, stoneId];
    inputRef.current = nextInput;
    setPlayerInput(nextInput);

    const idx = nextInput.length - 1;
    const seq = sequenceRef.current;

    // Immediate Wrong Check
    if (stoneId !== seq[idx]) {
        evaluateAndAdvance(nextInput, seq); // Will fail
    } else {
        // Correct step
        if (nextInput.length === seq.length) {
            // Wait for rabbit to land on final stone before moving to End
            setTimeout(() => {
                evaluateAndAdvance(nextInput, seq); // Will succeed
            }, 500);
        }
    }
  };
  
  const handleContinueGame = () => {
      setPhase("ready"); 
      setTimeout(() => startRound(round), 50);
  };

  const handleGameControl = () => {
    if (phase === "ready") {
      // Start!
      if (isTrial) {
          startRound(0); // Start Trial Round 0
      } else {
          setGameMsLeft(GAME_MAX_TIME_MS);
          startRound(0); // Start Game Round 0
      }
    } else {
       // Stop and Reset to Start (Default to Trial Mode?)
       // If user clicks "Restart" during game, reset everything
       clearTimers();
       setIsTrial(true);
       setPhase("ready");
       setRound(0);
       setTrialRound(0);
       setScore(0);
       setSequence([]);
       sequenceRef.current = [];
       setPlayerInput([]);
       inputRef.current = [];
       setActiveStone(null);
       moveRabbitTo(0); 
       setPhaseMsLeft(0);
       setGameMsLeft(GAME_MAX_TIME_MS);
    }
  };

  // Timers and Cleanup
  useEffect(() => {
    if (phase !== "show" && phase !== "input") return;
    const tick = window.setInterval(() => setPhaseMsLeft(ms => Math.max(0, ms - 100)), 100);
    return () => window.clearInterval(tick);
  }, [phase]);

  useEffect(() => {
      if (phase === "ready" || phase === "done" || phase === "trial_done" || isTrial) return;
      const interval = window.setInterval(() => {
          setGameMsLeft(prev => {
              if (prev <= 100) {
                  setPhase("done");
                  return 0;
              }
              return prev - 100;
          });
      }, 100);
      return () => window.clearInterval(interval);
  }, [phase, isTrial]);

  // Save Results on Done
  useEffect(() => {
    if (phase === "done") {
        const save = async () => {
            const normalizedId = studentName.trim().toLowerCase();
            try {
                await setDoc(doc(db, "game_results", normalizedId), {
                    name: studentName,
                    className: className,
                    rabbit_path: {
                        score: score,
                        totalRounds: totalRounds,
                        roundsPlayed: round + 1,
                        timestamp: new Date().toISOString(),
                        history: history // Save detailed history for analytics
                    },
                    timestamp: new Date().toISOString()
                }, { merge: true });
                console.log("Saved");
            } catch(e) {
                console.error("Save failed", e);
            }
        };
        save();
    }
  }, [phase, score, studentName, className, history]);

  // Render Helpers
  const phaseLabel = useMemo(() => {
    if (phase === "ready") return "Ready";
    if (phase === "show") return "Watch";
    if (phase === "input") return "Go!";
    if (phase === "feedback") return lastResult === "correct" ? "Correct!" : "Wrong";
    if (phase === "done") return "Finished";
    return "";
  }, [phase, lastResult]);

  // Editor Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    if (!isEditing) return;
    e.stopPropagation(); e.preventDefault(); setDraggingId(id);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditing || draggingId === null || !editorRef.current) return;
    const rect = editorRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newX = Number(x.toFixed(1));
    const newY = Number(y.toFixed(1));
    setStonesState(prev => prev.map(s => s.id === draggingId ? { ...s, xPct: newX, yPct: newY } : s));
    setRabbitPos({ x: newX, y: newY - 5 });
  };
  const handleMouseUp = () => setDraggingId(null);
  
  return (
    <div className="min-h-screen w-full bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      {/* VIDEO MODAL */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-3xl w-full border-4 border-yellow-400 relative">
            <div className="bg-yellow-400 p-4 text-center">
              <h2 className="text-2xl font-black text-yellow-900 uppercase tracking-widest">How to Play</h2>
            </div>
            <div className="relative aspect-video bg-black">
              <video ref={videoRef} src="/game-scenes/2nd/gamerule.mp4" className="w-full h-full object-contain" controls autoPlay onEnded={handleVideoEnd} />
            </div>
            <div className="p-6 flex justify-center bg-slate-50">
               <button onClick={handleStartGameClick} disabled={!videoEnded} className={`px-8 py-3 rounded-full text-xl font-bold transition-all transform shadow-[0_4px_0_rgb(0,0,0,0.2)] ${videoEnded ? 'bg-green-500 hover:bg-green-400 text-white translate-y-0 active:translate-y-[4px] active:shadow-none cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50' }`}>
                 {videoEnded ? "Go to Game 🚀" : "Watch to Start..."}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSED MODAL */}
      {phase === "paused" && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center border-4 border-yellow-400 shadow-2xl">
                   <h2 className="text-3xl font-black text-yellow-500 mb-4">Focus! 🧐</h2>
                   <button onClick={handleContinueGame} className="px-8 py-3 rounded-full bg-emerald-500 text-white text-xl font-bold shadow-lg">Continue</button>
              </div>
         </div>
      )}

      {/* TRIAL COMPLETE MODAL */}
      {phase === "trial_done" && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
             <div className="bg-white rounded-3xl p-8 max-w-lg w-full text-center border-4 border-emerald-400 shadow-2xl">
                  <h2 className="text-3xl font-black text-emerald-600 mb-4">Trial Complete! 🎉</h2>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button onClick={() => { setPhase("ready"); setTrialRound(0); setIsTrial(true); setTimeout(() => startRound(0), 500); }} className="px-6 py-3 rounded-full bg-gray-200 text-gray-800 font-bold shadow-md">Restart Trial</button>
                      <button onClick={() => { setIsTrial(false); setPhase("ready"); setRound(0); setScore(0); setTimeout(() => { setGameMsLeft(GAME_MAX_TIME_MS); startRound(0); }, 500); }} className="px-6 py-3 rounded-full bg-emerald-500 text-white text-lg font-bold shadow-lg">Start Game 🚀</button>
                  </div>
             </div>
         </div>
      )}

      <div className={`w-full max-w-[80%] transition-all duration-500 flex flex-col items-center ${showVideo ? 'blur-sm scale-95 opacity-50' : 'blur-0 scale-100 opacity-100'}`}>
        {/* HUD */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 w-full">
            <div className="flex items-center gap-3">
                <button onClick={() => router.push('/')} className="px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 transition font-semibold flex items-center gap-2">🏠 <span className="hidden sm:inline">Home</span></button>
                {isTrial ? (
                   <div className="px-3 py-2 rounded-2xl bg-yellow-400/20 backdrop-blur border border-yellow-400/50">
                       <span className="text-xs text-yellow-200 font-bold uppercase tracking-widest block">Trial Mode</span>
                       <span className="text-lg font-semibold text-yellow-400">Round {trialRound + 1} / 2</span>
                   </div>
                ) : (
                    <div className="px-3 py-2 rounded-2xl bg-white/10 backdrop-blur">
                       <span className="text-xs opacity-80 block">Time</span>
                       <span className={`text-lg font-semibold ${gameMsLeft < 30000 ? 'text-red-400 animate-pulse' : ''}`}>{Math.floor(gameMsLeft / 1000)}s</span>
                    </div>
                )}
                <div className="px-3 py-2 rounded-2xl bg-white/10 backdrop-blur">
                    <span className="text-xs opacity-80 block">Phase</span>
                    <span className="text-lg font-semibold">{phaseLabel}</span>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {isDev && <button className={`px-3 py-2 rounded-2xl transition font-bold ${isEditing ? 'bg-yellow-500 text-black' : 'bg-white/10'}`} onClick={() => setIsEditing(e => !e)}>{isEditing ? "Done" : "Edit"}</button>}
                <button className="px-3 py-2 rounded-2xl bg-white/10" onClick={() => setDebugNumbers(d => !d)}>{debugNumbers ? "Hide #'s" : "Show #'s"}</button>
                <button className="px-5 py-2 rounded-2xl bg-emerald-500 font-semibold" onClick={handleGameControl}>{phase === "ready" ? (isTrial ? "Start Trial" : "Start Game") : "Restart"}</button>
            </div>
        </div>

        {/* GAME STAGE */}
        <div ref={editorRef} className={`relative w-full aspect-[16/9] rounded-3xl overflow-hidden shadow-2xl border bg-black select-none ${isEditing ? 'border-yellow-500' : 'border-white/10'}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <img src={SCENE_SRC} className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} alt="scene" />
            <div className="absolute right-[6%] bottom-[32%] w-[10%] h-[18%] pointer-events-none" />
            
            <div className="absolute z-10 w-[14%] pointer-events-none transition-all duration-300" style={{ left: `${rabbitPos.x}%`, top: `${rabbitPos.y}%`, transform: `translate(-50%, -50%) scale(${rabbitScale})`, opacity: (rabbitVisible || isEditing) ? (isEditing ? 0.3 : 1) : 0 }}>
               <img src={RABBIT_SRC} className="w-full h-full object-contain drop-shadow-lg" draggable={false} alt="rabbit" />
            </div>

            {stonesState.map(s => {
                const isActive = activeStone === s.id && phase === "show";
                const isClickable = phase === "input" && !isEditing && s.id !== 0 && s.id !== 11;
                return (
                    <div key={s.id} className="absolute" style={{ left: `${s.xPct}%`, top: `${s.yPct}%`, width: `${s.rPct * 2}%`, height: `${s.rPct * 2}%`, transform: "translate(-50%, -50%)" }}>
                        <button onMouseDown={(e) => handleMouseDown(e, s.id)} onClick={() => !isEditing && isClickable && onStoneClick(s.id)} 
                            className={`w-full h-full rounded-full transition-transform ${isClickable ? 'cursor-pointer hover:scale-110' : ''} ${isActive ? 'scale-100' : ''} ${isEditing ? 'cursor-move ring-2 ring-yellow-400' : ''}`}
                            style={{ boxShadow: isActive ? "0 0 0 4px rgba(255,255,255,0.4), 0 0 12px rgba(255,255,255,0.6)" : (debugNumbers ? "0 0 0 2px red" : "none"), background: isActive ? "rgba(255,255,255,0.25)" : "transparent" }}>
                             {(debugNumbers || isEditing) && <span className="text-xs font-bold bg-black/50 px-1 rounded">{s.id === 0 ? "S" : s.id === 11 ? "E" : s.id}</span>}
                        </button>
                    </div>
                );
            })}
            
            {!isEditing && phase === "done" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur">
                    <div className="px-6 py-4 rounded-3xl bg-black/60 text-center border border-white/10">
                        <div className="text-2xl font-semibold">Time’s up</div>
                        <div className="mt-2 text-base">Congratulation's {studentName} you have completed the game !</div>
                        <button onClick={() => router.push('/')} className="mt-4 bg-white text-black font-bold py-2 px-6 rounded-full hover:bg-gray-200">Return Home</button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

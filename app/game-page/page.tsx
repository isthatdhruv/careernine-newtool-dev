"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

type AnimalType = "leopard" | "monkey" | "snake" | "parrot";

const ANIMALS: AnimalType[] = ["leopard", "monkey", "snake", "parrot"];
const TOTAL_ROUNDS = 40;
const ANIMALS_PER_TYPE = 10;
const DISPLAY_DURATION = 1500; // 1.5 seconds

export default function GamePage() {
  const searchParams = useSearchParams();
  const userName = searchParams.get("name") || "Explorer";

  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [animalQueue, setAnimalQueue] = useState<AnimalType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [score, setScore] = useState({
    leopardsShown: 0,
    leopardsClicked: 0,
    falseAlarms: 0,
  });

  // Refs for tracking synchronous state during rapid events
  const currentAnimalRef = useRef<AnimalType | null>(null);
  const hasClickedRef = useRef(false);

  // Initialize Game
  useEffect(() => {
    // Create deck: 10 of each animal
    const deck: AnimalType[] = [];
    ANIMALS.forEach((animal) => {
      for (let i = 0; i < ANIMALS_PER_TYPE; i++) {
        deck.push(animal);
      }
    });

    // Shuffle (Fisher-Yates)
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    setAnimalQueue(deck);
    setGameStarted(true);
    
    // Start the loop after a small delay
    const timer = setTimeout(() => {
        nextRound();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const nextRound = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= TOTAL_ROUNDS) {
        setGameOver(true);
        return prev;
      }
      
      hasClickedRef.current = false;
      return next;
    });
  }, []);

  // Update ref when index changes
  useEffect(() => {
    if (currentIndex >= 0 && currentIndex < animalQueue.length) {
      currentAnimalRef.current = animalQueue[currentIndex];
      
      // Auto advance timer
      const timer = setTimeout(() => {
        nextRound();
      }, DISPLAY_DURATION);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, animalQueue, nextRound]);

  // Handle Input
  const handleInput = useCallback(() => {
    if (gameOver || currentIndex < 0 || hasClickedRef.current) return;

    hasClickedRef.current = true;
    const currentAnimal = currentAnimalRef.current;

    setScore((prev) => {
      if (currentAnimal === "leopard") {
        return { ...prev, leopardsClicked: prev.leopardsClicked + 1 };
      } else {
        return { ...prev, falseAlarms: prev.falseAlarms + 1 };
      }
    });
  }, [gameOver, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault(); // Prevent scrolling
        handleInput();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleInput]);


  // Current tracking for calculating "Shown" count safely
  // It's just (currentIndex + 1) or loop through queue to see how many leopards passed
  const calculateFinalStats = () => {
     let shown = 0;
     for(let i=0; i < animalQueue.length; i++) {
         if (animalQueue[i] === 'leopard') shown++;
     }
     return shown;
  };

  // Save results when game ends
  useEffect(() => {
    if (gameOver) {
      const saveResult = async () => {
        try {
          await addDoc(collection(db, "game_results"), {
            name: userName,
            score: score.leopardsClicked,
            leopardsShown: calculateFinalStats(), // Use the function logic or just 10 since we know deck has 10
            leopardsClicked: score.leopardsClicked,
            falseAlarms: score.falseAlarms,
            timestamp: new Date().toISOString()
          });
          console.log("Score saved!");
        } catch (e) {
          console.error("Error adding document: ", e);
        }
      };
      saveResult();
    }
  }, [gameOver, userName, score]);

  if (gameOver) {
    return (
      <main className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="z-10 bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-4 border-yellow-400 max-w-md w-full text-center">
            <h1 className="text-4xl font-extrabold text-green-900 mb-6">Great Job, {userName}!</h1>
            
            <div className="space-y-4 mb-8 text-xl font-bold text-green-800">
                <div className="bg-green-100 p-4 rounded-xl flex justify-between">
                    <span>Leopards Spotted:</span>
                    <span className="text-2xl text-green-600">{score.leopardsClicked} / 10</span>
                </div>
                {score.falseAlarms > 0 && (
                 <div className="bg-red-50 p-4 rounded-xl flex justify-between text-red-800">
                    <span>Oopsies:</span>
                    <span className="text-2xl">{score.falseAlarms}</span>
                </div>
                )}
            </div>

            <Link href="/" className="block w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-2xl font-black py-4 rounded-full shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_4px_0_rgb(180,83,9)] active:translate-y-[6px] active:shadow-none transition-all uppercase tracking-wider">
                Play Again
            </Link>
        </div>
      </main>
    );
  }

  const currentAnimal = animalQueue[currentIndex];

  return (
    <main className="min-h-screen bg-green-600 flex flex-col items-center justify-center relative overflow-hidden cursor-none" onClick={handleInput}>
       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 10%, transparent 10%)', backgroundSize: '40px 40px'}}></div>

       <div className="relative z-10 flex flex-col items-center">
            {currentAnimal && (
                <div className="transform transition-all duration-200 scale-100">
                    <div className="bg-white p-4 rounded-3xl shadow-2xl rotate-1 border-8 border-white">
                        {/* We use specific filenames we generated */}
                        <Image 
                            src={`/assets/game/${currentAnimal}_sticker.png`}
                            alt={currentAnimal}
                            width={350}
                            height={350}
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            )}
            
            {/* Visual Guide for Kids */}
            <p className="mt-12 text-white/80 text-xl font-bold bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm">
                Press SPACE when you see a <span className="text-yellow-300">LEOPARD</span>!
            </p>
       </div>
    </main>
  );
}

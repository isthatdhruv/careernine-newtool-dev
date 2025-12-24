"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (name.trim()) {
      // Pass the name via query param or just simple navigation for now
      // In a real app we might use context or specific state management
      // For simplicity, let's just push to game page with query param
      router.push(`/game-page?name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <main className="min-h-screen bg-green-500 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Jungle Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-400 rounded-full opacity-50 -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-800 rounded-full opacity-50 translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        {/* Vines/Leaves decoration could go here */}
      </div>

      <div className="z-10 bg-white/30 backdrop-blur-md rounded-3xl p-8 shadow-2xl border-4 border-green-200 shadow-green-900/20 max-w-md w-full text-center">
        <h1 className="text-5xl font-extrabold text-green-900 mb-2 drop-shadow-sm font-sans">
          Jungle Spot!
        </h1>
        <p className="text-green-800 text-lg mb-8 font-medium">
          Can you spot the leopards?
        </p>

        {/* Sticker Decorations (using placeholders or verified assets if available) */}
        <div className="flex justify-center gap-4 mb-8">
             {/* We will add these images once fully verified, for now just decorative emojis or placeholders if assets missng */}
             <div className="text-4xl animate-bounce">🐆</div>
             <div className="text-4xl animate-bounce delay-100">🌿</div>
             <div className="text-4xl animate-bounce delay-200">🐒</div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-6 py-4 rounded-full text-xl text-center font-bold text-green-900 placeholder:text-green-700/50 bg-white/80 border-4 border-transparent focus:border-yellow-400 focus:outline-none transition-all shadow-inner"
              onKeyDown={(e) => e.key === "Enter" && handleStart()}
            />
          </div>

          <button
            onClick={handleStart}
            disabled={!name.trim()}
            className="w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-black py-4 rounded-full shadow-[0_6px_0_rgb(180,83,9)] hover:shadow-[0_4px_0_rgb(180,83,9)] active:shadow-none active:translate-y-[6px] transition-all transform uppercase tracking-wider"
          >
            Start Game
          </button>
        </div>
      </div>
    </main>
  );
}

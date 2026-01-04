"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const router = useRouter();

  const handlePlay = (gamePath: string) => {
    if (name.trim()) {
      const separator = gamePath.includes("?") ? "&" : "?";
      router.push(`${gamePath}${separator}name=${encodeURIComponent(name)}`);
    }
  };

  return (
    <main className="min-h-screen bg-green-500 flex flex-col items-center p-8 relative overflow-hidden font-sans">
      {/* Jungle Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-green-400 rounded-full opacity-50 -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-green-800 rounded-full opacity-50 translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-gradient-to-br from-green-400/20 to-transparent pointer-events-none"></div>
      </div>

      {/* Header Section */}
      <div className="z-10 w-full max-w-4xl text-center mb-12 mt-8">
        <h1 className="text-5xl md:text-6xl font-extrabold text-green-900 mb-4 drop-shadow-sm tracking-tight">
          Jungle Games Assessment
        </h1>
        <p className="text-green-800 text-xl font-medium opacity-90">
          Enter your name and choose an adventure!
        </p>
      </div>

      {/* Name Input Section */}
      <div className="z-10 w-full max-w-md mb-12">
        <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2 shadow-xl border-2 border-green-200/50">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter Child's Name"
              className="w-full px-6 py-4 rounded-xl text-xl text-center font-bold text-green-900 placeholder:text-green-800/50 bg-white/60 border-2 border-transparent focus:border-yellow-400 focus:outline-none transition-all shadow-inner"
            />
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        
        {/* Card 1: Jungle Spot */}
        <div className="group bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-4 border-green-200 hover:border-yellow-400 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
            <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">
                🐆
            </div>
            <h2 className="text-3xl font-black text-green-900 mb-2">
                Jungle Spot
            </h2>
            <p className="text-green-700/80 mb-6 font-medium text-lg leading-relaxed flex-grow">
                Keep your eyes peeled! Press space whenever you see a leopard appear in the jungle.
            </p>
            <button
                onClick={() => handlePlay("/game-page/jungle-spot")}
                disabled={!name.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed text-xl font-black py-4 rounded-2xl shadow-[0_4px_0_rgb(180,83,9)] hover:shadow-[0_2px_0_rgb(180,83,9)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider"
            >
                Play Jungle Spot
            </button>
        </div>

        {/* Card 2: Rabbit's Path */}
        <div className="group bg-white/90 backdrop-blur-md rounded-3xl p-6 shadow-xl border-4 border-blue-200 hover:border-blue-400 transition-all duration-300 transform hover:-translate-y-2 flex flex-col items-center text-center">
            <div className="text-7xl mb-4 group-hover:scale-110 transition-transform duration-300">
                🐇
            </div>
            <h2 className="text-3xl font-black text-blue-900 mb-2">
                The Rabbit's Path
            </h2>
            <p className="text-blue-700/80 mb-6 font-medium text-lg leading-relaxed flex-grow">
                Watch carefully where the rabbit jumps, then show us the path it took!
            </p>
            <button
                onClick={() => handlePlay("/game-page/rabbit-path")}
                disabled={!name.trim()}
                className="w-full bg-blue-500 hover:bg-blue-400 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xl font-black py-4 rounded-2xl shadow-[0_4px_0_rgb(29,78,216)] hover:shadow-[0_2px_0_rgb(29,78,216)] active:shadow-none active:translate-y-[4px] transition-all uppercase tracking-wider"
            >
                Play Rabbit's Path
            </button>
        </div>

      </div>

      {/* Sequence Mode Action */}
      <div className="z-10 mt-12 mb-8">
           <button
             onClick={() => handlePlay("/game-page/jungle-spot?mode=sequence")}
             disabled={!name.trim()}
             className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:opacity-50 disabled:cursor-not-allowed text-2xl font-black py-4 px-12 rounded-full shadow-2xl hover:shadow-purple-500/40 active:scale-95 transition-all uppercase tracking-wider flex items-center gap-4"
           >
                <span className="text-3xl">🚀</span>
                Start Full Assessment Sequence
           </button>
           <p className="text-green-900/60 mt-2 text-center font-medium opacity-70">
                Plays Jungle Spot followed immediately by The Rabbit's Path
           </p>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-8 text-green-800/60 font-medium text-sm">
        Assessment Tool v1.0 • Designed for Kids
      </div>
    </main>
  );
}

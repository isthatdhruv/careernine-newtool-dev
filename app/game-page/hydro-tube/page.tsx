"use client";

import { useState, useEffect } from "react";

export default function HydroTube() {
  const [tileRotations, setTileRotations] = useState<Record<number, number>>({});
  const [isWon, setIsWon] = useState(false);
  
  // 🎲 FIXED: Random pattern assignment on first load
  const [patternId, setPatternId] = useState(0);

  /* ----------------------------------
     TWO PATTERNS - RANDOMLY ASSIGNED TO USERS
  ---------------------------------- */
  type Pattern = {
    id: number;
    name: string;
    tileTypes: Record<number, string>;
    solution: number[];
  };

  const patterns: Pattern[] = [
    {
      id: 0,
      name: "Pattern A",
      tileTypes: {
        1: "t-pipe", 2: "bend", 3: "bend", 4: "straight", 5: "straight", 
        6: "bend", 7: "straight", 8: "bend", 9: "bend", 10: "bend", 
        11: "straight", 12: "bend", 13: "straight", 14: "bend", 15: "straight", 16: "bend"
      },
      solution: [0, 90, 0, 0, 0, 270, 90, 90, 0, 0, 90, 180, 0, 270, 90, 90]
    },
    { 
      id: 1,
      name: "Pattern B",
      tileTypes: {
        1: "straight", 2: "bend", 3: "bend", 4: "straight", 5: "bend", 
        6: "bend", 7: "bend", 8: "t-pipe", 9: "bend", 10: "t-pipe", 
        11: "straight", 12: "bend", 13: "straight", 14: "straight", 15: "bend", 16: "straight"
      },
      solution: [90, 90, 0, 0, 0, 180, 0, 0, 270, 0, 90, 90, 0, 0, 0, 0]
    }
  ];

  const currentPattern = patterns[patternId];
  
  /* ----------------------------------
     🎲 RANDOMIZE PATTERN ON FIRST LOAD - THE KEY FIX!
  ---------------------------------- */
  useEffect(() => {
    // 50% chance Pattern A, 50% chance Pattern B
    const randomPatternId = Math.floor(Math.random() * patterns.length);
    setPatternId(randomPatternId);
    console.log(`🎲 Assigned to user: ${patterns[randomPatternId].name} (ID: ${randomPatternId})`);
  }, []);

  /* ----------------------------------
     WIN CHECK
  ---------------------------------- */
  const checkWin = (currentRotations: Record<number, number>): boolean => {
    const playerRotations = Array.from({ length: 16 }, (_, i) => 
      currentRotations[i + 1] || 0
    );
    
    console.log("Current rotation:", playerRotations);

    
    const isMatch = currentPattern.solution.every((solRot, i) => 
      solRot === playerRotations[i]
    );
    
    if (isMatch) {
      console.log(" WIN! ", currentPattern.name);
    }
    
    return isMatch;
  };

  /* ----------------------------------
     ROTATE TILE ON CLICK
  ---------------------------------- */
  const handleTileClick = (tileNumber: number) => {
    setTileRotations((prev) => {
      const currentRotation = prev[tileNumber] || 0;
      const newRotation = (currentRotation + 90) % 360;
      
      console.log(`Tile ${tileNumber} rotated to: ${newRotation}°`);
      
      const newState = {
        ...prev,
        [tileNumber]: newRotation,
      };
      
      if (checkWin(newState)) {
        setIsWon(true);
      }
      
      return newState;
    });
  };

  const resetGame = () => {
    setTileRotations({});
    setIsWon(false);
    console.log(`🔄 Reset - ${currentPattern.name} still active`);
  };

  const renderPipe = (type: string) => {
    if (type === "straight") {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <rect x="35" y="-10" width="30" height="120" fill="#60a5fa" rx="3"/>
          <rect x="37" y="-10" width="8" height="120" fill="#3b82f6" opacity="0.4"/>
          <rect x="57" y="-10" width="6" height="120" fill="#93c5fd" opacity="0.6"/>
          <rect x="48" y="-10" width="4" height="120" fill="#dbeafe" opacity="0.5"/>
          <rect x="32" y="12" width="36" height="6" fill="#3b82f6" rx="2"/>
          <rect x="32" y="47" width="36" height="6" fill="#3b82f6" rx="2"/>
          <rect x="32" y="82" width="36" height="6" fill="#3b82f6" rx="2"/>
        </svg>
      );
    } else if (type === "bend") {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <path d="M 35 110 L 35 35 Q 35 15 50 15 L 110 15 L 110 45 L 50 45 Q 65 45 65 60 L 65 110 Z" fill="#60a5fa"/>
          <path d="M 39 105 L 39 39 Q 39 22 50 22 L 100 22" stroke="#3b82f6" strokeWidth="10" fill="none" opacity="0.4"/>
          <path d="M 61 105 L 61 61 Q 61 38 70 38 L 105 38" stroke="#93c5fd" strokeWidth="8" fill="none" opacity="0.6"/>
          <path d="M 48 105 L 48 48 Q 48 28 55 28 L 100 28" stroke="#dbeafe" strokeWidth="5" fill="none" opacity="0.5"/>
          <rect x="32" y="88" width="36" height="6" fill="#3b82f6" rx="2"/>
          <rect x="88" y="12" width="6" height="36" fill="#3b82f6" rx="2"/>
        </svg>
      );
    } else if (type === "t-pipe") {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <rect x="35" y="35" width="30" height="75" fill="#60a5fa" rx="3"/>
          <rect x="-10" y="35" width="120" height="30" fill="#60a5fa" rx="3"/>
          <circle cx="50" cy="50" r="22" fill="#3b82f6"/>
          <circle cx="50" cy="50" r="18" fill="#60a5fa"/>
          <rect x="37" y="35" width="8" height="75" fill="#3b82f6" opacity="0.4"/>
          <rect x="-10" y="37" width="120" height="8" fill="#3b82f6" opacity="0.4"/>
          <rect x="57" y="35" width="6" height="75" fill="#93c5fd" opacity="0.6"/>
          <rect x="-10" y="57" width="120" height="6" fill="#93c5fd" opacity="0.6"/>
          <circle cx="46" cy="46" r="10" fill="#93c5fd" opacity="0.5"/>
          <circle cx="48" cy="48" r="6" fill="#dbeafe" opacity="0.6"/>
          <rect x="32" y="82" width="36" height="6" fill="#3b82f6" rx="2"/>
          <rect x="12" y="32" width="6" height="36" fill="#3b82f6" rx="2"/>
          <rect x="82" y="32" width="6" height="36" fill="#3b82f6" rx="2"/>
        </svg>
      );
    }
  };
                
  return (
    <div className="h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 flex items-center justify-center relative pt-40">

      {/* Decorative elements */}
      <div className="absolute top-10 left-10 text-5xl opacity-30 animate-bounce">💧</div>
      <div className="absolute bottom-20 right-20 text-5xl opacity-30 animate-pulse">💧</div>
      
      <div className="relative">
        {/* WIN OVERLAY */}
        {isWon && (
          <div className="absolute inset-0 bg-green-500/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl border-8 border-green-400 animate-pulse">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Perfect Flow Achieved!
            </h2>
            <p className="text-xl text-white/90 mb-8">{currentPattern.name} Complete!</p>
            <button
              onClick={resetGame}
              className="px-12 py-4 bg-white text-green-600 font-bold text-xl rounded-full shadow-2xl hover:scale-110 transition-all duration-200"
            >
              Play Again 💧
            </button>
          </div>
        )}

        {/* Tap SVG */}
        <div className="absolute -top-32 left-0 z-10">
          <svg viewBox="0 0 120 150" className="w-32 h-40 drop-shadow-lg">
            <rect x="25" y="5" width="70" height="22" fill="#94a3b8" stroke="#64748b" strokeWidth="3" rx="11"/>
            <circle cx="40" cy="16" r="5" fill="#cbd5e1"/>
            <circle cx="80" cy="16" r="5" fill="#cbd5e1"/>
            <ellipse cx="60" cy="50" rx="32" ry="28" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="3"/>
            <circle cx="50" cy="44" r="4" fill="#334155"/>
            <circle cx="70" cy="44" r="4" fill="#334155"/>
            <path d="M 48 56 Q 60 64 72 56" stroke="#334155" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <rect x="48" y="15" width="24" height="18" fill="#60a5fa" stroke="#3b82f6" strokeWidth="3" rx="9"/>
            <circle cx="60" cy="24" r="5" fill="#93c5fd"/>
            <ellipse cx="54" cy="42" rx="14" ry="18" fill="#ffffff" opacity="0.5"/>
            <path d="M 54 72 Q 54 82 60 92 Q 60 98 60 105" stroke="#bae6fd" strokeWidth="16" fill="none" strokeLinecap="round"/>
            <path d="M 56 72 Q 56 82 60 92 Q 60 98 60 105" stroke="#e0f2fe" strokeWidth="12" fill="none" strokeLinecap="round"/>
            <ellipse cx="60" cy="105" rx="10" ry="6" fill="#bae6fd" stroke="#93c5fd" strokeWidth="2"/>
            <circle cx="60" cy="115" r="5" fill="#60a5fa" opacity="0.8">
              <animate attributeName="cy" values="115;125;135;145" dur="1.2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.8;0.6;0.4;0.2" dur="1.2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="60" cy="105" r="4" fill="#93c5fd" opacity="0.7">
              <animate attributeName="cy" values="105;115;125;135" dur="1.2s" begin="0.3s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0.5;0.3;0.1" dur="1.2s" begin="0.3s" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>

        {/* PIPE GRID */}
        <div style={{
          display: 'inline-grid', gridTemplateColumns: 'repeat(4, 110px)', gridTemplateRows: 'repeat(4, 110px)',
          gap: '3px', padding: '20px', 
          background: isWon ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          borderRadius: '16px', boxShadow: isWon ? '0 10px 40px rgba(16,185,129,0.4)' : '0 10px 40px rgba(0,0,0,0.15)',
          border: isWon ? '6px solid #059669' : '6px solid #334155', transition: 'all 0.5s ease'
        }}>
          {Array.from({ length: 16 }).map((_, index) => {
            const tileNumber = index + 1;
            const rotation = tileRotations[tileNumber] || 0;
            const pipeType = currentPattern.tileTypes[tileNumber];

            return (
              <div
                key={tileNumber}
                onClick={() => handleTileClick(tileNumber)}
                style={{
                  width: '110px', height: '110px', background: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
                  cursor: isWon ? 'default' : 'pointer', transform: `rotate(${rotation}deg)`,
                  transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  boxShadow: isWon ? 'inset 0 2px 6px rgba(16,185,129,0.3), 0 0 20px rgba(16,185,129,0.5)' : 'inset 0 2px 6px rgba(0,0,0,0.08)',
                  border: isWon ? '3px solid #10b981' : '1px solid #e2e8f0',
                }}
                onMouseEnter={(e) => !isWon && (e.currentTarget.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #e2e8f0 100%)', e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.12), 0 0 12px rgba(96,165,250,0.3)')}
                onMouseLeave={(e) => !isWon && (e.currentTarget.style.background = 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)', e.currentTarget.style.boxShadow = 'inset 0 2px 6px rgba(0,0,0,0.08)')}
                title={`Tile ${tileNumber}: ${rotation}° (${pipeType})`}
              >
                {renderPipe(pipeType)}
              </div>
            );
          })}
        </div>

        {/* Bucket */}
        <div className="mt-4 flex justify-end">
          <svg viewBox="0 0 150 160" className={`w-36 h-40 drop-shadow-lg ${isWon ? 'animate-bounce' : ''}`}>
            <path d="M 32 28 Q 75 6 118 28" stroke="#94a3b8" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <circle cx="32" cy="28" r="6" fill="#64748b" stroke="#475569" strokeWidth="2"/>
            <circle cx="118" cy="28" r="6" fill="#64748b" stroke="#475569" strokeWidth="2"/>
            <path d="M 22 35 L 12 125 Q 12 142 28 148 L 122 148 Q 138 142 138 125 L 128 35 Z" fill="#f87171" stroke="#ef4444" strokeWidth="3"/>
            <ellipse cx="75" cy="35" rx="56" ry="14" fill="#fca5a5" stroke="#f87171" strokeWidth="2"/>
            <ellipse cx="75" cy="35" rx="50" ry="11" fill="#fecaca"/>
            <ellipse cx="42" cy="75" rx="18" ry="40" fill="#fee2e2" opacity="0.7"/>
            <circle cx="65" cy="70" r="4" fill="#7f1d1d"/>
            <circle cx="85" cy="70" r="4" fill="#7f1d1d"/>
            <path d="M 62 84 Q 75 92 88 84" stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M 28 105 L 20 130 Q 20 138 32 142 L 118 142 Q 130 138 130 130 L 122 105 Z" fill="#60a5fa" opacity="0.9"/>
            <ellipse cx="75" cy="115" rx="38" ry="10" fill="#93c5fd" opacity="0.9"/>
            <ellipse cx="75" cy="122" rx="32" ry="6" fill="#bfdbfe" opacity="0.7">
              <animate attributeName="rx" values="32;36;32" dur="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.7;0.4;0.7" dur="1.5s" repeatCount="indefinite"/>
            </ellipse>
          </svg>
        </div>
      </div>
    </div>
  );
}

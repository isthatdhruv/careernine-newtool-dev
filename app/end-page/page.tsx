"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function EndContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const completedCount = parseInt(searchParams.get("completed") || "0");
  
  const [showConfetti, setShowConfetti] = useState(completedCount > 0);

  useEffect(() => {
    if (completedCount > 0) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [completedCount]);

  // Logic for different ending states
  const getContent = () => {
    if (completedCount >= 2) {
      return {
        title: "Game Complete!",
        subtitle: "🎉 You've mastered the flow! 🎉",
        desc: "Your puzzle-solving skills brought perfect harmony to the water flow.",
        footer: "✨ Perfect execution brings perfect flow ✨",
        confettiAmount: 50,
        dropOpacity: "opacity-20"
      };
    } else if (completedCount === 1) {
      return {
        title: "Nice Work!",
        subtitle: "💧 1/2 Puzzles Completed 💧",
        desc: "You're getting there! You've successfully restored part of the system.",
        footer: "Keep practicing to become a Flow Master",
        confettiAmount: 20,
        dropOpacity: "opacity-10"
      };
    } else {
      return {
        title: "Better Luck Next Time",
        subtitle: "⌛ Time Ran Out ⌛",
        desc: "The pipes are still a bit tangled, but don't give up yet!",
        footer: "Every drop counts. Try again!",
        confettiAmount: 0,
        dropOpacity: "opacity-5"
      };
    }
  };

  const content = getContent();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center relative overflow-hidden">
      <style jsx>{`
        @keyframes fall { to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes confettiFall { to { transform: translateY(110vh) rotate(720deg); opacity: 0; } }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
        .shimmer { background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent); background-size: 1000px 100%; animation: shimmer 3s infinite; }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .water-drop { animation: fall 5s linear infinite; }
        .confetti-piece { animation: confettiFall 3s ease-out infinite; }
      `}</style>

      {/* Background drops - intensity based on success */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(completedCount >= 2 ? 20 : 10)].map((_, i) => (
          <div
            key={i}
            className={`water-drop absolute text-4xl ${content.dropOpacity}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              animationDuration: `${5 + Math.random() * 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            💧
          </div>
        ))}
      </div>

      {showConfetti && content.confettiAmount > 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(content.confettiAmount)].map((_, i) => (
            <div
              key={i}
              className="confetti-piece absolute w-3 h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-5%`,
                backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'][Math.floor(Math.random() * 5)],
                animationDuration: `${3 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 text-center px-8 max-w-4xl">
        <div className="mb-8 flex justify-center">
          <svg viewBox="0 0 200 240" className={`w-48 h-56 drop-shadow-2xl ${completedCount > 0 ? 'float-animation' : ''}`}>
            <ellipse cx="100" cy="220" rx="60" ry="12" fill="#94a3b8" opacity="0.4" />
            <rect x="85" y="180" width="30" height="40" fill={completedCount >= 2 ? "#fbbf24" : "#cbd5e1"} stroke={completedCount >= 2 ? "#f59e0b" : "#94a3b8"} strokeWidth="3" rx="4" />
            <rect x="70" y="200" width="60" height="20" fill={completedCount >= 2 ? "#fbbf24" : "#cbd5e1"} stroke={completedCount >= 2 ? "#f59e0b" : "#94a3b8"} strokeWidth="3" rx="6" />
            
            <path
              d="M 40 80 L 50 160 Q 50 175 70 180 L 130 180 Q 150 175 150 160 L 160 80 Z"
              fill={completedCount >= 2 ? "url(#goldGradient)" : "#e2e8f0"}
              stroke={completedCount >= 2 ? "#f59e0b" : "#94a3b8"}
              strokeWidth="4"
            />
            <ellipse cx="100" cy="80" rx="62" ry="18" fill={completedCount >= 2 ? "#fcd34d" : "#f1f5f9"} stroke={completedCount >= 2 ? "#f59e0b" : "#94a3b8"} strokeWidth="3" />
            
            {/* Water only shows if at least one completed */}
            {completedCount > 0 && (
               <path d="M 58 110 L 52 155 Q 52 168 68 172 L 132 172 Q 148 168 148 155 L 142 110 Z" fill="#60a5fa" opacity="0.8" />
            )}
            
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 bg-clip-text text-transparent drop-shadow-lg">
          {content.title}
        </h1>

        <div className="relative inline-block mb-8">
          {completedCount >= 2 && <div className="shimmer absolute inset-0 rounded-2xl"></div>}
          <p className="relative text-2xl md:text-3xl font-semibold text-slate-700 bg-white/80 backdrop-blur-sm px-8 py-4 rounded-2xl shadow-lg border-2 border-cyan-200">
            {content.subtitle}
          </p>
        </div>

        <p className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          {content.desc}
        </p>

        <div className="mt-16 text-slate-500 text-sm">
          <p className="mb-2">{content.footer}</p>
          <p className="opacity-75">Made with 💙 for puzzle lovers</p>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function EndPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <EndContent />
    </Suspense>
  );
}
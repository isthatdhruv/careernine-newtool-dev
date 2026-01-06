"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RabbitRiverGame, { StonePos, RoundResult, shuffle } from "@/components/puzzles/RabbitRiverGame";

// Logic for Grade 4 (Placeholder)
// Currently behaves similar to Grade 3 but starts at Length 4.
const generateClass4Sequence = (
    stones: StonePos[], 
    roundIndex: number, 
    history: RoundResult[]
): number[] => {
    // TODO: Implement specific Class 4 Logic
    const length = 4;        
    const validIds = stones.filter(s => s.id !== 0 && s.id !== 11).map(s => s.id);
    return shuffle(validIds).slice(0, length).sort((a,b) => a - b);
};

function GameWrapper() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name") || "Explorer";

    return (
        <RabbitRiverGame 
            studentName={name}
            className="Class 4"
            totalRounds={12}
            sequenceGenerator={generateClass4Sequence}
        />
    );
}

export default function Grade4Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>}>
            <GameWrapper />
        </Suspense>
    );
}

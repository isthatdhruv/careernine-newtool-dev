"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import RabbitRiverGame, { StonePos, RoundResult, shuffle } from "@/components/puzzles/RabbitRiverGame";

// Logic for Grade 3
// 1. Trials: Random, Length 3.
// 2. Rounds 0-2 (Set 1): Length 3.
// 3. Rounds 3-5 (Set 2): If Set 1 (0-2) all correct -> Length 4, Else Length 3.
// 4. Rounds 6-8 (Set 3): If Set 2 (3-5) all correct AND Set 2 was Length 4 -> Length 5, Else Keep.
// 5. Rounds 9-11 (Set 4): Max Length 5.

const generateClass3Sequence = (
    stones: StonePos[], 
    roundIndex: number, 
    history: RoundResult[]
): number[] => {
    
    // Determine Target Length
    let length = 3;

    // Check Set 1 (Rounds 0, 1, 2) Performance
    const set1Passed = history.filter(h => h.round >= 0 && h.round <= 2 && h.correct).length === 3;
    
    if (roundIndex >= 3) {
        if (set1Passed) {
             length = 4;
        }
    }

    // Check Set 2 (Rounds 3, 4, 5) Performance
    // To advance to 5, must have passed Set 2 AND Set 2 must have been played at Length 4
    // (If they failed Set 1, they played Set 2 at Length 3, so even if they ace it, maybe we only upgrade to 4? 
    // The requirement says: "if students also corrects all 3 rounds with 4 length, it will be upgraded to 5")
    
    // So: 
    // If currently at Length 4 (due to Set 1 Pass) AND Set 2 Passed -> Length 5.
    // If currently at Length 3 (due to Set 1 Fail) AND Set 2 Passed -> Length 4? (User didn't specify recovery, but safe assumption).
    // Let's stick strictly to "If Set 1 Correct -> Length 4", "If Set 2 (at Length 4) Correct -> Length 5".
    
    if (roundIndex >= 6) {
         const set2Passed = history.filter(h => h.round >= 3 && h.round <= 5 && h.correct).length === 3;
         // Did we play Set 2 at Length 4? That implies Set 1 was passed.
         if (set1Passed && set2Passed) {
             length = 5;
         } else if (set1Passed && !set2Passed) {
             length = 4; // Stay at 4
         } else if (!set1Passed && set2Passed) {
             length = 4; // Promotion from 3 to 4? Assuming yes.
         } else {
             length = 3;
         }
    }
    
    // Rounds 9+ (Set 4) - continue with same logic (Max 5)
    if (roundIndex >= 9) {
         const set3Passed = history.filter(h => h.round >= 6 && h.round <= 8 && h.correct).length === 3;
         // If we were at 5, stay at 5.
         if (length === 5) {
             // Stay 5
         } else if (length === 4 && set3Passed) {
             length = 5;
         }
    }

    // GENERATE SEQUENCE WITH NO CONSECUTIVES
    // Constraint: No |a - b| == 1 for any sorted neighbors? 
    // Or just no immediate neighbors in the random pick?
    // "no consecutives" likely means IDs 1,2 is invalid. IDs 1,3 is valid.
    
    const validIds = stones.filter(s => s.id !== 0 && s.id !== 11).map(s => s.id); // [1..10]
    
    // We need to pick 'length' IDs such that no two IDs satisfy abs(a-b) == 1.
    // Simple rejection sampling (infinite loop protection)
    let candidates: number[] = [];
    let attempts = 0;
    while(attempts < 500) {
        const potential = shuffle(validIds).slice(0, length).sort((a,b) => a - b);
        
        // Check consecutives
        let hasConsecutive = false;
        for (let i = 0; i < potential.length - 1; i++) {
            if (potential[i+1] === potential[i] + 1) {
                hasConsecutive = true;
                break;
            }
        }
        
        if (!hasConsecutive) {
            candidates = potential;
            break;
        }
        attempts++;
    }
    
    // Fallback if strict generation fails (unlikely for len <= 5 with 10 items)
    if (candidates.length === 0) {
        candidates = shuffle(validIds).slice(0, length).sort((a,b) => a - b);
    }
    
    return candidates;
};

function GameWrapper() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name") || "Explorer";

    return (
        <RabbitRiverGame 
            studentName={name}
            className="Class 3"
            totalRounds={12}
            sequenceGenerator={generateClass3Sequence}
        />
    );
}

export default function Grade3Page() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>}>
            <GameWrapper />
        </Suspense>
    );
}

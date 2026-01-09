"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as XLSX from "xlsx";

// Updated interface to match new data structure from DataContext
interface GameResult {
  id: string;
  name: string;
  className?: string;
  timestamp: string;
  
  // New animal_reaction structure
  animal_reaction?: {
    totalTrials: number;
    trialMs: number;
    target: string;
    targetsShown: number;
    hits: number;
    misses: number;
    falsePositives: number;
    hitRTsMs: number[];
    timestamp: string;
  };
  
  // Rabbit path data
  rabbit_path?: {
    score: number;
    totalRounds: number;
    roundsPlayed: number;
    timestamp: string;
    history?: any[];
  };
  
  // Legacy fields for backward compatibility
  jungle_spot?: {
    score: number;
    leopardsShown: number;
    leopardsClicked: number;
    falseAlarms: number;
    timestamp: string;
  };
  score?: number;
  leopardsShown?: number;
  leopardsClicked?: number;
  falseAlarms?: number;
}

// Helper to calculate mean
function mean(nums: number[]): number {
  if (!nums || nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export default function AdminDashboard() {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "game_results"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        const data: GameResult[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() } as GameResult);
        });
        setResults(data);
        console.log("Fetched data:", data);
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to extract animal reaction data (new or legacy)
  const getAnimalReactionData = (r: GameResult) => {
    if (r.animal_reaction) {
      return {
        hasData: true,
        hits: r.animal_reaction.hits,
        misses: r.animal_reaction.misses,
        falsePositives: r.animal_reaction.falsePositives,
        targetsShown: r.animal_reaction.targetsShown,
        totalTrials: r.animal_reaction.totalTrials,
        trialMs: r.animal_reaction.trialMs,
        target: r.animal_reaction.target,
        hitRTsMs: r.animal_reaction.hitRTsMs || [],
        timestamp: r.animal_reaction.timestamp,
      };
    }
    // Legacy fallback
    if (r.jungle_spot || r.leopardsClicked !== undefined) {
      return {
        hasData: true,
        hits: r.jungle_spot?.leopardsClicked ?? r.leopardsClicked ?? 0,
        misses: 0,
        falsePositives: r.jungle_spot?.falseAlarms ?? r.falseAlarms ?? 0,
        targetsShown: r.jungle_spot?.leopardsShown ?? r.leopardsShown ?? 10,
        totalTrials: 0,
        trialMs: 0,
        target: "leopard",
        hitRTsMs: [],
        timestamp: r.jungle_spot?.timestamp ?? r.timestamp,
      };
    }
    return { hasData: false } as any;
  };

  const downloadReport = (r: GameResult) => {
    const animal = getAnimalReactionData(r);
    const rabbit = r.rabbit_path;

    const flattenedData = [{
      "Student Name": r.name || "nil",
      "Class": r.className || "nil",
      
      // Animal Reaction Data
      "Jungle: Target Animal": animal.hasData ? animal.target : "nil",
      "Jungle: Targets Shown": animal.hasData ? animal.targetsShown : "nil",
      "Jungle: Hits": animal.hasData ? animal.hits : "nil",
      "Jungle: Misses": animal.hasData ? animal.misses : "nil",
      "Jungle: False Positives": animal.hasData ? animal.falsePositives : "nil",
      "Jungle: Total Trials": animal.hasData ? animal.totalTrials : "nil",
      "Jungle: Trial Duration (ms)": animal.hasData ? animal.trialMs : "nil",
      "Jungle: Mean RT (ms)": animal.hasData && animal.hitRTsMs?.length > 0 
        ? mean(animal.hitRTsMs).toFixed(2) 
        : "nil",
      "Jungle: All RTs (ms)": animal.hasData && animal.hitRTsMs?.length > 0 
        ? animal.hitRTsMs.join(", ") 
        : "nil",
      "Jungle: Date Played": animal.hasData && animal.timestamp 
        ? new Date(animal.timestamp).toLocaleString() 
        : "nil",
      
      // Rabbit Path Data
      "Rabbit: Score": rabbit ? rabbit.score : "nil",
      "Rabbit: Total Rounds": rabbit ? rabbit.totalRounds : "nil",
      "Rabbit: Rounds Played": rabbit ? rabbit.roundsPlayed : "nil",
      "Rabbit: Date Played": rabbit?.timestamp 
        ? new Date(rabbit.timestamp).toLocaleString() 
        : "nil",
      
      "Last Updated": r.timestamp ? new Date(r.timestamp).toLocaleString() : "nil"
    }];

    const ws = XLSX.utils.json_to_sheet(flattenedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${r.name || "student"}_report.xlsx`);
  };

  const downloadAllReports = () => {
    const flattenedData = results.map(r => {
      const animal = getAnimalReactionData(r);
      const rabbit = r.rabbit_path;

      return {
        "Student Name": r.name || "nil",
        "Class": r.className || "nil",
        
        // Animal Reaction Data
        "Jungle: Target Animal": animal.hasData ? animal.target : "nil",
        "Jungle: Targets Shown": animal.hasData ? animal.targetsShown : "nil",
        "Jungle: Hits": animal.hasData ? animal.hits : "nil",
        "Jungle: Misses": animal.hasData ? animal.misses : "nil",
        "Jungle: False Positives": animal.hasData ? animal.falsePositives : "nil",
        "Jungle: Total Trials": animal.hasData ? animal.totalTrials : "nil",
        "Jungle: Trial Duration (ms)": animal.hasData ? animal.trialMs : "nil",
        "Jungle: Mean RT (ms)": animal.hasData && animal.hitRTsMs?.length > 0 
          ? mean(animal.hitRTsMs).toFixed(2) 
          : "nil",
        "Jungle: Date Played": animal.hasData && animal.timestamp 
          ? new Date(animal.timestamp).toLocaleString() 
          : "nil",
        
        // Rabbit Path Data
        "Rabbit: Score": rabbit ? rabbit.score : "nil",
        "Rabbit: Total Rounds": rabbit ? rabbit.totalRounds : "nil",
        "Rabbit: Rounds Played": rabbit ? rabbit.roundsPlayed : "nil",
        "Rabbit: Date Played": rabbit?.timestamp 
          ? new Date(rabbit.timestamp).toLocaleString() 
          : "nil",
        
        "Last Updated": r.timestamp ? new Date(r.timestamp).toLocaleString() : "nil"
      };
    });

    const ws = XLSX.utils.json_to_sheet(flattenedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AllResults");
    XLSX.writeFile(wb, "all_students_report.xlsx");
  };

  if (loading) return <div className="p-8 text-center text-xl">Loading data...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <button
            onClick={downloadAllReports}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
          >
            Download All Reports (XLSX)
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jungle (Hits / Targets)
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jungle Mean RT
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Rabbit Score
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => {
                const animal = getAnimalReactionData(result);
                const rabbit = result.rabbit_path;
                
                return (
                  <tr key={result.id}>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap font-medium">{result.name}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-600">{result.className || "-"}</p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {animal.hasData ? (
                        <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                          <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                          <span className="relative">
                            {animal.hits} / {animal.targetsShown}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not Played</span>
                      )}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {animal.hasData && animal.hitRTsMs?.length > 0 ? (
                        <span className="text-gray-700">
                          {mean(animal.hitRTsMs).toFixed(0)} ms
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      {rabbit ? (
                        <span className="relative inline-block px-3 py-1 font-semibold text-blue-900 leading-tight">
                          <span aria-hidden className="absolute inset-0 bg-blue-200 opacity-50 rounded-full"></span>
                          <span className="relative">
                            {rabbit.score} / {rabbit.totalRounds}
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Not Played</span>
                      )}
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <p className="text-gray-900 whitespace-no-wrap">
                        {new Date(result.timestamp).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                      <button
                        onClick={() => downloadReport(result)}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        Download XLSX
                      </button>
                    </td>
                  </tr>
                );
              })}
              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-5 text-center text-gray-500">
                    No results found yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

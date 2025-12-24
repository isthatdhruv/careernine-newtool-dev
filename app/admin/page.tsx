"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import * as XLSX from "xlsx";

interface GameResult {
  id: string;
  name: string;
  score: number;
  leopardsShown: number;
  leopardsClicked: number;
  falseAlarms: number;
  timestamp: string;
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
      } catch (error) {
        console.error("Error fetching data: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const downloadReport = (result: GameResult) => {
    const ws = XLSX.utils.json_to_sheet([result]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, `${result.name}_report.xlsx`);
  };

  const downloadAllReports = () => {
    const ws = XLSX.utils.json_to_sheet(results);
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
                  Score
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Leopards Found
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  False Alarms
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap font-medium">{result.name}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
                      <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
                      <span className="relative">{result.score}</span>
                    </span>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {result.leopardsClicked} / 10
                    </p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap text-red-600 font-bold">{result.falseAlarms}</p>
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <p className="text-gray-900 whitespace-no-wrap">
                      {new Date(result.timestamp).toLocaleString()}
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
              ))}
              {results.length === 0 && (
                <tr>
                   <td colSpan={6} className="px-5 py-5 text-center text-gray-500">
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

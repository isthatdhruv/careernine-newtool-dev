"use client";

import { useSearchParams } from "next/navigation";
import { useGameData } from "@/app/config/DataContext";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function HydroTube() {
  const searchParams = useSearchParams();
  const { setStudentInfo } = useGameData();

  const userName = searchParams.get("name") || "Explorer";
  const userClass = searchParams.get("class") || "";

  const [tileRotations, setTileRotations] = useState<Record<number, number>>({});

  useEffect(() => {
    setStudentInfo(userName, userClass ? `Class ${userClass}` : "");
  }, [userName, userClass, setStudentInfo]);

  /* ----------------------------------
     TILE → PIPE IMAGE MAPPING
  ---------------------------------- */
  const tileImages: Record<number, string> = {
    1: "/assets/hydro-tube/straight-pipe.png",
    2: "/assets/hydro-tube/bend-pipe.png",
    3: "/assets/hydro-tube/t-pipe.png",
    4: "/assets/hydro-tube/straight-pipe.png",

    5: "/assets/hydro-tube/bend-pipe.png",
    6: "/assets/hydro-tube/straight-pipe.png",
    7: "/assets/hydro-tube/t-pipe.png",
    8: "/assets/hydro-tube/bend-pipe.png",

    9: "/assets/hydro-tube/straight-pipe.png",
    10: "/assets/hydro-tube/t-pipe.png",
    11: "/assets/hydro-tube/bend-pipe.png",
    12: "/assets/hydro-tube/straight-pipe.png",

    13: "/assets/hydro-tube/bend-pipe.png",
    14: "/assets/hydro-tube/straight-pipe.png",
    15: "/assets/hydro-tube/t-pipe.png",
    16: "/assets/hydro-tube/straight-pipe.png",
  };

  /* ----------------------------------
     ROTATE TILE ON CLICK
  ---------------------------------- */
  const handleTileClick = (tileNumber: number) => {
    setTileRotations((prev) => {
      const currentRotation = prev[tileNumber] || 0;
      const newRotation = (currentRotation + 90) % 360;

      console.log(`Tile ${tileNumber} rotated → ${newRotation}°`);

      return {
        ...prev,
        [tileNumber]: newRotation,
      };
    });
  };

  return (
    <div className="min-h-screen w-screen bg-slate-900 flex items-center justify-center">
      <div>
        {/* 4x4 PIPE GRID */}
        <div className="grid grid-cols-4">
          {Array.from({ length: 16 }).map((_, index) => {
            const tileNumber = index + 1;
            const rotation = tileRotations[tileNumber] || 0;

            return (
              <div
                key={tileNumber}
                onClick={() => handleTileClick(tileNumber)}
                className="
                  w-36 h-36
                  border border-slate-800
                  bg-sky-50
                  flex items-center justify-center
                  cursor-pointer select-none
                  hover:bg-sky-100
                  transition-transform duration-300
                "
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <Image
                  src={tileImages[tileNumber]}
                  alt={`Pipe ${tileNumber}`}
                  width={100}
                  height={100}
                  className="pointer-events-none"
                  priority
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useGameData } from "@/app/config/DataContext";
import { useEffect, Suspense } from "react";

function HydroTubeContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { setStudentInfo } = useGameData();

    const userName = searchParams.get("name") || "Explorer";
    const userClass = searchParams.get("class") || "";

    // Set student info from URL params
    useEffect(() => {
        setStudentInfo(userName, userClass ? `Class ${userClass}` : "");
    }, [userName, userClass, setStudentInfo]);

    return (
        <div>
            <h1>Hydro Tube</h1>
        </div>
    );
}

export default function HydroTube() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <HydroTubeContent />
        </Suspense>
    );
}

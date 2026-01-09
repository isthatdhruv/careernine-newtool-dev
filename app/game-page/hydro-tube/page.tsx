"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useGameData } from "@/app/config/DataContext";
import { useEffect } from "react";

export default function HydroTube() {
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

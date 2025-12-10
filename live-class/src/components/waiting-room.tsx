"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, Users, Video, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WaitingRoomProps {
    sessionId: string;
    sessionTitle: string;
    courseTitle: string;
    instructorName: string;
    startTime: Date;
    roomId: string | null;
}

export function WaitingRoom({
    sessionId,
    sessionTitle,
    courseTitle,
    instructorName,
    startTime,
    roomId,
}: WaitingRoomProps) {
    const router = useRouter();
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const target = new Date(startTime).getTime();
            const diff = target - now;

            if (diff <= 0) {
                setTimeLeft(null);
                checkIfLive();
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft({ days, hours, minutes, seconds });
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const checkIfLive = async () => {
        setChecking(true);
        try {
            const res = await fetch(`/api/sessions/${sessionId}/status`);
            const data = await res.json();
            if (data.status === "LIVE" && data.roomId) {
                setIsLive(true);
                router.push(`/classroom/${data.roomId}`);
            }
        } catch (error) {
            console.error("Failed to check status:", error);
        }
        setChecking(false);
    };

    useEffect(() => {
        if (!timeLeft) {
            const pollInterval = setInterval(checkIfLive, 5000);
            return () => clearInterval(pollInterval);
        }
    }, [timeLeft]);

    return (
        <div className="min-h-screen hero-gradient flex items-center justify-center p-6">
            {/* Background effects */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="max-w-2xl w-full">
                <Link href="/dashboard/student" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="glass-card rounded-3xl p-8 text-center">
                    {/* Session Info */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 text-purple-400 mb-4">
                            <Video className="w-4 h-4" />
                            <span className="text-sm">Waiting Room</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">{sessionTitle}</h1>
                        <p className="text-gray-400">{courseTitle}</p>
                        <p className="text-sm text-gray-500 mt-2">by {instructorName}</p>
                    </div>

                    {/* Countdown */}
                    {timeLeft ? (
                        <div className="mb-8">
                            <p className="text-gray-400 mb-4">Class starts in</p>
                            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
                                {[
                                    { value: timeLeft.days, label: "Days" },
                                    { value: timeLeft.hours, label: "Hours" },
                                    { value: timeLeft.minutes, label: "Minutes" },
                                    { value: timeLeft.seconds, label: "Seconds" },
                                ].map((item) => (
                                    <div key={item.label} className="glass rounded-xl p-4">
                                        <div className="text-3xl font-bold gradient-text">
                                            {String(item.value).padStart(2, "0")}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-yellow-500/20 text-yellow-400 mb-4">
                                <Clock className="w-5 h-5 animate-pulse" />
                                <span>Waiting for instructor to start...</span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                You'll be redirected automatically when the class begins
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {isLive && roomId ? (
                            <Link href={`/classroom/${roomId}`}>
                                <Button className="w-full py-6 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 animate-pulse-glow">
                                    <Video className="w-5 h-5 mr-2" />
                                    Join Live Class
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                onClick={checkIfLive}
                                disabled={checking}
                                className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                            >
                                {checking ? "Checking..." : "Check if Live"}
                            </Button>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <h3 className="text-sm font-medium text-gray-400 mb-4">While you wait</h3>
                        <div className="grid grid-cols-2 gap-4 text-left">
                            <div className="glass rounded-lg p-4">
                                <div className="text-2xl mb-2">🎧</div>
                                <p className="text-sm text-gray-400">Test your audio and microphone</p>
                            </div>
                            <div className="glass rounded-lg p-4">
                                <div className="text-2xl mb-2">📹</div>
                                <p className="text-sm text-gray-400">Check your camera positioning</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

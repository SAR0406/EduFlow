"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { startLiveSession, endLiveSession } from "@/app/actions/sessionActions";
import { Play, Square, Video } from "lucide-react";

interface SessionActionsProps {
    session: {
        id: string;
        status: string;
        roomId: string | null;
    };
}

export function SessionActions({ session }: SessionActionsProps) {
    const router = useRouter();

    const handleStart = async () => {
        const result = await startLiveSession(session.id);
        if (result.success && result.roomId) {
            router.push(`/classroom/${result.roomId}`);
        } else {
            alert(result.error || "Failed to start session");
        }
    };

    const handleEnd = async () => {
        await endLiveSession(session.id);
        router.refresh();
    };

    const handleJoin = () => {
        if (session.roomId) {
            router.push(`/classroom/${session.roomId}`);
        }
    };

    if (session.status === "COMPLETED") {
        return (
            <span className="text-sm text-muted-foreground">Completed</span>
        );
    }

    if (session.status === "LIVE") {
        return (
            <div className="flex gap-2">
                <Button size="sm" onClick={handleJoin} className="gap-2">
                    <Video className="h-4 w-4" />
                    Join
                </Button>
                <Button size="sm" variant="destructive" onClick={handleEnd} className="gap-2">
                    <Square className="h-4 w-4" />
                    End
                </Button>
            </div>
        );
    }

    return (
        <Button size="sm" onClick={handleStart} className="gap-2 bg-green-600 hover:bg-green-700">
            <Play className="h-4 w-4" />
            Start Live
        </Button>
    );
}

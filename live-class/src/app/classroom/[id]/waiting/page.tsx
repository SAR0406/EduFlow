import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WaitingRoom } from "@/components/waiting-room";

export default async function WaitingRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: roomId } = await params;
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    // Find session by roomId
    const session = await prisma.classSession.findFirst({
        where: { roomId },
        include: {
            instructor: { select: { name: true } },
            course: { select: { title: true } },
        },
    });

    if (!session) {
        notFound();
    }

    // If already live, redirect to classroom
    if (session.status === "LIVE") {
        redirect(`/classroom/${roomId}`);
    }

    // If completed, show message
    if (session.status === "COMPLETED") {
        return (
            <div className="min-h-screen hero-gradient flex items-center justify-center p-6">
                <div className="glass-card rounded-3xl p-8 text-center max-w-md">
                    <div className="text-4xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Session Completed</h1>
                    <p className="text-gray-400">This class has already ended.</p>
                </div>
            </div>
        );
    }

    return (
        <WaitingRoom
            sessionId={session.id}
            sessionTitle={session.title}
            courseTitle={session.course?.title || "Independent Session"}
            instructorName={session.instructor.name || "Instructor"}
            startTime={session.startTime}
            roomId={session.roomId}
        />
    );
}

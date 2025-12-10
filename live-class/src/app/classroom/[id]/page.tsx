import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClassroomRoom } from "@/components/classroom-room";
import { prisma } from "@/lib/prisma";

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect("/");

    // Check if user is the instructor for this session
    const session = await prisma.classSession.findFirst({
        where: { roomId: id },
        select: { instructorId: true },
    });

    const isInstructor = session?.instructorId === user.id;

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            <header className="border-b bg-white p-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <h1 className="text-xl font-bold text-gray-900">Live Classroom</h1>
                    {isInstructor && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                            Instructor
                        </span>
                    )}
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <ClassroomRoom
                    roomId={id}
                    userId={user.id}
                    userName={user.fullName || user.firstName || "User"}
                    isInstructor={isInstructor}
                />
            </div>
        </div>
    );
}

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function startLiveSession(sessionId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const session = await prisma.classSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return { success: false, error: "Session not found" };
        }

        if (session.instructorId !== user.id) {
            return { success: false, error: "Not authorized" };
        }

        // Generate roomId if not exists
        const roomId = session.roomId || `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await prisma.classSession.update({
            where: { id: sessionId },
            data: {
                status: "LIVE",
                roomId,
            },
        });

        revalidatePath("/dashboard/instructor");
        return { success: true, roomId };
    } catch (error) {
        console.error("[START_SESSION]", error);
        return { success: false, error: "Failed to start session" };
    }
}

export async function endLiveSession(sessionId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const session = await prisma.classSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return { success: false, error: "Session not found" };
        }

        if (session.instructorId !== user.id) {
            return { success: false, error: "Not authorized" };
        }

        await prisma.classSession.update({
            where: { id: sessionId },
            data: {
                status: "COMPLETED",
                endTime: new Date(),
            },
        });

        revalidatePath("/dashboard/instructor");
        return { success: true };
    } catch (error) {
        console.error("[END_SESSION]", error);
        return { success: false, error: "Failed to end session" };
    }
}

export async function getSessionStatus(sessionId: string) {
    try {
        const session = await prisma.classSession.findUnique({
            where: { id: sessionId },
            select: {
                status: true,
                roomId: true,
                startTime: true,
            },
        });

        return session;
    } catch (error) {
        console.error("[GET_SESSION_STATUS]", error);
        return null;
    }
}

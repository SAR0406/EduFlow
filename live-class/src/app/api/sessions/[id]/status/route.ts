import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const session = await prisma.classSession.findUnique({
            where: { id },
            select: {
                status: true,
                roomId: true,
            },
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json(session);
    } catch (error) {
        console.error("[SESSION_STATUS]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

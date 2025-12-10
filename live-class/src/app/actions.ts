"use server";

import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createClass(formData: FormData) {
    const user = await currentUser();
    if (!user) throw new Error("Unauthorized");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTime = new Date(formData.get("startTime") as string);

    await prisma.classSession.create({
        data: {
            title,
            description,
            startTime,
            instructorId: user.id,
        },
    });

    revalidatePath("/dashboard/instructor");
    redirect("/dashboard/instructor");
}

export async function joinClass(classId: string) {
    const user = await currentUser();
    if (!user) return { message: "Unauthorized", success: false };

    try {
        await prisma.enrollment.create({
            data: {
                userId: user.id,
                classId: classId
            }
        });
        revalidatePath('/dashboard/student');
        return { message: "Joined class successfully", success: true };
    } catch (error) {
        console.error("Failed to join class:", error);
        return { message: "Failed to join class. You might already be enrolled.", success: false };
    }
}

export async function deleteClass(classId: string) {
    const user = await currentUser();
    // In a real app, check role: if (!user || user.publicMetadata.role !== 'INSTRUCTOR')
    if (!user) return { message: "Unauthorized", success: false };

    try {
        // Verify ownership
        const cls = await prisma.classSession.findUnique({
            where: { id: classId },
        });

        if (!cls || cls.instructorId !== user.id) {
            return { message: "Unauthorized or Class not found", success: false };
        }

        await prisma.enrollment.deleteMany({
            where: { classId: classId }
        });

        await prisma.classSession.delete({
            where: { id: classId }
        });

        revalidatePath('/dashboard/instructor');
        return { message: "Class deleted", success: true };
    } catch (error) {
        console.error("Failed to delete class:", error);
        return { message: "Failed to delete class", success: false };
    }
}

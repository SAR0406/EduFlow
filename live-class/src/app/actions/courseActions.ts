"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createCourse(formData: FormData) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr) || 0;
    const status = formData.get("status") as string || "DRAFT";

    if (!title) {
        return { success: false, error: "Title is required" };
    }

    try {
        const course = await prisma.course.create({
            data: {
                title,
                description,
                category: category || "General",
                price,
                status,
                instructorId: user.id,
            },
        });

        revalidatePath("/dashboard/instructor/courses");
        return { success: true, courseId: course.id };
    } catch (error) {
        console.error("[CREATE_COURSE]", error);
        return { success: false, error: "Failed to create course" };
    }
}

export async function updateCourse(courseId: string, formData: FormData) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr) || 0;
    const status = formData.get("status") as string;

    try {
        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course || course.instructorId !== user.id) {
            return { success: false, error: "Not authorized" };
        }

        await prisma.course.update({
            where: { id: courseId },
            data: {
                title,
                description,
                category,
                price,
                status,
            },
        });

        revalidatePath(`/dashboard/instructor/courses/${courseId}`);
        revalidatePath("/dashboard/instructor/courses");
        return { success: true };
    } catch (error) {
        console.error("[UPDATE_COURSE]", error);
        return { success: false, error: "Failed to update course" };
    }
}

export async function deleteCourse(courseId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course || course.instructorId !== user.id) {
            return { success: false, error: "Not authorized" };
        }

        await prisma.course.delete({
            where: { id: courseId },
        });

        revalidatePath("/dashboard/instructor/courses");
        return { success: true };
    } catch (error) {
        console.error("[DELETE_COURSE]", error);
        return { success: false, error: "Failed to delete course" };
    }
}

export async function publishCourse(courseId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course || course.instructorId !== user.id) {
            return { success: false, error: "Not authorized" };
        }

        await prisma.course.update({
            where: { id: courseId },
            data: { status: "PUBLISHED" },
        });

        revalidatePath(`/dashboard/instructor/courses/${courseId}`);
        revalidatePath("/dashboard/instructor/courses");
        return { success: true };
    } catch (error) {
        console.error("[PUBLISH_COURSE]", error);
        return { success: false, error: "Failed to publish course" };
    }
}

export async function addSessionToCourse(courseId: string, formData: FormData) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTimeStr = formData.get("startTime") as string;
    const startTime = new Date(startTimeStr);

    if (!title || !startTimeStr) {
        return { success: false, error: "Title and start time are required" };
    }

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course || course.instructorId !== user.id) {
            return { success: false, error: "Not authorized" };
        }

        const session = await prisma.classSession.create({
            data: {
                title,
                description,
                startTime,
                instructorId: user.id,
                courseId,
                status: "SCHEDULED",
                roomId: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            },
        });

        revalidatePath(`/dashboard/instructor/courses/${courseId}`);
        return { success: true, sessionId: session.id };
    } catch (error) {
        console.error("[ADD_SESSION]", error);
        return { success: false, error: "Failed to add session" };
    }
}

export async function incrementCourseViews(courseId: string) {
    try {
        await prisma.course.update({
            where: { id: courseId },
            data: { viewCount: { increment: 1 } },
        });
        return { success: true };
    } catch (error) {
        console.error("[INCREMENT_VIEWS]", error);
        return { success: false };
    }
}

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function enrollInCourse(courseId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        // Check if course exists and is published
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return { success: false, error: "Course not found" };
        }

        if (course.status !== "PUBLISHED") {
            return { success: false, error: "Course is not available" };
        }

        // Check if already enrolled
        const existing = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId,
                },
            },
        });

        if (existing) {
            return { success: false, error: "Already enrolled" };
        }

        // Create enrollment
        await prisma.courseEnrollment.create({
            data: {
                userId: user.id,
                courseId,
            },
        });

        revalidatePath("/dashboard/student");
        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("[ENROLL_COURSE]", error);
        return { success: false, error: "Failed to enroll" };
    }
}

export async function unenrollFromCourse(courseId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        await prisma.courseEnrollment.delete({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId,
                },
            },
        });

        revalidatePath("/dashboard/student");
        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("[UNENROLL_COURSE]", error);
        return { success: false, error: "Failed to unenroll" };
    }
}

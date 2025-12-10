"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitReview(courseId: string, rating: number, comment: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    if (rating < 1 || rating > 5) {
        return { success: false, error: "Rating must be between 1 and 5" };
    }

    try {
        // Check if user is enrolled
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId,
                },
            },
        });

        if (!enrollment) {
            return { success: false, error: "You must be enrolled to review this course" };
        }

        // Create or update review
        await prisma.review.upsert({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId,
                },
            },
            create: {
                userId: user.id,
                courseId,
                rating,
                comment: comment.trim() || null,
            },
            update: {
                rating,
                comment: comment.trim() || null,
            },
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("[SUBMIT_REVIEW]", error);
        return { success: false, error: "Failed to submit review" };
    }
}

export async function deleteReview(courseId: string) {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        await prisma.review.delete({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId,
                },
            },
        });

        revalidatePath(`/courses/${courseId}`);
        return { success: true };
    } catch (error) {
        console.error("[DELETE_REVIEW]", error);
        return { success: false, error: "Failed to delete review" };
    }
}

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

export async function updateUserRole(role: "STUDENT" | "INSTRUCTOR") {
    const user = await currentUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        // Update in database
        await prisma.user.upsert({
            where: { id: user.id },
            create: {
                id: user.id,
                email: user.emailAddresses[0].emailAddress,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                role: role,
            },
            update: {
                role: role,
            },
        });

        // Update Clerk metadata
        const client = await clerkClient();
        await client.users.updateUserMetadata(user.id, {
            publicMetadata: {
                role: role,
            },
        });

        revalidatePath("/dashboard");
        return { success: true, role };
    } catch (error) {
        console.error("[UPDATE_ROLE]", error);
        return { success: false, error: "Failed to update role" };
    }
}

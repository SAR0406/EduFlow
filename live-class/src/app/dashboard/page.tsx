import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/");
    }

    // Check if user exists in DB
    let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    // If user doesn't exist, create them
    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                id: user.id,
                email: user.emailAddresses[0].emailAddress,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                role: (user.publicMetadata?.role as string) || "",
            },
        });
    }

    // If no role set, redirect to onboarding
    if (!dbUser.role || dbUser.role === "") {
        redirect("/onboarding");
    }

    // Redirect based on role
    if (dbUser.role === "INSTRUCTOR") {
        redirect("/dashboard/instructor");
    } else {
        redirect("/dashboard/student");
    }
}

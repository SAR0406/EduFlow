import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
    const user = await currentUser();

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const dbUser = await prisma.user.upsert({
            where: { id: user.id },
            create: {
                id: user.id,
                email: user.emailAddresses[0].emailAddress,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
                role: (user.publicMetadata?.role as string) || "STUDENT",
            },
            update: {
                email: user.emailAddresses[0].emailAddress,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            },
            include: {
                enrollments: {
                    include: { class: true }
                },
                organizedClasses: true,
            }
        });

        const stats = {
            role: dbUser.role,
            totalEnrolled: dbUser.enrollments.length,
            totalOrganized: dbUser.organizedClasses.length,
            // Calculate recent activity or upcoming classes
            upcomingClasses: [
                ...dbUser.enrollments.map((e: any) => e.class).filter((c: any) => new Date(c.startTime) > new Date()),
                ...dbUser.organizedClasses.filter((c: any) => new Date(c.startTime) > new Date())
            ].sort((a: any, b: any) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
        };

        return NextResponse.json({
            user: {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role
            },
            stats,
            data: dbUser // Full data
        });
    } catch (error) {
        console.error('[DASHBOARD_GET]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

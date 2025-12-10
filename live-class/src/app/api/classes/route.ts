import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const classes = await prisma.classSession.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                instructor: {
                    select: { name: true, email: true }
                },
                _count: {
                    select: { enrollments: true }
                }
            }
        });
        return NextResponse.json(classes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}

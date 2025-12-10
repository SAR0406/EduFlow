import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Users, Play, CheckCircle, Clock, Trash2 } from "lucide-react";
import { publishCourse, deleteCourse } from "@/app/actions/courseActions";
import { startLiveSession } from "@/app/actions/sessionActions";
import { AddSessionForm } from "@/components/add-session-form";
import { SessionActions } from "@/components/session-actions";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await currentUser();
    if (!user) redirect("/");

    const course = await prisma.course.findUnique({
        where: { id },
        include: {
            sessions: {
                orderBy: { startTime: "asc" },
            },
            enrollments: {
                include: {
                    user: { select: { name: true, email: true } },
                },
            },
            _count: { select: { enrollments: true } },
        },
    });

    if (!course || course.instructorId !== user.id) {
        notFound();
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "LIVE": return <Play className="h-4 w-4 text-red-500" />;
            case "COMPLETED": return <CheckCircle className="h-4 w-4 text-green-500" />;
            default: return <Clock className="h-4 w-4 text-yellow-500" />;
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/instructor/courses">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{course.title}</h1>
                        <p className="text-muted-foreground">{course.category} · {course.price === 0 ? "Free" : `$${course.price}`}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {course.status === "DRAFT" && (
                        <form action={async () => {
                            "use server";
                            await publishCourse(id);
                        }}>
                            <Button type="submit" className="gap-2">
                                Publish Course
                            </Button>
                        </form>
                    )}
                    <form action={async () => {
                        "use server";
                        await deleteCourse(id);
                        redirect("/dashboard/instructor/courses");
                    }}>
                        <Button type="submit" variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{course._count.enrollments}</div>
                        <div className="text-sm text-muted-foreground">Enrolled Students</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{course.sessions.length}</div>
                        <div className="text-sm text-muted-foreground">Total Sessions</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold capitalize">{course.status.toLowerCase()}</div>
                        <div className="text-sm text-muted-foreground">Status</div>
                    </CardContent>
                </Card>
            </div>

            {/* Sessions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Live Sessions
                    </CardTitle>
                    <AddSessionForm courseId={course.id} />
                </CardHeader>
                <CardContent>
                    {course.sessions.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No sessions scheduled yet. Add your first live session!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {course.sessions.map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between p-4 rounded-lg border"
                                >
                                    <div className="flex items-center gap-3">
                                        {getStatusIcon(session.status)}
                                        <div>
                                            <div className="font-medium">{session.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(session.startTime).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <SessionActions session={session} />
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Enrolled Students */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Enrolled Students ({course.enrollments.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {course.enrollments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                            No students enrolled yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {course.enrollments.map((enrollment) => (
                                <div
                                    key={enrollment.id}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <div className="font-medium">{enrollment.user.name || "Unknown"}</div>
                                        <div className="text-sm text-muted-foreground">{enrollment.user.email}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Joined {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

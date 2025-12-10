import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { enrollInCourse, unenrollFromCourse } from "@/app/actions/enrollmentActions";
import { incrementCourseViews } from "@/app/actions/courseActions";
import { ArrowLeft, Users, Clock, DollarSign, Calendar, Video, CheckCircle } from "lucide-react";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const user = await currentUser();

    const course = await prisma.course.findUnique({
        where: { id, status: "PUBLISHED" },
        include: {
            instructor: { select: { name: true, bio: true } },
            sessions: {
                orderBy: { startTime: "asc" },
            },
            _count: { select: { enrollments: true } },
        },
    });

    if (!course) {
        notFound();
    }

    // Increment view count (fire and forget)
    incrementCourseViews(id);

    // Check if user is enrolled
    let isEnrolled = false;
    if (user) {
        const enrollment = await prisma.courseEnrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: user.id,
                    courseId: id,
                },
            },
        });
        isEnrolled = !!enrollment;
    }

    const upcomingSessions = course.sessions.filter(s => new Date(s.startTime) > new Date());
    const liveSessions = course.sessions.filter(s => s.status === "LIVE");

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Back Button */}
                <Link href="/dashboard/student/browse">
                    <Button variant="ghost" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Courses
                    </Button>
                </Link>

                {/* Course Header */}
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                            {course.category}
                        </span>
                        {course.price === 0 && (
                            <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
                                Free
                            </span>
                        )}
                    </div>

                    <h1 className="text-4xl font-bold">{course.title}</h1>

                    <p className="text-lg text-muted-foreground">
                        {course.description || "No description available"}
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{course._count.enrollments} students enrolled</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{course.sessions.length} live sessions</span>
                        </div>
                        <div className="flex items-center gap-2 font-semibold">
                            <DollarSign className="h-4 w-4" />
                            <span>{course.price === 0 ? "Free" : `$${course.price}`}</span>
                        </div>
                    </div>

                    <div className="text-muted-foreground">
                        Instructor: <span className="font-medium text-foreground">{course.instructor.name}</span>
                    </div>
                </div>

                {/* Enrollment Card */}
                <Card className="border-2">
                    <CardContent className="p-6">
                        {user ? (
                            isEnrolled ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-green-500">
                                        <CheckCircle className="h-5 w-5" />
                                        <span className="font-medium">You're enrolled in this course</span>
                                    </div>
                                    <div className="flex gap-3">
                                        <Link href="/dashboard/student" className="flex-1">
                                            <Button className="w-full">Go to Dashboard</Button>
                                        </Link>
                                        <form action={async () => {
                                            "use server";
                                            await unenrollFromCourse(id);
                                        }}>
                                            <Button type="submit" variant="outline">Unenroll</Button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                <form action={async () => {
                                    "use server";
                                    await enrollInCourse(id);
                                }}>
                                    <Button type="submit" size="lg" className="w-full">
                                        Enroll Now {course.price > 0 && `- $${course.price}`}
                                    </Button>
                                </form>
                            )
                        ) : (
                            <Link href="/sign-in">
                                <Button size="lg" className="w-full">Sign in to Enroll</Button>
                            </Link>
                        )}
                    </CardContent>
                </Card>

                {/* Live Sessions Alert */}
                {liveSessions.length > 0 && isEnrolled && (
                    <Card className="border-red-500/50 bg-red-500/5">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-red-500 font-medium mb-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                                Live Session in Progress!
                            </div>
                            {liveSessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between">
                                    <span>{session.title}</span>
                                    <Link href={`/classroom/${session.roomId}`}>
                                        <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700">
                                            <Video className="h-4 w-4" />
                                            Join Now
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Sessions Schedule */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Session Schedule
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {course.sessions.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                No sessions scheduled yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {course.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className="flex items-center justify-between p-4 rounded-lg border"
                                    >
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {session.title}
                                                {session.status === "LIVE" && (
                                                    <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded">
                                                        LIVE
                                                    </span>
                                                )}
                                                {session.status === "COMPLETED" && (
                                                    <span className="px-2 py-0.5 text-xs bg-gray-500 text-white rounded">
                                                        Completed
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(session.startTime).toLocaleString()}
                                            </div>
                                        </div>
                                        {session.status === "LIVE" && isEnrolled && session.roomId && (
                                            <Link href={`/classroom/${session.roomId}`}>
                                                <Button size="sm" className="gap-2">
                                                    <Video className="h-4 w-4" />
                                                    Join
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

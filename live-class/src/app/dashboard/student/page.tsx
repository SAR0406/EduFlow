import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DashboardHeader from "@/components/dashboard-header";
import { BookOpen, Clock, Video, Play, ArrowRight, Sparkles, Users } from "lucide-react";

export default async function StudentDashboardPage() {
    const user = await currentUser();
    if (!user) redirect("/");

    const enrollments = await prisma.courseEnrollment.findMany({
        where: { userId: user.id },
        include: {
            course: {
                include: {
                    instructor: { select: { name: true } },
                    sessions: {
                        where: {
                            startTime: { gte: new Date() },
                        },
                        orderBy: { startTime: "asc" },
                        take: 3,
                    },
                    _count: { select: { sessions: true } },
                },
            },
        },
        orderBy: { enrolledAt: "desc" },
    });

    const liveSessions = await prisma.classSession.findMany({
        where: {
            status: "LIVE",
            course: {
                enrollments: {
                    some: { userId: user.id },
                },
            },
        },
        include: {
            course: { select: { title: true } },
            instructor: { select: { name: true } },
        },
    });

    const totalCourses = enrollments.length;
    const upcomingSessions = enrollments.reduce((acc: number, e: any) => acc + e.course.sessions.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
            <div className="p-8 space-y-8">
                <DashboardHeader
                    title="Student Dashboard"
                    subtitle="Welcome back! Here's your learning progress"
                />

                {/* Live Now Banner */}
                {liveSessions.length > 0 && (
                    <div className="glass-card rounded-2xl p-6 border-2 border-red-200 bg-red-50/50 animate-pulse-glow">
                        <div className="flex items-center gap-3 text-red-600 font-semibold mb-4">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                            </span>
                            <span className="text-lg">Live Sessions Available!</span>
                        </div>
                        {liveSessions.map((session: any) => (
                            <div key={session.id} className="flex items-center justify-between bg-red-100/50 rounded-xl p-4">
                                <div>
                                    <div className="font-medium text-gray-900">{session.title}</div>
                                    <div className="text-sm text-gray-600">
                                        {session.course?.title} · {session.instructor.name}
                                    </div>
                                </div>
                                <Link href={`/classroom/${session.roomId}`}>
                                    <Button className="gap-2 bg-red-600 hover:bg-red-700 text-white">
                                        <Video className="h-4 w-4" />
                                        Join Now
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="glass-card rounded-2xl p-6 card-hover stat-card-blue">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Enrolled Courses</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalCourses}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 card-hover stat-card-cyan">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Upcoming Sessions</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingSessions}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-cyan-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 card-hover stat-card-red">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Live Now</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{liveSessions.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                                <Play className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 card-hover bg-gradient-to-br from-blue-100 to-cyan-100">
                        <Link href="/dashboard/student/browse" className="flex items-center justify-between h-full">
                            <div>
                                <p className="text-sm text-gray-700">Discover New</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">Courses</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                                <ArrowRight className="w-6 h-6 text-gray-700" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* My Courses */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">My Courses</h3>
                        <Link href="/dashboard/student/browse">
                            <Button variant="outline" className="border-gray-300 hover:bg-gray-100 text-gray-700">
                                Browse All Courses
                            </Button>
                        </Link>
                    </div>

                    {enrollments.length === 0 ? (
                        <div className="glass-card rounded-2xl text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Browse and enroll in courses to start your learning journey
                            </p>
                            <Link href="/dashboard/student/browse">
                                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                                    Browse Courses
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {enrollments.map((enrollment: any) => (
                                <div key={enrollment.id} className="glass-card rounded-2xl p-6 card-hover group">
                                    <div className="flex items-start justify-between mb-3">
                                        <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {enrollment.course.title}
                                        </h4>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4">
                                        by {enrollment.course.instructor.name}
                                    </p>
                                    <div className="text-sm text-gray-500 mb-4">
                                        {enrollment.course._count.sessions} sessions total
                                    </div>
                                    {enrollment.course.sessions.length > 0 && (
                                        <div className="space-y-2 mb-4">
                                            <div className="text-xs font-medium text-gray-500">Upcoming:</div>
                                            {enrollment.course.sessions.map((session: any) => (
                                                <div key={session.id} className="text-sm p-2 bg-gray-100 rounded-lg text-gray-700">
                                                    {session.title} - {new Date(session.startTime).toLocaleDateString()}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Link href={`/courses/${enrollment.course.id}`}>
                                        <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-100 text-gray-700">
                                            View Course
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

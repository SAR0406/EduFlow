import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/stats-card";
import DashboardHeader from "@/components/dashboard-header";
import { BookOpen, Users, Clock, Plus, ArrowRight, Sparkles, BarChart3 } from "lucide-react";

export default async function InstructorDashboard() {
    const user = await currentUser();
    if (!user) redirect("/");

    const courses = await prisma.course.findMany({
        where: { instructorId: user.id },
        include: {
            _count: { select: { enrollments: true, sessions: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 6,
    });

    const totalStudents = courses.reduce((acc: number, c: any) => acc + c._count.enrollments, 0);
    const totalSessions = courses.reduce((acc: number, c: any) => acc + c._count.sessions, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-white">
            <div className="p-8 space-y-8">
                <DashboardHeader
                    title="Instructor Dashboard"
                    subtitle="Manage your courses and live sessions"
                />

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="glass-card rounded-2xl p-6 card-hover stat-card-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Courses</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{courses.length}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 card-hover stat-card-cyan">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Students</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalStudents}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-cyan-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 card-hover stat-card-emerald">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Sessions</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalSessions}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 card-hover bg-gradient-to-br from-purple-100 to-cyan-100">
                        <Link href="/dashboard/instructor/courses/create" className="flex items-center justify-between h-full">
                            <div>
                                <p className="text-sm text-gray-700">Create New</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">Course</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-gray-700" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-4">
                    <Link href="/dashboard/instructor/courses/create">
                        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white">
                            <Plus className="h-4 w-4" />
                            Create Course
                        </Button>
                    </Link>
                    <Link href="/dashboard/instructor/analytics">
                        <Button variant="outline" className="gap-2 border-purple-200 hover:bg-purple-50 text-purple-700">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </Button>
                    </Link>
                    <Link href="/dashboard/instructor/courses">
                        <Button variant="outline" className="gap-2 border-gray-300 hover:bg-gray-100 text-gray-700">
                            View All Courses
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {/* Recent Courses */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">Recent Courses</h3>
                        <Link href="/dashboard/instructor/courses">
                            <Button variant="link" className="text-purple-600 hover:text-purple-700">View All →</Button>
                        </Link>
                    </div>

                    {courses.length === 0 ? (
                        <div className="glass-card rounded-2xl text-center py-16">
                            <div className="w-20 h-20 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses yet</h3>
                            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                Create your first course to start teaching and earning
                            </p>
                            <Link href="/dashboard/instructor/courses/create">
                                <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white">
                                    Create Your First Course
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {courses.map((course: any) => (
                                <Link key={course.id} href={`/dashboard/instructor/courses/${course.id}`}>
                                    <div className="glass-card rounded-2xl p-6 card-hover h-full group">
                                        <div className="flex items-start justify-between mb-4">
                                            <h4 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                                {course.title}
                                            </h4>
                                            <span className={`px-3 py-1 text-xs rounded-full shrink-0 ml-2 ${course.status === "PUBLISHED"
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {course.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Users className="h-4 w-4" />
                                                {course._count.enrollments} students
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {course._count.sessions} sessions
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <span className="text-sm text-gray-500">
                                                {course.category} · {course.price === 0 ? "Free" : `$${course.price}`}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

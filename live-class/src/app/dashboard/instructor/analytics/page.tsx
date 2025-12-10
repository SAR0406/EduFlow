import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Users, Eye, DollarSign, BookOpen, BarChart3 } from "lucide-react";

export default async function AnalyticsPage() {
    const user = await currentUser();
    if (!user) redirect("/");

    // Get all courses with stats
    const courses = await prisma.course.findMany({
        where: { instructorId: user.id },
        include: {
            _count: { select: { enrollments: true, sessions: true, reviews: true } },
            enrollments: {
                select: { enrolledAt: true },
                orderBy: { enrolledAt: "desc" },
            },
            reviews: {
                select: { rating: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalCourses = courses.length;
    const totalStudents = courses.reduce((acc, c) => acc + c._count.enrollments, 0);
    const totalViews = courses.reduce((acc, c) => acc + c.viewCount, 0);
    const totalRevenue = courses.reduce((acc, c) => acc + (c.price * c._count.enrollments), 0);
    const totalSessions = courses.reduce((acc, c) => acc + c._count.sessions, 0);

    // Calculate average rating
    const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating));
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
        : "N/A";

    // Get enrollment data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
    });

    const enrollmentsByDay = last7Days.map(day => {
        const count = courses.reduce((acc, course) => {
            return acc + course.enrollments.filter(e =>
                e.enrolledAt.toISOString().split('T')[0] === day
            ).length;
        }, 0);
        return { day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }), count };
    });

    const maxEnrollments = Math.max(...enrollmentsByDay.map(d => d.count), 1);

    // Top courses by enrollments
    const topCourses = [...courses]
        .sort((a, b) => b._count.enrollments - a._count.enrollments)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-white p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/instructor">
                        <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                        <p className="text-gray-600">Track your teaching performance</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <div className="glass-card rounded-2xl p-6 stat-card-purple">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Courses</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalCourses}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 stat-card-cyan">
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
                    <div className="glass-card rounded-2xl p-6 stat-card-blue">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Views</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{totalViews}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 stat-card-emerald">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Revenue</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">${totalRevenue.toFixed(0)}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 bg-gradient-to-br from-yellow-50 to-orange-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Avg Rating</p>
                                <p className="text-3xl font-bold text-gray-900 mt-1">{avgRating} ⭐</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Enrollment Chart */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Enrollments (Last 7 Days)</h3>
                        </div>
                        <div className="flex items-end justify-between h-48 gap-2">
                            {enrollmentsByDay.map((item, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                    <div
                                        className="w-full bg-gradient-to-t from-purple-500 to-cyan-500 rounded-t-lg transition-all"
                                        style={{
                                            height: `${(item.count / maxEnrollments) * 100}%`,
                                            minHeight: item.count > 0 ? '8px' : '2px'
                                        }}
                                    />
                                    <span className="text-xs text-gray-500">{item.day}</span>
                                    <span className="text-xs font-medium text-gray-700">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Courses */}
                    <div className="glass-card rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-cyan-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Top Courses by Enrollments</h3>
                        </div>
                        {topCourses.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No courses yet</p>
                        ) : (
                            <div className="space-y-4">
                                {topCourses.map((course, i) => (
                                    <div key={course.id} className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-cyan-100 flex items-center justify-center text-sm font-bold text-purple-600">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{course.title}</p>
                                            <p className="text-xs text-gray-500">{course.category}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">{course._count.enrollments}</p>
                                            <p className="text-xs text-gray-500">students</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* All Courses Table */}
                <div className="glass-card rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Course Performance</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Course</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Students</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Views</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Sessions</th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map((course) => (
                                    <tr key={course.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <Link href={`/dashboard/instructor/courses/${course.id}`} className="text-sm font-medium text-gray-900 hover:text-purple-600">
                                                {course.title}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`px-2 py-1 text-xs rounded-full ${course.status === "PUBLISHED"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                {course.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-sm text-gray-700">{course._count.enrollments}</td>
                                        <td className="py-3 px-4 text-center text-sm text-gray-700">{course.viewCount}</td>
                                        <td className="py-3 px-4 text-center text-sm text-gray-700">{course._count.sessions}</td>
                                        <td className="py-3 px-4 text-center text-sm font-medium text-gray-900">
                                            ${(course.price * course._count.enrollments).toFixed(0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

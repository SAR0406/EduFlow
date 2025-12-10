import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { enrollInCourse } from "@/app/actions/enrollmentActions";
import { BookOpen, Users, Clock, DollarSign, ArrowLeft } from "lucide-react";

const CATEGORIES = [
    "All",
    "General",
    "Mathematics",
    "Science",
    "Technology",
    "Business",
    "Arts",
    "Language",
    "Music",
    "Health",
    "Other",
];

export default async function BrowseCoursesPage({
    searchParams,
}: {
    searchParams: Promise<{ category?: string; search?: string }>;
}) {
    const params = await searchParams;
    const user = await currentUser();
    if (!user) redirect("/");

    const category = params.category;
    const search = params.search;

    // Get user's enrolled course IDs
    const enrolledCourseIds = await prisma.courseEnrollment.findMany({
        where: { userId: user.id },
        select: { courseId: true },
    }).then((e) => e.map((en) => en.courseId));

    // Fetch published courses
    const courses = await prisma.course.findMany({
        where: {
            status: "PUBLISHED",
            ...(category && category !== "All" ? { category } : {}),
            ...(search ? {
                OR: [
                    { title: { contains: search } },
                    { description: { contains: search } },
                ],
            } : {}),
        },
        include: {
            instructor: { select: { name: true } },
            _count: { select: { enrollments: true, sessions: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/student">
                    <Button variant="ghost" size="icon" className="hover:bg-gray-100">
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Browse Courses</h1>
                    <p className="text-gray-600">Discover and enroll in new courses</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                    <Link
                        key={cat}
                        href={`/dashboard/student/browse${cat === "All" ? "" : `?category=${cat}`}`}
                    >
                        <Button
                            variant={category === cat || (!category && cat === "All") ? "default" : "outline"}
                            size="sm"
                            className={category === cat || (!category && cat === "All")
                                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-0"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100"
                            }
                        >
                            {cat}
                        </Button>
                    </Link>
                ))}
            </div>

            {/* Course Grid */}
            {courses.length === 0 ? (
                <div className="glass-card rounded-2xl text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2 text-gray-900">No courses found</h3>
                    <p className="text-gray-600">
                        {category ? `No courses in ${category} category` : "No courses available yet"}
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => {
                        const isEnrolled = enrolledCourseIds.includes(course.id);

                        return (
                            <div key={course.id} className="glass-card rounded-2xl p-6 card-hover flex flex-col">
                                <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{course.title}</h3>
                                    {isEnrolled && (
                                        <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded shrink-0 ml-2">
                                            Enrolled
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-3">
                                    by {course.instructor.name}
                                </p>
                                <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                                    {course.description || "No description"}
                                </p>
                                <div className="flex flex-wrap gap-3 text-sm mb-3">
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Users className="h-4 w-4" />
                                        {course._count.enrollments}
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-600">
                                        <Clock className="h-4 w-4" />
                                        {course._count.sessions} sessions
                                    </div>
                                    <div className="flex items-center gap-1 font-medium text-gray-900">
                                        <DollarSign className="h-4 w-4" />
                                        {course.price === 0 ? "Free" : `$${course.price}`}
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                        {course.category}
                                    </span>
                                </div>
                                <div className="flex gap-2 mt-auto">
                                    <Link href={`/courses/${course.id}`} className="flex-1">
                                        <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-100">View</Button>
                                    </Link>
                                    {!isEnrolled && (
                                        <form action={async () => {
                                            "use server";
                                            await enrollInCourse(course.id);
                                        }} className="flex-1">
                                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white">Enroll</Button>
                                        </form>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

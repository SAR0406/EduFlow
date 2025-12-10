import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Users, Clock } from "lucide-react";

export default async function InstructorCoursesPage() {
    const user = await currentUser();
    if (!user) redirect("/");

    const courses = await prisma.course.findMany({
        where: { instructorId: user.id },
        include: {
            _count: { select: { enrollments: true, sessions: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PUBLISHED": return "bg-green-500/20 text-green-400";
            case "DRAFT": return "bg-yellow-500/20 text-yellow-400";
            case "ARCHIVED": return "bg-gray-500/20 text-gray-400";
            default: return "bg-gray-500/20 text-gray-400";
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Courses</h1>
                    <p className="text-muted-foreground">Manage your courses and sessions</p>
                </div>
                <Link href="/dashboard/instructor/courses/create">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Course
                    </Button>
                </Link>
            </div>

            {courses.length === 0 ? (
                <Card className="text-center py-12">
                    <CardContent>
                        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No courses yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Create your first course to start teaching
                        </p>
                        <Link href="/dashboard/instructor/courses/create">
                            <Button>Create Your First Course</Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(course.status)}`}>
                                        {course.status}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {course.description || "No description"}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {course._count.enrollments} students
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {course._count.sessions} sessions
                                    </div>
                                </div>
                                <div className="mt-2 text-sm">
                                    <span className="font-medium">
                                        {course.price === 0 ? "Free" : `$${course.price}`}
                                    </span>
                                    <span className="text-muted-foreground"> · {course.category}</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Link href={`/dashboard/instructor/courses/${course.id}`} className="w-full">
                                    <Button variant="outline" className="w-full">
                                        Manage Course
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

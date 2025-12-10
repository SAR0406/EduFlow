"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCourse } from "@/app/actions/courseActions";
import { ArrowLeft, Save, Eye } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
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

export default function CreateCoursePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = async (status: string) => {
        if (!formRef.current) return;

        setLoading(true);
        setError("");

        const formData = new FormData(formRef.current);
        formData.set("status", status);

        const result = await createCourse(formData);

        if (result.success) {
            router.push(`/dashboard/instructor/courses/${result.courseId}`);
        } else {
            setError(result.error || "Something went wrong");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/instructor/courses">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Create New Course</h1>
                    <p className="text-muted-foreground">Fill in the details for your course</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Course Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form ref={formRef} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Course Title *</label>
                            <Input
                                name="title"
                                placeholder="e.g., Introduction to Web Development"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                placeholder="What will students learn in this course?"
                                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <select
                                    name="category"
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    defaultValue="General"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Price ($)</label>
                                <Input
                                    type="number"
                                    name="price"
                                    placeholder="0 for free"
                                    min="0"
                                    step="0.01"
                                    defaultValue="0"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm">{error}</div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 gap-2"
                                disabled={loading}
                                onClick={() => handleSubmit("DRAFT")}
                            >
                                <Save className="h-4 w-4" />
                                Save as Draft
                            </Button>
                            <Button
                                type="button"
                                className="flex-1 gap-2"
                                disabled={loading}
                                onClick={() => handleSubmit("PUBLISHED")}
                            >
                                <Eye className="h-4 w-4" />
                                Publish Now
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

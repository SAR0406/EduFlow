"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateUserRole } from "@/app/actions/updateRole";
import { GraduationCap, BookOpen, ArrowRight, Sparkles } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState<string | null>(null);

    const handleRoleSelect = async (role: "STUDENT" | "INSTRUCTOR") => {
        setLoading(role);
        const result = await updateUserRole(role);

        if (result.success) {
            if (role === "INSTRUCTOR") {
                router.push("/dashboard/instructor");
            } else {
                router.push("/dashboard/student");
            }
        } else {
            setLoading(null);
            alert(result.error || "Failed to set role");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center hero-gradient p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-200/50 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            <div className="max-w-3xl w-full animate-slide-up">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-gray-600">One last step to get started</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Welcome to <span className="gradient-text">LiveClass</span>! 🎓
                    </h1>
                    <p className="text-lg text-gray-600">
                        Choose how you want to use the platform
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Student Card */}
                    <div
                        className="glass-card rounded-2xl p-8 cursor-pointer group card-hover relative overflow-hidden"
                        onClick={() => !loading && handleRoleSelect("STUDENT")}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                                <GraduationCap className="w-10 h-10 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">I'm a Student</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Browse courses, join live classes, and learn from expert instructors
                            </p>
                            <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-6 text-lg group"
                                disabled={loading !== null}
                            >
                                {loading === "STUDENT" ? (
                                    "Setting up..."
                                ) : (
                                    <>
                                        Continue as Student
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Instructor Card */}
                    <div
                        className="glass-card rounded-2xl p-8 cursor-pointer group card-hover relative overflow-hidden"
                        onClick={() => !loading && handleRoleSelect("INSTRUCTOR")}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-100/50 to-pink-100/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform mx-auto">
                                <BookOpen className="w-10 h-10 text-purple-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">I'm an Instructor</h3>
                            <p className="text-gray-600 text-center mb-6">
                                Create courses, schedule live sessions, and teach students worldwide
                            </p>
                            <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-6 text-lg group"
                                disabled={loading !== null}
                            >
                                {loading === "INSTRUCTOR" ? (
                                    "Setting up..."
                                ) : (
                                    <>
                                        Continue as Instructor
                                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

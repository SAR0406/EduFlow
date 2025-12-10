"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Video } from "lucide-react";

interface DashboardHeaderProps {
    title?: string;
    subtitle?: string;
}

export default function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
    return (
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold gradient-text hidden sm:inline">LiveClass</span>
                </Link>
                <div className="h-8 w-px bg-gray-200 hidden sm:block" />
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{title || "Dashboard"}</h1>
                    {subtitle && (
                        <p className="text-gray-600 text-sm sm:text-base">{subtitle}</p>
                    )}
                </div>
            </div>
            <UserButton
                afterSignOutUrl="/"
                appearance={{
                    elements: {
                        avatarBox: "w-10 h-10"
                    }
                }}
            />
        </header>
    );
}

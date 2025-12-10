"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export const LandingNavbar = () => {
    const { isSignedIn } = useAuth();

    return (
        <nav className="p-4 bg-transparent flex items-center justify-between">
            <Link href="/" className="flex items-center">
                <h1 className="text-2xl font-bold font-sans">LiveClass</h1>
            </Link>
            <div className="flex items-center gap-x-2">
                <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
                    <Button variant="outline" className="rounded-full">
                        {isSignedIn ? "Dashboard" : "Sign In"}
                    </Button>
                </Link>
                <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
                    <Button className="rounded-full">
                        {isSignedIn ? "Go to Class" : "Get Started"}
                    </Button>
                </Link>
            </div>
        </nav>
    );
};

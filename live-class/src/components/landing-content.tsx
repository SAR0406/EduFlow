"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const testimonials = [
    {
        name: "John Doe",
        avatar: "J",
        title: "Instructor",
        description: "This platform changed how I teach my coding bootcamps. The low latency is a game changer!",
    },
    {
        name: "Jane Smith",
        avatar: "S",
        title: "Student",
        description: "I love the interactive chat and how smooth the video quality is. Highly recommended!",
    },
    {
        name: "Mike Johnson",
        avatar: "M",
        title: "Tutor",
        description: "Setting up a class takes seconds. The dashboard is intuitive and powerful.",
    },
    {
        name: "Sarah Williams",
        avatar: "W",
        title: "Student",
        description: "The best part is that it works directly in the browser without installing anything.",
    }
];

export const LandingContent = () => {
    return (
        <div className="px-10 pb-20">
            <h2 className="text-center text-4xl text-black dark:text-white font-extrabold mb-10">
                Testimonials
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {testimonials.map((item) => (
                    <Card key={item.description} className="bg-[#192339] border-none text-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-x-2">
                                <div>
                                    <p className="text-lg">{item.name}</p>
                                    <p className="text-zinc-400 text-sm">{item.title}</p>
                                </div>
                            </CardTitle>
                            <CardContent className="pt-4 px-0">
                                {item.description}
                            </CardContent>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    );
};

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addSessionToCourse } from "@/app/actions/courseActions";
import { Plus, X } from "lucide-react";

export function AddSessionForm({ courseId }: { courseId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await addSessionToCourse(courseId, formData);

        if (result.success) {
            setIsOpen(false);
            // Page will revalidate
        } else {
            alert(result.error);
        }
        setLoading(false);
    };

    if (!isOpen) {
        return (
            <Button onClick={() => setIsOpen(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Session
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border rounded-lg bg-muted/50">
            <div className="flex-1 space-y-1">
                <label className="text-xs font-medium">Session Title</label>
                <Input name="title" placeholder="Session title" required />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium">Start Time</label>
                <Input type="datetime-local" name="startTime" required />
            </div>
            <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Adding..." : "Add"}
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
            </Button>
        </form>
    );
}

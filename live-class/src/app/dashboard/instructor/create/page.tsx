import { createClass } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CreateClassPage() {
    return (
        <div className="flex items-center justify-center min-h-screen p-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create New Class</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={createClass} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium mb-1">
                                Class Title
                            </label>
                            <Input id="title" name="title" required placeholder="e.g. Advanced Mathematics" />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium mb-1">
                                Description
                            </label>
                            <Input id="description" name="description" placeholder="Brief description..." />
                        </div>

                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium mb-1">
                                Start Time
                            </label>
                            <Input
                                id="startTime"
                                name="startTime"
                                type="datetime-local"
                                required
                                // Set default to now + 1 hour as simplified ISO string without ms/Z for input
                                defaultValue={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                            />
                        </div>

                        <Button type="submit" className="w-full">
                            Create Class
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

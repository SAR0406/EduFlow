import DashboardHeader from "@/components/dashboard-header";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-white">
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Navbar } from "@/components/layout/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen halftone">
      <Sidebar />
      <Navbar />
      <main className="md:ml-56 pt-13 md:pt-0 min-h-screen">
        <div className="max-w-screen-2xl mx-auto
          px-4 md:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
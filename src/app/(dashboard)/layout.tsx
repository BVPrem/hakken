import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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
      <Navbar />
      <main className="min-h-screen">
        <div className="max-w-screen-2xl mx-auto
          px-4 md:px-8
          pt-14 md:pt-20
          pb-8">
          {children}
        </div>
      </main>
    </div>
  );
}
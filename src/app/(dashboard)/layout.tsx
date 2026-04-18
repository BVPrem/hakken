import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";


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

      <main className="min-h-screen">
        <div
          className="max-w-screen-xl mx-auto px-4 md:px-8"
          style={{ paddingTop: "88px" }}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/ai/chat-panel";


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
          className="max-w-screen-xl mx-auto px-5 md:px-10 lg:px-12"
          style={{ paddingTop: "96px", paddingBottom: "2.5rem" }}
        >
          {children}
        </div>
        <ChatPanel />
      </main>
    </div>
  );
}
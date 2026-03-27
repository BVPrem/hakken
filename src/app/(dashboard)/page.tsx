import { currentUser } from "@clerk/nextjs/server";

export default async function HomePage() {
  const user = await currentUser();

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-heading font-bold text-text-primary">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          <span className="gradient-text"> 👋</span>
        </h1>
        <p className="text-text-secondary">
          Your anime & manga intelligence hub. Let&apos;s see what&apos;s happening.
        </p>
      </div>

      {/* Placeholder cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
        gap-4">
        {[
          {
            title: "Sentiment Pulse",
            desc: "Community mood on airing shows",
            soon: true,
          },
          {
            title: "Your Feed",
            desc: "News tailored to your taste",
            soon: true,
          },
          {
            title: "Hype Radar",
            desc: "What's trending right now",
            soon: true,
          },
          {
            title: "Release Calendar",
            desc: "Upcoming episodes & chapters",
            soon: true,
          },
          {
            title: "Hakken AI",
            desc: "Ask anything about anime",
            soon: true,
          },
          {
            title: "Friend Activity",
            desc: "What your friends are watching",
            soon: true,
          },
        ].map((card) => (
          <div
            key={card.title}
            className="glass rounded-xl p-6 flex flex-col gap-2
              border border-border hover:border-primary/30
              transition-colors group"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold
                text-text-primary group-hover:text-accent
                transition-colors">
                {card.title}
              </h3>
              {card.soon && (
                <span className="text-xs px-2 py-0.5 rounded-full
                  bg-primary/10 text-primary/70 border
                  border-primary/20">
                  Coming soon
                </span>
              )}
            </div>
            <p className="text-sm text-text-secondary">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

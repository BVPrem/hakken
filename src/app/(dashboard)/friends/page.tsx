export default function Page() {
  return (
    <div className="halftone min-h-screen">
      <div className="chapter-marker mb-8">
        <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
          Friends
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Find anime and manga across AniList, MAL and more
        </p>
      </div>
      
      <div className="manga-panel p-12 text-center">
        <p className="font-display text-lg uppercase tracking-wider text-foreground mb-2">
          Coming Soon
        </p>
        <p className="text-muted-foreground text-sm">
          Friend matching and shared watchlists
        </p>
      </div>
    </div>
  );
}

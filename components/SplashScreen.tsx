export function SplashScreen({ mode = "boot" }: { mode?: "boot" | "loading" }) {
  const simple = mode === "loading";

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-bg">
      <div
        className={simple ? "splash-icon-simple" : "splash-icon-intro"}
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <svg width="120" height="120" viewBox="0 0 60 60" fill="none">
          <path
            d="M30 50 C 14 39, 6 29, 6 18 C 6 10, 12 4, 20 4 C 25 4, 28 6.5, 30 10 C 32 6.5, 35 4, 40 4 C 48 4, 54 10, 54 18 C 54 29, 46 39, 30 50 Z"
            fill="var(--accent)"
          />
          <path
            d="M8 26 L18 26 L23 16 L30 36 L36 20 L41 26 L52 26"
            stroke="var(--bg)"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength="1"
            strokeDasharray="1"
            className={simple ? "splash-pulse-simple" : "splash-pulse-intro"}
          />
        </svg>
      </div>
      <div className={`font-display mt-6 text-[29px] font-bold tracking-tight ${simple ? "" : "splash-word-intro"}`}>
        <span className="text-white">Nutri</span>
        <span className="text-accent">Tracker</span>
      </div>
    </div>
  );
}

type Variant =
  | "welcome"
  | "name"
  | "sex"
  | "age"
  | "height"
  | "weight"
  | "activity"
  | "goal"
  | "days"
  | "split"
  | "equipment"
  | "favorites"
  | "extras";

function Welcome() {
  return (
    <svg width="96" height="96" viewBox="0 0 60 60" fill="none" style={{ animation: "stepBreathe 1.6s ease-in-out infinite" }}>
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
      />
    </svg>
  );
}

function NameIllustration() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "color-mix(in srgb, var(--accent) 16%, var(--panel))" }}>
      <span className="text-3xl" style={{ animation: "stepBreathe 1.8s ease-in-out infinite" }}>
        👋
      </span>
      <span
        className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full"
        style={{ background: "var(--accent)", animation: "stepCellGlow 1.6s ease-in-out infinite" }}
      />
    </div>
  );
}

function SexIllustration() {
  return (
    <div className="flex items-center gap-6">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
        style={{ background: "color-mix(in srgb, var(--fat) 18%, var(--panel))", color: "var(--fat)", animation: "stepBob 1.8s ease-in-out infinite" }}
      >
        ♂
      </div>
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold"
        style={{
          background: "color-mix(in srgb, var(--sodium) 18%, var(--panel))",
          color: "var(--sodium)",
          animation: "stepBob 1.8s ease-in-out infinite 0.5s",
        }}
      >
        ♀
      </div>
    </div>
  );
}

function AgeIllustration() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      {[0, 0.6, 1.2].map((delay) => (
        <span
          key={delay}
          className="absolute h-16 w-16 rounded-full border-2"
          style={{ borderColor: "var(--accent)", animation: `stepRipple 1.8s ease-out infinite ${delay}s` }}
        />
      ))}
      <span className="font-display text-lg font-bold text-accent">+1</span>
    </div>
  );
}

function HeightIllustration() {
  return (
    <div className="flex h-24 flex-col items-center justify-between">
      <div className="h-0.5 w-8 rounded-full" style={{ background: "var(--line)" }} />
      <div style={{ animation: "stepBob 1.6s ease-in-out infinite" }}>
        <svg width="24" height="48" viewBox="0 0 24 48" fill="none">
          <path d="M12 2 L12 46 M4 10 L12 2 L20 10 M4 38 L12 46 L20 38" stroke="var(--carb)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="h-0.5 w-8 rounded-full" style={{ background: "var(--line)" }} />
    </div>
  );
}

function WeightIllustration() {
  return (
    <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
      <g style={{ transformOrigin: "50px 20px", animation: "stepSwing 2.2s ease-in-out infinite" }}>
        <line x1="15" y1="20" x2="85" y2="20" stroke="var(--fat)" strokeWidth="3" strokeLinecap="round" />
        <line x1="15" y1="20" x2="15" y2="34" stroke="var(--fat)" strokeWidth="3" strokeLinecap="round" />
        <line x1="85" y1="20" x2="85" y2="8" stroke="var(--fat)" strokeWidth="3" strokeLinecap="round" />
        <circle cx="15" cy="40" r="8" fill="var(--fat)" opacity="0.85" />
        <circle cx="85" cy="4" r="8" fill="var(--fat)" opacity="0.5" />
      </g>
      <line x1="50" y1="20" x2="50" y2="66" stroke="var(--line)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 66 L68 66 L62 76 L38 76 Z" fill="var(--panel)" stroke="var(--line)" strokeWidth="2" />
    </svg>
  );
}

function ActivityIllustration() {
  const bars = [0.3, 0.7, 0.5, 0.9, 0.4];
  return (
    <div className="flex h-16 items-end gap-2">
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-3 rounded-full"
          style={{
            height: `${h * 64}px`,
            background: ["var(--protein)", "var(--carb)", "var(--accent)", "var(--fat)", "var(--sugar)"][i],
            transformOrigin: "bottom",
            animation: `stepBarPulse 1.2s ease-in-out infinite ${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function GoalIllustration() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      <span className="absolute h-24 w-24 rounded-full border-2" style={{ borderColor: "color-mix(in srgb, var(--accent) 35%, transparent)" }} />
      <span className="absolute h-16 w-16 rounded-full border-2" style={{ borderColor: "color-mix(in srgb, var(--accent) 55%, transparent)" }} />
      <span className="absolute h-8 w-8 rounded-full" style={{ background: "var(--accent)" }} />
      <span
        className="absolute h-2.5 w-2.5 rounded-full"
        style={{ background: "var(--chalk)", animation: "stepDotOrbit 1.8s ease-in-out infinite" }}
      />
    </div>
  );
}

function DaysIllustration() {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="h-6 w-6 rounded-md"
          style={{ background: "var(--accent)", opacity: 0.25, animation: `stepCellGlow 2.1s ease-in-out infinite ${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function SplitIllustration() {
  const boxes = [
    { color: "var(--protein)", delay: 0 },
    { color: "var(--fat)", delay: 0.2 },
    { color: "var(--sugar)", delay: 0.4 },
    { color: "var(--carb)", delay: 0.6 },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {boxes.map((b, i) => (
        <span
          key={i}
          className="h-9 w-9 rounded-lg"
          style={{ background: b.color, animation: `stepBreathe 1.8s ease-in-out infinite ${b.delay}s` }}
        />
      ))}
    </div>
  );
}

function EquipmentIllustration() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span className="absolute text-4xl" style={{ animation: "stepFadeInOut 2.4s ease-in-out infinite" }}>
        🏋️
      </span>
      <span className="absolute text-4xl" style={{ animation: "stepFadeInOut 2.4s ease-in-out infinite 1.2s" }}>
        ⚙️
      </span>
    </div>
  );
}

function FavoritesIllustration() {
  return (
    <div className="flex gap-2">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span key={i} className="text-3xl" style={{ color: "var(--accent)", animation: `stepBreathe 1.4s ease-in-out infinite ${delay}s` }}>
          ★
        </span>
      ))}
    </div>
  );
}

function ExtrasIllustration() {
  const rows = [0, 1, 2];
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((i) => (
        <div key={i} className="flex items-center gap-2.5" style={{ animation: `stepCheckIn 2.4s ease-out infinite ${i * 0.3}s` }}>
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
            style={{ background: "var(--accent)", color: "var(--bg)" }}
          >
            ✓
          </span>
          <span className="h-2 w-24 rounded-full" style={{ background: "var(--line)" }} />
        </div>
      ))}
    </div>
  );
}

export function StepIllustration({ variant }: { variant: Variant }) {
  const content = {
    welcome: <Welcome />,
    name: <NameIllustration />,
    sex: <SexIllustration />,
    age: <AgeIllustration />,
    height: <HeightIllustration />,
    weight: <WeightIllustration />,
    activity: <ActivityIllustration />,
    goal: <GoalIllustration />,
    days: <DaysIllustration />,
    split: <SplitIllustration />,
    equipment: <EquipmentIllustration />,
    favorites: <FavoritesIllustration />,
    extras: <ExtrasIllustration />,
  }[variant];

  return <div className="step-illustration">{content}</div>;
}

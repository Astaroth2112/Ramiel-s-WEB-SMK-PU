interface BubbleSpec {
  size: number;
  top: string;
  left?: string;
  right?: string;
  variant: 'slow' | 'drift';
  delay: string;
  opacity: number;
}

const BUBBLES: BubbleSpec[] = [
  { size: 170, top: '6%', left: '4%', variant: 'slow', delay: '0s', opacity: 0.72 },
  { size: 96, top: '18%', right: '7%', variant: 'drift', delay: '-3s', opacity: 0.78 },
  { size: 64, top: '42%', left: '12%', variant: 'drift', delay: '-6s', opacity: 0.65 },
  { size: 210, top: '56%', right: '3%', variant: 'slow', delay: '-2s', opacity: 0.58 },
  { size: 84, top: '76%', left: '6%', variant: 'slow', delay: '-5s', opacity: 0.7 },
  { size: 120, top: '82%', right: '18%', variant: 'drift', delay: '-8s', opacity: 0.64 },
  { size: 46, top: '28%', left: '46%', variant: 'slow', delay: '-4s', opacity: 0.55 },
];

export function AeroBackdrop({ subtle = false }: { subtle?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden aero-canvas"
    >
      {/* Soft sunlit horizon glow */}
      <div
        className="absolute -top-36 left-1/3 h-96 w-96 rounded-full opacity-55 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(125,211,252,0.45) 55%, transparent 100%)',
        }}
      />
      <div
        className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full opacity-45 blur-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(167,243,208,0.65) 0%, rgba(56,189,248,0.28) 60%, transparent 100%)',
        }}
      />

      {/* Translucent Frutiger Aero Glass Bubbles */}
      {BUBBLES.map((b, idx) => (
        <div
          key={idx}
          className={`aero-bubble absolute ${
            b.variant === 'slow' ? 'animate-aero-slow' : 'animate-aero-drift'
          }`}
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            top: b.top,
            left: b.left,
            right: b.right,
            animationDelay: b.delay,
            opacity: subtle ? b.opacity * 0.65 : b.opacity,
          }}
        />
      ))}
    </div>
  );
}

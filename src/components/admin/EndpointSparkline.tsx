import { memo } from "react";

interface EndpointSparklineProps {
  /** Failure ratio (0..1) per hourly bucket, oldest → newest. */
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Sparkline SVG minimalista para taxa de falhas por hora.
 * Última barra em destaque para indicar tendência recente.
 */
export const EndpointSparkline = memo(function EndpointSparkline({
  points,
  width = 72,
  height = 18,
  className,
}: EndpointSparklineProps) {
  if (!points.length) {
    return (
      <svg
        width={width}
        height={height}
        className={className}
        aria-label="Sem dados de tendência"
        role="img"
      >
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          className="stroke-muted-foreground/40"
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  const n = points.length;
  const barW = width / n;
  const gap = Math.min(1, barW * 0.2);

  return (
    <svg
      width={width}
      height={height}
      className={className}
      aria-label={`Tendência de falhas nas últimas ${n} horas`}
      role="img"
    >
      {points.map((r, i) => {
        const clamped = Math.max(0, Math.min(1, r));
        const h = Math.max(1, clamped * height);
        const x = i * barW;
        const y = height - h;
        const isLast = i === n - 1;
        const color =
          clamped >= 0.5
            ? "fill-destructive"
            : clamped >= 0.2
              ? "fill-destructive/70"
              : clamped >= 0.05
                ? "fill-warning"
                : "fill-success/70";
        return (
          <rect
            key={i}
            x={x + gap / 2}
            y={y}
            width={Math.max(1, barW - gap)}
            height={h}
            className={`${color} ${isLast ? "opacity-100" : "opacity-80"}`}
          />
        );
      })}
    </svg>
  );
});

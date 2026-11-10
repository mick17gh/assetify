"use client";

import { HEALTH_CHECK_AREAS } from "@/constants/health-check";

export function HealthMaturityRadar({
  scores,
  size = 280,
}: {
  scores: Record<string, number>;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const count = HEALTH_CHECK_AREAS.length;

  function point(index: number, value: number) {
    const angle = (-Math.PI / 2) + (index / count) * Math.PI * 2;
    const r = (Math.min(5, Math.max(0, value)) / 5) * radius;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  }

  const rings = [1, 2, 3, 4, 5];
  const polygon = HEALTH_CHECK_AREAS.map((area, index) => {
    const p = point(index, Number(scores[area.id] ?? 0));
    return `${p.x},${p.y}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-sm" role="img" aria-label="Maturity radar">
      {rings.map((ring) => {
        const pts = HEALTH_CHECK_AREAS.map((_, index) => {
          const p = point(index, ring);
          return `${p.x},${p.y}`;
        }).join(" ");
        return <polygon key={ring} points={pts} fill="none" stroke="#cbd5e1" strokeWidth="1" />;
      })}
      {HEALTH_CHECK_AREAS.map((area, index) => {
        const outer = point(index, 5);
        const label = point(index, 5.7);
        return (
          <g key={area.id}>
            <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e2e8f0" strokeWidth="1" />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-navy-900"
              fontSize="7"
            >
              {area.name.split(" ")[0]}
            </text>
          </g>
        );
      })}
      <polygon points={polygon} fill="rgba(15, 23, 42, 0.18)" stroke="#0f172a" strokeWidth="2" />
    </svg>
  );
}

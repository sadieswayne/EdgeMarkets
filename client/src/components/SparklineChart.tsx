import { useMemo } from 'react';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparklineChart({ data, width = 200, height = 50, color = 'var(--accent-primary)' }: SparklineChartProps) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = 2;
    const w = width - padding * 2;
    const h = height - padding * 2;

    const points = data.map((val, i) => ({
      x: padding + (i / (data.length - 1)) * w,
      y: padding + h - ((val - min) / range) * h,
    }));

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.4;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.6;
      d += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!path) return '';
    const lastPoint = data.length - 1;
    const padding = 2;
    const w = width - padding * 2;
    const firstX = padding;
    const lastX = padding + w;
    return `${path} L ${lastX} ${height - 2} L ${firstX} ${height - 2} Z`;
  }, [path, data.length, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {areaPath && <path d={areaPath} fill="url(#sparkFill)" />}
      {path && <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

interface ConfidenceBarsProps {
  level: 1 | 2 | 3 | 4 | 5;
}

export function ConfidenceBars({ level }: ConfidenceBarsProps) {
  return (
    <div className="flex items-end gap-[2px]" data-testid={`confidence-${level}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <div
          key={i}
          className="rounded-sm transition-colors duration-200"
          style={{
            width: 3,
            height: 6 + i * 3,
            backgroundColor: i <= level ? 'var(--accent-primary)' : 'var(--border-primary)',
          }}
        />
      ))}
    </div>
  );
}

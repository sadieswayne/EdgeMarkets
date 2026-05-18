import { useState, useEffect, useRef, memo } from 'react';

interface PriceFlashProps {
  value: string;
  flash?: 'up' | 'down' | null;
  className?: string;
}

export const PriceFlash = memo(function PriceFlash({ value, flash, className = '' }: PriceFlashProps) {
  const [animClass, setAnimClass] = useState('');
  const prevFlash = useRef(flash);

  useEffect(() => {
    if (flash && flash !== prevFlash.current) {
      setAnimClass(flash === 'up' ? 'animate-flash-green' : 'animate-flash-red');
      const timer = setTimeout(() => setAnimClass(''), 700);
      prevFlash.current = flash;
      return () => clearTimeout(timer);
    }
    prevFlash.current = flash;
  }, [flash]);

  return (
    <span className={`font-mono-nums transition-colors duration-300 ${animClass} ${className}`}>
      {value}
    </span>
  );
});

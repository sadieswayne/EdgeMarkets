const PLATFORM_BRAND_COLORS: Record<string, string> = {
  binance: '#F0B90B',
  coinbase: '#0052FF',
  bybit: '#F7A600',
  kraken: '#7B61FF',
  polymarket: '#00D395',
  kalshi: '#FF6B35',
  oanda: '#2D9CDB',
  fxcm: '#00A651',
  ibkr: '#D81B2A',
  saxo: '#0033A0',
  deribit: '#00C896',
  okx: '#FFFFFF',
};

export function PlatformLogo({ name, size = 14 }: { name: string; size?: number }) {
  const key = name.toLowerCase().replace(/\s/g, '');
  const color = PLATFORM_BRAND_COLORS[key] || 'var(--text-tertiary)';

  switch (key) {
    case 'binance':
      return (
        <svg viewBox="0 0 126.61 126.61" width={size} height={size} fill={color} className="flex-shrink-0">
          <path d="M38.73 53.2l24.59-24.58 24.6 24.6 14.3-14.31L63.32 0 24.42 38.9zM0 63.31L14.3 49l14.31 14.31L14.31 77.6zM38.73 73.41l24.59 24.59 24.6-24.6 14.31 14.29-38.91 38.91-38.9-38.88-.02.01 14.33-14.32zM98 63.31L112.3 49l14.31 14.3-14.31 14.32z"/>
          <path d="M77.83 63.3L63.32 48.78 52.59 59.51l-1.24 1.23-2.54 2.56 14.51 14.51 14.51-14.51z"/>
        </svg>
      );
    case 'coinbase':
      return (
        <svg viewBox="0 0 56 56" width={size} height={size} className="flex-shrink-0">
          <circle cx="28" cy="28" r="28" fill={color}/>
          <path d="M28 8C17 8 8 17 8 28s9 20 20 20 20-9 20-20S39 8 28 8zm-4 24c-2.2 0-4-1.8-4-4s1.8-4 4-4h8c2.2 0 4 1.8 4 4s-1.8 4-4 4h-8z" fill="#0A0E17"/>
        </svg>
      );
    case 'bybit':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <path d="M20 20h15v12H25v36h10v12H20V20zm45 0h15v60H65V68h10V32H65V20zM42 35h16v30H42V35z"/>
        </svg>
      );
    case 'kraken':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <circle cx="50" cy="50" r="46" fill="none" stroke={color} strokeWidth="6"/>
          <path d="M32 30v40h10V52l12 18h14L52 48l14-18H52L42 46V30z"/>
        </svg>
      );
    case 'polymarket':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <path d="M50 8l40 23v38L50 92 10 69V31L50 8zm0 8L16 37v26l34 20 34-20V37L50 16z"/>
          <circle cx="50" cy="50" r="12"/>
        </svg>
      );
    case 'kalshi':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <path d="M22 15h14v70H22V15zm22 0h10v28l20-28h16L68 50l24 35H76L58 55l-4 5v25H44V15z"/>
        </svg>
      );
    case 'oanda':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="5"/>
          <circle cx="50" cy="50" r="28" fill="none" stroke={color} strokeWidth="4"/>
          <circle cx="50" cy="50" r="14"/>
        </svg>
      );
    case 'fxcm':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <rect x="10" y="10" width="80" height="80" rx="8" fill="none" stroke={color} strokeWidth="5"/>
          <text x="50" y="62" textAnchor="middle" fontSize="30" fontWeight="bold" fontFamily="monospace" fill={color}>FX</text>
        </svg>
      );
    case 'ibkr':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <rect x="8" y="15" width="84" height="70" rx="6" fill="none" stroke={color} strokeWidth="5"/>
          <text x="50" y="60" textAnchor="middle" fontSize="28" fontWeight="bold" fontFamily="monospace" fill={color}>IB</text>
        </svg>
      );
    case 'saxo':
    case 'saxobank':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <rect x="5" y="20" width="90" height="60" rx="8" fill={color}/>
          <text x="50" y="58" textAnchor="middle" fontSize="24" fontWeight="bold" fontFamily="monospace" fill="#FFFFFF">SAXO</text>
        </svg>
      );
    case 'deribit':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill={color} className="flex-shrink-0">
          <path d="M50 10C27.9 10 10 27.9 10 50s17.9 40 40 40 40-17.9 40-40S72.1 10 50 10zm0 8c17.7 0 32 14.3 32 32S67.7 82 50 82 18 67.7 18 50s14.3-32 32-32z"/>
          <path d="M35 35h20c8.3 0 15 6.7 15 15s-6.7 15-15 15H35V35zm10 10v10h10c2.8 0 5-2.2 5-5s-2.2-5-5-5H45z"/>
        </svg>
      );
    case 'okx':
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} className="flex-shrink-0">
          <rect x="12" y="12" width="24" height="24" rx="3" fill={color}/>
          <rect x="38" y="12" width="24" height="24" rx="3" fill={color}/>
          <rect x="64" y="12" width="24" height="24" rx="3" fill={color}/>
          <rect x="12" y="38" width="24" height="24" rx="3" fill={color}/>
          <rect x="38" y="38" width="24" height="24" rx="3" fill="none" stroke={color} strokeWidth="3"/>
          <rect x="64" y="38" width="24" height="24" rx="3" fill={color}/>
          <rect x="12" y="64" width="24" height="24" rx="3" fill={color}/>
          <rect x="38" y="64" width="24" height="24" rx="3" fill={color}/>
          <rect x="64" y="64" width="24" height="24" rx="3" fill={color}/>
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" width={size} height={size} fill="var(--text-tertiary)" className="flex-shrink-0">
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6"/>
          <text x="50" y="58" textAnchor="middle" fontSize="36" fill="currentColor" fontFamily="monospace">
            {name.charAt(0).toUpperCase()}
          </text>
        </svg>
      );
  }
}

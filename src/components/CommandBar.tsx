import { useEffect, useState } from 'react';
import { Activity, Radio, Brain, Zap } from 'lucide-react';
import { StatusDot } from './StatusDot';

interface CommandBarProps {
  online: boolean;
  totalVessels: number;
  onInvestigate: () => void;
}

export function CommandBar({ online, totalVessels, onInvestigate }: CommandBarProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toISOString().slice(11, 19) + ' UTC');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[rgba(7,15,30,0.85)] backdrop-blur-lg border-b border-cyan-dim flex items-center px-4 gap-4">
      {/* Left: wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
              stroke="#00D4FF"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
              stroke="#00D4FF"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0"
              stroke="#00D4FF"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
          <span className="text-base font-semibold tracking-tight text-white">
            Sagar<span className="text-[#00D4FF]">Drishti</span>
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[0.625rem] font-semibold uppercase tracking-wider bg-[rgba(0,212,255,0.12)] text-[#00D4FF] border border-cyan-dim">
          SIH 2026
        </span>
      </div>

      {/* Center: status indicators */}
      <div className="flex items-center gap-5 flex-1 justify-center">
        <div className="flex items-center gap-1.5">
          <StatusDot color="#00FF88" />
          <span className="section-label">Sentinel-1</span>
          <span className="text-xs font-medium text-[#00FF88]">ACTIVE</span>
        </div>
        <div className="w-px h-5 bg-cyan-dim" />
        <div className="flex items-center gap-1.5">
          <Radio size={12} className="text-[#00D4FF]" />
          <span className="section-label">AIS Feed</span>
          <span className="text-xs font-medium text-[#00D4FF]">
            LIVE — {totalVessels || 72} ships
          </span>
        </div>
        <div className="w-px h-5 bg-cyan-dim" />
        <div className="flex items-center gap-1.5">
          <Brain size={12} className="text-[#A855F7]" />
          <span className="section-label">U-Net++</span>
          <span className="text-xs font-medium text-[#A855F7]">LOADED</span>
        </div>
        <div className="w-px h-5 bg-cyan-dim" />
        <div className="flex items-center gap-1.5">
          <Zap size={12} className={online ? 'text-[#00FF88]' : 'text-[#FFA500]'} />
          <span className="section-label">Backend</span>
          <span
            className={`text-xs font-medium ${online ? 'text-[#00FF88]' : 'text-[#FFA500]'}`}
          >
            {online ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Right: clock + button */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <Activity size={12} className="text-muted" />
          <span className="metric-value text-xs text-muted">{clock}</span>
        </div>
        <button
          onClick={onInvestigate}
          className="px-3 py-1.5 rounded-md bg-[rgba(0,212,255,0.12)] hover:bg-[rgba(0,212,255,0.2)] border border-cyan-dim text-[#00D4FF] text-xs font-semibold uppercase tracking-wider transition-all"
        >
          Run Full Investigation
        </button>
      </div>
    </header>
  );
}

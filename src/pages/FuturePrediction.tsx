import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Panel, PanelHeader } from '@/components/Panel';
import { StatusDot } from '@/components/StatusDot';
import { TrendingUp, AlertTriangle, Clock } from 'lucide-react';

const FORECAST_TIMES = [
  { label: '+6h', value: 6 },
  { label: '+12h', value: 12 },
  { label: '+24h', value: 24 },
  { label: '+48h', value: 48 },
];

const COASTAL_RISKS = [
  { name: 'Ras al Hadd Sanctuary', type: 'Marine Reserve', risk: 'HIGH', color: '#FF4444', eta: '18h' },
  { name: 'Oman Eastern Boundary', type: 'Coastal Zone', risk: 'HIGH', color: '#FF4444', eta: '24h' },
  { name: 'Sur Desalination Plant', type: 'Infrastructure', risk: 'MEDIUM', color: '#FFA500', eta: '36h' },
];

function ForecastMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTime, setSelectedTime] = useState(24);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Landmasses
      ctx.fillStyle = 'rgba(20, 45, 70, 0.6)';
      // Mainland (right side)
      ctx.beginPath();
      ctx.moveTo(w * 0.7, 0);
      ctx.lineTo(w, 0);
      ctx.lineTo(w, h);
      ctx.lineTo(w * 0.65, h);
      ctx.lineTo(w * 0.6, h * 0.5);
      ctx.lineTo(w * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      // Island
      ctx.beginPath();
      ctx.ellipse(w * 0.25, h * 0.3, w * 0.08, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      // Current spill location
      const cx = w * 0.4;
      const cy = h * 0.45;

      // Forecast spread based on time
      const spread = 1 + (selectedTime / 48) * 3;
      const driftX = (selectedTime / 48) * w * 0.15;
      const driftY = (selectedTime / 48) * h * 0.08;

      // Oil spread — multiple layers
      const t = frame * 0.02;
      for (let layer = 0; layer < 3; layer++) {
        const layerSpread = spread * (1 + layer * 0.3);
        const opacity = 0.3 - layer * 0.08;
        const offsetX = driftX + Math.sin(t + layer) * 5;
        const offsetY = driftY + Math.cos(t + layer) * 3;

        const grad = ctx.createRadialGradient(
          cx + offsetX,
          cy + offsetY,
          0,
          cx + offsetX,
          cy + offsetY,
          40 * layerSpread
        );
        grad.addColorStop(0, `rgba(255, 68, 68, ${opacity})`);
        grad.addColorStop(0.5, `rgba(255, 100, 50, ${opacity * 0.5})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(
          cx + offsetX,
          cy + offsetY,
          40 * layerSpread,
          25 * layerSpread,
          0.3,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Impact zones (pulsing)
      const pulseScale = 1 + Math.sin(t * 2) * 0.2;
      COASTAL_RISKS.forEach((risk, i) => {
        const zx = w * (0.7 + i * 0.05);
        const zy = h * (0.2 + i * 0.25);

        // Pulsing ring
        ctx.strokeStyle = risk.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + Math.sin(t * 2 + i) * 0.3;
        ctx.beginPath();
        ctx.arc(zx, zy, 15 * pulseScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Center dot
        ctx.fillStyle = risk.color;
        ctx.beginPath();
        ctx.arc(zx, zy, 3, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(risk.name, zx + 10, zy - 2);
        ctx.fillStyle = risk.color;
        ctx.fillText(risk.risk, zx + 10, zy + 8);
      });

      // Current location marker
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, 8 * pulseScale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Trajectory line
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + driftX, cy + driftY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Labels
      ctx.fillStyle = 'rgba(136, 153, 170, 0.5)';
      ctx.font = '9px Inter, sans-serif';
      ctx.fillText('SPILL ORIGIN', cx - 30, cy - 12);
      ctx.fillText('OMAN', w * 0.75, h * 0.08);
      ctx.fillText('GULF OF OMAN', w * 0.3, h * 0.08);

      frame++;
      requestAnimationFrame(animate);
    };

    animate();
  }, [selectedTime]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

export function FuturePrediction() {
  const [selectedTime, setSelectedTime] = useState(24);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Forecast Map */}
        <div className="glass-panel overflow-hidden h-[420px]">
          <PanelHeader
            title="48-Hour Forecast"
            right={
              <Badge color="warning">
                <TrendingUp size={10} /> PREDICTIVE
              </Badge>
            }
          />
          <div className="h-[calc(100%-44px)] p-2">
            <ForecastMap />
          </div>
        </div>

        {/* Timeline */}
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-label">Forecast Timeline</span>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-muted" />
              <span className="metric-value text-xs text-[#00D4FF]">T+{selectedTime}h</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {FORECAST_TIMES.map((t) => (
              <button
                key={t.label}
                onClick={() => setSelectedTime(t.value)}
                className={`px-3 py-2.5 rounded-md text-sm font-semibold transition-all border ${
                  selectedTime === t.value
                    ? 'bg-[rgba(0,212,255,0.12)] text-[#00D4FF] border-cyan-dim'
                    : 'bg-[rgba(10,22,40,0.4)] text-muted border-transparent hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spread Analysis */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Spread Area', value: `${(selectedTime * 0.8).toFixed(1)} km²`, color: '#FF4444' },
            { label: 'Drift Distance', value: `${(selectedTime * 0.3).toFixed(1)} km`, color: '#FFA500' },
            { label: 'Coastal ETA', value: `${Math.max(6, 48 - selectedTime)}h`, color: '#FFD700' },
          ].map((m) => (
            <div key={m.label} className="glass-panel p-4">
              <div className="section-label mb-1">{m.label}</div>
              <div className="metric-value text-2xl font-semibold" style={{ color: m.color }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coastal Risk Cards */}
      <div className="w-80 shrink-0 p-4 pl-0 overflow-y-auto space-y-3">
        <div className="section-label px-1">Coastal Risk Assessment</div>
        {COASTAL_RISKS.map((risk) => (
          <div
            key={risk.name}
            className="glass-panel p-4 space-y-2"
            style={{ borderLeft: `2px solid ${risk.color}` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold text-white">{risk.name}</div>
                <div className="text-[0.625rem] text-muted">{risk.type}</div>
              </div>
              <Badge color={risk.risk === 'HIGH' ? 'danger' : 'warning'}>{risk.risk}</Badge>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <StatusDot color={risk.color} />
              <span className="text-xs text-muted">
                Impact ETA: <span className="metric-value text-white">{risk.eta}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <AlertTriangle size={10} className={risk.color === '#FF4444' ? 'text-[#FF4444]' : 'text-[#FFA500]'} />
              <span className="text-[0.625rem] text-muted leading-relaxed">
                {risk.risk === 'HIGH'
                  ? 'Immediate response required — deploy containment'
                  : 'Monitor and prepare response teams'}
              </span>
            </div>
          </div>
        ))}

        <div className="glass-panel p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-[#00D4FF]" />
            <span className="section-label">Model Details</span>
          </div>
          <div className="space-y-1 text-[0.625rem] text-muted">
            <div>• OpenDrift particle simulation</div>
            <div>• Copernicus Marine currents</div>
            <div>• ERA5 wind forcing</div>
            <div>• 1000 particle ensemble</div>
            <div>• 10-minute time steps</div>
          </div>
        </div>
      </div>
    </div>
  );
}

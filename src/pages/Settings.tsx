import { Panel, PanelHeader } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { StatusDot } from '@/components/StatusDot';
import { Settings, Database, Globe, Shield, Bell } from 'lucide-react';

interface SettingsProps {
  online: boolean;
}

export function SettingsPage({ online }: SettingsProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl">
        <div className="glass-panel overflow-hidden">
          <PanelHeader title="System Settings" right={<Settings size={14} className="text-muted" />} />
          <div className="p-6 space-y-6">
            {/* API Status */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={14} className="text-[#00D4FF]" />
                <span className="section-label">API Connection</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                  <div>
                    <div className="text-sm text-white">Backend Status</div>
                    <div className="text-[0.625rem] text-muted">https://shelf-limit-sulphuric.ngrok-free.dev</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusDot color={online ? '#00FF88' : '#FFA500'} />
                    <span className="text-xs font-medium" style={{ color: online ? '#00FF88' : '#FFA500' }}>
                      {online ? 'CONNECTED' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                  <div>
                    <div className="text-sm text-white">Health Polling</div>
                    <div className="text-[0.625rem] text-muted">Every 30 seconds</div>
                  </div>
                  <Badge color="cyan">ACTIVE</Badge>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                  <div>
                    <div className="text-sm text-white">Data Refresh</div>
                    <div className="text-[0.625rem] text-muted">Vessel data every 60 seconds</div>
                  </div>
                  <Badge color="cyan">ACTIVE</Badge>
                </div>
              </div>
            </div>

            {/* Data Sources */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database size={14} className="text-[#00D4FF]" />
                <span className="section-label">Data Sources</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Sentinel-1 SAR', desc: 'Copernicus satellite imagery', status: 'ACTIVE' },
                  { name: 'Copernicus Marine', desc: 'Ocean current data', status: 'ACTIVE' },
                  { name: 'ERA5 Wind (ECMWF)', desc: 'Atmospheric reanalysis', status: 'ACTIVE' },
                  { name: 'AISStream API', desc: 'Real-time vessel positions', status: 'LIVE' },
                ].map((src) => (
                  <div key={src.name} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                    <div>
                      <div className="text-sm text-white">{src.name}</div>
                      <div className="text-[0.625rem] text-muted">{src.desc}</div>
                    </div>
                    <Badge color={src.status === 'LIVE' ? 'cyan' : 'success'}>{src.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Security */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={14} className="text-[#00D4FF]" />
                <span className="section-label">Security</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                  <div className="text-sm text-white">ngrok Browser Warning Bypass</div>
                  <Badge color="success">ENABLED</Badge>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                  <div className="text-sm text-white">Request Timeout</div>
                  <span className="metric-value text-xs text-white">15s</span>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell size={14} className="text-[#00D4FF]" />
                <span className="section-label">Notifications</span>
              </div>
              <div className="space-y-2">
                {[
                  { name: 'Anomaly Detection', desc: 'Alert when vessel anomaly detected', enabled: true },
                  { name: 'Prime Suspect Update', desc: 'Alert when attribution score changes', enabled: true },
                  { name: 'Backend Offline', desc: 'Alert when API connection lost', enabled: true },
                  { name: 'Coastal Risk', desc: 'Alert when oil spill approaches coastline', enabled: false },
                ].map((n) => (
                  <div key={n.name} className="flex items-center justify-between px-3 py-2.5 rounded-md bg-[rgba(0,212,255,0.04)]">
                    <div>
                      <div className="text-sm text-white">{n.name}</div>
                      <div className="text-[0.625rem] text-muted">{n.desc}</div>
                    </div>
                    <div
                      className={`w-9 h-5 rounded-full relative transition-colors ${n.enabled ? 'bg-[#00D4FF]/30' : 'bg-[rgba(136,153,170,0.15)]'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${n.enabled ? 'left-4 bg-[#00D4FF]' : 'left-0.5 bg-muted'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

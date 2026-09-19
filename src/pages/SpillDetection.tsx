import { useRef, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Panel, PanelHeader } from '@/components/Panel';
import { detectSpill } from '@/lib/api';
import { Upload, Loader2, ScanEye, ImageIcon } from 'lucide-react';

export function SpillDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<{ spill_detected: boolean; detection_percentage: number; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleDetect = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const r = await detectSpill(file);
      setResult(r);
    } catch {
      setError('Detection API unavailable — try again later');
    }
    setLoading(false);
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="glass-panel overflow-hidden">
          <PanelHeader
            title="SAR Spill Detection"
            right={<Badge color="success">U-NET++ READY</Badge>}
          />
          <div className="p-6 space-y-6">
            {/* Upload zone */}
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className="border-2 border-dashed border-cyan-dim rounded-xl p-8 text-center cursor-pointer hover:border-[#00D4FF] hover:bg-[rgba(0,212,255,0.03)] transition-all"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              {preview ? (
                <div className="flex flex-col items-center gap-3">
                  <img src={preview} alt="Preview" className="max-h-48 rounded-lg border border-cyan-dim" />
                  <div className="text-xs text-muted">{file?.name}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[rgba(0,212,255,0.08)] flex items-center justify-center">
                    <Upload size={24} className="text-[#00D4FF]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Drop SAR image here</div>
                    <div className="text-xs text-muted mt-1">or click to browse — JPG, PNG, TIFF</div>
                  </div>
                </div>
              )}
            </div>

            {/* Detect button */}
            <button
              onClick={handleDetect}
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-[rgba(0,212,255,0.12)] hover:bg-[rgba(0,212,255,0.2)] border border-cyan-dim text-[#00D4FF] text-sm font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Analyzing with U-Net++...
                </>
              ) : (
                <>
                  <ScanEye size={16} /> Detect Oil Spill
                </>
              )}
            </button>

            {error && (
              <div className="text-xs text-[#FFA500] text-center px-4 py-2 rounded-md bg-[rgba(255,165,0,0.06)] border border-[rgba(255,165,0,0.15)]">
                {error}
              </div>
            )}

            {/* Results */}
            {result && (
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-4 text-center">
                  <div className="section-label mb-2">Spill Detected</div>
                  <div
                    className={`metric-value text-2xl font-semibold ${result.spill_detected ? 'text-[#FF4444]' : 'text-[#00FF88]'}`}
                  >
                    {result.spill_detected ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="section-label mb-2">Coverage</div>
                  <div className="metric-value text-2xl font-semibold text-[#FFA500]">
                    {result.detection_percentage.toFixed(2)}%
                  </div>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="section-label mb-2">Confidence</div>
                  <div className="metric-value text-2xl font-semibold text-[#00D4FF]">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-72 shrink-0 p-4 pl-0 overflow-y-auto space-y-3">
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon size={14} className="text-[#00D4FF]" />
            <span className="section-label">Model Info</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Architecture</span>
              <span className="text-white">U-Net++</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Backbone</span>
              <span className="text-white">ResNet34</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Val Accuracy</span>
              <span className="text-[#00FF88]">99.3%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Loss Function</span>
              <span className="text-white">Dice + BCE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Input Size</span>
              <span className="text-white">256×256</span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-2">
          <span className="section-label">How It Works</span>
          <div className="text-[0.625rem] text-muted leading-relaxed space-y-1.5">
            <p>1. Upload a Sentinel-1 SAR image</p>
            <p>2. U-Net++ segments oil slick regions</p>
            <p>3. Detection percentage is calculated</p>
            <p>4. Confidence score reflects model certainty</p>
          </div>
        </div>
      </div>
    </div>
  );
}

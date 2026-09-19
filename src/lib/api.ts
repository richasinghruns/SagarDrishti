import axios from 'axios';

export const API_BASE = 'https://shelf-limit-sulphuric.ngrok-free.dev';

const headers = {
  'ngrok-skip-browser-warning': 'true',
};

export interface Vessel {
  name: string;
  mmsi: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  type: string;
  anomaly_score: number;
  status: string;
  is_anomaly?: boolean;
  is_prime_suspect?: boolean;
}

export interface VesselsResponse {
  total: number;
  anomalies: number;
  vessels: Vessel[];
}

export interface HealthResponse {
  status: string;
  unet: boolean;
  iso_forest: boolean;
}

export interface PrimeSuspectResponse {
  name: string;
  mmsi: string;
  attribution_score: number;
}

export interface DetectResponse {
  spill_detected: boolean;
  detection_percentage: number;
  confidence: number;
}

export interface SimulateResponse {
  footprint_size: number;
  peak_intensity: number;
}

const api = axios.create({
  baseURL: API_BASE,
  headers,
  timeout: 15000,
});

export async function getHealth(): Promise<HealthResponse> {
  const r = await api.get('/api/health');
  return r.data;
}

export async function getVessels(): Promise<VesselsResponse> {
  const r = await api.get('/api/vessels');
  return r.data;
}

export async function getPrimeSuspect(): Promise<PrimeSuspectResponse> {
  const r = await api.get('/api/prime-suspect');
  return r.data;
}

export async function detectSpill(file: File): Promise<DetectResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const r = await api.post('/api/detect', formData, {
    headers: { ...headers, 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return r.data;
}

export async function simulateSpill(
  vessel_name: string,
  lat: number,
  lon: number
): Promise<SimulateResponse> {
  const r = await api.post('/api/simulate', { vessel_name, lat, lon });
  return r.data;
}

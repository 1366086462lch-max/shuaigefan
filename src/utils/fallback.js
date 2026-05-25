// 解析 .env 中的兜底坐标，格式 "lng,lat"
export function getFallbackLocation() {
  const raw = import.meta.env.VITE_FALLBACK_LOCATION || '116.397,39.909';
  const [lng, lat] = raw.split(',').map(Number);
  return { lng, lat, source: 'fallback' };
}

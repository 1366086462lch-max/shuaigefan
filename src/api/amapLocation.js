// 高德定位封装（三级容错）
//
// 优先级：
//  1. 高德 JS SDK 定位（浏览器 GPS / WiFi，最精确，米级）
//  2. 高德 Web 服务 IP 定位（基于公网 IP，城市级精度，不需要授权）
//  3. .env 中的硬编码兜底坐标（最后保底）
//
// source 字段标识坐标来源：'amap' / 'ip' / 'fallback'
import AMapLoader from '@amap/amap-jsapi-loader';
import { getFallbackLocation } from '../utils/fallback';

let amapInstance = null;

// 高德 JS API 2021 后强制启用"安全模式"
function applySecurityConfig() {
  const secret = import.meta.env.VITE_AMAP_JS_SECRET;
  if (secret && typeof window !== 'undefined' && !window._AMapSecurityConfig) {
    window._AMapSecurityConfig = { securityJsCode: secret };
  }
}

async function loadAMap() {
  if (amapInstance) return amapInstance;

  const key = import.meta.env.VITE_AMAP_JS_KEY;
  if (!key) {
    throw new Error('VITE_AMAP_JS_KEY 未配置');
  }
  applySecurityConfig();

  amapInstance = await AMapLoader.load({
    key,
    version: '2.0',
    plugins: ['AMap.Geolocation'],
  });
  return amapInstance;
}

// 一级：高德 JS SDK 定位（精确）
async function tryAmapSdk() {
  try {
    const AMap = await loadAMap();
    return await new Promise((resolve) => {
      const geo = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });
      geo.getCurrentPosition((status, result) => {
        if (status === 'complete' && result?.position) {
          resolve({
            lng: result.position.lng,
            lat: result.position.lat,
            source: 'amap',
            accuracy: result.accuracy,
          });
        } else {
          console.warn('[location] 高德 JS SDK 定位失败:', result?.message || status, result);
          resolve(null);
        }
      });
    });
  } catch (err) {
    console.warn('[location] 高德 SDK 加载失败:', err.message);
    return null;
  }
}

// 二级：高德 Web 服务 IP 定位（基于公网 IP，城市级）
// 注意：内网 / 私网 IP 时高德可能返回 rectangle 为空数组 [] 或空字符串 ""
//      用严格的 typeof 判断而不是 !data.rectangle
async function tryIpLocation() {
  const key = import.meta.env.VITE_AMAP_WEB_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`);
    const data = await res.json();
    if (data.status !== '1') {
      console.warn('[location] 高德 IP 定位业务失败:', data.info || data);
      return null;
    }
    // 严格 type check：必须是含 ";" 的字符串
    if (typeof data.rectangle !== 'string' || !data.rectangle.includes(';')) {
      console.warn('[location] 高德 IP 定位 rectangle 字段无效（可能是内网 IP）:', data.rectangle, 'city:', data.city);
      return null;
    }
    // rectangle 格式："lng1,lat1;lng2,lat2" - 取矩形中心点
    const parts = data.rectangle.split(';').map((s) => s.split(',').map(Number));
    if (parts.length !== 2 || parts.some((p) => p.length !== 2 || p.some(isNaN))) {
      console.warn('[location] 高德 IP 定位 rectangle 解析失败:', data.rectangle);
      return null;
    }
    const [p1, p2] = parts;
    const lng = (p1[0] + p2[0]) / 2;
    const lat = (p1[1] + p2[1]) / 2;
    console.log('[location] IP 定位成功:', data.city, lng, lat);
    return { lng, lat, source: 'ip', city: data.city };
  } catch (err) {
    console.warn('[location] IP 定位请求失败:', err);
    return null;
  }
}

export async function getCurrentLocation() {
  const fromSdk = await tryAmapSdk();
  if (fromSdk) return fromSdk;

  const fromIp = await tryIpLocation();
  if (fromIp) return fromIp;

  console.warn('[location] 全部失败，使用 .env 兜底坐标');
  return getFallbackLocation();
}

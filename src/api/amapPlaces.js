// 高德 Web 服务 - 周边搜索餐饮 POI
// https://restapi.amap.com/v3/place/around
// types=050000 是餐饮服务大类
//
// 多页拉取策略：
// - 默认拉 2 页 (50 家)，覆盖比"最近 25 家"更广的范围
// - 若某页返回少于 25 家，说明已到边界，提前退出节省额度
// - 同 id 去重保险（高德同 query 不应返回重复，防御性处理）

const AROUND_URL = 'https://restapi.amap.com/v3/place/around';
const PAGE_SIZE = 25;
const DEFAULT_PAGES = 2;

export async function searchNearbyRestaurants({ lng, lat, radius = 1000, pages = DEFAULT_PAGES }) {
  const key = import.meta.env.VITE_AMAP_WEB_KEY;
  if (!key) {
    throw new Error('VITE_AMAP_WEB_KEY 未配置，请在 .env 中填入高德 Web 服务 Key');
  }

  const collected = [];
  const seen = new Set();

  for (let page = 1; page <= pages; page++) {
    const params = new URLSearchParams({
      key,
      location: `${lng},${lat}`,
      types: '050000',
      radius: String(radius),
      offset: String(PAGE_SIZE),
      page: String(page),
      extensions: 'all',
    });

    const res = await fetch(`${AROUND_URL}?${params}`);
    if (!res.ok) {
      // 第 1 页失败致命，后续页失败容忍
      if (page === 1) throw new Error(`高德接口 HTTP 错误：${res.status}`);
      console.warn(`[amap] page=${page} HTTP ${res.status}，提前结束`);
      break;
    }

    const data = await res.json();
    if (data.status !== '1') {
      if (page === 1) {
        throw new Error(`高德接口业务错误：${data.info} (infocode=${data.infocode})`);
      }
      console.warn(`[amap] page=${page} 业务错误`, data.info);
      break;
    }

    const pois = Array.isArray(data.pois) ? data.pois : [];
    let added = 0;
    for (const p of pois) {
      if (p.id && !seen.has(p.id)) {
        seen.add(p.id);
        collected.push(p);
        added++;
      }
    }

    console.log(`[amap] radius=${radius}m page=${page} 返回 ${pois.length} 家（新增 ${added}）`);

    // 这页不满 25 家，说明已经没下一页了，提前退出
    if (pois.length < PAGE_SIZE) break;
  }

  return collected;
}

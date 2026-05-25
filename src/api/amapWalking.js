// 高德 Web 服务 - 步行路径规划
// https://restapi.amap.com/v3/direction/walking
//
// 用于把"直线距离"升级为"真实步行距离 + 时间"
// 调用时机：抽中餐厅后异步触发，不阻塞揭晓动画
// 失败回退：返回 null，UI 继续用 poi.distance（直线距离）

const WALKING_URL = 'https://restapi.amap.com/v3/direction/walking';

/**
 * 查询从 from 到 to 的步行路径
 * @param {Object} args
 * @param {string} args.from - 起点 "lng,lat"
 * @param {string} args.to   - 终点 "lng,lat"
 * @returns {Promise<{distance: number, duration: number} | null>}
 *   distance 米数，duration 秒数；接口失败返回 null
 */
export async function getWalkingDistance({ from, to }) {
  const key = import.meta.env.VITE_AMAP_WEB_KEY;
  if (!key || !from || !to) return null;

  try {
    const params = new URLSearchParams({
      key,
      origin: from,
      destination: to,
    });
    const res = await fetch(`${WALKING_URL}?${params}`);
    if (!res.ok) {
      console.warn('[walking] HTTP 错误:', res.status);
      return null;
    }
    const data = await res.json();
    if (data.status !== '1' || !data.route?.paths?.length) {
      console.warn('[walking] 业务失败 / 无路径:', data.info || data);
      return null;
    }
    const path = data.route.paths[0];
    const distance = parseInt(path.distance, 10);
    const duration = parseInt(path.duration, 10);
    if (isNaN(distance) || isNaN(duration)) {
      console.warn('[walking] 解析失败:', path);
      return null;
    }
    return { distance, duration };
  } catch (err) {
    console.warn('[walking] 请求异常:', err);
    return null;
  }
}

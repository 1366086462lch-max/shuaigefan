// 调起高德 URI 跳转导航
// 优先尝试 App URI（amapuri://），失败回退到 Web URI
export function navigateTo({ lng, lat, name }) {
  const safeName = encodeURIComponent(name || '目的地');
  const webUri = `https://uri.amap.com/marker?position=${lng},${lat}&name=${safeName}&src=shuaigefan&coordinate=gaode&callnative=1`;
  window.open(webUri, '_blank', 'noopener');
}

import { getCategoryStyle, getShortType } from '../utils/categoryMap';
import { navigateTo } from '../utils/navigation';

export default function RestaurantCard({ poi, onShakeAgain, shakeButtonLabel, shakeSubtext }) {
  const { emoji, gradient, label } = getCategoryStyle(poi);
  const shortType = getShortType(poi);
  const opentime = poi.business?.opentime_today;
  const address = poi.address || poi.pname + (poi.cityname || '') + (poi.adname || '');

  // 距离显示优先级：步行（高德规划）→ 直线（POI 字段）→ 未知
  // 步行数据由 App.jsx 在卡片显示后异步追加到 poi._walking
  const walking = poi._walking;
  const distanceLabel = walking
    ? `🚶 ${walking.distance}m · 约 ${Math.max(1, Math.round(walking.duration / 60))} 分钟`
    : poi.distance
    ? `📍 直线 ${poi.distance}m`
    : '距离未知';

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl bg-white">
      <div className={`bg-gradient-to-br ${gradient} px-6 py-10 text-center`}>
        <div className="text-7xl drop-shadow-sm">{emoji}</div>
        <div className="mt-2 text-white/90 text-sm font-medium tracking-wider">
          {label}
        </div>
      </div>

      <div className="px-6 py-5">
        <h2 className="text-2xl font-bold text-slate-800 leading-tight">{poi.name}</h2>

        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {shortType}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            {distanceLabel}
          </span>
          {opentime && (
            <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700">
              🕒 {opentime}
            </span>
          )}
        </div>

        {address && (
          <p className="mt-3 text-xs text-slate-500 leading-relaxed line-clamp-2">
            {address}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={onShakeAgain}
            className="py-3 rounded-2xl border border-orange-300 text-orange-600 font-semibold active:scale-95 transition"
          >
            {shakeButtonLabel || '🎲 再摇一次'}
          </button>
          <button
            onClick={() => navigateTo({ lng: poi.location?.split(',')[0], lat: poi.location?.split(',')[1], name: poi.name })}
            className="py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-semibold active:scale-95 transition"
          >
            🧭 导航过去
          </button>
        </div>

        <div className="mt-3 text-center text-xs text-slate-400">
          {shakeSubtext || '抽空会自动刷新'}
        </div>
      </div>
    </div>
  );
}

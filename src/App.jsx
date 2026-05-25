import { useState, useCallback, useRef, useEffect } from 'react';
import { getCurrentLocation } from './api/amapLocation';
import { searchNearbyRestaurants } from './api/amapPlaces';
import { getWalkingDistance } from './api/amapWalking';
import { useShakeDetector } from './hooks/useShakeDetector';
import { filterPoolByCategory, getCategoryById } from './utils/categoryFilters';
import RestaurantCard from './components/RestaurantCard';
import RevealAnimation from './components/RevealAnimation';
import CategoryChips from './components/CategoryChips';
import { IdleView, LoadingView, EmptyView, ErrorView } from './components/StateView';

const hasKeys =
  !!import.meta.env.VITE_AMAP_JS_KEY && !!import.meta.env.VITE_AMAP_WEB_KEY;

const RADIUS_LEVELS = [1000, 2000, 5000]; // 自动扩大半径的档位

export default function App() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [current, setCurrent] = useState(null);
  const [snapshotPool, setSnapshotPool] = useState([]);
  const [categoryId, setCategoryId] = useState('all');
  const [currentRadius, setCurrentRadius] = useState(RADIUS_LEVELS[0]);

  // poolRef 缓存的是"原始池"（指定半径拉到的所有店，不过滤）
  // 每次抽取时再从中按当前类目过滤；已抽走的 id 记录在 usedIdsRef 中
  const poolRef = useRef([]);
  const usedIdsRef = useRef(new Set());

  const fetchPool = useCallback(async (radius) => {
    const loc = await getCurrentLocation();
    setLocation(loc);
    console.log('[step4] 位置：', loc, '半径', radius);
    const pois = await searchNearbyRestaurants({ lng: loc.lng, lat: loc.lat, radius });
    console.log(`[step4] 半径 ${radius}m 拉到 ${pois.length} 家候选`);
    return pois;
  }, []);

  // 从原始池中按类目过滤 + 排除已抽过的
  const buildCandidatePool = useCallback((catId) => {
    const filtered = filterPoolByCategory(poolRef.current, catId);
    return filtered.filter((p) => !usedIdsRef.current.has(p.id));
  }, []);

  // 核心抽取逻辑：先按类目筛 → 不够就升半径 → 还不够就给空状态
  const pickOne = useCallback(async (catId) => {
    // 没初始化过池就先拉一次
    if (poolRef.current.length === 0) {
      const fresh = await fetchPool(currentRadius);
      poolRef.current = fresh;
    }

    let candidates = buildCandidatePool(catId);

    // 自动扩大半径：每次扩到下一档重新拉，合并到现有池
    let radiusIdx = RADIUS_LEVELS.indexOf(currentRadius);
    while (candidates.length === 0 && radiusIdx < RADIUS_LEVELS.length - 1) {
      radiusIdx += 1;
      const nextRadius = RADIUS_LEVELS[radiusIdx];
      console.log(`[step4] ${catId} 没足够候选，扩大半径到 ${nextRadius}m`);
      const more = await fetchPool(nextRadius);
      // 用 id 去重合并
      const known = new Set(poolRef.current.map((p) => p.id));
      const merged = [...poolRef.current, ...more.filter((p) => !known.has(p.id))];
      poolRef.current = merged;
      setCurrentRadius(nextRadius);
      candidates = buildCandidatePool(catId);
    }

    if (candidates.length === 0) return null;

    const idx = Math.floor(Math.random() * candidates.length);
    const picked = candidates[idx];
    usedIdsRef.current.add(picked.id);
    return picked;
  }, [buildCandidatePool, fetchPool, currentRadius]);

  const handleShake = useCallback(async () => {
    if (status === 'loading' || status === 'revealing') return;
    if (!hasKeys) return;
    setStatus('loading');
    setError('');
    try {
      const picked = await pickOne(categoryId);
      if (!picked) {
        setStatus('empty');
        return;
      }
      const cat = getCategoryById(categoryId);
      const decoyPool = buildCandidatePool(categoryId);
      // RevealAnimation 需要至少 3 张 decoy 才好看，不足时用全池兜底
      const decoyFinal = decoyPool.length >= 3 ? decoyPool : poolRef.current;
      setSnapshotPool([...decoyFinal, picked]);
      setCurrent(picked);
      setStatus('revealing');
      console.log('[step4] 抽中：', picked.name, '| 类目:', cat.label, '| type:', picked.type, '| keytag:', picked.keytag);
    } catch (e) {
      console.error('[step4] 出错:', e);
      setError(e.message || String(e));
      setStatus('error');
    }
  }, [pickOne, status, categoryId, buildCandidatePool]);

  const shakeEnabled = status === 'idle' || status === 'showing';
  const { permission, requestPermission } = useShakeDetector({
    enabled: shakeEnabled,
    onShake: handleShake,
  });

  const handleRevealDone = useCallback(() => {
    setStatus('showing');
  }, []);

  // 切到 showing 状态后，异步查询真实步行距离 + 时间
  // 失败不影响主流程（UI 回退到直线距离）；防止 race condition（用户已经再摇了）
  useEffect(() => {
    if (status !== 'showing' || !current || !location) return;
    if (current._walking) return; // 这一家已经查过了

    let cancelled = false;
    const targetId = current.id;
    const targetName = current.name;
    (async () => {
      const walking = await getWalkingDistance({
        from: `${location.lng},${location.lat}`,
        to: current.location,
      });
      if (cancelled || !walking) return;
      // 仍是同一家店时才更新，避免覆盖已切换到的新结果
      setCurrent((prev) => (prev?.id === targetId ? { ...prev, _walking: walking } : prev));
      console.log('[walking] 步行 distance/duration:', walking, '←', targetName);
    })();

    return () => { cancelled = true; };
  }, [status, current, location]);

  const handleStart = useCallback(async () => {
    if (permission === 'needs-request') {
      await requestPermission();
    }
    handleShake();
  }, [permission, requestPermission, handleShake]);

  // 切换类目：不立即重摇，等用户主动触发；如果当前显示的卡片已不属于新类目，
  // 不强制清空（保留视觉上下文），由"再摇一次"按钮触发新筛选
  const handleCategoryChange = useCallback((newId) => {
    setCategoryId(newId);
    console.log('[step4] 切换类目:', getCategoryById(newId).label);
  }, []);

  // 根据当前类目 / 原池 / 已抽集 / 半径，生成"再摇按钮"的文案
  // 区分三种 0 候选情况：a) 全部已摇完  b) 类目在池里就没  c) 类目有但都抽过
  function getShakeHint() {
    const remaining = buildCandidatePool(categoryId).length;
    if (remaining > 0) {
      return {
        buttonLabel: '🎲 再摇一次',
        subtext: `缓存中还剩 ${remaining} 家候选 · 抽空会自动刷新`,
      };
    }

    const cat = getCategoryById(categoryId);
    const radiusLabel = currentRadius >= 1000 ? `${currentRadius / 1000}km` : `${currentRadius}m`;
    const isMaxRadius = currentRadius === RADIUS_LEVELS[RADIUS_LEVELS.length - 1];

    if (categoryId === 'all') {
      return {
        buttonLabel: isMaxRadius ? '🎲 试试再摇' : '🔍 扩大范围再摇',
        subtext: isMaxRadius
          ? `${radiusLabel} 内的店都摇过了，可能没结果`
          : '附近的店都摇过了，再摇会自动扩大搜索范围',
      };
    }

    // 类目模式：判断"池里有没有匹配这个类目的店"
    const matchingInPool = filterPoolByCategory(poolRef.current, categoryId);
    const allInPoolCount = matchingInPool.length;

    if (allInPoolCount === 0) {
      // 情况 B：当前半径池里压根没有该类目
      return {
        buttonLabel: `🔍 搜索更多${cat.label}`,
        subtext: isMaxRadius
          ? `${radiusLabel} 内暂无「${cat.label}」店，试试其他类目?`
          : `当前 ${radiusLabel} 内暂无「${cat.label}」店，再摇会扩大范围`,
      };
    }

    // 情况 C：池里有该类目但都被抽过了（可能是别的类目模式下抽走的）
    return {
      buttonLabel: isMaxRadius ? '🎲 试试再摇' : '🔍 扩大范围再摇',
      subtext: isMaxRadius
        ? `附近「${cat.label}」都被抽过了，试试其他类目?`
        : `附近「${cat.label}」都被抽过了，再摇会扩大搜索范围`,
    };
  }

  const showChips = status !== 'revealing' && status !== 'loading';
  const currentCategory = getCategoryById(categoryId);
  const shakeHint = (status === 'showing' && current) ? getShakeHint() : null;

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex flex-col px-4 py-6">
      <header className="w-full max-w-md mx-auto text-center mb-3">
        <h1 className="text-2xl font-bold text-orange-600">甩个饭</h1>
        <p className="text-xs text-slate-500 mt-0.5">摇一摇，决定吃什么</p>
      </header>

      {!hasKeys && (
        <div className="w-full max-w-md mx-auto mb-3 p-3 rounded-xl bg-yellow-50 border border-yellow-300 text-xs text-yellow-900">
          ⚠️ 还没配置高德 Key，请在 <code>app/.env</code> 填入后重启 dev server
        </div>
      )}

      {showChips && (
        <div className="mb-2">
          <CategoryChips
            value={categoryId}
            onChange={handleCategoryChange}
            disabled={false}
          />
        </div>
      )}

      <main className="flex-1 flex items-center justify-center">
        {status === 'idle' && <IdleView onStart={handleStart} hasKeys={hasKeys} />}
        {status === 'loading' && <LoadingView />}
        {status === 'empty' && (
          <EmptyView
            onRetry={handleStart}
            categoryLabel={categoryId === 'all' ? null : currentCategory.label}
            radius={currentRadius}
            onSwitchAll={() => {
              setCategoryId('all');
              handleStart();
            }}
          />
        )}
        {status === 'error' && <ErrorView message={error} onRetry={handleStart} />}
        {status === 'revealing' && current && (
          <RevealAnimation pool={snapshotPool} final={current} onDone={handleRevealDone} />
        )}
        {status === 'showing' && current && (
          <RestaurantCard
            poi={current}
            onShakeAgain={handleStart}
            shakeButtonLabel={shakeHint.buttonLabel}
            shakeSubtext={shakeHint.subtext}
          />
        )}
      </main>

      <footer className="w-full max-w-md mx-auto mt-5 text-center text-xs text-slate-400 space-y-1">
        {location && (status === 'showing' || status === 'revealing') && (
          <div>
            📍 {
              location.source === 'amap' ? '高德定位' :
              location.source === 'ip' ? `IP 定位${location.city ? `（${location.city}）` : ''}` :
              '兜底坐标'
            } · {location.lng.toFixed(4)}, {location.lat.toFixed(4)} · 半径 {currentRadius}m
          </div>
        )}
        {(status === 'idle' || status === 'showing') && permission === 'granted' && (
          <div className="text-slate-400">💡 摇动手机也能触发</div>
        )}
      </footer>
    </div>
  );
}

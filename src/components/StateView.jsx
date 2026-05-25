// 加载 / 空列表 / 错误 三态展示组件

export function LoadingView() {
  return (
    <div className="w-full max-w-md mx-auto py-16 text-center">
      <div className="inline-block w-12 h-12 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
      <p className="mt-4 text-sm text-slate-500">正在寻找附近的好吃的…</p>
    </div>
  );
}

export function EmptyView({ onRetry, categoryLabel, radius, onSwitchAll }) {
  const isCategoryEmpty = !!categoryLabel;
  return (
    <div className="w-full max-w-md mx-auto py-10 text-center px-6">
      <div className="text-6xl">🥲</div>
      {isCategoryEmpty ? (
        <>
          <p className="mt-3 text-slate-700 font-medium">
            附近 {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`} 内没找到
            <span className="text-orange-600">「{categoryLabel}」</span>
          </p>
          <p className="mt-1 text-sm text-slate-500">换个类目试试，或者就让我帮你随便摇？</p>
          <div className="mt-5 flex gap-2 justify-center">
            <button
              onClick={onSwitchAll}
              className="px-5 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold active:scale-95"
            >
              🎲 摇全部
            </button>
            <button
              onClick={onRetry}
              className="px-5 py-2 rounded-full border border-slate-300 text-slate-600 text-sm font-semibold active:scale-95"
            >
              重试
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-slate-700 font-medium">附近 {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`} 内没找到餐厅</p>
          <p className="mt-1 text-sm text-slate-500">试试换个位置？</p>
          <button
            onClick={onRetry}
            className="mt-5 px-6 py-2 rounded-full bg-orange-500 text-white text-sm font-semibold active:scale-95"
          >
            重新搜索
          </button>
        </>
      )}
    </div>
  );
}

export function ErrorView({ message, onRetry }) {
  return (
    <div className="w-full max-w-md mx-auto py-10 px-6">
      <div className="rounded-2xl bg-red-50 border border-red-200 p-5 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="mt-2 text-red-700 font-medium">出错了</p>
        <p className="mt-1 text-xs text-red-600 break-all">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-6 py-2 rounded-full bg-red-500 text-white text-sm font-semibold active:scale-95"
        >
          重试
        </button>
      </div>
    </div>
  );
}

export function IdleView({ onStart, hasKeys }) {
  return (
    <div className="w-full max-w-md mx-auto py-12 text-center">
      <div className="text-7xl animate-pulse">🍱</div>
      <p className="mt-4 text-slate-700 text-lg font-medium">饿了吗？</p>
      <p className="mt-1 text-sm text-slate-500">让我帮你随机抽一家附近的店</p>

      <button
        onClick={onStart}
        disabled={!hasKeys}
        className="mt-6 px-10 py-4 rounded-full bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold shadow-xl shadow-orange-200 transition"
      >
        {hasKeys ? '🎲 摇一摇' : '请先配置高德 Key'}
      </button>
    </div>
  );
}

import { CATEGORIES } from '../utils/categoryFilters';

// 横向滚动的 chip 按钮组
// 选中态 = 橙色填充，未选中态 = 白底浅边
export default function CategoryChips({ value, onChange, disabled }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className="flex gap-2 overflow-x-auto px-1 py-1 -mx-1 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {CATEGORIES.map((c) => {
          const active = c.id === value;
          return (
            <button
              key={c.id}
              onClick={() => !disabled && onChange(c.id)}
              disabled={disabled}
              className={[
                'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition select-none',
                active
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-200'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-orange-300',
                disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95 cursor-pointer',
              ].join(' ')}
              aria-pressed={active}
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

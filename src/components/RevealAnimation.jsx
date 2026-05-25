import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCategoryStyle } from '../utils/categoryMap';

// 老虎机式揭晓动画：
// 先在候选 decoys 中快速滚动（每张越来越慢），最后停在 final 上交给外层 onDone
//
// 时间表（默认）：8 张 decoy + 1 张 final，每张时长按 1.25 的系数递增（80ms → ~600ms）
// 总时长约 2.0s，足够看清是"在抽取"，但不会等到不耐烦

const DEFAULT_DECOY_COUNT = 7;
const BASE_DURATION = 80; // ms
const SLOW_FACTOR = 1.28;

export default function RevealAnimation({ pool, final, onDone }) {
  // 取 N 个 decoy（不含 final），加上 final 作为最后一帧
  const [frames] = useState(() => {
    const shuffled = pool.filter((p) => p.id !== final.id).slice(0, DEFAULT_DECOY_COUNT);
    return [...shuffled, final];
  });
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= frames.length - 1) {
      const timer = setTimeout(() => onDone?.(), 400);
      return () => clearTimeout(timer);
    }
    const duration = Math.round(BASE_DURATION * Math.pow(SLOW_FACTOR, index));
    const timer = setTimeout(() => setIndex((i) => i + 1), duration);
    return () => clearTimeout(timer);
  }, [index, frames.length, onDone]);

  const current = frames[index];
  const style = getCategoryStyle(current);
  const isFinal = index === frames.length - 1;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative h-72 overflow-hidden rounded-3xl shadow-2xl">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={index}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{
              duration: isFinal ? 0.45 : 0.12,
              ease: isFinal ? [0.2, 0.8, 0.2, 1] : 'linear',
            }}
            className={`absolute inset-0 bg-gradient-to-br ${style.gradient} flex flex-col items-center justify-center`}
          >
            <div className="text-8xl drop-shadow-lg">{style.emoji}</div>
            <div className="mt-3 text-white text-xl font-bold tracking-wide max-w-[80%] text-center line-clamp-1">
              {current?.name || '...'}
            </div>
            <div className="mt-1 text-white/80 text-xs">{style.label}</div>
          </motion.div>
        </AnimatePresence>

        {!isFinal && (
          <div className="absolute bottom-3 left-0 right-0 text-center text-white/90 text-xs font-mono">
            抽取中…
          </div>
        )}
      </div>
    </div>
  );
}

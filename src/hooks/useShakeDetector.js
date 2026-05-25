import { useEffect, useState, useCallback, useRef } from 'react';

// 摇一摇检测 hook
//
// 设计要点：
// - Android Chrome：DeviceMotion 直接可用，无需用户授权
// - iOS Safari 13+：DeviceMotionEvent.requestPermission() 必须在用户点击中调用
// - 阈值算法：取过去 ~500ms 窗口内三轴加速度绝对值之和，超过 threshold 触发
// - 触发后 1.5s 冷却，防止一次摇动连续触发多次
//
// 返回：{ permission, requestPermission, supported }
// permission: 'granted' | 'denied' | 'needs-request' | 'unsupported'

const WINDOW_MS = 500;
const COOLDOWN_MS = 1500;
const DEFAULT_THRESHOLD = 30;

export function useShakeDetector({ enabled = true, onShake, threshold = DEFAULT_THRESHOLD } = {}) {
  const [permission, setPermission] = useState('granted');
  const [supported, setSupported] = useState(true);
  const onShakeRef = useRef(onShake);
  onShakeRef.current = onShake;

  // 初始化判断设备支持情况和授权状态
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') {
      setSupported(false);
      setPermission('unsupported');
      return;
    }
    // iOS 13+ 需要显式授权
    if (typeof window.DeviceMotionEvent.requestPermission === 'function') {
      setPermission('needs-request');
    } else {
      setPermission('granted');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === 'undefined' || typeof window.DeviceMotionEvent === 'undefined') {
      setPermission('unsupported');
      return 'unsupported';
    }
    if (typeof window.DeviceMotionEvent.requestPermission !== 'function') {
      setPermission('granted');
      return 'granted';
    }
    try {
      const result = await window.DeviceMotionEvent.requestPermission();
      setPermission(result === 'granted' ? 'granted' : 'denied');
      return result;
    } catch (err) {
      console.warn('[shake] requestPermission 失败:', err);
      setPermission('denied');
      return 'denied';
    }
  }, []);

  // 绑定摇一摇监听
  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    if (typeof window === 'undefined') return;

    let lastFireTime = 0;
    const samples = []; // {t, dx, dy, dz}
    let lastAccel = null;

    const handler = (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc || acc.x == null) return;

      const now = Date.now();
      if (lastAccel) {
        const dx = Math.abs(acc.x - lastAccel.x);
        const dy = Math.abs(acc.y - lastAccel.y);
        const dz = Math.abs(acc.z - lastAccel.z);
        samples.push({ t: now, delta: dx + dy + dz });

        // 清理过期样本
        while (samples.length && now - samples[0].t > WINDOW_MS) {
          samples.shift();
        }

        const windowSum = samples.reduce((s, x) => s + x.delta, 0);
        if (windowSum > threshold && now - lastFireTime > COOLDOWN_MS) {
          lastFireTime = now;
          samples.length = 0;
          onShakeRef.current?.();
        }
      }
      lastAccel = { x: acc.x, y: acc.y, z: acc.z };
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [enabled, permission, threshold]);

  return { permission, requestPermission, supported };
}

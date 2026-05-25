// 根据高德 POI 的 type 字段匹配品类 emoji + Tailwind 渐变背景
// type 字段示例："餐饮服务;中餐厅;川菜" / "餐饮服务;餐饮相关场所;餐饮相关"
//
// 规则**顺序敏感**：辨识度高/具体的品类在前，通用兜底在后

const RULES = [
  // —— 地方菜系（最具体，优先匹配） ——
  { keys: ['川', '火锅', '麻辣', '串串'], emoji: '🌶️', gradient: 'from-red-400 to-orange-500', label: '川菜/火锅' },
  { keys: ['湘', '湖南'], emoji: '🌶️', gradient: 'from-red-500 to-rose-600', label: '湘菜' },
  { keys: ['粤', '茶餐厅', '港式', '广东'], emoji: '🦐', gradient: 'from-amber-300 to-yellow-500', label: '粤菜' },
  { keys: ['东北'], emoji: '🥟', gradient: 'from-red-300 to-orange-400', label: '东北菜' },
  { keys: ['江浙', '本帮', '杭帮', '上海'], emoji: '🥢', gradient: 'from-emerald-300 to-teal-400', label: '江浙菜' },
  { keys: ['云南', '滇'], emoji: '🍄', gradient: 'from-lime-300 to-green-500', label: '云南菜' },
  { keys: ['新疆', '清真'], emoji: '🥩', gradient: 'from-orange-500 to-red-600', label: '新疆/清真' },
  { keys: ['西北', '陕西', '兰州'], emoji: '🥟', gradient: 'from-yellow-400 to-amber-500', label: '西北菜' },

  // —— 异国料理 ——
  { keys: ['日本料理', '寿司', '日式', '居酒屋'], emoji: '🍣', gradient: 'from-pink-300 to-rose-400', label: '日料' },
  { keys: ['韩', '烤肉', '石锅'], emoji: '🥩', gradient: 'from-orange-400 to-red-500', label: '韩餐/烤肉' },
  { keys: ['西餐', '牛排', '意大利', '法餐'], emoji: '🍝', gradient: 'from-amber-400 to-orange-600', label: '西餐' },
  { keys: ['泰国', '东南亚', '越南'], emoji: '🍤', gradient: 'from-lime-400 to-amber-400', label: '东南亚菜' },

  // —— 烹饪形式 / 餐厅类型 ——
  { keys: ['火锅'], emoji: '🍲', gradient: 'from-red-400 to-orange-500', label: '火锅' },
  { keys: ['烧烤', '烤串'], emoji: '🍢', gradient: 'from-red-300 to-orange-400', label: '烧烤' },
  { keys: ['海鲜'], emoji: '🦞', gradient: 'from-cyan-300 to-blue-400', label: '海鲜' },
  { keys: ['素食', '素菜'], emoji: '🥗', gradient: 'from-green-300 to-emerald-400', label: '素食' },
  { keys: ['自助'], emoji: '🍽️', gradient: 'from-violet-300 to-purple-400', label: '自助餐' },
  { keys: ['现炒', '自选', '小炒', '快炒', '私厨', '私房菜', '家常'], emoji: '🥘', gradient: 'from-amber-400 to-orange-500', label: '现炒/家常' },

  // —— 主食类 ——
  { keys: ['面', '米线', '粉', '拉面'], emoji: '🍜', gradient: 'from-orange-300 to-amber-400', label: '面馆' },
  { keys: ['饺子', '包子', '馄饨'], emoji: '🥟', gradient: 'from-amber-300 to-orange-400', label: '饺子/面点' },
  { keys: ['汉堡', '炸鸡', '披萨'], emoji: '🍔', gradient: 'from-yellow-300 to-amber-500', label: '快餐' },
  { keys: ['猪脚饭', '卤肉饭', '盖饭', '焖饭', '套餐', '简餐', '快餐', '烧腊'], emoji: '🍚', gradient: 'from-amber-400 to-orange-500', label: '盖饭/简餐' },

  // —— 饮品 / 甜品 ——
  { keys: ['咖啡', '茶', '饮品', '奶茶'], emoji: '☕', gradient: 'from-amber-200 to-orange-300', label: '咖啡/茶饮' },
  { keys: ['甜品', '蛋糕', '面包', '烘焙', '冰淇淋'], emoji: '🍰', gradient: 'from-pink-200 to-rose-300', label: '甜品' },

  // —— 通用兜底（在所有具体规则之后） ——
  { keys: ['中餐厅', '中式'], emoji: '🥡', gradient: 'from-amber-300 to-orange-400', label: '中餐' },
  { keys: ['餐饮相关', '餐厅', '美食'], emoji: '🍱', gradient: 'from-orange-300 to-amber-400', label: '美食' },
];

// 终极兜底：用暖色而不是灰色，作品集观感更好
const FALLBACK = { emoji: '🍱', gradient: 'from-orange-200 to-amber-400', label: '餐厅' };

// 接受字符串（旧）或整个 poi 对象（新）
// 新模式会同时匹配 type + keytag + name 三个字段，命中率高得多
export function getCategoryStyle(poiOrType = '') {
  const text = buildSearchText(poiOrType);
  for (const rule of RULES) {
    if (rule.keys.some((k) => text.includes(k))) {
      return { emoji: rule.emoji, gradient: rule.gradient, label: rule.label };
    }
  }
  return FALLBACK;
}

// 显示用：优先用 keytag（"羊肉粉" 比 "中餐厅" 信息量大），其次取 type 末级
export function getShortType(poiOrType = '') {
  if (poiOrType && typeof poiOrType === 'object') {
    if (poiOrType.keytag) return poiOrType.keytag;
    if (poiOrType.type) {
      const parts = poiOrType.type.split(';').filter(Boolean);
      return parts[parts.length - 1] || '餐厅';
    }
    return '餐厅';
  }
  const parts = String(poiOrType).split(';').filter(Boolean);
  return parts[parts.length - 1] || '餐厅';
}

function buildSearchText(poiOrType) {
  if (typeof poiOrType === 'string') return poiOrType;
  if (poiOrType && typeof poiOrType === 'object') {
    return [poiOrType.type, poiOrType.keytag, poiOrType.name]
      .filter(Boolean).join(' ');
  }
  return '';
}

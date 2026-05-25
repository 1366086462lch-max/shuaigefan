// 品类筛选白名单（严格匹配，不复用 categoryMap）
//
// 设计原则：
// 1. 用户选了"奶茶"就只要奶茶，不能窜到"茶餐厅"
// 2. 每个类目的关键词在 type / keytag / name 三个字段任一命中即视为匹配
// 3. "全部" id 是 'all'，跳过过滤逻辑
//
// 类目划分参考：早餐 / 正餐 / 小吃 / 饮品 / 甜品 / 夜宵
// 注意：正餐和小吃可能有少量重叠（如"快餐"），优先保守划分到小吃

export const CATEGORIES = [
  { id: 'all', label: '全部', emoji: '🎲', keys: null }, // null = 不过滤
  {
    id: 'breakfast',
    label: '早餐',
    emoji: '🥟',
    // 高德没有"早餐"分类标签，靠多源关键词联合匹配
    keys: [
      // 显式带"早"字
      '早餐', '早茶', '早点',
      // 早餐食物
      '包子', '油条', '豆浆', '豆腐脑', '豆花',
      '粥', '肠粉', '烧饼', '煎饼', '糍粑',
      '生煎', '小笼包', '锅贴',
      // 早餐为主的连锁/类型店
      '茶餐厅', '沙县小吃', '兰州拉面',
      '麦当劳', '肯德基', 'KFC',
      // 直接含"早"字的店
      '早起', '一品早'
    ],
  },
  {
    id: 'main',
    label: '正餐',
    emoji: '🍱',
    keys: [
      '中餐厅', '川菜', '粤菜', '湘菜', '江浙菜', '本帮', '东北菜', '云南菜', '新疆',
      '西餐', '牛排', '意大利', '法餐', '日本料理', '寿司', '韩餐', '韩国料理',
      '海鲜', '火锅', '现炒', '家常', '私厨', '私房菜', '烤肉',
    ],
  },
  {
    id: 'snack',
    label: '小吃',
    emoji: '🍜',
    keys: [
      '小吃', '快餐', '简餐', '面馆', '米线', '粉', '拉面', '盖饭', '猪脚饭',
      '卤肉饭', '焖饭', '烧腊', '汉堡', '炸鸡', '披萨', '饺子', '馄饨',
    ],
  },
  {
    id: 'drink',
    label: '饮品',
    emoji: '🧋',
    keys: ['奶茶', '茶饮', '咖啡', '咖啡厅', '果汁', '鲜榨', '饮品店'],
  },
  {
    id: 'dessert',
    label: '甜品',
    emoji: '🍰',
    keys: ['甜品', '蛋糕', '面包', '烘焙', '冰淇淋', '甜点', '糕点'],
  },
  {
    id: 'latenight',
    label: '夜宵',
    emoji: '🍢',
    keys: ['烧烤', '烤串', '串串', '大排档', '夜宵', '海鲜大排档'],
  },
];

export function getCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];
}

// 判断单个 POI 是否匹配指定类目
export function poiMatchesCategory(poi, categoryId) {
  if (!categoryId || categoryId === 'all') return true;
  const cat = getCategoryById(categoryId);
  if (!cat.keys) return true;
  const text = [poi.type, poi.keytag, poi.name].filter(Boolean).join(' ');
  return cat.keys.some((k) => text.includes(k));
}

// 从候选池中筛出符合类目的 POI
export function filterPoolByCategory(pool, categoryId) {
  if (!categoryId || categoryId === 'all') return pool;
  return pool.filter((poi) => poiMatchesCategory(poi, categoryId));
}

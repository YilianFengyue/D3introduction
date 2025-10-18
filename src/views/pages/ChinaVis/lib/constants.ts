import type { FeatureDef } from '../types';

// ============================================
// 聚类颜色（与其他视图保持一致）
// ============================================
export const CLUSTER_COLORS = [
  '#2E86DE', // 蓝色 - Cluster 0
  '#F39C12', // 橙色 - Cluster 1
  '#10AC84', // 绿色 - Cluster 2
  '#8E44AD', // 紫色 - Cluster 3
  '#D63031', // 红色 - Cluster 4
];

export const CLUSTER_NAMES = [
  '高效拖延者 (Efficient Procrastinators)',
  '积极探索者 (Diligent Explorers)',
  '卓越学习者 (Outstanding Learners)',
  'Cluster 3',
  'Cluster 4',
];

// ============================================
// 特征定义
// ============================================
export const FEATURE_DEFS: FeatureDef[] = [
  {
    key: 'acc_last',
    label: '答题得分',
    description: '最后一次提交的平均得分（归一化）',
    range: [0, 1],
  },
  {
    key: 'gain',
    label: '学习增益',
    description: '最后得分 - 首次得分',
    range: [-1, 1],
  },
  {
    key: 'redo_rate',
    label: '重做率',
    description: '多次尝试的题目占比',
    range: [0, 1],
  },
  {
    key: 'avg_time',
    label: '时间复杂度',
    description: '平均耗时（归一化）',
    range: [0, 1],
  },
  {
    key: 'spacing_med',
    label: '复习间隔',
    description: '相邻提交时间间隔中位数',
    range: [0, 1],
  },
  {
    key: 'night_ratio',
    label: '夜间学习',
    description: '22:00-07:00提交占比',
    range: [0, 1],
  },
  {
    key: 'explore_bonus',
    label: '探索加成',
    description: 'AC后继续尝试的次数',
    range: [0, 1],
  },
  {
    key: 'enthusiasm_bonus',
    label: '热情加成',
    description: '题目发布后提交的及时性',
    range: [0, 1],
  },
];

// ============================================
// 数据路径
// ============================================
export const DATA_PATHS = {
  students: '/chinavis-data/Data_StudentInfo.csv',
  titles: '/chinavis-data/Data_TitleInfo.csv',
  getClassRecords: (classNum: number) => 
    `/chinavis-data/SubmitRecord/SubmitRecord-Class${classNum}.csv`,
};

// 总共有15个班级
export const CLASS_NUMS = Array.from({ length: 15 }, (_, i) => i + 1);

// ============================================
// 状态映射
// ============================================
export const STATE_SCORE_MAP: Record<string, number> = {
  'Absolutely_Correct': 1,
  'Partially_Correct': 0.5,
  'Absolutely_Error': 0,
  'Error1': 0,
  'Error2': 0,
  'Error3': 0,
  'Error4': 0,
  'Error5': 0,
  'Error6': 0,
};

// ============================================
// 可视化配置
// ============================================
export const VIS_CONFIG = {
  width: 600,
  height: 450,
  padding: { top: 20, right: 20, bottom: 40, left: 50 },
  pointRadius: 4,
  pointRadiusHover: 6,
  pointRadiusSelected: 5,
  opacityNormal: 0.7,
  opacityDimmed: 0.2,
  opacitySelected: 1,
};
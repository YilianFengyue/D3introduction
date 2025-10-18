// ============================================
// 原始数据类型（CSV字段映射）
// ============================================

/** 提交记录（日志） */
export interface SubmitRecord {
  index: number;
  class: string;
  time: number;
  state: string;
  score: number;
  title_ID: string;
  method: string;
  memory: number;
  timeconsume: number;
  student_ID: string;
  // 派生字段（前端计算）
  pct_score?: number;        // 归一化分数 (score/score_max)
  correct?: number;          // 0=错误, 0.5=部分正确, 1=完全正确
  hour?: number;             // 提交时刻（小时）
  week?: number;             // 提交周数
  attempt_idx?: number;      // 该生该题的第几次尝试
  delta_t?: number;          // 距离上次提交的时间间隔（秒）
}

/** 题目信息 */
export interface TitleInfo {
  index: number;
  title_ID: string;
  score: number;             // 满分
  knowledge: string;         // 知识点
  sub_knowledge: string;     // 子知识点
}

/** 学生信息 */
export interface StudentInfo {
  index: number;
  student_ID: string;
  sex: string;
  age: number;
  major: string;
}

// ============================================
// 聚合后的学生特征
// ============================================

/** 学生画像特征（用于聚类） */
export interface StudentFeatures {
  student_ID: string;
  class: string;
  
  // 8个核心特征
  acc_last: number;          // 最后一次平均得分
  gain: number;              // 学习增益 (acc_last - acc_first)
  redo_rate: number;         // 重做率（多次尝试的题占比）
  avg_time: number;          // 平均耗时（归一化）
  spacing_med: number;       // 时间间隔中位数（复习强度）
  night_ratio: number;       // 夜间学习占比（22:00-07:00）
  explore_bonus: number;     // 探索加成（AC后继续尝试）
  enthusiasm_bonus: number;  // 热情加成（发布后多快提交）
  
  // 元信息
  meta: {
    attempts: number;        // 总提交次数
    samples: number;         // 做过的题目数
    major?: string;
    sex?: string;
    age?: number;
  };
}

/** 可视化数据点（聚类+降维后） */
export interface StudentPoint extends StudentFeatures {
  x: number;                 // PCA降维后的x坐标
  y: number;                 // PCA降维后的y坐标
  cluster: number;           // 聚类标签 (0, 1, 2, ...)
  
  // UI状态
  cx?: number;               // SVG画布上的x像素
  cy?: number;               // SVG画布上的y像素
  selected?: boolean;        // 是否被选中
  visible?: boolean;         // 是否可见（图例筛选）
}

// ============================================
// 配置类型
// ============================================

/** 聚类配置 */
export interface ClusterConfig {
  k: number;                 // 聚类数量
  features: string[];        // 使用的特征名
  classes: string[];         // 筛选的班级
  majors: string[];          // 筛选的专业
}

/** 特征定义 */
export interface FeatureDef {
  key: keyof StudentFeatures;
  label: string;
  description: string;
  range: [number, number];   // 用于归一化或筛选
}
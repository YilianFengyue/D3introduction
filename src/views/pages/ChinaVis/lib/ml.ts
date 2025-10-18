import * as d3 from 'd3';

// ============================================
// Z-Score 标准化
// ============================================

/**
 * 对特征矩阵进行 z-score 标准化
 * 返回：{ zscored: 标准化后的矩阵, means: 各列均值, stds: 各列标准差 }
 */
export function zscore(X: number[][]): {
  zscored: number[][];
  means: number[];
  stds: number[];
} {
  if (X.length === 0) return { zscored: [], means: [], stds: [] };

  const nFeatures = X[0].length;
  const means: number[] = [];
  const stds: number[] = [];

  // 计算每列的均值和标准差
  for (let j = 0; j < nFeatures; j++) {
    const col = X.map(row => row[j]);
    const mean = d3.mean(col) || 0;
    const std = d3.deviation(col) || 1;
    means.push(mean);
    stds.push(std);
  }

  // 标准化
  const zscored = X.map(row =>
    row.map((val, j) => (val - means[j]) / (stds[j] || 1))
  );

  return { zscored, means, stds };
}

// ============================================
// K-Means 聚类
// ============================================

/**
 * K-Means++ 初始化（选择初始聚类中心）
 */
function kmeansppInit(X: number[][], k: number): number[][] {
  const n = X.length;
  const centers: number[][] = [];

  // 随机选择第一个中心
  centers.push(X[Math.floor(Math.random() * n)]);

  // 依次选择剩余中心
  for (let i = 1; i < k; i++) {
    const distances = X.map(x => {
      const minDist = Math.min(...centers.map(c => euclidean(x, c)));
      return minDist * minDist;
    });

    const sum = d3.sum(distances);
    const rand = Math.random() * sum;
    let cumsum = 0;
    
    for (let j = 0; j < n; j++) {
      cumsum += distances[j];
      if (cumsum >= rand) {
        centers.push(X[j]);
        break;
      }
    }
  }

  return centers;
}

/**
 * 欧氏距离
 */
function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, i) => sum + (val - b[i]) ** 2, 0)
  );
}

/**
 * K-Means 聚类
 * 返回：每个样本的聚类标签 (0, 1, ..., k-1)
 */
export function kmeans(X: number[][], k: number, maxIter = 100): number[] {
  if (X.length === 0) return [];
  if (k <= 0 || k > X.length) k = Math.min(3, X.length);

  const n = X.length;
  let centers = kmeansppInit(X, k);
  let labels = new Array(n).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // 分配标签（找最近的中心）
    const newLabels = X.map(x => {
      const distances = centers.map(c => euclidean(x, c));
      return distances.indexOf(Math.min(...distances));
    });

    // 检查是否收敛
    if (newLabels.every((l, i) => l === labels[i])) {
      break;
    }
    labels = newLabels;

    // 更新中心（计算每簇的均值）
    centers = Array.from({ length: k }, (_, c) => {
      const clusterPoints = X.filter((_, i) => labels[i] === c);
      if (clusterPoints.length === 0) return centers[c]; // 空簇保持原中心

      const dim = X[0].length;
      return Array.from({ length: dim }, (_, j) =>
        d3.mean(clusterPoints.map(p => p[j])) || 0
      );
    });
  }

  return labels;
}

// ============================================
// PCA 降维
// ============================================

/**
 * 简易 PCA 降维到 2D
 * 返回：[[x1, y1], [x2, y2], ...]
 */
export function pca2d(X: number[][]): number[][] {
  if (X.length === 0) return [];

  const n = X.length;
  const dim = X[0].length;

  // 1. 中心化
  const means = Array.from({ length: dim }, (_, j) =>
    d3.mean(X.map(row => row[j])) || 0
  );
  const centered = X.map(row => row.map((val, j) => val - means[j]));

  // 2. 计算协方差矩阵
  const cov: number[][] = Array.from({ length: dim }, () => Array(dim).fill(0));
  for (let i = 0; i < dim; i++) {
    for (let j = i; j < dim; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      cov[i][j] = cov[j][i] = sum / (n - 1);
    }
  }

  // 3. 幂迭代法求前2个主成分（简化实现）
  const pc1 = powerIteration(cov, 100);
  const pc2 = powerIteration(cov, 100, pc1); // 正交于pc1

  // 4. 投影到2D
  return centered.map(row => [
    row.reduce((sum, val, i) => sum + val * pc1[i], 0),
    row.reduce((sum, val, i) => sum + val * pc2[i], 0),
  ]);
}

/**
 * 幂迭代法求特征向量（最大特征值对应的向量）
 */
function powerIteration(
  matrix: number[][],
  maxIter: number,
  orthogonalTo?: number[]
): number[] {
  const dim = matrix.length;
  let vec = Array.from({ length: dim }, () => Math.random());

  for (let iter = 0; iter < maxIter; iter++) {
    // 如果需要正交化
    if (orthogonalTo) {
      const dot = vec.reduce((sum, val, i) => sum + val * orthogonalTo[i], 0);
      vec = vec.map((val, i) => val - dot * orthogonalTo[i]);
    }

    // 矩阵乘法
    const newVec = Array(dim).fill(0);
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        newVec[i] += matrix[i][j] * vec[j];
      }
    }

    // 归一化
    const norm = Math.sqrt(newVec.reduce((sum, val) => sum + val * val, 0));
    vec = newVec.map(v => v / (norm || 1));
  }

  return vec;
}
import * as d3 from 'd3';
import type { SubmitRecord, StudentInfo, StudentFeatures } from '../types';

/**
 * 从日志聚合出学生级别的特征向量
 */
export function aggregateStudentFeatures(
  records: SubmitRecord[],
  studentMap: Map<string, StudentInfo>
): StudentFeatures[] {
  console.time('⏱️ 特征聚合');

  // 按学生分组
  const grouped = d3.group(records, d => d.student_ID);

  const features: StudentFeatures[] = [];

  for (const [student_ID, logs] of grouped) {
    const studentInfo = studentMap.get(student_ID);
    const classLabel = logs[0]?.class || 'Unknown';

    // 按题目分组（用于计算redo_rate）
    const byTitle = d3.group(logs, d => d.title_ID);
    const totalTitles = byTitle.size;
    const redoTitles = Array.from(byTitle.values()).filter(l => l.length > 1).length;

    // 计算各个特征
    const scores = logs.map(d => d.pct_score!);
    const times = logs.map(d => d.timeconsume);
    const deltas = logs.map(d => d.delta_t!).filter(d => d > 0);
    const hours = logs.map(d => d.hour!);

    // 1. acc_last: 每道题最后一次的平均得分
    const lastScores = Array.from(byTitle.values()).map(titleLogs => {
      const sorted = titleLogs.sort((a, b) => a.time - b.time);
      return sorted[sorted.length - 1].pct_score!;
    });
    const acc_last = d3.mean(lastScores) || 0;

    // 2. gain: 每道题最后得分 - 首次得分
    const gains = Array.from(byTitle.values()).map(titleLogs => {
      const sorted = titleLogs.sort((a, b) => a.time - b.time);
      return sorted[sorted.length - 1].pct_score! - sorted[0].pct_score!;
    });
    const gain = d3.mean(gains) || 0;

    // 3. redo_rate: 多次尝试的题占比
    const redo_rate = totalTitles > 0 ? redoTitles / totalTitles : 0;

    // 4. avg_time: 平均耗时（归一化到0-1）
    const avg_time = d3.mean(times) || 0;

    // 5. spacing_med: 时间间隔中位数
    const spacing_med = deltas.length > 0 ? d3.median(deltas)! : 0;

    // 6. night_ratio: 夜间学习占比（22:00-07:00）
    const nightCount = hours.filter(h => h >= 22 || h < 7).length;
    const night_ratio = logs.length > 0 ? nightCount / logs.length : 0;

    // 7. explore_bonus: AC后继续探索的次数
    let exploreCount = 0;
    for (const titleLogs of byTitle.values()) {
      const sorted = titleLogs.sort((a, b) => a.time - b.time);
      const firstAC = sorted.findIndex(d => d.correct === 1);
      if (firstAC >= 0 && firstAC < sorted.length - 1) {
        exploreCount += sorted.length - firstAC - 1;
      }
    }
    const explore_bonus = logs.length > 0 ? exploreCount / logs.length : 0;

    // 8. enthusiasm_bonus: 平均提交时间（相对于题目发布）- 简化版
    // 这里用"首次尝试在第几周"作为代理
    const firstWeeks = Array.from(byTitle.values()).map(titleLogs => {
      return Math.min(...titleLogs.map(d => d.week!));
    });
    const avgFirstWeek = d3.mean(firstWeeks) || 0;
    const enthusiasm_bonus = Math.max(0, 1 - avgFirstWeek / 20); // 越早越高

    features.push({
      student_ID,
      class: classLabel,
      acc_last,
      gain,
      redo_rate,
      avg_time: normalizeValue(avg_time, 0, 10), // 假设最大10秒
      spacing_med: normalizeValue(spacing_med, 0, 7 * 24 * 3600), // 最大1周
      night_ratio,
      explore_bonus,
      enthusiasm_bonus,
      meta: {
        attempts: logs.length,
        samples: totalTitles,
        major: studentInfo?.major,
        sex: studentInfo?.sex,
        age: studentInfo?.age,
      },
    });
  }

  console.timeEnd('⏱️ 特征聚合');
  console.log(`✅ 聚合完成: ${features.length}个学生特征向量`);

  return features;
}

/**
 * 归一化到0-1
 */
function normalizeValue(val: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

/**
 * 提取特征矩阵（用于聚类和降维）
 */
export function extractFeatureMatrix(
  features: StudentFeatures[],
  featureKeys: (keyof StudentFeatures)[]
): number[][] {
  return features.map(f => 
    featureKeys.map(key => {
      const val = f[key];
      return typeof val === 'number' ? val : 0;
    })
  );
}
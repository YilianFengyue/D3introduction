// src/views/pages/ChinaVis/lib/aggregateWeek.ts
import * as d3 from 'd3';
import type { SubmitRecord, TitleInfo } from '../types';

/**
 * 单周快照数据
 */
export interface WeekSnapshot {
  week: number;
  knowledgeScores: Map<string, number>;  // 知识点 → 掌握度
  avgScore: number;                      // 当周平均得分
  totalSubmits: number;                  // 当周总提交数
  hasActivity: boolean;                  // 是否有提交
}

/**
 * 相邻周进步数据
 */
export interface WeekProgress {
  fromWeek: number;
  toWeek: number;
  improvement: number;  // 平均进步幅度（-1到1）
  isPositive: boolean;  // 是否进步
}

/**
 * 按周聚合知识点掌握度
 */
export function aggregateWeeklyKnowledge(
  records: SubmitRecord[],
  titleMap: Map<string, TitleInfo>,
  studentIds?: Set<string>
): WeekSnapshot[] {
  // 1. 筛选记录
  let filtered = records;
  if (studentIds && studentIds.size > 0) {
    filtered = records.filter(r => studentIds.has(r.student_ID));
  }

  // 2. 按周分组
  const byWeek = d3.group(filtered, d => d.week || 0);

  const snapshots: WeekSnapshot[] = [];

  for (const [week, logs] of byWeek) {
    if (week === 0 || logs.length === 0) continue; // 跳过无效周

    // 3. 按知识点分组
    const byKnowledge = d3.group(logs, d => {
      const titleInfo = titleMap.get(d.title_ID);
      return titleInfo?.knowledge || 'Unknown';
    });

    const knowledgeScores = new Map<string, number>();

    for (const [knowledge, kLogs] of byKnowledge) {
      if (knowledge === 'Unknown') continue;

      // 按题目分组，取每题的最后一次得分
      const byTitle = d3.group(kLogs, d => d.title_ID);
      const lastScores: number[] = [];

      for (const [_, titleLogs] of byTitle) {
        const sorted = [...titleLogs].sort((a, b) => a.time - b.time);
        lastScores.push(sorted[sorted.length - 1].pct_score || 0);
      }

      knowledgeScores.set(knowledge, d3.mean(lastScores) || 0);
    }

    // 4. 计算当周平均得分
    const avgScore = d3.mean(logs, d => d.pct_score || 0) || 0;

    snapshots.push({
      week,
      knowledgeScores,
      avgScore,
      totalSubmits: logs.length,
      hasActivity: true,
    });
  }

  // 5. 按周排序
  return snapshots.sort((a, b) => a.week - b.week);
}

/**
 * 计算相邻周的进步幅度
 */
export function calculateWeekProgress(
  snapshots: WeekSnapshot[]
): WeekProgress[] {
  const progress: WeekProgress[] = [];

  for (let i = 0; i < snapshots.length - 1; i++) {
    const curr = snapshots[i];
    const next = snapshots[i + 1];

    // 计算所有知识点的平均进步
    let totalImprovement = 0;
    let count = 0;

    for (const [knowledge, nextScore] of next.knowledgeScores) {
      const currScore = curr.knowledgeScores.get(knowledge);
      if (currScore !== undefined) {
        totalImprovement += nextScore - currScore;
        count++;
      }
    }

    const avgImprovement = count > 0 ? totalImprovement / count : 0;

    progress.push({
      fromWeek: curr.week,
      toWeek: next.week,
      improvement: avgImprovement,
      isPositive: avgImprovement > 0,
    });
  }

  return progress;
}

/**
 * 获取知识点列表（按题目表中的顺序）
 */
export function getKnowledgeOrder(titleMap: Map<string, TitleInfo>): string[] {
  const knowledgeSet = new Set<string>();
  for (const title of titleMap.values()) {
    if (title.knowledge && title.knowledge !== 'Unknown') {
      knowledgeSet.add(title.knowledge);
    }
  }
  return Array.from(knowledgeSet).sort();
}
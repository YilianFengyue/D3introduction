import * as d3 from 'd3';
import type { SubmitRecord, TitleInfo } from '../types';

/**
 * 题目统计数据
 */
export interface QuestionStats {
  title_ID: string;
  knowledge: string;
  sub_knowledge: string;
  score_max: number;          // 满分
  avgAttempts: number;        // 平均提交次数
  avgScore: number;           // 平均得分
  difficulty: 'Easy' | 'Medium' | 'Hard';  // 难度等级
  timeDistribution: Map<number, number>;   // 提交时间分布（周→次数）
  scoreDistribution: {        // 得分分布
    perfect: number;          // 满分比例
    partial: number;          // 部分正确比例
    zero: number;             // 零分比例
  };
}

/**
 * 按题目聚合统计数据
 */
export function aggregateQuestionStats(
  records: SubmitRecord[],
  titleMap: Map<string, TitleInfo>,
  studentIds?: Set<string>,
  knowledgeFilter?: string
): QuestionStats[] {
  // 筛选记录
  let filtered = records;
  if (studentIds && studentIds.size > 0) {
    filtered = filtered.filter(r => studentIds.has(r.student_ID));
  }
  if (knowledgeFilter) {
    filtered = filtered.filter(r => {
      const titleInfo = titleMap.get(r.title_ID);
      return titleInfo?.knowledge === knowledgeFilter;
    });
  }

  // 按题目分组
  const byTitle = d3.group(filtered, d => d.title_ID);

  const results: QuestionStats[] = [];

  for (const [title_ID, logs] of byTitle) {
    const titleInfo = titleMap.get(title_ID);
    if (!titleInfo) continue;

    // 计算平均提交次数
    const byStudent = d3.group(logs, d => d.student_ID);
    const attemptsPerStudent = Array.from(byStudent.values()).map(l => l.length);
    const avgAttempts = d3.mean(attemptsPerStudent) || 0;

    // 计算平均得分（每个学生取最高分）
    const maxScoresPerStudent = Array.from(byStudent.values()).map(studentLogs => {
      return d3.max(studentLogs, d => d.pct_score) || 0;
    });
    const avgScore = d3.mean(maxScoresPerStudent) || 0;

    // 计算难度
    const difficulty = calculateDifficulty(avgAttempts, avgScore);

    // 时间分布（按周）
    const timeDistribution = d3.rollup(
      logs,
      v => v.length,
      d => d.week || 0
    );

    // 得分分布
    const totalStudents = byStudent.size;
    const perfectCount = maxScoresPerStudent.filter(s => s >= 0.99).length;
    const partialCount = maxScoresPerStudent.filter(s => s > 0 && s < 0.99).length;
    const zeroCount = maxScoresPerStudent.filter(s => s === 0).length;

    results.push({
      title_ID,
      knowledge: titleInfo.knowledge,
      sub_knowledge: titleInfo.sub_knowledge,
      score_max: titleInfo.score,
      avgAttempts,
      avgScore,
      difficulty,
      timeDistribution,
      scoreDistribution: {
        perfect: perfectCount / totalStudents,
        partial: partialCount / totalStudents,
        zero: zeroCount / totalStudents,
      },
    });
  }

  // 按难度排序
  return results.sort((a, b) => {
    const order = { 'Hard': 0, 'Medium': 1, 'Easy': 2 };
    return order[a.difficulty] - order[b.difficulty];
  });
}

/**
 * 计算题目难度
 */
function calculateDifficulty(
  avgAttempts: number,
  avgScore: number
): 'Easy' | 'Medium' | 'Hard' {
  // 困难度 = 高提交次数 + 低得分
  const hardnessScore = (avgAttempts / 10) + (1 - avgScore);

  if (hardnessScore > 1.2) return 'Hard';
  if (hardnessScore > 0.7) return 'Medium';
  return 'Easy';
}
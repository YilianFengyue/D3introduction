import * as d3 from 'd3';
import type { SubmitRecord, TitleInfo } from '../types';

/**
 * 知识点掌握度数据结构
 */
export interface KnowledgeScore {
  knowledge: string;          // 知识点ID
  score: number;              // 平均掌握度 (0-1)
  attempts: number;           // 总提交次数
  subKnowledge: {             // 子知识点
    [subKey: string]: {
      score: number;
      attempts: number;
    };
  };
}

/**
 * 按知识点聚合学生的掌握情况
 */
export function aggregateKnowledgeScores(
  records: SubmitRecord[],
  titleMap: Map<string, TitleInfo>,
  studentIds?: Set<string>
): KnowledgeScore[] {
  // 筛选指定学生的记录
  let filtered = records;
  if (studentIds && studentIds.size > 0) {
    filtered = records.filter(r => studentIds.has(r.student_ID));
  }

  // 按知识点分组
  const byKnowledge = d3.group(filtered, d => {
    const titleInfo = titleMap.get(d.title_ID);
    return titleInfo?.knowledge || 'Unknown';
  });

  const results: KnowledgeScore[] = [];

  for (const [knowledge, logs] of byKnowledge) {
    if (knowledge === 'Unknown') continue;

    // 计算该知识点的整体得分（每道题取最后一次）
    const byTitle = d3.group(logs, d => d.title_ID);
    const lastScores: number[] = [];
    
    for (const [titleId, titleLogs] of byTitle) {
      const sorted = [...titleLogs].sort((a, b) => a.time - b.time);
      lastScores.push(sorted[sorted.length - 1].pct_score || 0);
    }

    const avgScore = d3.mean(lastScores) || 0;

    // 按子知识点分组
    const bySubKnowledge = d3.group(logs, d => {
      const titleInfo = titleMap.get(d.title_ID);
      return titleInfo?.sub_knowledge || 'Unknown';
    });

    const subKnowledge: KnowledgeScore['subKnowledge'] = {};

    for (const [subKey, subLogs] of bySubKnowledge) {
      if (subKey === 'Unknown') continue;

      const subByTitle = d3.group(subLogs, d => d.title_ID);
      const subLastScores: number[] = [];

      for (const [_, subTitleLogs] of subByTitle) {
        const sorted = [...subTitleLogs].sort((a, b) => a.time - b.time);
        subLastScores.push(sorted[sorted.length - 1].pct_score || 0);
      }

      subKnowledge[subKey] = {
        score: d3.mean(subLastScores) || 0,
        attempts: subLogs.length,
      };
    }

    results.push({
      knowledge,
      score: avgScore,
      attempts: logs.length,
      subKnowledge,
    });
  }

  // 按知识点ID排序
  return results.sort((a, b) => a.knowledge.localeCompare(b.knowledge));
}

/**
 * 获取所有知识点列表（用于Legend）
 */
export function getKnowledgeList(titleMap: Map<string, TitleInfo>): string[] {
  const knowledgeSet = new Set<string>();
  for (const title of titleMap.values()) {
    if (title.knowledge) {
      knowledgeSet.add(title.knowledge);
    }
  }
  return Array.from(knowledgeSet).sort();
}
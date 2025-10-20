import { computed } from 'vue';
import * as d3 from 'd3';
import { useVisStore } from '../stores/useVisStore';
import { useScatterData } from './useScatterData';

export interface StudentTitleStats {
  titleId: string;
  knowledge: string;
  attempts: number;
  firstTime: number;
  lastTime: number;
  bestTime: number;
  bestMemory: number;
  maxScore: number;
  errorTypes: string[];
}

export function useStudentData() {
  const store = useVisStore();
  const scatterData = useScatterData();

  // 获取学生的题目答题统计
  function getStudentTitles(studentId: string): StudentTitleStats[] {
    if (!scatterData.rawData?.value) return [];

    const { records, titleMap } = scatterData.rawData.value;
    const logs = records.filter(r => r.student_ID === studentId);

    const byTitle = d3.group(logs, d => d.title_ID);
    const results: StudentTitleStats[] = [];

    for (const [titleId, titleLogs] of byTitle) {
      const titleInfo = titleMap.get(titleId);
      const sorted = [...titleLogs].sort((a, b) => a.time - b.time);

      results.push({
        titleId,
        knowledge: titleInfo?.knowledge || 'Unknown',
        attempts: titleLogs.length,
        firstTime: sorted[0].time,
        lastTime: sorted[sorted.length - 1].time,
        bestTime: Math.min(...titleLogs.map(l => l.timeconsume || Infinity)),
        bestMemory: Math.min(...titleLogs.map(l => l.memory || Infinity)),
        maxScore: Math.max(...titleLogs.map(l => l.pct_score || 0)),
        errorTypes: Array.from(new Set(
          titleLogs.map(l => l.state).filter(s => s.includes('Error'))
        )),
      });
    }

    return results.sort((a, b) => a.titleId.localeCompare(b.titleId));
  }

  // 获取学生班级
  function getStudentClass(studentId: string): string | null {
    if (!scatterData.rawData?.value) return null;
    const { records } = scatterData.rawData.value;
    const log = records.find(r => r.student_ID === studentId);
    return log?.class || null;
  }

  return {
    getStudentTitles,
    getStudentClass,
  };
}
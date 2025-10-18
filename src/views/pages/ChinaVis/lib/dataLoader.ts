import * as d3 from 'd3';
import type { SubmitRecord, TitleInfo, StudentInfo } from '../types';
import { DATA_PATHS, CLASS_NUMS } from './constants';

/**
 * 并行加载所有CSV数据
 * 约30万条日志 + 维表，耗时约1-2秒
 */
// ===== [PATCH START] singleton loadAllData =====
// ===== [PATCH START] 明确数据包类型，修正 _inflight 类型收窄问题 =====
type DataBundle = {
  students: StudentInfo[];
  studentMap: Map<string, StudentInfo>;
  titles: TitleInfo[];
  titleMap: Map<string, TitleInfo>;
  records: SubmitRecord[];
};

let _cache: DataBundle | null = null;
let _inflight: Promise<DataBundle> | null = null;
// ===== [PATCH END] =====

// ===== [PATCH START] loadAllData 显式返回 DataBundle =====
export async function loadAllData(force = false): Promise<DataBundle> {
  if (_cache && !force) return _cache; // TS 已能正确收窄；若仍告警可写: return _cache as DataBundle;
  if (_inflight) return _inflight;

  const t0 = performance.now();

  _inflight = (async (): Promise<DataBundle> => {
    try {
      // 保留你当前的并行加载与解析逻辑 ↓↓↓
      const [studentsRaw, titlesRaw, ...classRecordsRaw] = await Promise.all([
        d3.csv(DATA_PATHS.students),
        d3.csv(DATA_PATHS.titles),
        ...CLASS_NUMS.map((n) => d3.csv(DATA_PATHS.getClassRecords(n))),
      ]);

      const students = parseStudents(studentsRaw);
      const studentMap = new Map(students.map((s) => [s.student_ID, s]));

      const titles = parseTitles(titlesRaw);
      const titleMap = new Map(titles.map((t) => [t.title_ID, t]));

      const allRecordsRaw = classRecordsRaw.flat();
      const records = parseRecords(allRecordsRaw, titleMap);

      _cache = { students, studentMap, titles, titleMap, records };

      console.log(`⏱️ 数据加载+解析: ${(performance.now() - t0).toFixed(1)} ms`);
      console.log(
        `✅ 加载完成: ${students.length}个学生, ${titles.length}道题, ${records.length}条日志`
      );

      return _cache; // 这里的 _cache 一定是 DataBundle
    } catch (error) {
      console.error("❌ 数据加载失败:", error);
      throw error;
    } finally {
      _inflight = null;
    }
  })();

  return _inflight;
}
// ===== [PATCH END] =====


/**
 * 解析学生表
 */
function parseStudents(raw: d3.DSVRowArray<string>): StudentInfo[] {
  return raw.map(row => ({
    index: +row.index!,
    student_ID: row.student_ID!,
    sex: row.sex!,
    age: +row.age!,
    major: row.major!,
  }));
}

/**
 * 解析题目表
 */
function parseTitles(raw: d3.DSVRowArray<string>): TitleInfo[] {
  return raw.map(row => ({
    index: +row.index!,
    title_ID: row.title_ID!,
    score: +row.score!,
    knowledge: row.knowledge!,
    sub_knowledge: row.sub_knowledge!,
  }));
}

/**
 * 解析日志并添加派生字段
 */
function parseRecords(
  raw: d3.DSVRowArray<string>,
  titleMap: Map<string, TitleInfo>
): SubmitRecord[] {
  // 按学生+题目分组，用于计算 attempt_idx
  const attemptCounters = new Map<string, number>();
  
  // 按学生分组，用于计算 delta_t
  const studentLastTime = new Map<string, number>();

  return raw.map(row => {
    const title_ID = row.title_ID!;
    const student_ID = row.student_ID!;
    const time = +row.time!;
    const score = +row.score!;
    const state = row.state!;

    // 查找题目满分
    const titleInfo = titleMap.get(title_ID);
    const score_max = titleInfo?.score || 1;

    // 计算派生字段
    const pct_score = score / score_max;
    const correct = state.includes('Correct') 
      ? (state === 'Absolutely_Correct' ? 1 : 0.5) 
      : 0;

    const date = new Date(time * 1000);
    const hour = date.getHours();
    const week = Math.floor((time - 1693497600) / (7 * 24 * 3600)); // 相对于2023-09-01

    // 计算attempt_idx（该生该题第几次尝试）
    const attemptKey = `${student_ID}_${title_ID}`;
    const attempt_idx = (attemptCounters.get(attemptKey) || 0) + 1;
    attemptCounters.set(attemptKey, attempt_idx);

    // 计算delta_t（距上次提交间隔）
    const lastTime = studentLastTime.get(student_ID);
    const delta_t = lastTime ? time - lastTime : 0;
    studentLastTime.set(student_ID, time);

    return {
      index: +row.index!,
      class: row.class!,
      time,
      state,
      score,
      title_ID,
      method: row.method!,
      memory: +row.memory!,
      timeconsume: +row.timeconsume!,
      student_ID,
      pct_score,
      correct,
      hour,
      week,
      attempt_idx,
      delta_t,
    };
  });
}
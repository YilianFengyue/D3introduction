import * as d3 from 'd3';
import type { SubmitRecord, TitleInfo, StudentInfo } from '../types';
import { DATA_PATHS, CLASS_NUMS } from './constants';

/**
 * 并行加载所有CSV数据
 * 约30万条日志 + 维表，耗时约1-2秒
 */
export async function loadAllData() {
  console.time('⏱️ 数据加载');

  try {
    // 并行加载所有数据
    const [studentsRaw, titlesRaw, ...classRecordsRaw] = await Promise.all([
      d3.csv(DATA_PATHS.students),
      d3.csv(DATA_PATHS.titles),
      ...CLASS_NUMS.map(n => d3.csv(DATA_PATHS.getClassRecords(n))),
    ]);

    console.timeEnd('⏱️ 数据加载');
    console.time('⏱️ 数据解析');

    // 解析学生表
    const students = parseStudents(studentsRaw);
    const studentMap = new Map(students.map(s => [s.student_ID, s]));

    // 解析题目表（构建查找表）
    const titles = parseTitles(titlesRaw);
    const titleMap = new Map(titles.map(t => [t.title_ID, t]));

    // 合并所有班级的日志并解析
    const allRecordsRaw = classRecordsRaw.flat();
    const records = parseRecords(allRecordsRaw, titleMap);

    console.timeEnd('⏱️ 数据解析');
    console.log(`✅ 加载完成: ${students.length}个学生, ${titles.length}道题, ${records.length}条日志`);

    return { students, studentMap, titles, titleMap, records };
  } catch (error) {
    console.error('❌ 数据加载失败:', error);
    throw error;
  }
}

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
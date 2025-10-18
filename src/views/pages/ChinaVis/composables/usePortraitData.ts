import { ref, computed, watch } from 'vue';
import { aggregateKnowledgeScores, getKnowledgeList } from '../lib/aggregateKnowledge';
import type { KnowledgeScore } from '../lib/aggregateKnowledge';
import type { StudentFeatures } from '../types';
import { useVisStore } from '../stores/useVisStore';
import { useScatterData } from './useScatterData';

export function usePortraitData() {
  const store = useVisStore();
  const scatterData = useScatterData();

  // ============================================
  // 响应式状态
  // ============================================

  const knowledgeScores = ref<KnowledgeScore[]>([]);
  const radarFeatures = ref<StudentFeatures | null>(null);
  const knowledgeList = ref<string[]>([]);

  // ============================================
  // 计算属性
  // ============================================

  const hasSelection = computed(() => store.selectedStudents.size > 0);

  const displayMode = computed(() => {
    if (store.selectedStudents.size === 1) return 'individual';
    if (store.selectedStudents.size > 1) return 'group';
    return 'all';
  });

  // ============================================
  // 数据处理
  // ============================================

  /* ===== [PATCH START] 添加空值检查 ===== */
async function processPortraitData() {
  // 等待数据加载完成
  if (!scatterData.rawData || !scatterData.rawData.value) {
    console.log('等待数据加载...');
    return;
  }

  const { records, titleMap } = scatterData.rawData.value;

  // 获取知识点列表
  knowledgeList.value = getKnowledgeList(titleMap);

  // 计算知识点掌握度
  if (store.selectedStudents.size > 0) {
    // 选中学生的知识点掌握度
    knowledgeScores.value = aggregateKnowledgeScores(
      records,
      titleMap,
      store.selectedStudents
    );

    // 雷达图特征（取选中学生的平均值或单个学生的值）
    const selectedPoints = scatterData.points.value.filter(p =>
      store.selectedStudents.has(p.student_ID)
    );

    if (selectedPoints.length === 1) {
      // 单个学生
      radarFeatures.value = selectedPoints[0];
    } else {
      // 多个学生，计算平均值
      radarFeatures.value = calculateAverageFeatures(selectedPoints);
    }
  } else {
    // 全体平均
    knowledgeScores.value = aggregateKnowledgeScores(records, titleMap);
    radarFeatures.value = calculateAverageFeatures(scatterData.points.value);
  }
}
/* ===== [PATCH END] ===== */

  // ============================================
  // 辅助函数
  // ============================================

  function calculateAverageFeatures(points: StudentFeatures[]): StudentFeatures {
    if (points.length === 0) {
      return {
        student_ID: 'Average',
        class: 'All',
        acc_last: 0,
        gain: 0,
        redo_rate: 0,
        avg_time: 0,
        spacing_med: 0,
        night_ratio: 0,
        explore_bonus: 0,
        enthusiasm_bonus: 0,
        meta: { attempts: 0, samples: 0 },
      };
    }

    const avg = (key: keyof StudentFeatures) => {
      const sum = points.reduce((s, p) => {
        const val = p[key];
        return s + (typeof val === 'number' ? val : 0);
      }, 0);
      return sum / points.length;
    };

    return {
      student_ID: 'Average',
      class: points[0].class,
      acc_last: avg('acc_last'),
      gain: avg('gain'),
      redo_rate: avg('redo_rate'),
      avg_time: avg('avg_time'),
      spacing_med: avg('spacing_med'),
      night_ratio: avg('night_ratio'),
      explore_bonus: avg('explore_bonus'),
      enthusiasm_bonus: avg('enthusiasm_bonus'),
      meta: {
        attempts: Math.round(avg('meta' as any)),
        samples: points.length,
      },
    };
  }

  // ============================================
  // 监听变化
  // ============================================

  /* ===== [PATCH START] 延迟执行避免初始空值 ===== */
watch(
  () => [store.selectedStudents, scatterData.points.value.length],
  () => {
    // 延迟执行，确保 rawData 已加载
    setTimeout(() => {
      processPortraitData();
    }, 100);
  },
  { deep: true, immediate: true }
);
/* ===== [PATCH END] ===== */

  return {
    // 状态
    knowledgeScores,
    radarFeatures,
    knowledgeList,

    // 计算属性
    hasSelection,
    displayMode,

    // 方法
    processPortraitData,
  };
}
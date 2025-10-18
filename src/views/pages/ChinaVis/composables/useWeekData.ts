// src/views/pages/ChinaVis/composables/useWeekData.ts
import { ref, computed, watch } from 'vue';
import { aggregateWeeklyKnowledge, calculateWeekProgress, getKnowledgeOrder } from '../lib/aggregateWeek';
import type { WeekSnapshot, WeekProgress } from '../lib/aggregateWeek';
import { useVisStore } from '../stores/useVisStore';
import { useScatterData } from './useScatterData';

export function useWeekData() {
  const store = useVisStore();
  const scatterData = useScatterData();

  // ============================================
  // 响应式状态
  // ============================================

  const snapshots = ref<WeekSnapshot[]>([]);
  const progress = ref<WeekProgress[]>([]);
  const knowledgeOrder = ref<string[]>([]);
  const loading = ref(false);

  // ============================================
  // 计算属性
  // ============================================

  const displayMode = computed(() => {
    if (store.selectedStudents.size === 1) return 'individual';
    if (store.selectedStudents.size > 1) return 'group';
    return 'all';
  });

  // ============================================
  // 数据处理
  // ============================================

  async function processWeekData() {
    if (!scatterData.rawData?.value) {
      console.log('WeekData: 等待数据加载...');
      return;
    }

    loading.value = true;

    try {
      const { records, titleMap } = scatterData.rawData.value;

      // 获取知识点顺序（用于统一各周的扇形顺序）
      knowledgeOrder.value = getKnowledgeOrder(titleMap);

      // 聚合周数据
      snapshots.value = aggregateWeeklyKnowledge(
        records,
        titleMap,
        store.selectedStudents.size > 0 ? store.selectedStudents : undefined
      );

      // 计算进步
      progress.value = calculateWeekProgress(snapshots.value);

      console.log(`✅ WeekData: 加载 ${snapshots.value.length} 周数据`);
    } catch (error) {
      console.error('WeekData 处理失败:', error);
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // 监听变化
  // ============================================

  watch(
    () => [store.selectedStudents, scatterData.points.value.length],
    () => {
      setTimeout(() => {
        processWeekData();
      }, 100);
    },
    { deep: true, immediate: true }
  );

  return {
    // 状态
    snapshots,
    progress,
    knowledgeOrder,
    loading,

    // 计算属性
    displayMode,

    // 方法
    processWeekData,
  };
}
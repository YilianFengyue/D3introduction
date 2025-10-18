import { ref, computed, watch } from 'vue';
import { aggregateQuestionStats } from '../lib/aggregateTitle';
import type { QuestionStats } from '../lib/aggregateTitle';
import { useVisStore } from '../stores/useVisStore';
import { useScatterData } from './useScatterData';

export function useQuestionData() {
  const store = useVisStore();
  const scatterData = useScatterData();

  // ============================================
  // 响应式状态
  // ============================================

  const questions = ref<QuestionStats[]>([]);
  const loading = ref(false);

  // ============================================
  // 计算属性
  // ============================================

  const filteredQuestions = computed(() => {
    // 如果选中了知识点，只显示该知识点下的题目
    if (store.selectedKnowledge) {
      return questions.value.filter(q => q.knowledge === store.selectedKnowledge);
    }
    return questions.value;
  });

  const questionsByDifficulty = computed(() => {
    const grouped = {
      Hard: filteredQuestions.value.filter(q => q.difficulty === 'Hard'),
      Medium: filteredQuestions.value.filter(q => q.difficulty === 'Medium'),
      Easy: filteredQuestions.value.filter(q => q.difficulty === 'Easy'),
    };
    return grouped;
  });

  // ============================================
  // 数据处理
  // ============================================

 /* ===== [PATCH START] 添加空值检查 ===== */
    async function processQuestionData() {
    // 等待数据加载完成
    if (!scatterData.rawData || !scatterData.rawData.value) {
        console.log('等待数据加载...');
        return;
    }

    loading.value = true;

    try {
        const { records, titleMap } = scatterData.rawData.value;

        // 聚合题目数据
        questions.value = aggregateQuestionStats(
        records,
        titleMap,
        store.selectedStudents.size > 0 ? store.selectedStudents : undefined,
        store.selectedKnowledge || undefined
        );
    } catch (error) {
        console.error('Question data processing failed:', error);
    } finally {
        loading.value = false;
    }
    }
/* ===== [PATCH END] ===== */

  // ============================================
  // 监听变化
  // ============================================

  /* ===== [PATCH START] 延迟执行避免初始空值 ===== */
    watch(
    () => [
        store.selectedStudents,
        store.selectedKnowledge,
        scatterData.points.value.length,
    ],
    () => {
        setTimeout(() => {
        processQuestionData();
        }, 100);
    },
    { deep: true, immediate: true }
    );
/* ===== [PATCH END] ===== */

  return {
    // 状态
    questions,
    loading,

    // 计算属性
    filteredQuestions,
    questionsByDifficulty,

    // 方法
    processQuestionData,
  };
}
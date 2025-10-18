import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useVisStore = defineStore('chinavis', () => {
  // ============================================
  // 选中状态
  // ============================================
  
  /** 选中的学生ID集合 */
  const selectedStudents = ref<Set<string>>(new Set());

  /** 选中的聚类ID集合 */
  const selectedClusters = ref<Set<number>>(new Set([0, 1, 2])); // 默认全选

  // ============================================
  // 聚类配置
  // ============================================
  
  /** 聚类数量 */
  const clusterCount = ref(3);

  /** 启用的特征 */
  const enabledFeatures = ref<string[]>([
    'acc_last',
    'gain',
    'redo_rate',
    'avg_time',
    'spacing_med',
    'night_ratio',
    'explore_bonus',
    'enthusiasm_bonus',
  ]);

  /** 筛选的班级 */
  const selectedClasses = ref<string[]>([]);

  /** 筛选的专业 */
  const selectedMajors = ref<string[]>([]);

  // ============================================
  // 计算属性
  // ============================================
  
  const hasSelection = computed(() => selectedStudents.value.size > 0);

  const selectedStudentsList = computed(() => Array.from(selectedStudents.value));

  // ============================================
  // 方法
  // ============================================
  
  /** 设置选中的学生 */
  function setSelectedStudents(ids: Set<string>) {
    selectedStudents.value = ids;
  }

  /** 添加学生到选中集合 */
  function addStudent(id: string) {
    selectedStudents.value.add(id);
  }

  /** 移除学生 */
  function removeStudent(id: string) {
    selectedStudents.value.delete(id);
  }

  /** 清空选中 */
  function clearSelection() {
    selectedStudents.value.clear();
  }

  /** 切换聚类可见性 */
  function toggleCluster(clusterId: number) {
    if (selectedClusters.value.has(clusterId)) {
      selectedClusters.value.delete(clusterId);
    } else {
      selectedClusters.value.add(clusterId);
    }
  }

  /** 设置聚类数量 */
  function setClusterCount(k: number) {
    clusterCount.value = k;
    // 重置可见聚类
    selectedClusters.value = new Set(Array.from({ length: k }, (_, i) => i));
  }

  /** 切换特征启用状态 */
  function toggleFeature(featureKey: string) {
    const idx = enabledFeatures.value.indexOf(featureKey);
    if (idx >= 0) {
      enabledFeatures.value.splice(idx, 1);
    } else {
      enabledFeatures.value.push(featureKey);
    }
  }

  return {
    // 状态
    selectedStudents,
    selectedClusters,
    clusterCount,
    enabledFeatures,
    selectedClasses,
    selectedMajors,
    
    // 计算属性
    hasSelection,
    selectedStudentsList,
    
    // 方法
    setSelectedStudents,
    addStudent,
    removeStudent,
    clearSelection,
    toggleCluster,
    setClusterCount,
    toggleFeature,
  };
});
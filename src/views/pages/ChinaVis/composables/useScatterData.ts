import { ref, computed, watch } from 'vue';
import { loadAllData } from '../lib/dataLoader';
import { aggregateStudentFeatures, extractFeatureMatrix } from '../lib/etl';
import { zscore, kmeans, pca2d } from '../lib/ml';
import type { StudentPoint } from '../types';
import { useVisStore } from '../stores/useVisStore';

export function useScatterData() {
  const store = useVisStore();

  // ============================================
  // 响应式状态
  // ============================================
  
  const loading = ref(true);
  const error = ref<Error | null>(null);
  const rawData = ref<Awaited<ReturnType<typeof loadAllData>> | null>(null);
  const points = ref<StudentPoint[]>([]);

  // ============================================
  // 数据加载
  // ============================================
  
  async function load() {
    try {
      loading.value = true;
      error.value = null;

      // 加载CSV数据
      const data = await loadAllData();
      rawData.value = data;

      // 触发特征聚合
      await processData();
    } catch (e) {
      error.value = e as Error;
      console.error('数据加载失败:', e);
    } finally {
      loading.value = false;
    }
  }

  // ============================================
  // 数据处理流程
  // ============================================
  
  async function processData() {
    if (!rawData.value) return;

    console.time('⏱️ 完整数据处理');

    const { records, studentMap } = rawData.value;

    // 1. 聚合学生特征
    const features = aggregateStudentFeatures(records, studentMap);

    // 2. 筛选（根据班级/专业）
    let filtered = features;
    if (store.selectedClasses.length > 0) {
      filtered = filtered.filter(f => store.selectedClasses.includes(f.class));
    }
    if (store.selectedMajors.length > 0) {
      filtered = filtered.filter(f => 
        f.meta.major && store.selectedMajors.includes(f.meta.major)
      );
    }

    // 3. 提取特征矩阵
    const X = extractFeatureMatrix(
      filtered,
      store.enabledFeatures as any
    );

    // 4. 标准化
    const { zscored } = zscore(X);

    // 5. 聚类
    const labels = kmeans(zscored, store.clusterCount);

    // 6. 降维到2D
    const projected = pca2d(zscored);

    // 7. 组装可视化数据点
    points.value = filtered.map((f, i) => ({
      ...f,
      x: projected[i][0],
      y: projected[i][1],
      cluster: labels[i],
      visible: store.selectedClusters.has(labels[i]),
      selected: store.selectedStudents.has(f.student_ID),
    }));

    console.timeEnd('⏱️ 完整数据处理');
    console.log(`✅ 生成 ${points.value.length} 个可视化数据点`);
  }

  // ============================================
  // 监听配置变化，重新处理
  // ============================================
  
  watch(
    () => [
      store.clusterCount,
      store.enabledFeatures.length,
      store.selectedClasses.length,
      store.selectedMajors.length,
    ],
    () => {
      if (rawData.value) {
        processData();
      }
    },
    { deep: true }
  );

  // 监听选中状态变化，只更新显示状态（不重算）
  watch(
    () => [store.selectedStudents, store.selectedClusters],
    () => {
      points.value.forEach(p => {
        p.visible = store.selectedClusters.has(p.cluster);
        p.selected = store.selectedStudents.has(p.student_ID);
      });
    },
    { deep: true }
  );

  // ============================================
  // 计算属性
  // ============================================
  
  const visiblePoints = computed(() => 
    points.value.filter(p => p.visible)
  );

  const selectedPoints = computed(() =>
    points.value.filter(p => p.selected)
  );

  const clusterStats = computed(() => {
    const stats = new Map<number, number>();
    points.value.forEach(p => {
      stats.set(p.cluster, (stats.get(p.cluster) || 0) + 1);
    });
    return stats;
  });

  return {
    // 状态
    loading,
    error,
    points,
    
    // 计算属性
    visiblePoints,
    selectedPoints,
    clusterStats,
    
    // 方法
    load,
    processData,
  };
}
// ===== [FULL FILE REPLACE] useScatterData.ts =====
import { ref, computed, watch } from "vue";
import { loadAllData } from "../lib/dataLoader";
import { aggregateStudentFeatures, extractFeatureMatrix } from "../lib/etl";
import { zscore, kmeans, pca2d } from "../lib/ml";
import type { StudentPoint } from "../types";
import { useVisStore } from "../stores/useVisStore";

/**
 * 单例包装，所有组件拿到同一份 ref（含 rawData）
 */
let _singleton: ReturnType<typeof createScatterData> | null = null;

export function useScatterData() {
  if (_singleton) return _singleton;
  _singleton = createScatterData();
  return _singleton;
}

function createScatterData() {
  const store = useVisStore();

  // -----------------------------
  // 状态
  // -----------------------------
  const loading = ref(true);
  const error = ref<Error | null>(null);

  // rawData 暴露给其他 composable 使用
  const rawData = ref<Awaited<ReturnType<typeof loadAllData>> | null>(null);

  const points = ref<StudentPoint[]>([]);

  // -----------------------------
  // 加载
  // -----------------------------
  async function load() {
    try {
      loading.value = true;
      error.value = null;

      // loadAllData 自带 cache/inflight 去重
      const data = await loadAllData();
      rawData.value = data;

      await processData();
    } catch (e) {
      error.value = e as Error;
      console.error("数据加载失败:", e);
    } finally {
      loading.value = false;
    }
  }

  // -----------------------------
  // 处理
  // -----------------------------
  async function processData() {
    if (!rawData.value) return;

    console.time("⏱️ 完整数据处理");

    const { records, studentMap } = rawData.value;

    // 1) 特征聚合
    const features = aggregateStudentFeatures(records, studentMap);

    // 2) 筛选（班级/专业）
    let filtered = features;
    if (store.selectedClasses.length > 0) {
      filtered = filtered.filter((f) => store.selectedClasses.includes(f.class));
    }
    if (store.selectedMajors.length > 0) {
      filtered = filtered.filter(
        (f) => f.meta.major && store.selectedMajors.includes(f.meta.major)
      );
    }

    // 3) 特征矩阵
    const X = extractFeatureMatrix(filtered, store.enabledFeatures as any);

    // 4) 标准化
    const { zscored } = zscore(X);

    // 5) 聚类
    const labels = kmeans(zscored, store.clusterCount);

    // 6) 降维
    const projected = pca2d(zscored);

    // 7) 装配点
    points.value = filtered.map((f, i) => ({
      ...f,
      x: projected[i][0],
      y: projected[i][1],
      cluster: labels[i],
      visible: store.selectedClusters.has(labels[i]),
      selected: store.selectedStudents.has(f.student_ID),
    }));

    console.timeEnd("⏱️ 完整数据处理");
    console.log(`✅ 生成 ${points.value.length} 个可视化数据点`);
  }

  // -----------------------------
  // 监听：配置变化 → 重算
  // -----------------------------
  watch(
    () => [
      store.clusterCount,
      store.enabledFeatures.length,
      store.selectedClasses.length,
      store.selectedMajors.length,
    ],
    () => {
      if (rawData.value) processData();
    },
    { deep: true }
  );

  // 监听：选中/可见变化 → 只改样式
  watch(
    () => [store.selectedStudents, store.selectedClusters],
    () => {
      points.value.forEach((p) => {
        p.visible = store.selectedClusters.has(p.cluster);
        p.selected = store.selectedStudents.has(p.student_ID);
      });
    },
    { deep: true }
  );

  // -----------------------------
  // 计算
  // -----------------------------
  const visiblePoints = computed(() => points.value.filter((p) => p.visible));
  const selectedPoints = computed(() => points.value.filter((p) => p.selected));
  const clusterStats = computed(() => {
    const m = new Map<number, number>();
    points.value.forEach((p) => m.set(p.cluster, (m.get(p.cluster) || 0) + 1));
    return m;
  });

  return {
    // 状态
    loading,
    error,
    rawData,     // <<< 暴露 rawData
    points,

    // 计算
    visiblePoints,
    selectedPoints,
    clusterStats,

    // 方法
    load,
    processData,
  };
}

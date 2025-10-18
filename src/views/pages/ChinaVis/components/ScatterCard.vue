<template>
  <v-card elevation="2" class="scatter-card">
    <!-- 工具栏 - 紧凑版 -->
    <v-card-title class="d-flex align-center py-2 px-3">
      <v-icon size="20" class="mr-2">mdi-chart-scatter-plot</v-icon>
      <span class="text-subtitle-1 font-weight-medium">Scatter View</span>
      
      <v-spacer />
      
     <!-- 操作菜单 -->
    <v-menu
      :close-on-content-click="false"    
      location="bottom end"
      transition="scale-transition"
    >
      <template #activator="{ props }">
        <v-btn icon size="small" variant="text" v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <!-- 用 Card 包裹；表单控件放在 card-text，而不是 v-list-item -->
      <v-card min-width="260">
        <v-card-text>
          <div class="text-caption mb-2">聚类设置</div>
          <v-select
            v-model="store.clusterCount"
            :items="[2, 3, 4, 5]"
            label="聚类数量"
            density="compact"
            variant="outlined"
            hide-details
            @click.stop                    
            @mousedown.stop                 
          />
        </v-card-text>

        <v-divider class="my-1" />

        <!-- 下面才是菜单里的动作条目 -->
        <v-list density="compact">
          <v-list-item @click="resetView" prepend-icon="mdi-refresh">
            <v-list-item-title>重置视图</v-list-item-title>
          </v-list-item>

          <v-list-item @click="handleExport" prepend-icon="mdi-download">
            <v-list-item-title>导出选中数据</v-list-item-title>
          </v-list-item>

          <v-list-item @click="reloadData" prepend-icon="mdi-reload">
            <v-list-item-title>重新加载数据</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
<v-card-text v-if="scatterData.loading.value" class="text-center pa-8">
  <v-progress-circular indeterminate color="primary" size="64" />
  <div class="mt-4 text-body-1">加载数据中...</div>
</v-card-text>

<!-- 错误状态 -->              <!-- ❌ 去掉这类注释（或移到内部） -->
<v-card-text v-else-if="scatterData.error.value" class="text-center pa-8">
  <v-icon color="error" size="64">mdi-alert-circle</v-icon>
  <div class="mt-4 text-error">{{ scatterData.error.value.message }}</div>
</v-card-text>

<!-- 散点图画布 -->            <!-- ❌ 去掉这类注释（或移到内部） -->
<v-card-text v-else class="pa-2" style="height: calc(100% - 120px); overflow: hidden;">
  <div ref="containerRef" class="scatter-container">
    <!-- ✅ ② 配合下面把 svg 改成成对闭合 -->
    <svg ref="svgRef" width="100%" height="100%"></svg>

    <!-- Tooltip（把注释放在内部不会破链） -->
    <div
      ref="tooltipRef"
      class="scatter-tooltip"
      :style="tooltipStyle"
      v-show="tooltip.visible"
    >
      <div class="tooltip-title">{{ tooltip.data?.student_ID }}</div>
      <v-divider class="my-1" />
      <div class="tooltip-row">
        <span>班级:</span>
        <strong>{{ tooltip.data?.class }}</strong>
      </div>
      <div class="tooltip-row">
        <span>掌握度:</span>
        <strong>{{ tooltip.data?.acc_last.toFixed(2) }}</strong>
      </div>
      <div class="tooltip-row">
        <span>重做率:</span>
        <strong>{{ tooltip.data?.redo_rate.toFixed(2) }}</strong>
      </div>
      <div class="tooltip-row">
        <span>提交次数:</span>
        <strong>{{ tooltip.data?.meta.attempts }}</strong>
      </div>
    </div>
  </div>
</v-card-text>

    <!-- 图例 - 紧凑版 -->
    <v-card-actions class="px-3 py-2" style="border-top: 1px solid #e0e0e0;">
      <v-chip-group
        v-model="selectedClusterIndices"
        multiple
        column
      >
        <v-chip
          v-for="k in store.clusterCount"
          :key="k - 1"
          :color="CLUSTER_COLORS[k - 1]"
          :value="k - 1"
          filter
          variant="flat"
          size="small"
        >
          {{ CLUSTER_NAMES[k - 1].split('(')[0].trim() }}
          <v-badge
          :content="scatterData.clusterStats.value.get(k - 1) || 0"
          color="white"
          text-color="black"
          inline
          class="ml-1"
        >
          <!-- 作为徽标锚点的内联元素（可以是空 span） -->
          <span></span>
        </v-badge>
        </v-chip>
      </v-chip-group>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import * as d3 from 'd3';
import { useScatterData } from '../composables/useScatterData';
import { useVisStore } from '../stores/useVisStore';
import { CLUSTER_COLORS, CLUSTER_NAMES, VIS_CONFIG } from '../lib/constants';
import type { StudentPoint } from '../types';

import { buildQuadtree, installHoverTooltip, installClickSelect } from '../lib/interaction';

// ============================================
// Setup
// ============================================

const scatterData = useScatterData();
const store = useVisStore();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

const width = ref(600);
const height = ref(350);


// ============================================
// Tooltip状态
// ============================================

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null as StudentPoint | null,
});

const tooltipStyle = computed(() => ({
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`,
}));

// ============================================
// 图例联动
// ============================================

const selectedClusterIndices = computed({
  get: () => Array.from(store.selectedClusters),
  set: (val: number[]) => {
    store.selectedClusters = new Set(val);
  },
});

// ============================================
// 绘图状态（用于后续更新）
// ============================================

let currentG: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

// ============================================
// 生命周期
// ============================================

onMounted(async () => {
  // 计算容器尺寸
  updateSize();
  window.addEventListener('resize', updateSize);
  
  // 加载数据
  await scatterData.load();
  
  // 等待 DOM 更新后渲染
  nextTick(() => {
    renderScatter();
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', updateSize);
});

// 监听数据变化，重新渲染
watch(() => scatterData.points.value.length, () => {
  if (scatterData.points.value.length > 0) {
    nextTick(() => {
      renderScatter();
    });
  }
});

// 监听选中状态变化，只更新点的样式
watch(() => [store.selectedStudents, store.selectedClusters], () => {
  updatePointStyles();
}, { deep: true });

// ============================================
// 响应式尺寸
// ============================================

function updateSize() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    width.value = rect.width || 600;
    height.value = rect.height || 350;
    
    // 如果已经有数据，重新渲染
    if (scatterData.points.value.length > 0) {
      nextTick(() => {
        renderScatter();
      });
    }
  }
}

// ============================================
// 更新点的显示样式（不重新渲染）
// ============================================

function updatePointStyles() {
  if (!svgRef.value || !currentG) return;

  currentG.selectAll('circle')
    .attr('r', (d: any) => 
      store.selectedStudents.has(d.student_ID) ? VIS_CONFIG.pointRadiusSelected : VIS_CONFIG.pointRadius
    )
    .attr('opacity', (d: any) => 
      store.selectedStudents.has(d.student_ID) ? VIS_CONFIG.opacitySelected : 
      store.selectedClusters.has(d.cluster) ? VIS_CONFIG.opacityNormal : 
      VIS_CONFIG.opacityDimmed
    )
    .attr('stroke', (d: any) => 
      store.selectedStudents.has(d.student_ID) ? '#fff' : 'none'
    )
    .attr('stroke-width', (d: any) => 
      store.selectedStudents.has(d.student_ID) ? 2 : 0
    );
}

// ============================================
// 渲染散点图
// ============================================

function renderScatter() {
  if (!svgRef.value || scatterData.points.value.length === 0) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  const points = scatterData.points.value;
  const { padding } = VIS_CONFIG;

  // 比例尺
  const xExtent = d3.extent(points, d => d.x) as [number, number];
  const yExtent = d3.extent(points, d => d.y) as [number, number];

  const xScale = d3.scaleLinear()
    .domain(xExtent)
    .range([padding.left, width.value - padding.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain(yExtent)
    .range([height.value - padding.bottom, padding.top])
    .nice();

  // 坐标轴
  const xAxis = d3.axisBottom(xScale).ticks(5);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg.append('g')
    .attr('transform', `translate(0, ${height.value - padding.bottom})`)
    .call(xAxis)
    .selectAll('text')
    .style('font-size', '10px');

  svg.append('g')
    .attr('transform', `translate(${padding.left}, 0)`)
    .call(yAxis)
    .selectAll('text')
    .style('font-size', '10px');

  // 网格线
  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(0, ${height.value - padding.bottom})`)
    .call(d3.axisBottom(xScale).tickSize(-height.value + padding.top + padding.bottom).tickFormat(() => ''))
    .style('stroke', '#e0e0e0')
    .style('stroke-dasharray', '2,2');

  svg.append('g')
    .attr('class', 'grid')
    .attr('transform', `translate(${padding.left}, 0)`)
    .call(d3.axisLeft(yScale).tickSize(-width.value + padding.left + padding.right).tickFormat(() => ''))
    .style('stroke', '#e0e0e0')
    .style('stroke-dasharray', '2,2');

  // 点容器
  const g = svg.append('g').attr('class', 'points');
  currentG = g; // 保存供后续更新使用

  // Brush
  const brush = d3.brush()
    .extent([[padding.left, padding.top], [width.value - padding.right, height.value - padding.bottom]])
    .on('end', handleBrush);

  svg.append('g').attr('class', 'brush').call(brush);
      /* ===== [PATCH START] overlay + quadtree + hover & click ===== */

    // 拿到 brush 的 overlay（这货盖在点上，会拦截事件）
    const gBrush = svg.select<SVGGElement>('g.brush');                 // ✅ 不要把 append(...) 赋给 const，直接 select 更稳
    const overlay = gBrush.select<SVGRectElement>('.overlay')
      .style('cursor', 'crosshair');                                   // 光标样式

    // 基于当前“可见的 points”构建 quadtree（用像素坐标加速最近邻查找）
    const tree = d3.quadtree<StudentPoint>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .addAll(points);

    // Hover：在 overlay 上做最近邻拾取，更新响应式 tooltip
    overlay
      .on('mousemove.overlay', (event: MouseEvent) => {
        const [mx, my] = d3.pointer(event);                            // 鼠标像素坐标（相对 SVG）
        const found = tree.find(mx, my, 24);                           // 24px 搜索半径
        if (!found) { tooltip.value.visible = false; return; }
        tooltip.value.visible = true;
        tooltip.value.x = event.pageX + 10;                            // 你现有 tooltip 是 fixed，需要 pageX/pageY
        tooltip.value.y = event.pageY + 10;
        tooltip.value.data = found;
      })
      .on('mouseleave.overlay', () => { tooltip.value.visible = false; });

    // Click：在 overlay 上拾取最近点，单选/多选（Ctrl/⌘ 多选）
    overlay.on('click.overlay', (event: MouseEvent) => {
      const [mx, my] = d3.pointer(event);
      const found = tree.find(mx, my, 16);
      if (!found) return;

      const multi = event.metaKey || event.ctrlKey;
      if (!multi) store.clearSelection();
      if (store.selectedStudents.has(found.student_ID)) {
        store.removeStudent(found.student_ID);
      } else {
        store.addStudent(found.student_ID);
      }
    });
  // 绘制点
  drawPoints(g, points, xScale, yScale);

  // Brush处理
  function handleBrush(event: any) {
    if (!event.selection) {
      store.clearSelection();
      return;
    }

    const [[x0, y0], [x1, y1]] = event.selection;
    const selected = points.filter(p => {
      const cx = xScale(p.x);
      const cy = yScale(p.y);
      return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
    });

    store.setSelectedStudents(new Set(selected.map(p => p.student_ID)));
  }
}

// ============================================
// 绘制数据点
// ============================================

function drawPoints(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  points: StudentPoint[],
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>
) {
  g.selectAll('circle')
    .data(points, (d: any) => d.student_ID)
    .join('circle')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', d => d.selected ? VIS_CONFIG.pointRadiusSelected : VIS_CONFIG.pointRadius)
    .attr('fill', d => CLUSTER_COLORS[d.cluster])
    .attr('opacity', d => 
      d.selected ? VIS_CONFIG.opacitySelected : 
      d.visible ? VIS_CONFIG.opacityNormal : 
      VIS_CONFIG.opacityDimmed
    )
    .attr('stroke', d => d.selected ? '#fff' : 'none')
    .attr('stroke-width', d => d.selected ? 2 : 0)
    .style('cursor', 'pointer')
    // .on('mouseenter', (event, d) => {
    //   tooltip.value = {
    //     visible: true,
    //     x: event.pageX + 10,
    //     y: event.pageY + 10,
    //     data: d,
    //   };
      
    //   d3.select(event.target)
    //     .attr('r', VIS_CONFIG.pointRadiusHover);
    // })
    // .on('mousemove', (event) => {
    //   tooltip.value.x = event.pageX + 10;
    //   tooltip.value.y = event.pageY + 10;
    // })
    // .on('mouseleave', (event, d) => {
    //   tooltip.value.visible = false;
      
    //   d3.select(event.target)
    //     .attr('r', d.selected ? VIS_CONFIG.pointRadiusSelected : VIS_CONFIG.pointRadius);
    // })
    // .on('click', (event, d) => {
    //   if (store.selectedStudents.has(d.student_ID)) {
    //     store.removeStudent(d.student_ID);
    //   } else {
    //     store.addStudent(d.student_ID);
    //   }
    // });
}

// ============================================
// 工具函数
// ============================================

function resetView() {
  store.clearSelection();
  renderScatter();
}

function handleExport() {
  const csv = [
    ['student_ID', 'class', 'cluster', 'x', 'y'],
    ...scatterData.selectedPoints.value.map(p => [
      p.student_ID,
      p.class,
      p.cluster,
      p.x,
      p.y,
    ]),
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scatter_selection.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function reloadData() {
  scatterData.load();
}
</script>

<style scoped>
.scatter-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.scatter-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 250px;
}

.scatter-container svg {
  display: block;
}

.scatter-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 9999;
  font-size: 12px;
  max-width: 200px;
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 4px;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin: 2px 0;
}
</style>
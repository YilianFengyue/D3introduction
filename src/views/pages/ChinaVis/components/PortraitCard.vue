<template>
  <v-card elevation="2" class="portrait-card">
    <!-- 标题 -->
    <v-card-title class="d-flex align-center py-2 px-3">
      <v-icon size="20" class="mr-2">mdi-account-circle</v-icon>
      <span class="text-subtitle-1 font-weight-medium">Portrait View</span>
      
      <v-spacer />
      
      <v-chip size="small" :color="getModeColor()">
        {{ getModeText() }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
    <v-card-text v-if="!portraitData.radarFeatures.value" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-card-text>

    <!-- 画像画布 -->
    <v-card-text v-else class="pa-2 portrait-canvas">
      <div ref="containerRef" class="portrait-container">
        <svg ref="svgRef" width="100%" height="100%" > </svg>
        
        <!-- Tooltip -->
        <div
          class="portrait-tooltip"
          :style="tooltipStyle"
          v-show="tooltip.visible"
        >
          <div class="tooltip-title">{{ tooltip.title }}</div>
          <div class="tooltip-value">{{ tooltip.value }}</div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import * as d3 from 'd3';
import { usePortraitData } from '../composables/usePortraitData';
import { useVisStore } from '../stores/useVisStore';
import { FEATURE_DEFS } from '../lib/constants';

// ============================================
// Setup
// ============================================

const portraitData = usePortraitData();
const store = useVisStore();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const width = ref(600);
const height = ref(480);

// ============================================
// Tooltip
// ============================================

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  value: '',
});

const tooltipStyle = computed(() => ({
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`,
}));

// ============================================
// 模式显示
// ============================================

function getModeText() {
  const mode = portraitData.displayMode.value;
  if (mode === 'individual') return '个体';
  if (mode === 'group') return `群体 (${store.selectedStudents.size})`;
  return '全体平均';
}

function getModeColor() {
  const mode = portraitData.displayMode.value;
  if (mode === 'individual') return 'primary';
  if (mode === 'group') return 'success';
  return 'grey';
}

// ============================================
// 生命周期
// ============================================

onMounted(() => {
  updateSize();
  window.addEventListener('resize', updateSize);
  nextTick(() => {
    renderPortrait();
  });
});

watch(() => portraitData.radarFeatures.value, () => {
  nextTick(() => {
    renderPortrait();
  });
});

function updateSize() {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    width.value = rect.width || 800;
    height.value = rect.height || 400;
  }
}

// ============================================
// 渲染画像
// ============================================

function renderPortrait() {
  if (!svgRef.value || !portraitData.radarFeatures.value) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  const centerX = width.value / 2;
  const centerY = height.value / 2;

  // 绘制外圈环形图（知识点）
  drawKnowledgeRing(svg, centerX, centerY);

  // 绘制内圈雷达图（特征）
  drawRadarChart(svg, centerX, centerY);
}

// ============================================
// 环形图（知识点掌握度）
// ============================================

function drawKnowledgeRing(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  cx: number,
  cy: number
) {
  const scores = portraitData.knowledgeScores.value;
  if (scores.length === 0) return;

  const outerRadius = Math.min(width.value, height.value) * 0.45;
  const innerRadius = outerRadius * 0.7;

  // 颜色比例尺
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, 1]);

  // 创建弧生成器
  const arc = d3.arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  // 创建饼图布局
  const pie = d3.pie<any>()
    .value(1)
    .sort(null);

  const arcs = pie(scores);

  // 绘制弧形
  const g = svg.append('g')
    .attr('transform', `translate(${cx}, ${cy})`);

  g.selectAll('path')
    .data(arcs)
    .join('path')
    .attr('d', arc)
    .attr('fill', d => colorScale(d.data.score))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', (event, d) => {
      d3.select(event.target)
        .attr('opacity', 0.8);
      
      tooltip.value = {
        visible: true,
        x: event.pageX + 10,
        y: event.pageY + 10,
        title: d.data.knowledge,
        value: `掌握度: ${(d.data.score * 100).toFixed(1)}%`,
      };
    })
    .on('mouseleave', (event) => {
      d3.select(event.target)
        .attr('opacity', 1);
      tooltip.value.visible = false;
    })
    .on('click', (event, d) => {
      // 点击知识点，联动到 Question View
      store.setSelectedKnowledge(d.data.knowledge);
    });

  // 添加标签
  g.selectAll('text')
    .data(arcs)
    .join('text')
    .attr('transform', d => {
      const pos = arc.centroid(d);
      return `translate(${pos[0]}, ${pos[1]})`;
    })
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#333')
    .attr('pointer-events', 'none')
    .text(d => d.data.knowledge);
}

// ============================================
// 雷达图（学习特征）
// ============================================

function drawRadarChart(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  cx: number,
  cy: number
) {
  const features = portraitData.radarFeatures.value;
  if (!features) return;

  const radius = Math.min(width.value, height.value) * 0.25;
  const levels = 5;

  // 8个特征
  const featureKeys = [
    'acc_last',
    'enthusiasm_bonus',
    'redo_rate',
    'avg_time',
    'spacing_med',
    'night_ratio',
    'explore_bonus',
    'gain',
  ] as const;

  const angleSlice = (Math.PI * 2) / featureKeys.length;

  const g = svg.append('g')
    .attr('transform', `translate(${cx}, ${cy})`);

  // 绘制同心圆网格
  for (let level = 1; level <= levels; level++) {
    const r = (radius / levels) * level;
    
    g.append('circle')
      .attr('r', r)
      .attr('fill', 'none')
      .attr('stroke', '#e0e0e0')
      .attr('stroke-width', 1);
  }

  // 绘制轴线
  featureKeys.forEach((key, i) => {
    const angle = angleSlice * i - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    g.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', x)
      .attr('y2', y)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1);

    // 添加标签
    const labelX = Math.cos(angle) * (radius + 20);
    const labelY = Math.sin(angle) * (radius + 20);
    const featureDef = FEATURE_DEFS.find(f => f.key === key);

    g.append('text')
      .attr('x', labelX)
      .attr('y', labelY)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(featureDef?.label || key);
  });

  // 绘制数据多边形
  const points = featureKeys.map((key, i) => {
    const value = features[key] as number || 0;
    const angle = angleSlice * i - Math.PI / 2;
    const r = value * radius;
    return [Math.cos(angle) * r, Math.sin(angle) * r];
  });

  const lineGenerator = d3.line();
  const pathData = lineGenerator([...points, points[0]]);

  g.append('path')
    .attr('d', pathData || '')
    .attr('fill', '#2E86DE')
    .attr('fill-opacity', 0.3)
    .attr('stroke', '#2E86DE')
    .attr('stroke-width', 2);

  // 添加数据点
  g.selectAll('circle.data-point')
    .data(points)
    .join('circle')
    .attr('class', 'data-point')
    .attr('cx', d => d[0])
    .attr('cy', d => d[1])
    .attr('r', 4)
    .attr('fill', '#2E86DE')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);
}
</script>

<style scoped>
.portrait-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.portrait-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.portrait-tooltip {
  position: fixed;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  pointer-events: none;
  z-index: 9999;
  font-size: 12px;
}

.tooltip-title {
  font-weight: bold;
  margin-bottom: 2px;
}

.tooltip-value {
  font-size: 11px;
}
.portrait-canvas {
  height: calc(100% - 60px);
  overflow: hidden;
}

.portrait-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
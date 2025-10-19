<!-- src/views/pages/ChinaVis/components/WeekCard.vue -->
<template>
  <v-card elevation="2" class="week-card">
    <!-- 标题栏 -->
    <v-card-title class="d-flex align-center py-2 px-3">
      <v-icon size="20" class="mr-2">mdi-calendar-week</v-icon>
      <span class="text-subtitle-1 font-weight-medium">Week View</span>
      
      <v-spacer />
      
      <!-- 分页控制 -->
      <div v-if="totalPages > 1" class="d-flex align-center mr-2">
        <v-btn 
          icon 
          size="small" 
          variant="text"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          <v-icon>mdi-chevron-left</v-icon>
        </v-btn>
        <span class="text-caption mx-2">{{ currentPage }} / {{ totalPages }}</span>
        <v-btn 
          icon 
          size="small" 
          variant="text"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          <v-icon>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
      
      <v-chip size="small" :color="getModeColor()">
        {{ getModeText() }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
    <v-card-text v-if="weekData.loading.value || scatterData.loading.value" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-card-text>

    <!-- 空状态 -->
    <v-card-text v-else-if="pagedStudentData.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-information-outline</v-icon>
      <div class="mt-2 text-grey">暂无答题记录</div>
    </v-card-text>

    <!-- 周日志画布 -->
    <v-card-text v-else class="pa-0" style="height: calc(100% - 60px);">
      <div ref="containerRef" class="week-container">
        <svg ref="svgRef" :width="svgWidth" :height="svgHeight" />
        
        <!-- Tooltip - 改用相对定位 -->
        <v-card
          v-show="tooltip.visible"
          class="week-tooltip"
          :style="tooltipStyle"
          elevation="8"
        >
          <v-card-title class="text-subtitle-2 pa-2">
            <v-icon size="16" class="mr-1">mdi-account</v-icon>
            {{ tooltip.studentId }}
            <v-spacer />
            <v-chip size="x-small" color="primary">Week {{ tooltip.week }}</v-chip>
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-2 text-caption">
            <div v-for="[k, v] in tooltip.knowledge" :key="k" class="d-flex justify-space-between mb-1">
              <span class="text-grey-darken-1">{{ k }}:</span>
              <strong :style="{ color: getScoreColor(v) }">{{ (v * 100).toFixed(0) }}%</strong>
            </div>
            <v-divider class="my-1" />
            <div class="d-flex justify-space-between">
              <span class="text-grey-darken-1">平均得分:</span>
              <strong class="text-success">{{ (tooltip.avgScore * 100).toFixed(0) }}%</strong>
            </div>
            <div class="text-grey text-caption mt-1">
              提交 {{ tooltip.submits }} 次
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import * as d3 from 'd3';
import { useWeekData } from '../composables/useWeekData';
import { useVisStore } from '../stores/useVisStore';
import { useScatterData } from '../composables/useScatterData';
import type { WeekSnapshot } from '../lib/aggregateWeek';

const weekData = useWeekData();
const store = useVisStore();
const scatterData = useScatterData();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);

const currentPage = ref(1);
const pageSize = 5; // 减少每页数量，提升性能

// 布局参数
const rowHeight = 100;
const weekWidth = 90;
const ringRadius = 36;
const innerRadius = 24;
const leftMargin = 70; // 缩小左边距，避免文字冲突

// ============================================
// D3 配色方案 - 使用推荐的 Blues
// ============================================
const knowledgeColors = d3.schemeBlues[9];
const knowledgeColorScale = d3.scaleOrdinal(knowledgeColors);
const scoreColorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

interface StudentWeekRow {
  studentId: string;
  snapshots: WeekSnapshot[];
  maxWeek: number;
}

// ============================================
// 学生数据聚合 - 修复：分离全体平均和个体逻辑
// ============================================
const isAllMode = computed(() => store.selectedStudents.size === 0);

// 总数据（用于分页计算）
const totalStudentCount = computed(() => {
  if (isAllMode.value) return 1; // 全体平均只有1行
  return store.selectedStudents.size;
});

const totalPages = computed(() => 
  Math.ceil(totalStudentCount.value / pageSize)
);

// 只渲染当前页的数据
const pagedStudentData = computed<StudentWeekRow[]>(() => {
  if (!scatterData.rawData?.value) return [];

  // 情况1：全体平均（不分页，直接用 weekData）
  if (isAllMode.value) {
    const snaps = weekData.snapshots.value.filter(s => s.hasActivity);
    if (snaps.length === 0) return [];
    return [{
      studentId: '全体平均',
      snapshots: snaps,
      maxWeek: Math.max(...snaps.map(s => s.week), 0),
    }];
  }

  // 情况2：选中学生（分页加载）
  const { records, titleMap } = scatterData.rawData.value;
  const allIds = Array.from(store.selectedStudents);
  
  // 只取当前页的ID
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  const pageIds = allIds.slice(start, end);

  // 只聚合当前页的5个学生
  return pageIds
    .map(studentId => {
      const snapshots = aggregateStudentWeeks(records, titleMap, studentId)
        .filter(s => s.hasActivity && s.totalSubmits > 0);
      if (snapshots.length === 0) return null;
      return {
        studentId,
        snapshots,
        maxWeek: Math.max(...snapshots.map(s => s.week), 0),
      };
    })
    .filter((row): row is StudentWeekRow => row !== null)
    .sort((a, b) => b.maxWeek - a.maxWeek);
});

function aggregateStudentWeeks(records: any[], titleMap: any, studentId: string) {
  const studentRecords = records.filter(r => r.student_ID === studentId);
  const byWeek = d3.group(studentRecords, d => d.week || 0);
  const knowledgeOrder = weekData.knowledgeOrder.value;

  const snapshots: WeekSnapshot[] = [];

  for (const [week, logs] of byWeek) {
    if (week === 0 || logs.length === 0) continue;

    const byKnowledge = d3.group(logs, d => 
      titleMap.get(d.title_ID)?.knowledge || 'Unknown'
    );
    const knowledgeScores = new Map<string, number>();

    for (const [knowledge, kLogs] of byKnowledge) {
      if (knowledge === 'Unknown') continue;

      const byTitle = d3.group(kLogs, d => d.title_ID);
      const lastScores: number[] = [];

      for (const [_, titleLogs] of byTitle) {
        const sorted = [...titleLogs].sort((a, b) => a.time - b.time);
        lastScores.push(sorted[sorted.length - 1].pct_score || 0);
      }

      knowledgeScores.set(knowledge, d3.mean(lastScores) || 0);
    }

    snapshots.push({
      week,
      knowledgeScores,
      avgScore: d3.mean(logs, d => d.pct_score || 0) || 0,
      totalSubmits: logs.length,
      hasActivity: true,
    });
  }

  return snapshots.sort((a, b) => a.week - b.week);
}

const svgWidth = computed(() => {
  const maxWeeks = Math.max(
    ...pagedStudentData.value.map(r => r.maxWeek),
    20
  );
  return leftMargin + maxWeeks * weekWidth + 50;
});

const svgHeight = computed(() => {
  return pagedStudentData.value.length * rowHeight + 60;
});

// ============================================
// Tooltip（改用相对定位）
// ============================================
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  studentId: '',
  week: 0,
  knowledge: [] as [string, number][],
  avgScore: 0,
  submits: 0,
});

const tooltipStyle = computed(() => ({
  position: 'absolute',
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`,
  'pointer-events': 'none',
  'z-index': '1000',
}));

function getScoreColor(score: number) {
  return scoreColorScale(score);
}

// ============================================
// 模式显示
// ============================================
function getModeText() {
  if (store.selectedStudents.size === 0) return '全体平均';
  if (store.selectedStudents.size === 1) return '个体';
  return `群体 (${store.selectedStudents.size})`;
}

function getModeColor() {
  if (store.selectedStudents.size === 0) return 'grey';
  if (store.selectedStudents.size === 1) return 'primary';
  return 'success';
}

// ============================================
// 渲染（优化：只渲染当前页）
// ============================================
onMounted(() => {
  nextTick(() => renderWeekView());
});

watch(() => [currentPage.value, pagedStudentData.value.length], () => {
  nextTick(() => renderWeekView());
}, { deep: true });

// 监听选中变化，重置到第一页
watch(() => store.selectedStudents.size, () => {
  currentPage.value = 1;
});

function renderWeekView() {
  if (!svgRef.value || pagedStudentData.value.length === 0) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  const data = pagedStudentData.value;
  const knowledgeOrder = weekData.knowledgeOrder.value;

  data.forEach((row, rowIdx) => {
    const y = rowIdx * rowHeight + rowHeight / 2 + 40;

    // 1. 学生图标（改用 mdi 图标）
    drawStudentIcon(svg, row.studentId, 20, y); // x=20，给文字留够空间

    // 2. 进度线
    const progressData = calculateRowProgress(row.snapshots);
    drawProgressFlows(svg, progressData, y);

    // 3. 周环形图
    row.snapshots.forEach(snapshot => {
      const x = leftMargin + snapshot.week * weekWidth;
      drawWeekRing(svg, snapshot, knowledgeOrder, x, y, row.studentId);
    });

    // 4. 周标签
    if (rowIdx === 0) {
      for (let week = 1; week <= row.maxWeek; week++) {
        const x = leftMargin + week * weekWidth;
        drawWeekLabel(svg, week, x, 20);
      }
    }
  });
}

// ============================================
// 绘图函数（优化配色）
// ============================================
function drawStudentIcon(svg: any, studentId: string, x: number, y: number) {
  const g = svg.append('g').attr('transform', `translate(${x}, ${y})`);

  // 简洁的圆形背景
  g.append('circle')
    .attr('r', 18)
    .attr('fill', '#1976D2')
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // mdi 图标
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', '20px')
    .attr('fill', '#fff')
    .attr('font-family', 'Material Design Icons')
    .text('\uF004'); // mdi-account

  // ID 文字 - 调整位置避免冲突
  const label = studentId === '全体平均' ? '全部' : studentId.slice(-6);
  g.append('text')
    .attr('x', 26)
    .attr('text-anchor', 'start')
    .attr('dominant-baseline', 'central')
    .attr('font-size', '10px')
    .attr('fill', '#444')
    .attr('font-weight', '500')
    .text(label);
}

function drawWeekLabel(svg: any, week: number, x: number, y: number) {
  svg.append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('font-weight', '500')
    .attr('fill', '#888')
    .text(`W${week}`);
}

function drawWeekRing(
  svg: any,
  snapshot: WeekSnapshot,
  knowledgeOrder: string[],
  cx: number,
  cy: number,
  studentId: string
) {
  const data = knowledgeOrder.map((k, i) => ({
    knowledge: k,
    score: snapshot.knowledgeScores.get(k) || 0,
    color: knowledgeColorScale(i.toString()),
  }));

  const arc = d3.arc<any>()
    .innerRadius(innerRadius)
    .outerRadius(ringRadius);

  const pie = d3.pie<any>()
    .value(1)
    .sort(null);

  const g = svg.append('g').attr('transform', `translate(${cx}, ${cy})`);

  // 外圈扇形（使用 Blues 色系）
  g.selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arc)
    .attr('fill', (d: any) => {
      // 根据分数调整透明度
      const baseColor = d3.color(d.data.color);
      if (!baseColor) return d.data.color;
      baseColor.opacity = d.data.score * 0.7 + 0.3;
      return baseColor.toString();
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);

  // 中心圆（分数色阶）
  g.append('circle')
    .attr('r', innerRadius - 2)
    .attr('fill', scoreColorScale(snapshot.avgScore))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // 交互层（使用容器相对坐标）
  g.append('circle')
    .attr('r', ringRadius)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('mouseenter', (event: any) => {
      const containerRect = containerRef.value!.getBoundingClientRect();
      const svgRect = svgRef.value!.getBoundingClientRect();
      
      tooltip.value = {
        visible: true,
        x: cx + (svgRect.left - containerRect.left) + 10,
        y: cy + (svgRect.top - containerRect.top) - 80,
        studentId,
        week: snapshot.week,
        knowledge: Array.from(snapshot.knowledgeScores.entries()),
        avgScore: snapshot.avgScore,
        submits: snapshot.totalSubmits,
      };
    })
    .on('mouseleave', () => {
      tooltip.value.visible = false;
    });
}

function calculateRowProgress(snapshots: WeekSnapshot[]) {
  const progress: any[] = [];
  for (let i = 0; i < snapshots.length - 1; i++) {
    const curr = snapshots[i];
    const next = snapshots[i + 1];
    let total = 0, count = 0;
    for (const [k, v] of next.knowledgeScores) {
      const prev = curr.knowledgeScores.get(k);
      if (prev !== undefined) {
        total += v - prev;
        count++;
      }
    }
    progress.push({
      fromWeek: curr.week,
      toWeek: next.week,
      improvement: count > 0 ? total / count : 0,
    });
  }
  return progress;
}

function drawProgressFlows(svg: any, progressData: any[], y: number) {
  progressData.forEach(d => {
    const x1 = leftMargin + d.fromWeek * weekWidth + ringRadius;
    const x2 = leftMargin + d.toWeek * weekWidth - ringRadius;
    const color = d.improvement >= 0 ? '#4CAF50' : '#F44336';
    
    svg.append('line')
      .attr('x1', x1).attr('y1', y)
      .attr('x2', x2).attr('y2', y)
      .attr('stroke', color)
      .attr('stroke-width', Math.max(1, Math.abs(d.improvement) * 20))
      .attr('opacity', 0.4);
  });
}
</script>

<style scoped>
.week-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.week-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  position: relative;
}

.week-tooltip {
  max-width: 240px;
  font-size: 12px;
}
</style>
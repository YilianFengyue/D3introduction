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
    <v-card-text v-if="weekData.loading.value" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-card-text>

    <!-- 空状态 -->
    <v-card-text v-else-if="allStudentData.length === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-information-outline</v-icon>
      <div class="mt-2 text-grey">该时间段内无答题记录</div>
    </v-card-text>

    <!-- 周日志画布 -->
    <v-card-text v-else class="pa-0" style="height: calc(100% - 60px);">
      <div ref="containerRef" class="week-container">
        <svg ref="svgRef" :width="svgWidth" :height="svgHeight" />
        
        <!-- Tooltip -->
        <div
          ref="tooltipRef"
          class="week-tooltip"
          :style="tooltipStyle"
          v-show="tooltip.visible"
        >
          <div class="tooltip-header">
            <strong>{{ tooltip.studentId }}</strong>
            <span class="text-caption ml-2">Week {{ tooltip.week }}</span>
          </div>
          <v-divider class="my-1" />
          <div class="tooltip-content">
            <div v-for="[k, v] in tooltip.knowledge" :key="k" class="tooltip-row">
              <span>{{ k }}:</span>
              <strong>{{ (v * 100).toFixed(0) }}%</strong>
            </div>
          </div>
          <v-divider class="my-1" />
          <div class="tooltip-row">
            <span>平均得分:</span>
            <strong>{{ (tooltip.avgScore * 100).toFixed(0) }}%</strong>
          </div>
          <div class="tooltip-row">
            <span>提交 {{ tooltip.submits }} 次</span>
          </div>
        </div>
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

// ============================================
// Setup
// ============================================

const weekData = useWeekData();
const store = useVisStore();
const scatterData = useScatterData();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

// 分页状态
const currentPage = ref(1);
const pageSize = 10; // 每页显示10个学生

// 布局参数
const rowHeight = 100;
const weekWidth = 90;
const ringRadius = 36;
const innerRadius = 24;
const leftMargin = 100;

// D3 配色方案
const knowledgeColorScale = d3.scaleOrdinal(d3.schemeCategory10);
const scoreColorScale = d3.scaleSequential(d3.interpolateYlGn).domain([0, 1]);

// ============================================
// 学生数据聚合
// ============================================

interface StudentWeekRow {
  studentId: string;
  snapshots: WeekSnapshot[];
  maxWeek: number;
}

const allStudentData = computed<StudentWeekRow[]>(() => {
  if (!scatterData.rawData?.value) return [];

  const { records, titleMap } = scatterData.rawData.value;
  const selectedIds = store.selectedStudents;

  // 未选中：显示全体平均
  if (selectedIds.size === 0) {
    return [{
      studentId: '全体平均',
      snapshots: weekData.snapshots.value,
      maxWeek: Math.max(...weekData.snapshots.value.map(s => s.week), 0),
    }];
  }

  // 已选中：为每个学生聚合
  return Array.from(selectedIds)
    .map(studentId => {
      const snapshots = aggregateStudentWeeks(records, titleMap, studentId);
      return {
        studentId,
        snapshots,
        maxWeek: Math.max(...snapshots.map(s => s.week), 0),
      };
    })
    .filter(row => row.snapshots.length > 0)
    .sort((a, b) => b.maxWeek - a.maxWeek); // 按活跃度排序
});

// 分页数据
const pagedStudentData = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  const end = start + pageSize;
  return allStudentData.value.slice(start, end);
});

const totalPages = computed(() => 
  Math.ceil(allStudentData.value.length / pageSize)
);

// 单个学生的周数据聚合
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

// SVG 尺寸
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
// Tooltip
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
  left: `${tooltip.value.x}px`,
  top: `${tooltip.value.y}px`,
}));

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
// 渲染
// ============================================

onMounted(() => {
  nextTick(() => renderWeekView());
});

watch(() => [currentPage.value, pagedStudentData.value.length], () => {
  nextTick(() => renderWeekView());
}, { deep: true });

function renderWeekView() {
  if (!svgRef.value || pagedStudentData.value.length === 0) return;

  const svg = d3.select(svgRef.value);
  svg.selectAll('*').remove();

  const data = pagedStudentData.value;
  const knowledgeOrder = weekData.knowledgeOrder.value;

  // 绘制每个学生的行
  data.forEach((row, rowIdx) => {
    const y = rowIdx * rowHeight + rowHeight / 2 + 40;

    // 1. 学生头像
    drawStudentAvatar(svg, row.studentId, 20, y);

    // 2. 进度线
    const progressData = calculateRowProgress(row.snapshots);
    drawProgressFlows(svg, progressData, y);

    // 3. 周环形图
    row.snapshots.forEach(snapshot => {
      const x = leftMargin + snapshot.week * weekWidth;
      drawWeekRing(svg, snapshot, knowledgeOrder, x, y, row.studentId);
    });

    // 4. 周标签（只在第一行）
    if (rowIdx === 0) {
      for (let week = 1; week <= row.maxWeek; week++) {
        const x = leftMargin + week * weekWidth;
        drawWeekLabel(svg, week, x, 20);
      }
    }
  });
}

// ============================================
// 绘图函数
// ============================================

function drawStudentAvatar(svg: any, studentId: string, x: number, y: number) {
  const g = svg.append('g').attr('transform', `translate(${x}, ${y})`);

  // 渐变背景圆
  const gradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', `avatar-grad-${studentId}`)
    .attr('x1', '0%').attr('y1', '0%')
    .attr('x2', '100%').attr('y2', '100%');
  
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#667eea');
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#764ba2');

  g.append('circle')
    .attr('r', 20)
    .attr('fill', `url(#avatar-grad-${studentId})`)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // 首字母
  g.append('text')
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'central')
    .attr('font-size', '14px')
    .attr('font-weight', 'bold')
    .attr('fill', '#fff')
    .text(studentId.slice(-2).toUpperCase());

  // ID 文字
  g.append('text')
    .attr('x', 30)
    .attr('text-anchor', 'start')
    .attr('dominant-baseline', 'central')
    .attr('font-size', '12px')
    .attr('fill', '#666')
    .text(studentId.slice(-6));
}

function drawWeekLabel(svg: any, week: number, x: number, y: number) {
  svg.append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
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
  // 外圈扇形
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

  g.selectAll('path')
    .data(pie(data))
    .join('path')
    .attr('d', arc)
    .attr('fill', (d: any) => {
      const opacity = d.data.score * 0.7 + 0.3;
      return d3.color(d.data.color)!.copy({ opacity });
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);

  // 中心圆
  g.append('circle')
    .attr('r', innerRadius - 2)
    .attr('fill', scoreColorScale(snapshot.avgScore))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2);

  // 交互层
  g.append('circle')
    .attr('r', ringRadius)
    .attr('fill', 'transparent')
    .style('cursor', 'pointer')
    .on('mouseenter', (event: any) => {
      tooltip.value = {
        visible: true,
        x: event.pageX + 10,
        y: event.pageY + 10,
        studentId,
        week: snapshot.week,
        knowledge: Array.from(snapshot.knowledgeScores.entries()),
        avgScore: snapshot.avgScore,
        submits: snapshot.totalSubmits,
      };
    })
    .on('mousemove', (event: any) => {
      tooltip.value.x = event.pageX + 10;
      tooltip.value.y = event.pageY + 10;
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
    const color = d.improvement >= 0 ? '#52c41a' : '#f5222d';
    
    svg.append('line')
      .attr('x1', x1).attr('y1', y)
      .attr('x2', x2).attr('y2', y)
      .attr('stroke', color)
      .attr('stroke-width', Math.max(2, Math.abs(d.improvement) * 25))
      .attr('opacity', 0.5);
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
  position: fixed;
  background: rgba(30, 30, 30, 0.95);
  color: white;
  padding: 10px 14px;
  border-radius: 6px;
  pointer-events: none;
  z-index: 9999;
  font-size: 12px;
  max-width: 280px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.tooltip-header {
  display: flex;
  align-items: center;
  font-size: 13px;
  margin-bottom: 4px;
}

.tooltip-content {
  max-height: 140px;
  overflow-y: auto;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 3px 0;
  font-size: 11px;
  line-height: 1.4;
}

.tooltip-row strong {
  color: #4CAF50;
}
</style>
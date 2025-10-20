<template>
  <v-card elevation="2" class="student-card">
    <v-card-title class="d-flex align-center py-2 px-3">
      <v-icon size="20" class="mr-2">mdi-account-details</v-icon>
      <span class="text-subtitle-1 font-weight-medium">Student View</span>
      
      <v-spacer />
      
      <v-chip size="small" :color="getModeColor()">
        {{ getModeText() }}
      </v-chip>
    </v-card-title>

    <v-divider />

    <!-- 无选中状态 -->
    <v-card-text v-if="store.selectedStudents.size === 0" class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-account-search</v-icon>
      <div class="mt-2 text-grey">请在散点图中选择学生</div>
    </v-card-text>

    <!-- 学生详情视图 -->
    <v-card-text v-else class="pa-0" style="height: calc(100% - 60px);">
      <div class="student-content">
        <!-- 左侧：学生列表 -->
        <div class="student-list">
          <v-list density="compact" class="pa-0">
            <v-list-item
              v-for="studentId in selectedStudentsList"
              :key="studentId"
              :active="currentStudent === studentId"
              @click="currentStudent = studentId"
              class="student-list-item"
            >
              <template #prepend>
                <v-avatar size="32" color="primary">
                  <v-icon size="18" color="white">mdi-account</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="text-caption">
                {{ studentId.slice(-8) }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="text-caption">
                {{ getStudentClass(studentId) }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </div>

        <!-- 右侧：题目详情 -->
        <div class="student-detail">
          <div v-if="currentStudentData" class="detail-content">
            
            <div class="student-header pa-3">
              <div class="d-flex align-center">
                <v-avatar size="40" color="primary" class="mr-3">
                  <v-icon size="24" color="white">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">
                    {{ currentStudent }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ getStudentClass(currentStudent) }}
                  </div>
                </div>
                <v-spacer />
                <v-chip size="small" color="success">
                  {{ currentStudentData.length }} 道题
                </v-chip>
              </div>
            </div>

            <v-divider />

            
            <div class="title-list pa-3">
              <svg ref="chartRef" :width="chartWidth" :height="chartHeight"></svg>
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import * as d3 from 'd3';
import { useVisStore } from '../stores/useVisStore';
import { useStudentData } from '../composables/useStudentData';

const store = useVisStore();
const studentData = useStudentData();

const chartRef = ref<SVGSVGElement | null>(null);
const currentStudent = ref<string>('');

// 当选中学生变化时，自动切换到第一个
watch(() => store.selectedStudents, () => {
  const ids = Array.from(store.selectedStudents);
  if (ids.length > 0 && !store.selectedStudents.has(currentStudent.value)) {
    currentStudent.value = ids[0];
  }
}, { deep: true, immediate: true });

const selectedStudentsList = computed(() => 
  Array.from(store.selectedStudents)
);

const currentStudentData = computed(() => {
  if (!currentStudent.value) return null;
  return studentData.getStudentTitles(currentStudent.value);
});

const chartWidth = 600;
const chartHeight = computed(() => {
  const count = currentStudentData.value?.length || 0;
  return Math.max(count * 30 + 80, 300);
});

function getStudentClass(studentId: string) {
  return studentData.getStudentClass(studentId) || 'Unknown';
}

function getModeText() {
  const count = store.selectedStudents.size;
  if (count === 1) return '个体';
  return `群体 (${count})`;
}

function getModeColor() {
  return store.selectedStudents.size === 1 ? 'primary' : 'success';
}

// 渲染图表
watch(() => currentStudentData.value, () => {
  nextTick(() => renderChart());
}, { immediate: true });

function renderChart() {
  if (!chartRef.value || !currentStudentData.value) return;

  const svg = d3.select(chartRef.value);
  svg.selectAll('*').remove();

  const data = currentStudentData.value;
  const margin = { top: 40, right: 120, bottom: 40, left: 80 };
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight.value - margin.top - margin.bottom;
  const rowHeight = 25;

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // 比例尺
  const maxAttempts = d3.max(data, d => d.attempts) || 10;
  const xScale = d3.scaleLinear()
    .domain([0, Math.max(maxAttempts, 10)])
    .range([0, width * 0.4]);

  const scoreScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, width * 0.5]);

  // 绘制每道题
  data.forEach((item, i) => {
    const y = i * rowHeight;

    // 题目ID
    g.append('text')
      .attr('x', -10)
      .attr('y', y + rowHeight / 2)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(item.titleId.slice(-6));

    // 提交次数（蓝色柱）
    g.append('rect')
      .attr('x', 0)
      .attr('y', y + 2)
      .attr('width', xScale(item.attempts))
      .attr('height', rowHeight - 4)
      .attr('fill', '#2196F3')
      .attr('opacity', 0.6);

    // 提交次数文本
    g.append('text')
      .attr('x', xScale(item.attempts) + 5)
      .attr('y', y + rowHeight / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(item.attempts);

    // 得分（绿色柱）
    const scoreX = width * 0.45;
    g.append('rect')
      .attr('x', scoreX)
      .attr('y', y + 2)
      .attr('width', scoreScale(item.maxScore))
      .attr('height', rowHeight - 4)
      .attr('fill', '#4CAF50')
      .attr('opacity', 0.7);

    // 得分文本
    g.append('text')
      .attr('x', scoreX + scoreScale(item.maxScore) + 5)
      .attr('y', y + rowHeight / 2)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(`${(item.maxScore * 100).toFixed(0)}%`);

    // 提交点（蓝色圆点）
    const dotX = width * 0.42;
    for (let j = 0; j < Math.min(item.attempts, 10); j++) {
      g.append('circle')
        .attr('cx', dotX + j * 4)
        .attr('cy', y + rowHeight / 2)
        .attr('r', 1.5)
        .attr('fill', '#1976D2');
    }
  });

  // 图例
  const legend = g.append('g')
    .attr('transform', `translate(0, ${data.length * rowHeight + 20})`);

  legend.append('rect')
    .attr('x', 0).attr('y', 0)
    .attr('width', 20).attr('height', 12)
    .attr('fill', '#2196F3').attr('opacity', 0.6);
  legend.append('text')
    .attr('x', 25).attr('y', 10)
    .attr('font-size', '11px')
    .text('SubmitNum');

  legend.append('rect')
    .attr('x', 120).attr('y', 0)
    .attr('width', 20).attr('height', 12)
    .attr('fill', '#4CAF50').attr('opacity', 0.7);
  legend.append('text')
    .attr('x', 145).attr('y', 10)
    .attr('font-size', '11px')
    .text('Score');
}
</script>

<style scoped>
.student-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.student-content {
  display: flex;
  height: 100%;
}

.student-list {
  width: 200px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
}

.student-list-item {
  border-bottom: 1px solid #f5f5f5;
}

.student-detail {
  flex: 1;
  overflow-y: auto;
}

.detail-content {
  height: 100%;
}

.student-header {
  background: #fafafa;
}

.title-list {
  overflow-y: auto;
}
</style>
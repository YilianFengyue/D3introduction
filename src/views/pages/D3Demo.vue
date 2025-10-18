<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="text-h4 text-center">
            D3.js + Vue3 + Vuetify3 入门Demo
          </v-card-title>
          <v-card-subtitle class="text-center">
            数据可视化基础示例
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- 柱状图示例 -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>柱状图示例</v-card-title>
          <v-card-text>
            <div ref="barChartRef" class="chart-container"></div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="updateBarChart" color="primary" size="small">
              更新数据
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 折线图示例 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>折线图示例</v-card-title>
          <v-card-text>
            <div ref="lineChartRef" class="chart-container"></div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="updateLineChart" color="secondary" size="small">
              更新数据
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 散点图示例 -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>散点图示例</v-card-title>
          <v-card-text>
            <div ref="scatterChartRef" class="chart-container"></div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="updateScatterChart" color="success" size="small">
              更新数据
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 饼图示例 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>饼图示例</v-card-title>
          <v-card-text>
            <div ref="pieChartRef" class="chart-container"></div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="updatePieChart" color="warning" size="small">
              更新数据
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 交互式图表 -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>交互式柱状图</v-card-title>
          <v-card-subtitle>鼠标悬停查看详细信息，点击高亮</v-card-subtitle>
          <v-card-text>
            <div ref="interactiveChartRef" class="chart-container"></div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as d3 from 'd3'

// 模板引用
const barChartRef = ref(null)
const lineChartRef = ref(null)
const scatterChartRef = ref(null)
const pieChartRef = ref(null)
const interactiveChartRef = ref(null)

// 图表数据
const barData = ref([
  { name: 'A', value: 30 },
  { name: 'B', value: 80 },
  { name: 'C', value: 45 },
  { name: 'D', value: 60 },
  { name: 'E', value: 20 }
])

const lineData = ref([
  { x: 0, y: 30 },
  { x: 1, y: 80 },
  { x: 2, y: 45 },
  { x: 3, y: 60 },
  { x: 4, y: 20 },
  { x: 5, y: 90 },
  { x: 6, y: 55 }
])

const scatterData = ref([
  { x: 30, y: 40, size: 10 },
  { x: 80, y: 90, size: 15 },
  { x: 45, y: 30, size: 8 },
  { x: 60, y: 70, size: 12 },
  { x: 20, y: 50, size: 6 }
])

const pieData = ref([
  { name: '苹果', value: 30 },
  { name: '橙子', value: 25 },
  { name: '香蕉', value: 20 },
  { name: '葡萄', value: 15 },
  { name: '其他', value: 10 }
])

// 图表尺寸配置
const chartConfig = {
  width: 400,
  height: 300,
  margin: { top: 20, right: 30, bottom: 40, left: 40 }
}

// 创建柱状图
const createBarChart = () => {
  const container = barChartRef.value
  d3.select(container).selectAll("*").remove() // 清空容器

  const svg = d3.select(container)
    .append('svg')
    .attr('width', chartConfig.width)
    .attr('height', chartConfig.height)

  const { width, height, margin } = chartConfig
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 比例尺
  const xScale = d3.scaleBand()
    .domain(barData.value.map(d => d.name))
    .range([0, innerWidth])
    .padding(0.1)

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(barData.value, d => d.value)])
    .range([innerHeight, 0])

  // 绘制坐标轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))

  g.append('g')
    .call(d3.axisLeft(yScale))

  // 绘制柱子
  g.selectAll('.bar')
    .data(barData.value)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.name))
    .attr('width', xScale.bandwidth())
    .attr('y', d => yScale(d.value))
    .attr('height', d => innerHeight - yScale(d.value))
    .attr('fill', '#1976D2')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('fill', '#FF9800')
    })
    .on('mouseout', function(event, d) {
      d3.select(this).attr('fill', '#1976D2')
    })
}

// 创建折线图
const createLineChart = () => {
  const container = lineChartRef.value
  d3.select(container).selectAll("*").remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', chartConfig.width)
    .attr('height', chartConfig.height)

  const { width, height, margin } = chartConfig
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 比例尺
  const xScale = d3.scaleLinear()
    .domain(d3.extent(lineData.value, d => d.x))
    .range([0, innerWidth])

  const yScale = d3.scaleLinear()
    .domain(d3.extent(lineData.value, d => d.y))
    .range([innerHeight, 0])

  // 线条生成器
  const line = d3.line()
    .x(d => xScale(d.x))
    .y(d => yScale(d.y))
    .curve(d3.curveMonotoneX)

  // 绘制坐标轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))

  g.append('g')
    .call(d3.axisLeft(yScale))

  // 绘制线条
  g.append('path')
    .datum(lineData.value)
    .attr('fill', 'none')
    .attr('stroke', '#4CAF50')
    .attr('stroke-width', 2)
    .attr('d', line)

  // 绘制数据点
  g.selectAll('.dot')
    .data(lineData.value)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', 4)
    .attr('fill', '#4CAF50')
}

// 创建散点图
const createScatterChart = () => {
  const container = scatterChartRef.value
  d3.select(container).selectAll("*").remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', chartConfig.width)
    .attr('height', chartConfig.height)

  const { width, height, margin } = chartConfig
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 比例尺
  const xScale = d3.scaleLinear()
    .domain(d3.extent(scatterData.value, d => d.x))
    .range([0, innerWidth])

  const yScale = d3.scaleLinear()
    .domain(d3.extent(scatterData.value, d => d.y))
    .range([innerHeight, 0])

  const sizeScale = d3.scaleLinear()
    .domain(d3.extent(scatterData.value, d => d.size))
    .range([3, 15])

  // 绘制坐标轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))

  g.append('g')
    .call(d3.axisLeft(yScale))

  // 绘制散点
  g.selectAll('.dot')
    .data(scatterData.value)
    .enter().append('circle')
    .attr('class', 'dot')
    .attr('cx', d => xScale(d.x))
    .attr('cy', d => yScale(d.y))
    .attr('r', d => sizeScale(d.size))
    .attr('fill', '#E91E63')
    .attr('opacity', 0.7)
}

// 创建饼图
const createPieChart = () => {
  const container = pieChartRef.value
  d3.select(container).selectAll("*").remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', chartConfig.width)
    .attr('height', chartConfig.height)

  const radius = Math.min(chartConfig.width, chartConfig.height) / 2 - 10

  const g = svg.append('g')
    .attr('transform', `translate(${chartConfig.width/2},${chartConfig.height/2})`)

  // 颜色比例尺
  const color = d3.scaleOrdinal()
    .domain(pieData.value.map(d => d.name))
    .range(['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'])

  // 饼图生成器
  const pie = d3.pie()
    .value(d => d.value)
    .sort(null)

  // 弧形生成器
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius)

  // 绘制饼图
  const arcs = g.selectAll('.arc')
    .data(pie(pieData.value))
    .enter().append('g')
    .attr('class', 'arc')

  arcs.append('path')
    .attr('d', arc)
    .attr('fill', d => color(d.data.name))
    .attr('stroke', 'white')
    .attr('stroke-width', 2)

  // 添加标签
  arcs.append('text')
    .attr('transform', d => `translate(${arc.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('fill', 'white')
    .text(d => d.data.name)
}

// 创建交互式图表
const createInteractiveChart = () => {
  const container = interactiveChartRef.value
  d3.select(container).selectAll("*").remove()

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '400')
    .attr('viewBox', `0 0 800 400`)

  const width = 800
  const height = 400
  const margin = { top: 20, right: 30, bottom: 40, left: 40 }
  const innerWidth = width - margin.left - margin.right
  const innerHeight = height - margin.top - margin.bottom

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 创建工具提示
  const tooltip = d3.select(container)
    .append('div')
    .style('position', 'absolute')
    .style('padding', '10px')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('border-radius', '5px')
    .style('pointer-events', 'none')
    .style('opacity', 0)

  // 比例尺
  const xScale = d3.scaleBand()
    .domain(barData.value.map(d => d.name))
    .range([0, innerWidth])
    .padding(0.1)

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(barData.value, d => d.value)])
    .range([innerHeight, 0])

  // 绘制坐标轴
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))

  g.append('g')
    .call(d3.axisLeft(yScale))

  // 绘制柱子
  g.selectAll('.interactive-bar')
    .data(barData.value)
    .enter().append('rect')
    .attr('class', 'interactive-bar')
    .attr('x', d => xScale(d.name))
    .attr('width', xScale.bandwidth())
    .attr('y', d => yScale(d.value))
    .attr('height', d => innerHeight - yScale(d.value))
    .attr('fill', '#673AB7')
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', '#FF5722')
        .attr('transform', 'scale(1.02)')

      tooltip
        .style('opacity', 1)
        .html(`<strong>${d.name}</strong><br/>值: ${d.value}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('fill', '#673AB7')
        .attr('transform', 'scale(1)')

      tooltip.style('opacity', 0)
    })
    .on('click', function(event, d) {
      // 重置所有柱子
      g.selectAll('.interactive-bar')
        .attr('stroke', 'none')
        .attr('stroke-width', 0)

      // 高亮当前柱子
      d3.select(this)
        .attr('stroke', '#FFC107')
        .attr('stroke-width', 3)

      alert(`你点击了: ${d.name}, 值: ${d.value}`)
    })
}

// 更新数据函数
const updateBarChart = () => {
  barData.value = barData.value.map(d => ({
    ...d,
    value: Math.floor(Math.random() * 100)
  }))
  createBarChart()
}

const updateLineChart = () => {
  lineData.value = lineData.value.map((d, i) => ({
    x: i,
    y: Math.floor(Math.random() * 100)
  }))
  createLineChart()
}

const updateScatterChart = () => {
  scatterData.value = scatterData.value.map(d => ({
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
    size: Math.floor(Math.random() * 15) + 5
  }))
  createScatterChart()
}

const updatePieChart = () => {
  pieData.value = pieData.value.map(d => ({
    ...d,
    value: Math.floor(Math.random() * 50) + 10
  }))
  createPieChart()
}

// 生命周期
onMounted(async () => {
  await nextTick()
  createBarChart()
  createLineChart()
  createScatterChart()
  createPieChart()
  createInteractiveChart()
})
</script>

<style scoped>
.chart-container {
  min-height: 300px;
  overflow: hidden;
}
</style>

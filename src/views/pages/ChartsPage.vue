<template>
  <div class="pa-4">
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>垂直条形图 (Bar Chart)</v-card-title>
          <v-card-subtitle>scaleBand (X轴) + scaleLinear (Y轴)</v-card-subtitle>
          <v-card-text>
            <svg ref="barChartRef" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>折线图 (Line Chart)</v-card-title>
          <v-card-subtitle>scaleTime (X轴) + scaleLinear (Y轴) + d3.line()</v-card-subtitle>
          <v-card-text>
            <svg ref="lineChartRef" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>散点图 (Scatter Plot)</v-card-title>
          <v-card-subtitle>scaleLinear (X轴 & Y轴) + scaleOrdinal (颜色)</v-card-subtitle>
          <v-card-text>
            <svg ref="scatterPlotRef" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>甜甜圈图 (Donut Chart)</v-card-title>
          <v-card-subtitle>scaleOrdinal (颜色) + d3.pie() + d3.arc()</v-card-subtitle>
          <v-card-text>
            <svg ref="pieChartRef" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="12" lg="12">
        <v-card class="card-shadow" height="420">
          <v-card-title>散点抖动图 (Scatter with Jittering)</v-card-title>
          <v-card-subtitle>scaleBand (X轴) + scaleLinear (Y轴) + 颜色映射</v-card-subtitle>
          <v-card-text>
            <svg ref="jitterScatterRef" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card class="card-shadow" height="600">
          <v-card-title>收入动态折线图 (Income Growth Animation)</v-card-title>
          <v-card-subtitle>多国收入对比 + 动画 + 交互 Tooltip</v-card-subtitle>
          <v-card-text>
            <div style="position: relative;">
              <svg ref="incomeChartRef" width="100%" height="500"></svg>
              <!-- Tooltip 卡片 -->
              <v-card
                v-if="tooltipVisible"
                :style="{
                  position: 'absolute',
                  left: tooltipX + 'px',
                  top: tooltipY + 'px',
                  pointerEvents: 'none',
                  zIndex: 1000
                }"
                class="tooltip-card"
                elevation="8"
              >
                <v-card-text class="pa-2">
                  <div style="font-weight: bold; margin-bottom: 8px;">{{ tooltipYear }}</div>
                  <div v-for="item in tooltipData" :key="item.country" style="margin: 4px 0;">
                    <span :style="{ color: item.color, marginRight: '8px' }">●</span>
                    <span style="font-weight: 500;">{{ item.country }}</span>
                    <span style="float: right; margin-left: 20px;">{{ item.value.toLocaleString() }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12">
        <v-card class="card-shadow" height="600">
          <v-card-title>动态排序柱状图</v-card-title>
          <v-card-subtitle>多国收入对比 + 动画 + 交互 Tooltip</v-card-subtitle>
          <v-card-text>
              <svg ref="raceChartRef" width="100%" height="500"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';

// --- Refs ---
const barChartRef = ref<SVGSVGElement | null>(null);
const lineChartRef = ref<SVGSVGElement | null>(null);
const scatterPlotRef = ref<SVGSVGElement | null>(null);
const pieChartRef = ref<SVGSVGElement | null>(null);
// ...已有的 ref...
const jitterScatterRef = ref<SVGSVGElement | null>(null);


const incomeChartRef = ref<SVGSVGElement | null>(null);

// Tooltip 状态
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipYear = ref('');
const tooltipData = ref<Array<{country: string, value: number, color: string}>>([]);

const raceChartRef = ref<SVGSVGElement | null>(null);

// --- Lifecycle ---
onMounted(() => {
  renderBarChart();
  renderLineChart();
  renderScatterPlot();
  renderPieChart();
  //新增调用
  renderJitterScatter();
  renderIncomeChart();
  renderRaceChart();
});



// --- 1. 条形图 ---
function renderBarChart() {
  if (!barChartRef.value) return;
  const data = [
    { name: 'A', value: 30 }, { name: 'B', value: 55 },
    { name: 'C', value: 42 }, { name: 'D', value: 68 },
    { name: 'E', value: 24 }, { name: 'F', value: 75 },
  ];

  const width = 600, height = 320;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const svg = d3.select(barChartRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([0, chartWidth])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)!])
    .nice()
    .range([chartHeight, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.selectAll("rect")
    .data(data)
    .join("rect")
      .attr("x", d => x(d.name)!)
      .attr("y", d => y(d.value))
      .attr("width", x.bandwidth())
      .attr("height", d => chartHeight - y(d.value))
      .attr("fill", "steelblue");
}

// --- 2. 折线图 ---
function renderLineChart() {
  if (!lineChartRef.value) return;
  const data = [
    { date: new Date(2025, 0, 1), value: 20 }, { date: new Date(2025, 1, 1), value: 35 },
    { date: new Date(2025, 2, 1), value: 28 }, { date: new Date(2025, 3, 1), value: 45 },
    { date: new Date(2025, 4, 1), value: 40 }, { date: new Date(2025, 5, 1), value: 60 },
  ];

  const width = 600, height = 320;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const svg = d3.select(lineChartRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date) as [Date, Date])
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)!])
    .nice()
    .range([chartHeight, 0]);

  svg.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).ticks(5));

  svg.append("g")
    .call(d3.axisLeft(y));

  const lineGenerator = d3.line<{date: Date, value: number}>()
    .x(d => x(d.date))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  svg.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "darkorange")
    .attr("stroke-width", 2.5)
    .attr("d", lineGenerator);
}

// --- 3. 散点图 ---
function renderScatterPlot() {
  if (!scatterPlotRef.value) return;
  const data = [
    { x: 10, y: 20, category: 'A' }, { x: 40, y: 90, category: 'B' },
    { x: 80, y: 50, category: 'A' }, { x: 60, y: 70, category: 'B' },
    { x: 25, y: 45, category: 'A' }, { x: 95, y: 85, category: 'C' },
  ];

  const width = 600, height = 320;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };

  const svg = d3.select(scatterPlotRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const x = d3.scaleLinear()
    .domain([0, 100]).nice().range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain([0, 100]).nice().range([chartHeight, 0]);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  svg.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  svg.selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("r", 8)
      .attr("fill", d => color(d.category))
      .style("opacity", 0.8);
}

// --- 4. 甜甜圈图 ---
function renderPieChart() {
  if (!pieChartRef.value) return;
  const data = [
    { name: 'A', value: 30 }, { name: 'B', value: 55 },
    { name: 'C', value: 42 }, { name: 'D', value: 68 },
  ];

  const width = 600, height = 320;
  const radius = Math.min(width, height) / 2 - 40;

  const svg = d3.select(pieChartRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const color = d3.scaleOrdinal()
    .domain(data.map(d => d.name))
    .range(d3.schemeTableau10);

  const pieGenerator = d3.pie<{name: string, value: number}>()
    .value(d => d.value)
    .sort(null);

  const arcGenerator = d3.arc<d3.PieArcDatum<{name: string, value: number}>>()
    .innerRadius(radius * 0.5) // ✨ 内半径不为0，即为甜甜圈图
    .outerRadius(radius);

  const arcs = pieGenerator(data);

  svg.selectAll("path")
    .data(arcs)
    .join("path")
      .attr("d", arcGenerator)
      .attr("fill", d => color(d.data.name) as string)
      .attr("stroke", "white")
      .style("stroke-width", "2px");
}

// --- 5. 散点抖动图 (复刻 ECharts Scatter with Jittering) ---
function renderJitterScatter() {
  if (!jitterScatterRef.value) return;

  // 生成数据（与 ECharts 一致，但过滤超出范围的点）
  const data: Array<{day: number, y: number, color: number}> = [];
  for (let day = 0; day < 7; ++day) {
    for (let i = 0; i < 1000; ++i) {
      const y = Math.tan(i) / 2 + 7;
      // 只保留在 0-10 范围内的点
      if (y >= 0 && y <= 10) {
        data.push({ day, y, color: Math.random() });
      }
    }
  }

  const width = 600, height = 320;
  const margin = { top: 40, right: 50, bottom: 40, left: 80 };

  const svg = d3.select(jitterScatterRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // 星期标签
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // 为每个 day 分配固定颜色（匹配 ECharts 图片效果）
  const dayColors = [
    '#5470c6',  // Mon - 蓝色
    '#91cc75',  // Tue - 绿色
    '#73c0de',  // Wed - 青色
    '#fac858',  // Thu - 黄色
    '#ee6666',  // Fri - 红色
    '#9a60b4',  // Sat - 紫色
    '#ea7ccc'   // Sun - 粉色
  ];

  // X轴：使用 scaleBand
  const x = d3.scaleBand()
    .domain(days)
    .range([0, chartWidth])
    .padding(0.1);

  // Y轴
  const y = d3.scaleLinear()
    .domain([0, 10])
    .range([chartHeight, 0]);

  // 添加标题
  svg.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Scatter with Jittering");

  // 绘制X轴
  svg.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
      .style("font-size", "12px");

  // 绘制Y轴
  svg.append("g")
    .call(d3.axisLeft(y).ticks(5))
    .selectAll("text")
      .style("font-size", "12px");

  // 计算 jitter 范围（与 ECharts 一致：80% 的 band 宽度）
  const jitterRange = x.bandwidth() * 0.8;

  // 绘制散点（添加 jittering 效果）
  svg.selectAll("circle")
    .data(data)
    .join("circle")
      .attr("cx", d => {
        const baseX = x(days[d.day])! + x.bandwidth() / 2;
        const jitter = (Math.random() - 0.5) * jitterRange;
        return baseX + jitter;
      })
      .attr("cy", d => y(d.y))
      .attr("r", 3)
      .attr("fill", d => dayColors[d.day])  // ← 使用 day 对应的固定颜色
      .style("opacity", 0.4);
}
// --- 6. 动态收入折线图 (复刻 ECharts Income Growth) ---
function renderIncomeChart() {
  if (!incomeChartRef.value) return;

  const countries = ['Finland', 'France', 'Germany', 'Iceland', 'Norway', 'Poland', 'Russia', 'United Kingdom'];

  const countryColors: Record<string, string> = {
    'Norway': '#00bcd4',
    'Germany': '#5c6bc0',
    'Iceland': '#ff9800',
    'Finland': '#3f51b5',
    'United Kingdom': '#9c27b0',
    'France': '#cddc39',
    'Russia': '#e91e63',
    'Poland': '#ffeb3b'
  };

  // 修正的数据生成（更平缓的线性增长 + 小波动）
  const generateCountryData = (country: string) => {
    const data: Array<{year: number, income: number}> = []; // ← 明确类型

    const baseIncome: Record<string, number> = {
      'Norway': 11500,
      'Germany': 9500,
      'Iceland': 8200,
      'Finland': 8000,
      'United Kingdom': 9200,
      'France': 7800,
      'Russia': 7200,
      'Poland': 4800
    };

    // 年均增长量（线性增长而非指数）
    const yearlyGrowth: Record<string, number> = {
      'Norway': 780,    // 最快
      'Germany': 510,
      'Iceland': 500,
      'Finland': 470,
      'United Kingdom': 430,
      'France': 440,
      'Russia': 380,
      'Poland': 410
    };

    let income = baseIncome[country] || 8000;
    const growth = yearlyGrowth[country] || 450;

    for (let year = 1950; year <= 2018; year++) {
      data.push({ year, income: Math.round(income) });

      // 线性增长 + 随机波动
      income += growth;

      // 添加小幅波动（±5%）
      if (Math.random() > 0.6) {
        income *= (0.95 + Math.random() * 0.1);
      }

      // 1990年代之后增速稍微放缓
      if (year > 1990 && country === 'Poland') {
        income += growth * 0.3; // Poland 加速
      }
      if (year > 2008) {
        income *= 0.998; // 2008金融危机后略微放缓
      }
    }

    return data;
  };

  const allData = countries.map(country => ({
    country,
    data: generateCountryData(country),
    color: countryColors[country]
  }));

  const width = 1100, height = 500;
  const margin = { top: 60, right: 200, bottom: 50, left: 80 };

  const svg = d3.select(incomeChartRef.value)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // 比例尺
  const x = d3.scaleLinear()
    .domain([1950, 2018])
    .range([0, chartWidth]);

  const y = d3.scaleLinear()
    .domain([0, 70000])
    .nice()
    .range([chartHeight, 0]);

  // 添加标题
  svg.append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .style("fill", "#333")
    .text("Income of Germany and France since 1950");

  // 网格线
  svg.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(y.ticks(7))
    .join("line")
      .attr("x1", 0)
      .attr("x2", chartWidth)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "#e0e0e0")
      .attr("stroke-width", 1);

  // 1971 年的虚线标注
  svg.append("line")
    .attr("x1", x(1971))
    .attr("x2", x(1971))
    .attr("y1", 0)
    .attr("y2", chartHeight)
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "5,5");

  // X轴
  svg.append("g")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(x).tickFormat(d => d.toString()).ticks(10))
    .selectAll("text")
      .style("font-size", "11px");

  // Y轴
  svg.append("g")
    .call(d3.axisLeft(y).ticks(7).tickFormat(d => d3.format(",.0f")(d as number)))
    .selectAll("text")
      .style("font-size", "11px");

  // Y轴标签
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -chartHeight / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .text("Income");

  // 线条生成器 - 明确类型
  const lineGenerator = d3.line<{year: number, income: number}>()
    .x(d => x(d.year))
    .y(d => y(d.income))
    .curve(d3.curveMonotoneX);

  // 绘制每条国家线（带动画）
  allData.forEach((countryData, index) => {
    const path = svg.append("path")
      .datum(countryData.data)
      .attr("fill", "none")
      .attr("stroke", countryData.color)
      .attr("stroke-width", 2)
      .attr("d", lineGenerator)
      .attr("opacity", 0.8);

    // 动画：从左到右绘制（速度减慢）
    const totalLength = (path.node() as SVGPathElement).getTotalLength();
    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(5000) // ← 从3000改为5000，减慢速度
      .delay(index * 300) // ← 从200改为300，增加间隔
      .ease(d3.easeLinear)
      .attr("stroke-dashoffset", 0);

    // End Label
    const lastPoint = countryData.data[countryData.data.length - 1];
    const labelGroup = svg.append("g")
      .attr("opacity", 0);

    labelGroup.append("text")
      .attr("x", chartWidth + 10)
      .attr("y", y(lastPoint.income) + 4)
      .style("font-size", "12px")
      .style("fill", countryData.color)
      .style("font-weight", "500")
      .text(`${countryData.country}: ${lastPoint.income.toLocaleString()}`);

    labelGroup
      .transition()
      .duration(500)
      .delay(5000 + index * 300) // ← 同步调整
      .attr("opacity", 1);

    // 鼠标悬停高亮
    path
      .on("mouseenter", function() {
        d3.select(this)
          .attr("stroke-width", 4)
          .attr("opacity", 1);
      })
      .on("mouseleave", function() {
        d3.select(this)
          .attr("stroke-width", 2)
          .attr("opacity", 0.8);
      });
  });

  // Tooltip 交互层
  const tooltipLine = svg.append("line")
    .attr("stroke", "#999")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "3,3")
    .attr("opacity", 0);

  svg.append("rect")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mousemove", function(event) {
      const [mouseX] = d3.pointer(event);
      const year = Math.round(x.invert(mouseX));

      if (year < 1950 || year > 2018) {
        tooltipVisible.value = false;
        tooltipLine.attr("opacity", 0);
        return;
      }

      tooltipLine
        .attr("x1", x(year))
        .attr("x2", x(year))
        .attr("y1", 0)
        .attr("y2", chartHeight)
        .attr("opacity", 1);

      const data = allData.map(countryData => {
        const yearData = countryData.data.find(d => d.year === year);
        return {
          country: countryData.country,
          value: yearData?.income || 0,
          color: countryData.color
        };
      }).sort((a, b) => b.value - a.value);

      tooltipData.value = data;
      tooltipYear.value = year.toString();

      const rect = incomeChartRef.value?.getBoundingClientRect();
      tooltipX.value = event.clientX - (rect?.left || 0) + 20;
      tooltipY.value = event.clientY - (rect?.top || 0) - 50;
      tooltipVisible.value = true;
    })
    .on("mouseleave", () => {
      tooltipVisible.value = false;
      tooltipLine.attr("opacity", 0);
    });
}

// ===== 动态排序柱状图实现（平滑过渡版本）=====
function renderRaceChart() {
  if (!raceChartRef.value) return;

  // 清空之前的内容
  d3.select(raceChartRef.value).selectAll('*').remove();

  // 准备模拟数据 - 各国GDP数据（单位：十亿美元）
  const countries = [
    { name: 'United States', flag: '🇺🇸', color: '#4e79a7' },
    { name: 'China', flag: '🇨🇳', color: '#f28e2c' },
    { name: 'Japan', flag: '🇯🇵', color: '#e15759' },
    { name: 'Germany', flag: '🇩🇪', color: '#76b7b2' },
    { name: 'India', flag: '🇮🇳', color: '#59a14f' },
    { name: 'United Kingdom', flag: '🇬🇧', color: '#edc949' },
    { name: 'France', flag: '🇫🇷', color: '#af7aa1' },
    { name: 'Brazil', flag: '🇧🇷', color: '#ff9da7' },
    { name: 'Italy', flag: '🇮🇹', color: '#9c755f' },
    { name: 'Canada', flag: '🇨🇦', color: '#bab0ab' },
    { name: 'South Korea', flag: '🇰🇷', color: '#1f77b4' },
    { name: 'Russia', flag: '🇷🇺', color: '#ff7f0e' },
  ];

  // 生成年份数据 (2000-2024)
  const startYear = 2000;
  const endYear = 2024;
  const years: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    years.push(y);
  }

  // 生成随机增长数据
  const dataByYear = new Map<number, Array<{ country: string; flag: string; value: number; color: string }>>();

  countries.forEach((country) => {
    let baseValue = Math.random() * 5000 + 2000;
    const growthRate = Math.random() * 0.08 + 0.02;

    years.forEach((year) => {
      if (!dataByYear.has(year)) {
        dataByYear.set(year, []);
      }
      baseValue *= (1 + growthRate + (Math.random() - 0.5) * 0.02);
      dataByYear.get(year)!.push({
        country: country.name,
        flag: country.flag,
        value: Math.round(baseValue),
        color: country.color
      });
    });
  });

  // 对每年的数据排序
  dataByYear.forEach((data) => {
    data.sort((a, b) => b.value - a.value);
  });

  // SVG 尺寸设置
  const svg = d3.select(raceChartRef.value);
  const container = svg.node()?.parentElement;
  const width = container?.clientWidth || 800;
  const height = 500;
  const margin = { top: 20, right: 100, bottom: 60, left: 180 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  svg.attr('viewBox', `0 0 ${width} ${height}`);

  // 创建主画布
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // 比例尺
  const topN = 10;
  const barHeight = chartHeight / topN;

  const x = d3.scaleLinear()
    .range([0, chartWidth]);

  const y = d3.scaleBand()
    .range([0, chartHeight])
    .padding(0.1);

  // 创建坐标轴组
  const xAxisG = g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${chartHeight})`);

  const yAxisG = g.append('g')
    .attr('class', 'y-axis');

  // 年份显示
  const yearText = g.append('text')
    .attr('class', 'year-label')
    .attr('x', chartWidth - 20)
    .attr('y', chartHeight - 20)
    .attr('text-anchor', 'end')
    .style('font-size', '80px')
    .style('font-weight', 'bold')
    .style('fill', 'rgba(100, 100, 100, 0.25)')
    .text(startYear);

  // 动画控制参数
  let currentYearIndex = 0;
  const transitionDuration = 1000; // 每次过渡的动画时长
  const intervalDuration = 800;   // 每次更新的间隔时长

  // 更新函数 - 使用平滑过渡
  function update(year: number) {
    const yearData = dataByYear.get(year)!.slice(0, topN);

    // 更新比例尺域
    const maxValue = d3.max(yearData, d => d.value) || 0;
    x.domain([0, maxValue]);
    y.domain(yearData.map(d => d.country));

    // 创建过渡对象
    const t = d3.transition()
      .duration(transitionDuration)
      .ease(d3.easeLinear);

    // 更新x轴（平滑过渡）
    xAxisG.transition(t)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${(d as number / 1000).toFixed(1)}T`));

    // 更新y轴
    yAxisG.transition(t)
      .call(d3.axisLeft(y).tickSize(0).tickFormat((d) => {
        const item = yearData.find(item => item.country === d);
        return item ? `${item.flag} ${d}` : d as string;
      }));

    yAxisG.select('.domain').remove();

    // 绑定数据到柱状图
    const bars = g.selectAll<SVGRectElement, typeof yearData[0]>('.bar')
      .data(yearData, d => d.country);

    // 退出动画
    bars.exit()
      .transition(t)
      .attr('width', 0)
      .remove();

    // 进入新柱子
    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => y(d.country) || 0)
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => d.color)
      .attr('rx', 4);

    // 合并进入和更新，统一应用过渡
    barsEnter.merge(bars)
      .transition(t)
      .attr('y', d => y(d.country) || 0)
      .attr('width', d => x(d.value))
      .attr('height', y.bandwidth());

    // 数值标签
    const labels = g.selectAll<SVGTextElement, typeof yearData[0]>('.value-label')
      .data(yearData, d => d.country);

    labels.exit()
      .transition(t)
      .style('opacity', 0)
      .remove();

    const labelsEnter = labels.enter()
      .append('text')
      .attr('class', 'value-label')
      .attr('x', d => x(d.value) + 8)
      .attr('y', d => (y(d.country) || 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('font-weight', '500')
      .style('fill', '#333')
      .style('opacity', 0);

    labelsEnter.merge(labels)
      .transition(t)
      .attr('x', d => x(d.value) + 8)
      .attr('y', d => (y(d.country) || 0) + y.bandwidth() / 2)
      .style('opacity', 1)
      .tween('text', function(d) {
        const that = d3.select(this);
        const currentText = that.text();
        const currentValue = currentText ? parseInt(currentText.replace(/,/g, '')) : 0;
        const interpolator = d3.interpolateNumber(currentValue, d.value);

        return function(t) {
          that.text(Math.round(interpolator(t)).toLocaleString());
        };
      });

    // 年份标签平滑过渡
    yearText.transition(t)
      .tween('text', function() {
        const that = d3.select(this);
        const currentYear = parseInt(that.text());
        const interpolator = d3.interpolateNumber(currentYear, year);

        return function(t) {
          that.text(Math.round(interpolator(t)));
        };
      });
  }

  // 初始化第一帧
  update(years[0]);

  // 开始动画循环
  const interval = setInterval(() => {
    currentYearIndex++;
    if (currentYearIndex >= years.length) {
      currentYearIndex = 0; // 循环播放
    }
    update(years[currentYearIndex]);
  }, intervalDuration);

  // 清理函数（组件卸载时调用）
  // return () => clearInterval(interval);
}
</script>

<style scoped>
/* 可选：为卡片添加统一的阴影效果 */
.card-shadow {
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.05);
}

.tooltip-card {
  background: white;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>

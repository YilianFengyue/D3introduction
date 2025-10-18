<template>
  <v-app>
    <v-main class="bg-grey-lighten-5">
      <v-container>
        <v-row>
          <v-col>
            <h1 class="text-h4 font-weight-bold">D3 比例尺 (d3-scale) 渐进式 Demo</h1>
            <p class="text-medium-emphasis">从数据世界到视觉世界的“翻译官”</p>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="py-8 min-h-200">
              <v-card-title>Step 1: 线性比例尺 (Linear) - 基础位置映射</v-card-title>
              <v-card-subtitle>将数值 [0, 100] 映射到 SVG 的 X 轴像素位置上。</v-card-subtitle>
              <v-card-text>
                <svg ref="step1Ref" :width="width" :height="100" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="py-8 min-h-200">
              <v-card-title>Step 2: 线性比例尺 (Linear) - 映射到颜色和尺寸</v-card-title>
              <v-card-subtitle>比例尺的强大之处在于，它可以映射到任何视觉属性。</v-card-subtitle>
              <v-card-text>
                <svg ref="step2Ref" :width="width" :height="100" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="py-8 min-h-200">
              <v-card-title>Step 3: 幂比例尺 (Pow/Sqrt) - 感知面积</v-card-title>
              <v-card-subtitle>当数据与面积相关时，使用 scaleSqrt 能带来更准确的视觉感知。</v-card-subtitle>
              <v-card-text>
                <svg ref="step3Ref" :width="width" :height="180" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="py-8 min-h-200">
              <v-card-title>Step 4: 序数比例尺 (Ordinal) - 分类到颜色</v-card-title>
              <v-card-subtitle>最常见的用法：将离散的分类（如名称）映射到离散的颜色。</v-card-subtitle>
              <v-card-text>
                <svg ref="step4Ref" :width="width" :height="100" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="py-8 min-h-200">
              <v-card-title>Step 5: 带尺度 (Band) - 条形图的基石</v-card-title>
              <v-card-subtitle>自动计算每个分类的“地盘”（起始位置、宽度、间距）。</v-card-subtitle>
              <v-card-text>
                <svg ref="step5Ref" :width="width" :height="120" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="12">
            <v-card class="py-8 min-h-200">
              <v-card-title>Step 6: 点尺度 (Point) - 折线图的坐标点</v-card-title>
              <v-card-subtitle>与 Band 类似，但它为每个分类提供一个没有宽度的精确“点”。</v-card-subtitle>
              <v-card-text>
                <svg ref="step6Ref" :width="width" :height="100" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';

// --- 通用设置 ---
const width = 800;
const step1Ref = ref<SVGSVGElement | null>(null);
const step2Ref = ref<SVGSVGElement | null>(null);
const step3Ref = ref<SVGSVGElement | null>(null);
const step4Ref = ref<SVGSVGElement | null>(null);
const step5Ref = ref<SVGSVGElement | null>(null);
const step6Ref = ref<SVGSVGElement | null>(null);

// --- Step 1: 基础位置映射 ---
function renderStep1() {
  if (!step1Ref.value) return;
  const svg = d3.select(step1Ref.value);
  const height = 100;
  const margin = { top: 20, right: 30, bottom: 30, left: 30 };
  const data = [0, 10, 25, 50, 70, 100];

  // 1. 创建一个线性比例尺
  const xScale = d3.scaleLinear()
    .domain([0, 100]) // 数据世界：0 到 100
    .range([margin.left, width - margin.right]); // 视觉世界：从左边距到右边距

  // 2. 绘制一条代表坐标轴的线
  svg.append('line')
    .attr('x1', xScale.range()[0])
    .attr('x2', xScale.range()[1])
    .attr('y1', height / 2)
    .attr('y2', height / 2)
    .attr('stroke', '#ccc');

  // 3. 使用比例尺定位圆形和文本
  const groups = svg.selectAll('g')
    .data(data)
    .join('g');

  groups.append('circle')
    .attr('cx', d => xScale(d)) // ✨ 使用 xScale 将数据值翻译成 x 坐标
    .attr('cy', height / 2)
    .attr('r', 5)
    .attr('fill', 'steelblue');

  groups.append('text')
    .attr('x', d => xScale(d))
    .attr('y', height / 2 + 25)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .text(d => d);
}


// --- Step 2: 映射到颜色和尺寸 ---
function renderStep2() {
  if (!step2Ref.value) return;
  const svg = d3.select(step2Ref.value);
  const data = [0, 10, 25, 50, 90, 100];

  // 1. 创建三个不同的线性比例尺
  // scalePoint：离散点比例尺（适合均匀分布的点）

  const xScale = d3.scalePoint().domain(data.map(String)).range([50, width - 50]);

  const colorScale = d3.scaleLinear<string>()
    .domain([0, 100])
    .range(['#e0f7fa', '#00796b']); // 从浅蓝绿色到深蓝绿色

  const sizeScale = d3.scaleLinear()
    .domain([0, 100])
    .range([5, 30]); // 半径从 5px 到 30px

  // 2. 使用不同的比例尺设置不同的视觉属性
  svg.selectAll('circle')
    .data(data)
    .join('circle')
      .attr('cx', d => xScale(String(d))!)
      .attr('cy', 50)
      .attr('fill', d => colorScale(d)) // ✨ 颜色由 colorScale 决定
      .attr('r', d => sizeScale(d));    // ✨ 半径由 sizeScale 决定
}


// --- Step 3: 幂比例尺 (Pow/Sqrt) ---
function renderStep3() {
  if (!step3Ref.value) return;
  const svg = d3.select(step3Ref.value);
  const data = [100, 1000, 5000, 10000]; // 数据不成比例

  // 1. 创建线性和平方根两种比例尺，用于设置半径
  const extent = d3.extent(data) as [number, number];
  const linearRadiusScale = d3.scaleLinear().domain(extent).range([10, 50]);
  const sqrtRadiusScale = d3.scaleSqrt().domain(extent).range([10, 50]); // ✨ 使用 Sqrt

  const xScale = d3.scalePoint().domain(data.map(String)).range([100, width - 100]);

  // 2. 第一行：使用线性比例尺设置半径
  svg.append('text').attr('x', 10).attr('y', 40).text('线性 (Linear):').attr('font-size', '12px');
  svg.selectAll('.linear-circle')
    .data(data)
    .join('circle')
    .attr('class', 'linear-circle')
    .attr('cx', d => xScale(String(d))!)
    .attr('cy', 40)
    .attr('r', d => linearRadiusScale(d))
    .attr('fill', 'darkorange');

  // 3. 第二行：使用平方根比例尺设置半径
  svg.append('text').attr('x', 10).attr('y', 120).text('平方根 (Sqrt):').attr('font-size', '12px');
  svg.selectAll('.sqrt-circle')
    .data(data)
    .join('circle')
    .attr('class', 'sqrt-circle')
    .attr('cx', d => xScale(String(d))!)
    .attr('cy', 120)
    .attr('r', d => sqrtRadiusScale(d)) // ✨ 半径由 Sqrt 比例尺决定
    .attr('fill', 'purple');
}
// --- Step 4: 序数比例尺 (Ordinal) ---
function renderStep4() {
  if (!step4Ref.value) return;
  const svg = d3.select(step4Ref.value);

  // 1. 定义离散的 domain (分类) 和 range (颜色)
  const categories = ['苹果', '香蕉', '橘子', '葡萄'];
  const colors = d3.schemeTableau10; // D3 提供的一套优质配色方案

  // 2. 创建序数比例尺
  const colorScale = d3.scaleOrdinal(categories, colors);

  // 3. 绘制色块和标签
  const groups = svg.selectAll('g')
    .data(categories.concat(['西瓜'])) // ✨ 故意加一个不在 domain 里的"西瓜"
    .join('g')
      .attr('transform', (d, i) => `translate(${i * 120 + 50}, 30)`);

  groups.append('rect')
    .attr('width', 100)
    .attr('height', 30)
    .attr('fill', d => colorScale(d)); // ✨ 使用 colorScale "翻译"分类为颜色

  groups.append('text')
    .attr('x', 50)
    .attr('y', 55)
    .attr('text-anchor', 'middle')
    .text(d => `${d}: ${colorScale(d)}`);
}


// --- Step 5: 带尺度 (Band) ---
function renderStep5() {
  if (!step5Ref.value) return;
  const svg = d3.select(step5Ref.value);
  const margin = { left: 20, right: 20 };
  const categories = ['A', 'B', 'C', 'D', 'E'];

  // 1. 创建带尺度
  const xScale = d3.scaleBand()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.1); // ✨ 设置 10% 的间距

  // 2. 可视化 Band 的计算结果
  const bands = svg.selectAll('g').data(categories).join('g');

  // 灰色底表示 step (band + padding)
  bands.append('rect')
    .attr('x', d => xScale(d)!)
    .attr('y', 20)
    .attr('width', xScale.step()) // ✨ step 是 band+padding 的总宽度
    .attr('height', 80)
    .attr('fill', '#f0f0f0');

  // 彩色块表示 bandwidth (真正的条形宽度)
  bands.append('rect')
    .attr('x', d => xScale(d)!)
    .attr('y', 20)
    .attr('width', xScale.bandwidth()) // ✨ bandwidth 是 band 自身的宽度
    .attr('height', 80)
    .attr('fill', (d, i) => d3.schemeTableau10[i]);

  bands.append('text')
    .attr('x', d => xScale(d)! + xScale.bandwidth() / 2)
    .attr('y', 65)
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .text(d => d);

  // 3. 显示计算出的值
  svg.append('text').attr('x', 10).attr('y', 115)
     .text(`bandwidth(): ${xScale.bandwidth().toFixed(2)}px,  step(): ${xScale.step().toFixed(2)}px`).attr('font-size', 12);
}


// --- Step 6: 点尺度 (Point) ---
function renderStep6() {
  if (!step6Ref.value) return;
  const svg = d3.select(step6Ref.value);
  const margin = { left: 20, right: 20 };
  const categories = ['A', 'B', 'C', 'D', 'E'];

  // 1. 创建点尺度
  const xScale = d3.scalePoint()
    .domain(categories)
    .range([margin.left, width - margin.right])
    .padding(0.5); // ✨ Point 的 padding 是指两端的留白

  // 2. 可视化 Point 的计算结果
  const points = svg.selectAll('g').data(categories).join('g');

  points.append('line') // 画一条垂直线代表每个点的位置
    .attr('x1', d => xScale(d)!)
    .attr('x2', d => xScale(d)!)
    .attr('y1', 10)
    .attr('y2', 90)
    .attr('stroke', '#ccc')
    .attr('stroke-dasharray', '3 3');

  points.append('circle')
    .attr('cx', d => xScale(d)!) // ✨ 直接使用 xScale 获取点的坐标
    .attr('cy', 50)
    .attr('r', 8)
    .attr('fill', (d, i) => d3.schemeTableau10[i]);

  points.append('text')
    .attr('x', d => xScale(d)!)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .text(d => d);

  // 3. 显示计算出的值
  svg.append('text').attr('x', 10).attr('y', 95).text(`bandwidth(): ${xScale.bandwidth()},  step(): ${xScale.step().toFixed(2)}px`).attr('font-size', 12);
}

onMounted(() => {
  renderStep1();
  renderStep2();
  renderStep3();
   // --- 新增调用 ---
  renderStep4();
  renderStep5();
  renderStep6();

});
</script>

<style>
.demo-svg {
  background-color: white;
  border-radius: 4px;
}
</style>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" md="4">
        <v-card height="300">
          <v-card-title>Demo 1: 基础三件套</v-card-title>
          <v-card-subtitle>.attr() .style() .text()</v-card-subtitle>
          <v-card-text>
            <svg ref="modifyStep1Ref" width="100%" height="200"></svg>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="300">
          <v-card-title>Demo 2: Join连接</v-card-title>
          <v-card-subtitle>.classed() .html()</v-card-subtitle>
          <v-card-text>
            <svg ref="modifyStep2Ref" width="100%" height="200"></svg>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card height="300">
          <v-card-title>Demo 3: 增删与交互</v-card-title>
          <v-card-subtitle>.append() .remove() .raise()</v-card-subtitle>
          <v-card-text>
            <div class="mb-2">
              <v-btn size="x-small" @click="addCircle">添加圆形</v-btn>
              <v-btn class="ml-2" size="x-small" @click="removeCircle">移除圆形</v-btn>
            </div>
            <svg ref="modifyStep3Ref" width="100%" height="160"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-divider class="my-6"></v-divider>

    <v-row>
      <v-col cols="12">
        <p class="text-h6">之前的回顾</p>
      </v-col>
      <v-col cols="12" md="6">
        <v-card height="420">
          <v-card-title>回顾：线性轴</v-card-title>
          <v-card-text>
            <svg ref="svgRef" :width="width" :height="height"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>回顾：Chord 弦图</v-card-title>
          <v-card-text>
            <svg ref="chordRef" :width="chordW" :height="chordH"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue'
import * as d3 from 'd3'

/* ========== 修改元素 Demo 的 Ref ========== */
const modifyStep1Ref = ref<SVGSVGElement | null>(null);
const modifyStep2Ref = ref<SVGSVGElement | null>(null);
const modifyStep3Ref = ref<SVGSVGElement | null>(null);

/* ========== 卡片1：线性轴 ========== */
const width = 600
const height = 150
const margin = { top: 10, right: 20, bottom: 30, left: 20 }
const svgRef = ref<SVGSVGElement | null>(null)

const pRef = ref<HTMLParagraphElement | null>(null);
const step2Ref = ref<SVGSVGElement | null>(null);
const step3Ref = ref<SVGSVGElement | null>(null);
/* ========== 卡片2：弦图 ========== */
const chordW = 400
const chordH = 400
const chordRef = ref<SVGSVGElement | null>(null)

onMounted(() => {
  renderAxis()
  renderChord()

  // 本次学习的三个步骤
  renderModifyStep1();
  renderModifyStep2();
  renderModifyStep3();


})

/** 渲染底部线性轴（与你已有逻辑一致，稍作显眼化样式） */
function renderAxis() {
  if (!svgRef.value) return
  const svg = d3.select(svgRef.value)
  svg.selectAll('*').remove()

  const gx = svg.append('g')
    .attr('transform', `translate(${margin.left},${height - margin.bottom})`)

  const x = d3.scaleLinear()
    .domain([0, 100])
    .range([0, width - margin.left - margin.right])

  const xAxis = d3.axisBottom(x)
    .ticks(10)
    .tickFormat(d => `${d}分`)
    .tickSize(10)
    .tickSizeOuter(0)
    .tickPadding(10)

  gx.call(xAxis)

  // 仅为更容易观察到刻度效果，稍微加粗上色（可删）
  gx.selectAll('path, line')
    .attr('stroke', '#333')
    .attr('stroke-width', 1.5)
  gx.selectAll('text')
    .attr('fill', '#333')
    .attr('font-size', 12)
}

/** 渲染 Chord 弦图（4×4 最小示例：A/B/C/D 之间的关系强度） */
function renderChord() {
  if (!chordRef.value) return;
  const svg = d3.select(chordRef.value);
  svg.selectAll('*').remove();

  // --- 我们保留的部分 START ---

  // 1. 数据：节点名称和关系矩阵
  const names = ['A', 'B', 'C', 'D'];
  const matrix = [
    [0, 2, 3, 4], // A -> (A, B, C, D)
    [2, 0, 5, 1], // B -> (A, B, C, D)
    [3, 5, 0, 2], // C -> (A, B, C, D)
    [4, 1, 2, 0], // D -> (A, B, C, D)
  ];

  // 2. 布局生成器：计算数据
  // 这是“大脑”，它只负责计算，不负责画任何东西
  const chordGenerator = d3.chord(); // 使用最基础的生成器
  const chordsData = chordGenerator(matrix);

  // 打印出来看看，这是所有魔法的来源
  console.log('Calculated Chords Data:', chordsData);
  console.log('...and its Groups:', chordsData.groups);

  // --- 我们保留的部分 END ---
  // 3. 准备工作：尺寸、颜色和形状生成器
  const innerRadius = Math.min(chordW, chordH) * 0.5 - 60;
  const outerRadius = innerRadius + 10;
  const color = d3.scaleOrdinal<string, string>()
  .domain(names)
  .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']); // 使用固定颜色更清晰
  // ✨ Arc 形状生成器，专门用来画弧
  const arc = d3.arc<d3.ChordGroup>()
  .innerRadius(innerRadius)
  .outerRadius(outerRadius);
  // 4. 绘图：将数据绑定到 SVG
  const g = svg
  .append('g')
  .attr('transform', `translate(${chordW / 2}, ${chordH / 2})`); // 将坐标原点移到画布中心
  // ✨ 绘制外圈的弧
  const groups = g.append('g')
  .selectAll('g')
  .data(chordsData.groups) // 绑定 groups 数据
  .join('g');

  groups.append('path')
  .attr('d', arc as any) // 使用 arc 生成器
  .attr('fill', d => color(names[d.index]))
  .attr('stroke', d => d3.color(color(names[d.index]))!.darker(0.5).toString());

  // 5. ✨ Ribbon 形状生成器，专门用来画弦
  const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>()
  .radius(innerRadius); // 弦的末端会贴着内半径
  // 6. ✨ 绘制内部的弦
  g.append('g')
    .attr('fill-opacity', 0.75) // 设置一点透明度更好看
    .selectAll('path')
    .data(chordsData) // 直接绑定 chordsData
    .join('path')
      .attr('d', ribbon as any) // 使用 ribbon 生成器
      .attr('fill', d => color(names[d.source.index])) // 根据弦的“源”来上色
      .attr('stroke', '#fff');


}

// 学习
/** Step 1: 最简单的选择与修改 */
/** Demo 1: 基础三件套 */
function renderModifyStep1() {
  if (!modifyStep1Ref.value) return;
  const svg = d3.select(modifyStep1Ref.value);
  svg.selectAll('*').remove(); // 清空

  // 1. 用 .attr() "画骨"：定义一个矩形的几何属性
  svg.append('rect')
    .attr('x', 10)
    .attr('y', 10)
    .attr('width', 150)
    .attr('height', 100);

  // 2. 用 .style() "上妆"：为所有矩形设置 CSS 样式
  svg.selectAll('rect')
    .style('fill', 'steelblue') // 填充色
    .style('stroke', 'black')   // 描边色
    .style('stroke-width', '2px'); // 注意单位！

  // 3. 用 .text() "加字"：添加文本内容
  svg.append('text')
    .attr('x', 20)
    .attr('y', 140)
    .text('这是一个 D3 矩形')
    .style('font-family', 'sans-serif');
}

function renderStep2(){
  if (!step2Ref.value) return;
  const svg = d3.select(step2Ref.value);
  svg.selectAll('*').remove(); // 清空画布
  // 1. .append() 创建新元素，并返回对新元素的选择集
  // 链式调用：选中 svg -> 创建 g -> 设置 transform 属性
  const g = svg.append('g').attr('transform', 'translate(10, 10)');
  // 2. 在 g 内部继续创建图形
  g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 100)
    .attr('height', 100)
    .attr('fill', '#07bb68');
   g.append('circle')
    .attr('cx', 160)
    .attr('cy', 50)
    .attr('r', 50)
    .attr('fill', '#2ca02c');
     const allShapes = g.selectAll('rect, circle');
     // 4. 对选中的所有图形进行统一操作
  allShapes
    .attr('stroke', 'black')
    .attr('stroke-width', 4);
}



// Demo 3 的交互函数需要放在 render 函数外面，以便按钮调用
let circleCount = 0;
function addCircle() {
  if (!modifyStep3Ref.value) return;
  const svg = d3.select(modifyStep3Ref.value);
  circleCount++;

  svg.append('circle')
    .attr('cx', Math.random() * 250 + 20)
    .attr('cy', Math.random() * 120 + 20)
    .attr('r', 15)
    .style('fill', d3.schemeTableau10[circleCount % 10]) // 循环使用颜色
    .style('stroke', 'white')
    .style('stroke-width', 2)
    .on('click', handleCircleClick); // ✨ 绑定点击事件
}

function removeCircle() {
  if (!modifyStep3Ref.value) return;
  const svg = d3.select(modifyStep3Ref.value);
  // 选中最后一个 circle 元素并移除
  svg.select('circle:last-child').remove();
}

// ✨ 点击事件的回调函数
function handleCircleClick(event: MouseEvent) {
  const currentCircle = d3.select(event.currentTarget as SVGCircleElement);
  // .raise() 会把当前元素移动到父元素的最后，从而在视觉上置顶
  currentCircle.raise();
}

/** Demo 3: 增删与交互 */
function renderModifyStep3() {
  if (!modifyStep3Ref.value) return;
  const svg = d3.select(modifyStep3Ref.value);
  svg.selectAll('*').remove();

  // 初始化时添加三个圆
  addCircle();
  addCircle();
  addCircle();
}

/** Demo 2: 动态样式与内容 */
function renderModifyStep2() {
  if (!modifyStep2Ref.value) return;
  const svg = d3.select(modifyStep2Ref.value);
  svg.selectAll('*').remove();

  const data = [10, 25, 40, 55, 70, 85, 100];

  // 1. 根据数据创建一组圆
  const circles = svg.append('g')
    .attr('transform', 'translate(0, 50)')
    .selectAll('circle')
    .data(data)
    .join('circle')
      .attr('cx', (d, i) => i * 40 + 30) // ✨ 值可以是函数！根据索引 i 定位
      .attr('cy', 0)
      .attr('r', d => d / 5); // ✨ 根据数据 d 决定半径大小

  // 2. 用 .classed() "贴标签"：根据条件动态添加 class
  // 如果数据 d > 50，就给这个圆加上 "highlight" 类
  circles.classed('highlight', d => d > 50);

  // 3. 用 .html() 添加富文本
  // svg.append('text')
  //   .attr('x', 10)
  //   .attr('y', 150)
  //   .html('数据 > 50 的圆被<tspan class="highlight-text">高亮</tspan>了');

  // 4. ✨ 请在 <style> 标签或全局 CSS 中添加以下样式
  /*
    svg .highlight {
      fill: orange;
      stroke: red;
      stroke-width: 3px;
    }
    .highlight-text {
      fill: orange;
      font-weight: bold;
    }
  */
}
</script>

<style lang="css">

    svg .highlight {
      fill: orange;
      stroke: red;
      stroke-width: 3px;
    }
    .highlight-text {
      fill: orange;
      font-weight: bold;
    }

</style>

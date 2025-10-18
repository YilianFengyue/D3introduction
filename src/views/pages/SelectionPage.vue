<template>
  <v-app>
    <v-app-bar app color="surface-variant" density="compact">
      <v-app-bar-title class="font-weight-bold">D3 数据连接 Demo</v-app-bar-title>
      <v-spacer></v-spacer>

      <v-btn-toggle v-model="toggle" mandatory color="primary">
        <v-btn @click="runStep1" size="small">Step 1: 初始创建 (Enter)</v-btn>
        <v-btn @click="runStep2" size="small">Step 2: 更新数据 (Update)</v-btn>
        <v-btn @click="runStep3" size="small">Step 3: 增/删数据 (Enter+Exit)</v-btn>
        <v-btn @click="runStep4" size="small">Step 4: 带 Key 排序</v-btn>
      </v-btn-toggle>
      <v-divider vertical class="mx-2"></v-divider>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container fluid>
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title>可视化画布</v-card-title>
              <v-card-subtitle>{{ currentStepDescription }}</v-card-subtitle>
              <v-card-text>
                <svg ref="svgRef" :width="width" :height="height" style="border: 1px solid #ccc;"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Demo: 控制流与工具函数</v-card-title>
            <v-card-subtitle>.each(), .call(), .size(), .nodes()... </v-card-subtitle>
            <v-card-text class="d-flex">
              <div class="flex-grow-1">
                <svg ref="controlFlowRef" width="100%" height="200" style="border: 1px solid #ccc;"></svg>
              </div>

              <div class="ml-4" style="min-width: 250px;">
                <p class="font-weight-bold">工具函数检查结果:</p>
                <pre style="font-size: 12px; background-color: #f5f5f5; padding: 8px; border-radius: 4px;">{{ utilityOutput }}</pre>
                <v-btn @click="runCallDemo" color="primary" size="small" class="mt-4">运行 .call() 示例</v-btn>
              </div>
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

// --- Vue 响应式状态 ---
const svgRef = ref<SVGSVGElement | null>(null);
const width = 1000;
const height = 300;
const toggle = ref(0); // 用于按钮组状态
const currentStepDescription = ref('点击顶部按钮开始');

// --- D3 相关变量 ---
// 颜色比例尺，用于根据 ID 赋予不同颜色
const color = d3.scaleOrdinal(d3.schemeTableau10);
// X 轴比例尺，用于定位
const x = d3.scalePoint().range([50, width - 50]).padding(0.5);

// --- 我们的数据集 ---
const step1_data = [
  { id: 'A', value: 10 },
  { id: 'B', value: 20 },
  { id: 'C', value: 30 },
  { id: 'D', value: 25 },
];

const step2_data = [ // ID 相同，value 不同
  { id: 'A', value: 15 },
  { id: 'B', value: 35 },
  { id: 'C', value: 12 },
  { id: 'D', value: 40 },
];

const step3_data = [ // 移除了 B, C, 新增了 E, F
  { id: 'A', value: 18 },
  { id: 'D', value: 33 },
  { id: 'E', value: 22 },
  { id: 'F', value: 14 },
];

const step4_data = [ // 顺序打乱
  { id: 'E', value: 22 },
  { id: 'A', value: 18 },
  { id: 'F', value: 14 },
  { id: 'D', value: 33 },
];


// --- 核心渲染函数 ---
function render(data: { id: string, value: number }[]) {
  if (!svgRef.value) return;
  const svg = d3.select(svgRef.value);
  const t = svg.transition().duration(750); // 创建一个 750ms 的过渡

  // 更新 X 轴的 domain
  x.domain(data.map(d => d.id));

  // ✨ 最核心的数据连接 ✨
  const circles = svg.selectAll("circle")
    .data(data, (d: any) => d.id) // ✨ 第二个参数是 key 函数！
    .join(
      // 1. Enter: 对新数据，创建 circle
      enter => enter.append("circle")
        .attr("fill", d => color(d.id))
        .attr("cy", height / 2 - 80) // 从上方进入
        .attr("cx", d => x(d.id)!)
        .attr("r", 0)
        .call(enter => enter.transition(t) // 应用过渡
          .attr("cy", height / 2)
          .attr("r", d => d.value)
        ),

      // 2. Update: 对已存在的元素，更新属性
      update => update
        .call(update => update.transition(t) // 应用过渡
          .attr("cx", d => x(d.id)!)
          .attr("r", d => d.value)
        ),

      // 3. Exit: 对多余的元素，执行退场动画后移除
      exit => exit
        .call(exit => exit.transition(t) // 应用过渡
          .attr("cy", height / 2 + 80) // 向下方退出
          .attr("r", 0)
          .remove() // 动画结束后移除元素
        )
    );
}

// --- 按钮点击事件处理 ---
function runStep1() {
  currentStepDescription.value = 'Step 1: 初始数据驱动视图。4个数据点进入 (Enter)，创建了4个圆形。';
  render(step1_data);
}
function runStep2() {
  currentStepDescription.value = 'Step 2: 数据值改变。D3 识别出 ID 未变，只更新 (Update) 了圆形的半径。';
  render(step2_data);
}
function runStep3() {
  currentStepDescription.value = 'Step 3: 数据增删。B,C 退出 (Exit)，E,F 进入 (Enter)。A,D 保持并更新 (Update)。';
  render(step3_data);
}
function runStep4() {
  currentStepDescription.value = 'Step 4: 数据重新排序。因为有 Key 函数，D3 知道只是顺序变了，所以平滑地移动圆形到新位置。';
  render(step4_data);
}

// --- Vue生命周期钩子 ---
onMounted(() => {
  runStep1(); // 页面加载后立即执行第一步
  renderControlFlowDemo(); // ✨ 新增的 Demo 函数
});

/* ========== 控制流 Demo 的 Ref ========== */
const controlFlowRef = ref<SVGSVGElement | null>(null);
const utilityOutput = ref('等待渲染...');


function applyHighlight(selection: d3.Selection<any, any, any, any>, color: string, strokeWidth: number) {
  // 注释：.call() 会把 selection 作为第一个参数自动传入
  selection
    .style('stroke', color)
    .style('stroke-width', strokeWidth)
    .style('opacity', 1);
}

// Demo 3 的按钮点击事件现在需要调用这个新函数
function runCallDemo() {
  if (!controlFlowRef.value) return;
  const svg = d3.select(controlFlowRef.value);

  // 选中所有矩形，并“请外援”来设置高亮样式
  svg.selectAll('rect').call(applyHighlight, 'purple', 4);
}

/** Demo: 演示控制流与工具函数 */
function renderControlFlowDemo() {
  if (!controlFlowRef.value) return;
  const svg = d3.select(controlFlowRef.value);
  svg.selectAll('*').remove();

  // 1. 准备嵌套数据
  const parentData = [
    { group: 'A', color: 'steelblue', children: [{ value: 10 }, { value: 20 }] },
    { group: 'B', color: 'darkorange', children: [{ value: 15 }, { value: 25 }, { value: 5 }] },
  ];

  // 2. 绑定父级数据到 <g> 元素
  const groups = svg.selectAll('g')
    .data(parentData)
    .join('g')
      .attr('transform', (d, i) => `translate(0, ${i * 80 + 20})`);

  // 3. ✨ 使用 .each() 遍历每个父级分组 "开小会"
  groups.each(function(p, i) {
    // 在 .each() 内部:
    // - 'this' 指向当前的 <g> DOM 元素
    // - 'p' 是绑定的父级数据 (e.g., { group: 'A', ... })
    // - 'i' 是父级数据的索引

    const groupSelection = d3.select(this);

    // a. 添加分组标签
    groupSelection.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .text(`分组 ${p.group} (父)`);

    // b. 在分组内部，进行子元素的嵌套数据连接
    groupSelection.selectAll('rect')
      .data(p.children) // ✨ 使用父数据 p 里的 children 数组
      .join('rect')
        .attr('x', (d, i) => i * 60 + 80)
        .attr('y', 10)
        .attr('width', 50)
        .attr('height', d => d.value * 2) // ✨ 高度由子数据决定
        .style('fill', p.color); // ✨ 颜色由父数据决定
  });

  // 4. ✨ 使用工具函数检查选择集
  const allRects = svg.selectAll('rect');

  const size = allRects.size();      // 获取元素总数
  const isEmpty = allRects.empty(); // 判断是否为空
  const firstNode = allRects.node();  // 获取第一个原生 DOM 节点
  const allNodes = allRects.nodes();  // 获取所有原生 DOM 节点数组

  utilityOutput.value = `
.size(): ${size}
.empty(): ${isEmpty}
.node(): ${firstNode?.tagName} at (${firstNode?.getAttribute('x')}, ${firstNode?.getAttribute('y')})
.nodes(): [${allNodes.length} HTMLElements]
  `.trim();
}


</script>

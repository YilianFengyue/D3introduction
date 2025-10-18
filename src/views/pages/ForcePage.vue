<template>
  <div class="pa-4">
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>力导向图 (可拖拽)</v-card-title>
          <v-card-subtitle>Step 2.3: Draggable Nodes</v-card-subtitle>
          <v-card-text>
            <svg ref="forceChartRef" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>Demo 1: 不同尺寸节点的碰撞</v-card-title>
          <v-card-subtitle>forceCollide.radius(d => d.radius)</v-card-subtitle>
          <v-card-text>
            <svg ref="demo1Ref" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row dense>
    <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>Demo 2: 调节“力”的强度</v-card-title>
          <v-card-subtitle>forceCenter.strength(0.05)</v-card-subtitle>
          <v-card-text>
            <svg ref="demo2Ref" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>Demo 3: 交互式中心点</v-card-title>
          <v-card-subtitle>forceCenter.x(mouseX).y(mouseY)</v-card-subtitle>
          <v-card-text>
            <svg ref="demo3Ref" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
     <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>Demo 4: 可变连接力</v-card-title>
          <v-card-subtitle>forceLink.distance() & .strength()</v-card-subtitle>
          <v-card-text>
            <svg ref="demo4Ref" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="420">
          <v-card-title>Demo 5: 多体引力与范围</v-card-title>
          <v-card-subtitle>forceManyBody.strength(+) & .distanceMax()</v-card-subtitle>
          <v-card-text>
            <svg ref="demo5Ref" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row dense>
       <v-col cols="12" lg="12">
        <v-card class="card-shadow" height="420">
          <v-card-title>Demo 6: 分类布局</v-card-title>
          <v-card-subtitle>forceX(d => ...) & forceY()</v-card-subtitle>
          <v-card-text>
            <svg ref="demo6Ref" width="100%" height="320"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';


// 定义节点和链接的数据结构类型，这在TS中是好习惯
interface Node {
  id: number | string; // <--- 关键在这里：允许 ID 是数字或字符串
  radius?: number;
  group?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: number | string | Node; // <--- 关键在这里：允许 source 是数字、字符串或节点对象
  target: number | string | Node; // <--- 关键在这里：允许 target 也是
  type?: string;
}

// --- Refs ---
// 为新的力导向图创建一个 Ref
const forceChartRef = ref<SVGSVGElement | null>(null);
const demo1Ref = ref<SVGSVGElement | null>(null);
const demo2Ref = ref<SVGSVGElement | null>(null);
const demo3Ref = ref<SVGSVGElement | null>(null);
const demo4Ref = ref<SVGSVGElement | null>(null);
const demo5Ref = ref<SVGSVGElement | null>(null);
const demo6Ref = ref<SVGSVGElement | null>(null);

// --- Lifecycle ---
onMounted(() => {
  // --- 力导向图 Demo ---
  drawForceDirectedGraph();
  drawDemo1(demo1Ref);
  drawDemo2(demo2Ref);
  drawDemo3(demo3Ref);
  drawDemo4(demo4Ref);
  drawDemo5(demo5Ref);
  drawDemo6(demo6Ref);
});

//力导向图
const drawForceDirectedGraph = () => {
  if (!forceChartRef.value) return;

  const width = forceChartRef.value.clientWidth;
  const height = forceChartRef.value.clientHeight;
  const svg = d3.select(forceChartRef.value);
  svg.selectAll("*").remove();

  // --- 1. 数据准备 (更新) ---
  const nodeCount = 20;
  const nodes: Node[] = d3.range(nodeCount).map(i => ({ id: i }));

  // 新增: 创建链接数据
  // 这里我们创建一个简单的链式结构，每个节点连接到下一个节点
  const links: Link[] = d3.range(nodeCount - 1).map(i => ({
    source: i,
    target: i + 1,
  }));
  // 再随机加一些链接，让网络更复杂一点
  for (let i = 0; i < nodeCount / 4; i++) {
    links.push({
      source: Math.floor(Math.random() * nodeCount),
      target: Math.floor(Math.random() * nodeCount),
    })
  }

  // --- 2. 元素创建 (更新) ---

  // 新增: 创建一个 <g> 容器来存放所有的连线
  const linkGroup = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

  // 新增: 数据绑定 <line> 元素
  const linkElements = linkGroup.selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", 1.5);

  // (不变) 创建节点元素
  const nodeGroup = svg.append("g");
  const nodeElements = nodeGroup.selectAll("circle")
    .data(nodes)
    .join("circle")
      .attr("r", 6)
      .attr("fill", "steelblue");

  // --- 3. 创建力模拟引擎 (更新) ---
  const simulation = d3.forceSimulation(nodes)
    // 新增: 添加链接力
    // .id() 告诉 D3 如何通过 link.source/target 的值找到对应的 node 对象
    .force("link", d3.forceLink<Node, Link>(links).id(d => d.id))
    .force("charge", d3.forceManyBody().strength(-40))
    .force("center", d3.forceCenter(width / 2, height / 2))
    // 新增: 添加碰撞力
    // 半径设为 7，比圆圈的半径 6 稍大一点，留出一些边距
    .force("collide", d3.forceCollide(7));

  nodeElements.call(drag(simulation));
  // --- 4. 启动渲染 (更新) ---
  simulation.on("tick", () => {
    // 新增: 更新连线的位置
    // d.source 和 d.target 在这里已经被 D3 替换成了完整的 node 对象
    linkElements
      .attr("x1", d => (d.source as Node).x!)
      .attr("y1", d => (d.source as Node).y!)
      .attr("x2", d => (d.target as Node).x!)
      .attr("y2", d => (d.target as Node).y!);

    // (不变) 更新节点的位置
    nodeElements
      .attr("cx", d => d.x!)
      .attr("cy", d => d.y!);
  });
};

const drag = (simulation: d3.Simulation<Node, undefined>) => {
  function dragstarted(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
    // event.active 表示当前是否正在发生其他拖拽事件
    // 如果没有，就"重新加热"模拟，让它动起来
    if (!event.active) simulation.alphaTarget(0.3).restart();
    // d.fx 和 d.fy 是节点的固定位置。一旦设置，节点就会被“钉”在那里
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
    // 在拖拽过程中，持续更新节点的固定位置
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event: d3.D3DragEvent<SVGCircleElement, Node, Node>, d: Node) {
    // 拖拽结束后，取消"加热"，让模拟自然冷却
    if (!event.active) simulation.alphaTarget(0);
    // 取消节点的固定位置，让它重新受物理引擎的控制
    d.fx = null;
    d.fy = null;
  }

  return d3.drag<SVGCircleElement, Node>()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
}

// --- Demo 1: 不同尺寸节点的碰撞 ---
// 知识点: forceCollide.radius() 接收一个函数，为每个节点设置不同的碰撞半径
const drawDemo1 = (elRef: typeof demo1Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value);
  const width = elRef.value.clientWidth;
  const height = elRef.value.clientHeight;
  svg.selectAll("*").remove();

  // 数据: 节点拥有了大小不一的 radius 属性
  const nodes: Node[] = d3.range(50).map(i => ({
    id: i,
    radius: Math.random() * 15 + 5 // 半径在 5 到 20 之间
  }));

  const nodeElements = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", d => d.radius!) // 视觉上的半径
      .attr("fill", d => d3.interpolateViridis(d.radius! / 20)); // 根据半径大小给个颜色

  d3.forceSimulation(nodes)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(-15))
      // 核心: forceCollide 的半径不再是固定数字，而是来自数据的函数
      // 我们给碰撞半径额外加2个像素的边距，效果更好
      .force("collide", d3.forceCollide<Node>(d => d.radius! + 2))
      .on("tick", () => {
        nodeElements.attr("cx", d => d.x!).attr("cy", d => d.y!);
      });
};

// --- Demo 2: 调节“力”的强度 ---
// 知识点: forceCenter.strength() 控制中心力的“柔和度”
const drawDemo2 = (elRef: typeof demo2Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value);
  const width = elRef.value.clientWidth;
  const height = elRef.value.clientHeight;
  svg.selectAll("*").remove();

  const nodes: Node[] = d3.range(30).map(i => ({ id: i, radius: 8 }));

  const nodeElements = svg.append("g").selectAll("circle").data(nodes, (d: any) => d.id).join("circle")
      .attr("r", d => d.radius!)
      .attr("fill", "coral");

  const simulation = d3.forceSimulation(nodes)
      // 核心: 将中心力的强度调低，使其作用变得非常柔和
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force("charge", d3.forceManyBody().strength(-20))
      .force("collide", d3.forceCollide<Node>(d => d.radius! + 2))
      .on("tick", () => {
        // 更新时给个过渡，更平滑
        nodeElements.transition().duration(50).attr("cx", d => d.x!).attr("cy", d => d.y!);
      });

  // 模拟场景: 2秒后，突然加入一个新节点
  setTimeout(() => {
    nodes.push({ id: 30, radius: 15 }); // 一个大节点
    // 更新数据绑定
    nodeElements.data(nodes, (d: any) => d.id).join(
        enter => enter.append("circle")
            .attr("r", 0).attr("fill", "purple")
            .call(enter => enter.transition().duration(500).attr("r", d => d.radius!))
            .attr("cx", width / 2).attr("cy", height / 2) // 从中心出现
    );
    // 通知模拟器: 节点数据变了！
    simulation.nodes(nodes);
    // 观察: 由于中心力强度很低，整个群组会非常平滑、缓慢地重新寻找中心，而不是突然“跳”一下。
  }, 2000);
};

// --- Demo 3: 交互式中心点 ---
// 知识点: 动态修改中心力 forceCenter.x() 和 .y()
const drawDemo3 = (elRef: typeof demo3Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value);
  const width = elRef.value.clientWidth;
  const height = elRef.value.clientHeight;
  svg.selectAll("*").remove();

  const nodes: Node[] = d3.range(80).map(i => ({ id: i, radius: 4 }));

  const nodeElements = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", d => d.radius!)
      .attr("fill", "teal");

  const simulation = d3.forceSimulation(nodes)
      .force("center", d3.forceCenter(width / 2, height / 2)) // 初始中心
      .force("charge", d3.forceManyBody().strength(-10))
      .force("collide", d3.forceCollide(5));

  simulation.on("tick", () => {
    nodeElements.attr("cx", d => d.x!).attr("cy", d => d.y!);
  });

  // 核心: 监听SVG上的鼠标移动事件
  svg.on("mousemove", (event) => {
    const [mouseX, mouseY] = d3.pointer(event);

    // 动态更新中心力的目标点为当前鼠标位置
    const centerForce = simulation.force<d3.ForceCenter<Node>>("center");
    if (centerForce) {
      centerForce.x(mouseX).y(mouseY);
    }

    // "重新加热"模拟，让它动起来去追逐新的中心点
    simulation.alpha(0.2).restart();
  });
};


// --- Demo 4: 可变连接力 ---
// 知识点: forceLink 的 distance 和 strength 接受函数，实现数据驱动的链接效果
const drawDemo4 = (elRef: typeof demo4Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value), width = elRef.value.clientWidth, height = elRef.value.clientHeight;
  svg.selectAll("*").remove();

  const nodes: Node[] = [
    { id: "Center", radius: 10 }, { id: "A", radius: 5 }, { id: "B", radius: 5 },
    { id: "C", radius: 5 }, { id: "D", radius: 5 }, { id: "E", radius: 5 }
  ];
  const links: Link[] = [
    { source: "Center", target: "A", type: "strong" }, { source: "Center", target: "B", type: "strong" },
    { source: "Center", target: "C", type: "weak" }, { source: "Center", target: "D", type: "weak" },
    { source: "A", target: "E", type: "weak" }
  ];

  const linkElements = svg.append("g").selectAll("line").data(links).join("line")
    .attr("stroke", d => d.type === 'strong' ? 'black' : '#999')
    .attr("stroke-width", d => d.type === 'strong' ? 2 : 1);
  const nodeElements = svg.append("g").selectAll("circle").data(nodes).join("circle")
    .attr("r", d => d.radius!)
    .attr("fill", d => d.id === 'Center' ? 'brown' : 'steelblue');

  d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-400)) // 较强的排斥力
    .force("center", d3.forceCenter(width / 2, height / 2))
    // 核心: forceLink 的配置
    .force("link", d3.forceLink<Node, Link>(links)
      .id(d => d.id as string) // 告诉 D3 如何匹配字符串 ID
      // 距离: 如果是 strong 类型，距离为 50，否则为 100
      .distance(d => d.type === 'strong' ? 50 : 100)
      // 强度: 如果是 strong 类型，强度为 0.9，否则为 0.1
      .strength(d => d.type === 'strong' ? 0.9 : 0.1)
    )
    .on("tick", () => {
      nodeElements.attr("cx", d => d.x!).attr("cy", d => d.y!);
      linkElements
        .attr("x1", d => (d.source as Node).x!).attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!).attr("y2", d => (d.target as Node).y!);
    });
};

// --- Demo 5: 多体引力与范围 ---
// 知识点: forceManyBody 的 strength 为正值模拟引力，并使用 distanceMax 优化性能
const drawDemo5 = (elRef: typeof demo5Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value), width = elRef.value.clientWidth, height = elRef.value.clientHeight;
  svg.selectAll("*").remove();

  const nodes: Node[] = d3.range(150).map(i => ({ id: i, radius: 4, group: i % 3 }));
  const colors = ["#FFC107", "#4CAF50", "#2196F3"];

  const nodeElements = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", d => d.radius!)
      .attr("fill", d => colors[d.group!]);

  d3.forceSimulation(nodes)
      // 核心 1: strength 为正值，模拟万有引力，所有节点会互相吸引
      // 核心 2: distanceMax 设置了力的最大作用范围，超过这个距离的节点对将忽略彼此
      // 这会防止所有节点都挤成一团，而是形成更有趣的局部星团
      .force("charge", d3.forceManyBody().strength(5).distanceMax(80))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.05))
      // 仍然需要碰撞力，防止它们在吸引到一起时完全重叠
      .force("collide", d3.forceCollide(5))
      .on("tick", () => {
        nodeElements.attr("cx", d => d.x!).attr("cy", d => d.y!);
      });
};

// --- Demo 6: 分类布局 ---
// 知识点: 使用 forceX 的函数模式，将节点按类别分到不同垂直区域
const drawDemo6 = (elRef: typeof demo6Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value), width = elRef.value.clientWidth, height = elRef.value.clientHeight;
  svg.selectAll("*").remove();

  const numNodes = 100;
  const numGroups = 3;
  const nodes: Node[] = d3.range(numNodes).map(i => ({
    id: i,
    group: i % numGroups, // 分成 3 组
    radius: 5
  }));
  // 创建一些随机链接
  const links: Link[] = d3.range(numNodes / 2).map(() => ({
    source: Math.floor(Math.random() * numNodes),
    target: Math.floor(Math.random() * numNodes)
  }));

  // 为不同分组定义目标 X 坐标
  const xPositions = {
    0: width * 0.2, // 第 0 组去左边
    1: width * 0.5, // 第 1 组去中间
    2: width * 0.8, // 第 2 组去右边
  };
  const colors = ["#FFC107", "#4CAF50", "#2196F3"];

  const linkElements = svg.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.4).selectAll("line").data(links).join("line");
  const nodeElements = svg.append("g").selectAll("circle").data(nodes).join("circle")
      .attr("r", 5)
      .attr("fill", d => colors[d.group!]);

  const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id as number).distance(40).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-30))
      .force("collide", d3.forceCollide(6))
      // 初始状态: 只有一个中心力，所有节点混在一起
      .force("center", d3.forceCenter(width / 2, height / 2));

  simulation.on("tick", () => {
    nodeElements.attr("cx", d => d.x!).attr("cy", d => d.y!);
    linkElements
      .attr("x1", d => (d.source as Node).x!).attr("y1", d => (d.source as Node).y!)
      .attr("x2", d => (d.target as Node).x!).attr("y2", d => (d.target as Node).y!);
  });

  // 核心: 3秒后，动态改变力的规则！
  setTimeout(() => {
    // 1. 移除中心力，因为它会与 forceX/forceY 冲突
    simulation.force("center", null);

    // 2. 添加 forceX，根据节点分组将其拉到不同的X坐标
    simulation.force("x", d3.forceX<Node>(d => xPositions[d.group!]).strength(0.1));

    // 3. 添加 forceY，将所有节点都拉到垂直中心，让队形更整齐
    simulation.force("y", d3.forceY<Node>(height / 2).strength(0.1));

    // 4. "重新加热"模拟，让动画效果更明显
    simulation.alpha(0.5).restart();
  }, 3000);
};

</script>

<style scoped>
/* 可选：为卡片添加统一的阴影效果 */
.card-shadow {
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.05);
}
svg { cursor: default; } /* 恢复默认鼠标样式 */

</style>

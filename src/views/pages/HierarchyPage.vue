<template>
  <div class="pa-4">
    <v-row dense>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="500">
          <v-card-title>Demo 1: 基础树图</v-card-title>
          <v-card-subtitle>d3.hierarchy + d3.tree</v-card-subtitle>
          <v-card-text>
            <svg ref="treeDemo1Ref" width="100%" height="380"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="6">
        <v-card class="card-shadow" height="500">
          <v-card-title>Demo 2: 从CSV到优雅的树图</v-card-title>
          <v-card-subtitle>d3.stratify + d3.linkVertical</v-card-subtitle>
          <v-card-text>
            <svg ref="treeDemo2Ref" width="100%" height="380"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="12" lg="12">
        <v-card class="card-shadow" min-height="300">
          <v-card-title>Demo 3: 交互式文件浏览器</v-card-title>
          <v-card-subtitle>单击节点可展开/折叠</v-card-subtitle>
          <v-card-text class="pa-4">
            <svg ref="treeDemo3Ref" width="100%" height="500" class="mt-6"></svg>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row dense>
  <v-col cols="12" lg="4">
    <v-card class="card-shadow" height="500">
      <v-card-title>范式一: 节点-链接图 (簇)</v-card-title>
      <v-card-subtitle>d3.cluster - 所有叶子节点对齐</v-card-subtitle>
      <v-card-text>
        <svg ref="clusterDemoRef" width="100%" height="400"></svg>
      </v-card-text>
    </v-card>
  </v-col>
  <v-col cols="12" lg="4">
    <v-card class="card-shadow" height="500">
      <v-card-title>范式二: 邻接图 (旭日图)</v-card-title>
      <v-card-subtitle>d3.partition - 递归空间分割</v-card-subtitle>
      <v-card-text>
        <svg ref="sunburstDemoRef" width="100%" height="400"></svg>
      </v-card-text>
    </v-card>
  </v-col>
  <v-col cols="12" lg="4">
    <v-card class="card-shadow" height="500">
      <v-card-title>范式三: 封闭图 (矩形树图)</v-card-title>
      <v-card-subtitle>d3.treemap - 按面积展示权重</v-card-subtitle>
      <v-card-text>
        <svg ref="treemapDemoRef" width="100%" height="400"></svg>
      </v-card-text>
    </v-card>
  </v-col>
</v-row>
    <v-row dense>
      <v-col cols="6">
        <v-card class="card-shadow" height="600">
          <v-card-title>实用Demo: 可交互缩放的旭日图</v-card-title>
          <v-card-subtitle>单击扇区深入，单击中心圆返回</v-card-subtitle>
          <v-card-text class="d-flex justify-center align-center" style="min-height: 550px;">
            <svg ref="zoomableSunburstRef"></svg>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="6">
        <v-card class="card-shadow" height="600">
          <v-card-title>实用Demo: 径向树状图</v-card-title>
          <v-card-subtitle>鼠标悬停查看详情，展现技术生态全景</v-card-subtitle>
          <v-card-text class="d-flex justify-center align-center" style="position: relative; min-height: 550px;">
            <svg ref="radialTreeRef"></svg>
            <!-- Tooltip 卡片 -->
            <v-card
              v-show="tooltipVisible"
              :style="{
                position: 'absolute',
                left: tooltipX + 'px',
                top: tooltipY + 'px',
                pointerEvents: 'none',
                zIndex: 1000
              }"
              class="pa-2"
              elevation="8"
              max-width="200"
            >
              <v-card-title class="text-subtitle-2 pa-1">{{ tooltipContent.name }}</v-card-title>
              <v-card-text class="text-caption pa-1" v-if="tooltipContent.description">
                {{ tooltipContent.description }}
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as d3 from 'd3';

// --- Refs for Hierarchy Demos ---
const treeDemo1Ref = ref<SVGSVGElement | null>(null);
const treeDemo2Ref = ref<SVGSVGElement | null>(null);
const treeDemo3Ref = ref<SVGSVGElement | null>(null);

// --- Refs for New Demos ---
const clusterDemoRef = ref<SVGSVGElement | null>(null);
const sunburstDemoRef = ref<SVGSVGElement | null>(null);
const treemapDemoRef = ref<SVGSVGElement | null>(null);

//交互Demo
const zoomableSunburstRef = ref<SVGSVGElement | null>(null);


// 径向树状图
const radialTreeRef = ref<SVGSVGElement | null>(null);
const tooltipVisible = ref(false);
const tooltipX = ref(0);
const tooltipY = ref(0);
const tooltipContent = ref({ name: '', description: '' });


// --- 数据 (旭日图和树状图共用) ---
// 注意：这次的数据在叶子节点上增加了 value 属性，这是计算面积/角度大小的依据
const valuedData = {
  name: "flare",
  children: [
    {
      name: "analytics",
      children: [
        {
          name: "cluster",
          children: [
            { name: "AgglomerativeCluster", value: 3938 },
            { name: "CommunityStructure", value: 3812 },
            { name: "HierarchicalCluster", value: 6714 },
          ]
        },
        {
          name: "graph",
          children: [
            { name: "BetweennessCentrality", value: 3534 },
            { name: "LinkDistance", value: 5731 },
          ]
        }
      ]
    },
    {
      name: "animate",
      children: [
        { name: "Easing", value: 17010 },
        { name: "FunctionSequence", value: 5842 },
        { name: "interpolate", children: [{ name: "ArrayInterpolator", value: 1983 }] }
      ]
    }
  ]
};

onMounted(() => {
  drawDemo1(treeDemo1Ref);
  drawDemo2(treeDemo2Ref);
  drawDemo3(treeDemo3Ref);

  drawClusterDemo(clusterDemoRef);
  drawSunburstDemo(sunburstDemoRef);
  drawTreemapDemo(treemapDemoRef);

  drawZoomableSunburst(zoomableSunburstRef);
  drawRadialTree(radialTreeRef);  // 添加这一行

});

// --- Demo 1: 基础树图 (最简单) ---
const drawDemo1 = (elRef: typeof treeDemo1Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value);
  const width = elRef.value.clientWidth;
  const height = elRef.value.clientHeight;
  const margin = { top: 40, right: 90, bottom: 50, left: 90 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // 1. 数据: 一个简单的嵌套JS对象
  const data = {
    name: "Lappand",
    children: [
      { name: "Texas" },
      { name: "Seth", children: [{ name: "Enos" }, { name: "Noam" }] },
      { name: "Abel" },
      { name: "Awan", children: [{ name: "Enoch" }] },
      { name: "Azura" }
    ]
  };

  // 2. 使用 d3.hierarchy() "增强"数据
  const root = d3.hierarchy(data);

  // 3. 创建树布局生成器
  const treeLayout = d3.tree().size([innerWidth, innerHeight]);

  // 4. 计算布局，为每个节点添加 x, y 坐标
  treeLayout(root);

  // 5. 渲染连线
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links()) // 使用 .links() 获取父子连接
    .join("path")
      .attr("d", d3.linkVertical() // 使用 d3.linkVertical 生成器
        .x((d: any) => d.x)
        .y((d: any) => d.y));

  // 6. 渲染节点
  const node = g.append("g")
    .selectAll("g")
    .data(root.descendants()) // 使用 .descendants() 获取所有节点
    .join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("circle")
    .attr("fill", "#999")
    .attr("r", 4);

  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => d.children ? -8 : 8)
    .attr("text-anchor", d => d.children ? "end" : "start")
    .text(d => d.data.name)
    .clone(true).lower()
    .attr("stroke", "white");
};

// --- Demo 2: 从CSV到优雅的树图 (进阶) ---
const drawDemo2 = (elRef: typeof treeDemo2Ref) => {
  if (!elRef.value) return;
  // ... (与Demo 1类似的SVG和边距设置)
  const svg = d3.select(elRef.value), width = elRef.value.clientWidth, height = elRef.value.clientHeight;
  const margin = { top: 40, right: 20, bottom: 50, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // 1. 数据: 扁平的CSV格式字符串
  const csvData = `name,parent\nEve,\nCain,Eve\nSeth,Eve\nEnos,Seth\nNoam,Seth\nAbel,Eve\nAwan,Eve\nEnoch,Awan\nAzura,Eve`;
  const table = d3.csvParse(csvData);

  // 2. 使用 d3.stratify() 将扁平数据转换为层级数据
  const root = d3.stratify()
    .id((d: any) => d.name)
    .parentId((d: any) => d.parent)
    (table);

  // 3. (可选但推荐) 使用 .count() 计算每个节点下的叶子节点数，并 .sort() 排序
  root.count().sort((a, b) => b.height - a.height || a.data.name!.localeCompare(b.data.name!));

  // 4. 创建并计算树布局
  const treeLayout = d3.tree().size([innerWidth, innerHeight]);
  treeLayout(root);

  // 5. 渲染连线 (这次使用曲线)
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .selectAll("path")
    .data(root.links())
    .join("path")
      // d3.linkVertical()() 会生成贝塞尔曲线，更美观
      .attr("d", d3.linkVertical()
        .x((d: any) => d.x)
        .y((d: any) => d.y));

  // 6. 渲染节点和文本
  const node = g.append("g").selectAll("g").data(root.descendants()).join("g")
      .attr("transform", d => `translate(${d.x},${d.y})`);
  node.append("circle").attr("fill", d => d.children ? "#555" : "#999").attr("r", 5);
  node.append("text").attr("dy", "0.32em").attr("y", 12).attr("text-anchor", "middle").text(d => d.id!);
};


// --- Demo 3: 交互式文件浏览器 (实用例子) ---
const drawDemo3 = (elRef: typeof treeDemo3Ref) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value), width = elRef.value.clientWidth;
  const margin = { top: 70, left: 120 };

  // 1. 数据: 模拟一个文件系统
  const data = {
    name: "项目根目录",
    children: [
      { name: "src", children: [{ name: "index.ts" }, { name: "App.vue" }] },
      { name: "public", children: [{ name: "index.html" }] },
      { name: "package.json" }
    ]
  };

  const root: any = d3.hierarchy(data);
  const dx = 20; // 节点垂直间距
  const dy = width / (root.height + 1); // 节点水平间距

  const treeLayout = d3.tree().nodeSize([dx, dy]);

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
  const gLink = g.append("g").attr("fill", "none").attr("stroke", "#555").attr("stroke-opacity", 0.4);
  const gNode = g.append("g").attr("cursor", "pointer");

  function update(source: any) {
    const duration = 250;
    const nodes = root.descendants().reverse();
    const links = root.links();

    treeLayout(root);

    let left = root;
    let right = root;
    root.eachBefore((node: any) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + margin.top * 2;
    svg.attr("height", height);

    const transition = svg.transition().duration(duration);

    // 更新节点
    const node = gNode.selectAll("g").data(nodes, (d: any) => d.id || (d.id = Math.random()));

    const nodeEnter = node.enter().append("g")
      .attr("transform", `translate(${source.y0 || source.y},${source.x0 || source.x})`)
      .on("click", (event, d) => {
        d.children = d.children ? null : d._children;
        update(d);
      });

    nodeEnter.append("circle").attr("r", 4).attr("fill", d => d._children ? "#555" : "#999");
    nodeEnter.append("text").attr("x", d => d.children || d._children ? -10 : 10)
      .attr("dy", "0.32em").attr("text-anchor", d => d.children || d._children ? "end" : "start")
      .text((d: any) => d.data.name);

    node.merge(nodeEnter).transition(transition)
      .attr("transform", d => `translate(${d.y},${d.x})`);

    node.exit().transition(transition).remove()
      .attr("transform", `translate(${source.y},${source.x})`);

    // 更新连线
    const link = gLink.selectAll("path").data(links, (d: any) => d.target.id);

    const linkEnter = link.enter().append("path")
      .attr("d", d3.linkHorizontal()
        .x((d: any) => source.y0 || source.y)
        .y((d: any) => source.x0 || source.x));

    link.merge(linkEnter).transition(transition)
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x));

    link.exit().transition(transition).remove()
      .attr("d", d3.linkHorizontal()
        .x((d: any) => source.y)
        .y((d: any) => source.x));

    root.eachBefore((d: any) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  root.x0 = 0;
  root.y0 = 0;
  root.descendants().forEach((d: any, i) => {
    d.id = i;
    d._children = d.children;
    if (d.depth && d.data.name.length !== 7) d.children = null;
  });

  update(root);
};

// --- Demo 4: Cluster (簇状布局/树状图) ---
const drawClusterDemo = (elRef: typeof clusterDemoRef) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value);
  const width = elRef.value.clientWidth;
  const height = elRef.value.clientHeight;
  const margin = { top: 20, right: 120, bottom: 20, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

  // 1. 创建 cluster 布局生成器。API和 d3.tree() 几乎一样！
  const clusterLayout = d3.cluster().size([innerHeight, innerWidth]);

  // 2. 创建层级
  const root = d3.hierarchy(valuedData).sort((a,b) => d3.ascending(a.data.name, b.data.name));

  // 3. 计算布局
  clusterLayout(root);

  // 4. 渲染连线 - 注意看，所有叶子节点都完美对齐在右侧
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
      .attr("d", d => d3.linkHorizontal()
          .x((d:any) => d.y) // cluster布局中，y是深度
          .y((d:any) => d.x) // x是广度
          (d as any));

  // 5. 渲染节点和文本
  const node = g.append("g").selectAll("g")
    .data(root.descendants())
    .join("g")
      .attr("transform", d => `translate(${d.y},${d.x})`);

  node.append("circle").attr("fill", "#555").attr("r", 2.5);
  node.append("text").attr("dy", "0.31em")
      .attr("x", d => d.children ? -6 : 6)
      .attr("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.name)
      .attr("paint-order", "stroke").attr("stroke", "white").attr("stroke-width", 3);
};


// --- Demo 5: Sunburst (旭日图) ---
const drawSunburstDemo = (elRef: typeof sunburstDemoRef) => {
  if (!elRef.value) return;
  const svg = d3.select(elRef.value);
  const width = elRef.value.clientWidth;
  const height = elRef.value.clientHeight;
  const radius = Math.min(width, height) / 2 * 0.9;

  // 1. 创建旭日图专用 partition 布局
  // .size() 的 [2 * Math.PI, radius] 是关键，它将布局映射到一个完整的圆形
  const partition = d3.partition().size([2 * Math.PI, radius]);

  // 2. 创建层级并计算 value
  // 必须调用 .sum()，这样每个节点才有 .value 属性来决定弧度大小
  const root = d3.hierarchy(valuedData)
      .sum(d => d.value)
      .sort((a, b) => b.value! - a.value!);

  partition(root); // 计算布局

  // 3. 颜色比例尺和弧形生成器
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, valuedData.children.length + 1));
  const arc = d3.arc()
      .startAngle((d:any) => d.x0)
      .endAngle((d:any) => d.x1)
      .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
      .padRadius(radius / 2)
      .innerRadius((d:any) => d.y0)
      .outerRadius((d:any) => d.y1 - 1);

  // 4. 渲染
  const g = svg.append("g").attr("transform", `translate(${width / 2},${height / 2})`);
  g.selectAll("path")
    .data(root.descendants().filter(d => d.depth))
    .join("path")
      .attr("fill", (d:any) => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("d", arc as any);

  // 5. 添加标题
  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", "14px")
    .text(root.data.name);
};


// --- Demo 6: Treemap (矩形树图) ---
const drawTreemapDemo = (elRef: typeof treemapDemoRef) => {
    if (!elRef.value) return;
    const svg = d3.select(elRef.value);
    const width = elRef.value.clientWidth;
    const height = elRef.value.clientHeight;

    // 1. 创建 Treemap 布局
    const treemap = d3.treemap()
        .size([width, height])
        .padding(1)
        .round(true);

    // 2. 创建层级，同样必须 .sum()
    const root = d3.hierarchy(valuedData)
        .sum(d => d.value)
        .sort((a, b) => b.value! - a.value!);

    treemap(root); // 计算布局，为节点添加 x0, y0, x1, y1

    // 3. 渲染矩形
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    const cell = svg.selectAll("g")
      .data(root.descendants())
      .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    cell.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.parent ? d.parent.data.name : d.data.name))
      .attr("stroke", "white");

    // 4. 渲染文字
    cell.append("text")
      .selectAll("tspan")
      .data(d => d.data.name.split(/(?=[A-Z][a-z])|\s+/g)) // 自动换行
      .join("tspan")
        .attr("x", 4)
        .attr("y", (d, i) => 13 + i * 10)
        .text(d => d)
        .style("font-size", "10px")
        .style("fill", "white")
        .style("display", function(this, d) {
          // 如果文字宽度超过矩形宽度，则隐藏
          const node = this.parentNode?.parentNode as SVGGElement;
          const rectWidth = Number(d3.select(node).select('rect').attr('width'));
          return this.getComputedTextLength() > rectWidth - 8 ? "none" : "";
        });
};


// ---drawZoomableSunburst 函数 ---
const drawZoomableSunburst = (elRef: typeof zoomableSunburstRef) => {
  if (!elRef.value || !elRef.value.parentElement) return;

  const container = elRef.value.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const data = {
      name: "C:",
      children: [
        { name: "Program Files", children: [ { name: "Java", value: 400 }, { name: "Python", value: 350 }, { name: "VS Code", value: 800 } ]},
        { name: "Users", children: [ { name: "Gemini", children: [ { name: "Documents", value: 1200 }, { name: "Downloads", value: 1800 }, { name: "Pictures", value: 900 } ]}, ]},
        { name: "Windows", children: [ { name: "System32", value: 2500 }, { name: "Fonts", value: 600 } ]},
        { name: "pagefile.sys", value: 1000 }
      ]
  };
  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.children.length + 1));

  const hierarchy = d3.hierarchy(data).sum(d => d.value).sort((a, b) => b.value! - a.value!);

  // --- START: 核心修改区域 ---

  // 【修改点 1】定义图表外圈半径，这是新的“尺寸总开关”
  // 我们让图表半径占满容器较小边的 95%，留一点边距，看起来更大更饱满
  const chartRadius = Math.min(width, height) / 2 * 0.95;

  // 【修改点 2】修改 partition 布局
  // 我们不再映射到抽象的深度，而是直接映射到以像素为单位的 chartRadius
  const partition = d3.partition().size([2 * Math.PI, chartRadius]);

  // (旧的 radius 变量已删除)

  // --- END: 核心修改区域 ---

  const root = partition(hierarchy);
  root.each((d: any) => d.current = d);

  // 【修改点 3】修改 arc 生成器
  // 因为 partition 直接输出了像素值，所以不再需要乘以 radius
  const arc = d3.arc()
    .startAngle((d: any) => d.x0)
    .endAngle((d: any) => d.x1)
    .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(20) // 可以给一个固定的 padRadius
    .innerRadius((d: any) => d.y0)
    .outerRadius((d: any) => d.y1 - 1);

  const svg = d3.select(elRef.value)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .style("font", "12px sans-serif"); // 也可以适当调大字体

  const path = svg.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
      .attr("fill", (d: any) => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
      .attr("d", (d: any) => arc(d.current));

  path.filter((d: any) => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.append("title").text((d: any) => `${d.ancestors().map((d: any) => d.data.name).reverse().join("/")}\n${d.value?.toLocaleString()}`);

  const label = svg.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

  // 【修改点 4】修改中心圆
  // 中心圆的半径现在是第一层扇形的内半径
  const parent = svg.append("circle")
      .datum(root)
      .attr("r", (root.children && root.children[0]) ? root.children[0].y0 : 30)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

  function clicked(event: MouseEvent, p: any) {
    // 【修改点 5】更新中心圆的半径
    parent.datum(p.parent || root)
      .transition().duration(750)
      .attr("r", (d:any) => (d.children && d.children[0]) ? d.children[0].y0 : 30);

    // ... zoom 逻辑，重新计算 target...
    // 这里也需要用新的 chartRadius
    root.each((d: any) => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: (d.y0 - p.y0),
      y1: (d.y1 - p.y0)
    });

    const t = svg.transition().duration(750);
    path.transition(t)
        .tween("data", (d: any) => {
          // target 的 y 值现在也需要乘以一个缩放因子
          const i = d3.interpolate(d.current, d.target);
          return (t: any) => d.current = i(t);
        })
        // ... 以下部分不变 ...
      .filter(function(d: any) { return +this.getAttribute("fill-opacity")! || arcVisible(d.target); })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
        .attrTween("d", (d: any) => () => arc(d.current));
    label.filter(function(d: any) { return +this.getAttribute("fill-opacity")! || labelVisible(d.target); }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", (d: any) => () => labelTransform(d.current));
  }
  function arcVisible(d: any) { return d.y1 <= chartRadius && d.y0 >= 0 && d.x1 > d.x0; }
  function labelVisible(d: any) { return d.y1 <= chartRadius && d.y0 >=0 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03; }

  // 【修改点 6】修改 labelTransform 函数
  // 不再使用旧的 radius 变量
  function labelTransform(d: any) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2;
    const isParent = d.children ? true : false;
    // 对父节点稍微旋转一下，避免文字倒置
    const angle = x < 180 && x > 0 ? 0 : 180;
    return `rotate(${x - 90}) translate(${y},0) rotate(${isParent ? angle : x < 180 ? 0 : 180})`;
  }
};


// --- 实用Demo: 径向树状图 ---
const drawRadialTree = (elRef: typeof radialTreeRef) => {
  if (!elRef.value || !elRef.value.parentElement) return;

  const container = elRef.value.parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;
  const radius = Math.min(width, height) / 2 - 100;

  // 更丰富的技术生态数据
  const data = {
    name: "flare.vis.data",
    description: "数据可视化生态系统",
    children: [
      {
        name: "data",
        description: "数据处理",
        children: [
          { name: "converters", description: "数据转换器",
            children: [
              { name: "JSONConverter", description: "JSON转换" },
              { name: "XMLConverter", description: "XML转换" },
              { name: "CSVConverter", description: "CSV转换" }
            ]
          },
          { name: "DataUtil", description: "数据工具" },
          { name: "DataSource", description: "数据源" }
        ]
      },
      {
        name: "display",
        description: "显示组件",
        children: [
          { name: "DirtySprite", description: "脏矩形渲染" },
          { name: "LineSprite", description: "线条精灵" },
          { name: "RectSprite", description: "矩形精灵" },
          { name: "TextSprite", description: "文本精灵" }
        ]
      },
      {
        name: "flex",
        description: "布局系统",
        children: [
          { name: "FlareVis", description: "可视化容器" }
        ]
      },
      {
        name: "physics",
        description: "物理引擎",
        children: [
          { name: "DragForce", description: "拖拽力" },
          { name: "GravityForce", description: "重力" },
          { name: "NBodyForce", description: "多体力" },
          { name: "Particle", description: "粒子" },
          { name: "Simulation", description: "模拟器" },
          { name: "Spring", description: "弹簧" },
          { name: "SpringForce", description: "弹簧力" }
        ]
      },
      {
        name: "query",
        description: "查询系统",
        children: [
          { name: "AggregateExpression", description: "聚合表达式" },
          { name: "methods", description: "查询方法",
            children: [
              { name: "add", description: "添加" },
              { name: "and", description: "与运算" },
              { name: "average", description: "平均值" },
              { name: "count", description: "计数" },
              { name: "distinct", description: "去重" },
              { name: "div", description: "除法" },
              { name: "eq", description: "等于" },
              { name: "fn", description: "函数" },
              { name: "gt", description: "大于" },
              { name: "gte", description: "大于等于" },
              { name: "if", description: "条件" },
              { name: "iff", description: "双条件" },
              { name: "lt", description: "小于" },
              { name: "lte", description: "小于等于" },
              { name: "max", description: "最大值" },
              { name: "min", description: "最小值" },
              { name: "mod", description: "取模" },
              { name: "mul", description: "乘法" },
              { name: "neq", description: "不等于" },
              { name: "not", description: "非" },
              { name: "or", description: "或" },
              { name: "orderby", description: "排序" },
              { name: "range", description: "范围" },
              { name: "select", description: "选择" },
              { name: "stddev", description: "标准差" },
              { name: "sub", description: "减法" },
              { name: "sum", description: "求和" },
              { name: "update", description: "更新" },
              { name: "variance", description: "方差" },
              { name: "where", description: "过滤" },
              { name: "xor", description: "异或" },
              { name: "_", description: "下划线" }
            ]
          },
          { name: "Minimum", description: "最小值" },
          { name: "Maximum", description: "最大值" },
          { name: "Query", description: "查询对象" },
          { name: "Variable", description: "变量" }
        ]
      },
      {
        name: "scale",
        description: "比例尺",
        children: [
          { name: "IScaleMap", description: "比例映射接口" },
          { name: "LinearScale", description: "线性比例尺" },
          { name: "LogScale", description: "对数比例尺" },
          { name: "OrdinalScale", description: "序数比例尺" },
          { name: "QuantileScale", description: "分位数比例尺" },
          { name: "QuantitativeScale", description: "定量比例尺" },
          { name: "RootScale", description: "根比例尺" },
          { name: "Scale", description: "比例尺基类" },
          { name: "ScaleType", description: "比例尺类型" },
          { name: "TimeScale", description: "时间比例尺" }
        ]
      },
      {
        name: "util",
        description: "工具集",
        children: [
          { name: "palette", description: "调色板",
            children: [
              { name: "ColorPalette", description: "颜色调色板" },
              { name: "Palette", description: "调色板基类" },
              { name: "ShapePalette", description: "形状调色板" },
              { name: "SizePalette", description: "尺寸调色板" }
            ]
          },
          { name: "math", description: "数学工具",
            children: [
              { name: "DenseMatrix", description: "密集矩阵" },
              { name: "IMatrix", description: "矩阵接口" },
              { name: "SparseMatrix", description: "稀疏矩阵" }
            ]
          },
          { name: "heap", description: "堆",
            children: [
              { name: "FibonacciHeap", description: "斐波那契堆" },
              { name: "HeapNode", description: "堆节点" }
            ]
          },
          { name: "Arrays", description: "数组工具" },
          { name: "Colors", description: "颜色工具" },
          { name: "Dates", description: "日期工具" },
          { name: "Displays", description: "显示工具" },
          { name: "Filter", description: "过滤器" },
          { name: "Geometry", description: "几何工具" },
          { name: "IEvaluable", description: "可评估接口" },
          { name: "IPredicate", description: "谓词接口" },
          { name: "IValueProxy", description: "值代理接口" },
          { name: "Maths", description: "数学集合" },
          { name: "Orientation", description: "方向" },
          { name: "Property", description: "属性" },
          { name: "Shapes", description: "形状" },
          { name: "Sort", description: "排序" },
          { name: "Stats", description: "统计" },
          { name: "Strings", description: "字符串" }
        ]
      }
    ]
  };

  const svg = d3.select(elRef.value)
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .style("font", "11px sans-serif");

  const g = svg.append("g");

  // 创建树布局，让根节点在顶部（-Math.PI/2 是 12点钟方向）
  const tree = d3.tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

  const root = d3.hierarchy(data);
  tree(root);

  // 优雅的蓝灰色系配色，避免撞色
  const getNodeColor = (d: any) => {
    if (d.depth === 0) return "#4A90E2"; // 根节点：亮蓝色
    if (d.depth === 1) return "#5DADE2"; // 第一层：天蓝色
    if (d.depth === 2) return "#7FB3D5"; // 第二层：浅蓝色
    if (d.depth === 3) return "#85C1E9"; // 第三层：更浅蓝
    return "#AED6F1"; // 叶子节点：淡蓝色
  };

  // 绘制连线
  g.append("g")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", 1)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("d", d3.linkRadial()
      .angle((d: any) => d.x - Math.PI / 2) // 调整角度，让根节点在上方
      .radius((d: any) => d.y) as any);

  // 绘制节点
  const node = g.append("g")
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => {
      const angle = d.x - Math.PI / 2; // 调整角度
      return `rotate(${angle * 180 / Math.PI}) translate(${d.y},0)`;
    })
    .style("cursor", "pointer");

  // 实心圆点，使用和谐的蓝色系
  node.append("circle")
    .attr("fill", d => getNodeColor(d))
    .attr("r", d => {
      if (d.depth === 0) return 8;
      if (d.children) return 5;
      return 3.5;
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .on("mouseenter", function(event, d: any) {
      // 放大效果
      const originalR = d.depth === 0 ? 8 : d.children ? 5 : 3.5;
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", originalR * 1.5);

      // 显示 tooltip
      const rect = elRef.value!.getBoundingClientRect();
      tooltipContent.value = {
        name: d.data.name,
        description: d.data.description || ''
      };
      tooltipX.value = event.clientX - rect.left + 10;
      tooltipY.value = event.clientY - rect.top + 10;
      tooltipVisible.value = true;
    })
    .on("mouseleave", function(event, d: any) {
      // 恢复大小
      const originalR = d.depth === 0 ? 8 : d.children ? 5 : 3.5;
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", originalR);

      // 隐藏 tooltip
      tooltipVisible.value = false;
    });

  // 添加文本标签
  node.append("text")
    .attr("dy", "0.31em")
    .attr("x", d => {
      const angle = d.x - Math.PI / 2;
      return angle > 0 && angle < Math.PI ? 6 : -6;
    })
    .attr("text-anchor", d => {
      const angle = d.x - Math.PI / 2;
      return angle > 0 && angle < Math.PI ? "start" : "end";
    })
    .attr("transform", d => {
      // 当节点在右半圆时（0到π），文字不需要额外旋转
      // 当节点在左半圆时（π到2π），文字旋转180度保持可读
      return d.x <= Math.PI ? null : "rotate(180)";
    })
    .text(d => d.data.name)
    .attr("paint-order", "stroke")
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("fill", "#333")
    .style("font-size", d => {
      if (d.depth === 0) return "13px";
      if (d.depth === 1) return "11px";
      return "10px";
    })
    .style("font-weight", d => d.depth === 0 ? "bold" : "normal");

  // 添加入场动画
  node.style("opacity", 0)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 20)
    .style("opacity", 1);
};
</script>

<style>
/* 为 Demo 3 的文本添加样式 */
.v-card-text text {
  font: 12px sans-serif;

}
</style>

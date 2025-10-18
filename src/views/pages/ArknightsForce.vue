<template>
  <v-card class="ark-wrap" flat>
    <!-- 背景菱形网格 -->
    <div class="ark-grid"></div>

    <!-- 星点层（独立画布，降低主层 overdraw） -->
    <canvas ref="starsRef" class="ark-stars"></canvas>

    <!-- 主粒子层 -->
    <canvas
      ref="canvasRef"
      class="ark-main"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @click="nextShape"
    ></canvas>

    <!-- 右侧切换按钮（贴近官网交互习惯） -->
    <button class="ark-next" @click="nextShape" aria-label="next">›</button>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import * as d3 from 'd3'

// ---------- Props ----------
const props = withDefaults(defineProps<{
  sources: string[]                  // 多个轮廓 PNG
  step?: number                      // 采样网格间距（像素）
  pointSize?: number                 // 粒子大小（像素）
  brightnessTh?: number              // 亮度阈值，0~255；小于此阈值视为“命中”
  repelRadius?: number               // 鼠标排斥半径
  repelStrength?: number             // 排斥强度（像素/帧）
}>(), {
  step: 6,
  pointSize: 2,
  brightnessTh: 180,
  repelRadius: 110,
  repelStrength: 3.2
})

const fallbackSources = [
  new URL('@/assets/arknights/rhodes.png', import.meta.url).href,
  new URL('@/assets/arknights/sui.png',     import.meta.url).href,
]
const resolvedSources = computed(() =>
  (props.sources && props.sources.length) ? props.sources : fallbackSources
)

// ---------- Refs & State ----------
const canvasRef = ref<HTMLCanvasElement | null>(null)
const starsRef  = ref<HTMLCanvasElement | null>(null)
const dpr = window.devicePixelRatio || 1

const W = ref(0)
const H = ref(0)

type P = { x:number; y:number; vx:number; vy:number; tx:number; ty:number; a:number }
let nodes: P[] = []
let sim: d3.Simulation<P, undefined> | null = null
let rafId: number | null = null
let rafStars: number | null = null

let mouseX = -1e3, mouseY = -1e3
let shapeIdx = 0

// ---------- Helpers ----------
function resizeCanvas(el: HTMLCanvasElement, w: number, h: number) {
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  el.style.width = `${w}px`
  el.style.height = `${h}px`
  const ctx = el.getContext('2d')!
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function fitContain(imgW: number, imgH: number, viewW: number, viewH: number, padding=40) {
  const availW = viewW - padding*2
  const availH = viewH - padding*2
  const s = Math.min(availW / imgW, availH / imgH)
  const w = imgW * s
  const h = imgH * s
  const ox = (viewW - w) / 2
  const oy = (viewH - h) / 2
  return { x: ox, y: oy, w, h }
}

function luminance(r:number,g:number,b:number) {
  // 线性近似即可：官网是单色
  return 0.2126*r + 0.7152*g + 0.0722*b
}

// 将位图采样为点阵
async function rasterToPoints(url: string, viewW: number, viewH: number, step: number, th: number) {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.src = url;
  });

  // 1) 离屏画布用“设备像素”大小；不再用 ctx.setTransform
  const off = document.createElement('canvas');
  off.width = Math.floor(viewW * dpr);
  off.height = Math.floor(viewH * dpr);
  const octx = off.getContext('2d')!;
  // octx.setTransform(...) 这里不要再缩放

  // 2) 等比居中 + 动态留白（18% 宽/高），避免过大并绝对居中
  const PADDING = Math.round(Math.min(viewW, viewH) * 0.18);
  const box = fitContain(img.width, img.height, viewW, viewH, PADDING);

  // 3) 按设备像素把图片画到离屏画布（坐标全部 * dpr）
  octx.clearRect(0, 0, off.width, off.height);
  octx.drawImage(
    img,
    Math.round(box.x * dpr),
    Math.round(box.y * dpr),
    Math.round(box.w * dpr),
    Math.round(box.h * dpr)
  );

  // 4) 取整张离屏画布的像素（设备像素坐标系）
  const imgData = octx.getImageData(0, 0, off.width, off.height);
  const data = imgData.data;
  const stride = off.width; // 设备像素宽

  const pts: { x: number; y: number }[] = [];

  // 5) 遍历仍按 CSS 像素；换算到设备像素再取样
  const yStart = Math.max(0, Math.floor(box.y));
  const yEnd = Math.min(viewH, Math.ceil(box.y + box.h));
  const xStart = Math.max(0, Math.floor(box.x));
  const xEnd = Math.min(viewW, Math.ceil(box.x + box.w));

  for (let y = yStart; y < yEnd; y += step) {
    const yi = Math.min(off.height - 1, Math.floor(y * dpr));
    for (let x = xStart; x < xEnd; x += step) {
      const xi = Math.min(off.width - 1, Math.floor(x * dpr));
      const idx = (yi * stride + xi) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];

      // 白主体 + 透明背景：亮度或高 alpha 命中
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if ((a > 10 && lum >= th) || (a > 220 && lum > 30)) {
        const j = step * 0.3;
        const jx = (Math.random() - 0.5) * j;
        const jy = (Math.random() - 0.5) * j;
        pts.push({ x: x + jx, y: y + jy }); // 注意：返回 CSS 坐标供渲染/力场使用
      }
    }
  }
  return pts;
}

// 将 A 点集“合理”映射到 B 点集：按极角排序后索引配对（快且稳定）
function mapTargets(from: {x:number;y:number}[], to: {x:number;y:number}[]) {
  const cx = (arr: {x:number;y:number}[]) => {
    const m = arr.reduce((s,p)=>({x:s.x+p.x,y:s.y+p.y}), {x:0,y:0})
    return { x: m.x/arr.length, y: m.y/arr.length }
  }
  const ca = cx(from.length? from : to)
  const cb = cx(to)

  const sf = [...from].map(p => ({...p, ang: Math.atan2(p.y-ca.y, p.x-ca.x)})).sort((a,b)=>a.ang-b.ang)
  const st = [...to].map(p => ({...p, ang: Math.atan2(p.y-cb.y, p.x-cb.x)})).sort((a,b)=>a.ang-b.ang)

  const n = Math.max(sf.length, st.length)
  const out: {tx:number;ty:number}[] = new Array(n)
  for (let i=0;i<n;i++) {
    const t = st[i % st.length]
    out[i] = { tx: t.x, ty: t.y }
  }
  return out
}

// ---------- Init & Simulation ----------
async function buildShape(url: string) {
  const pts = await rasterToPoints(url, W.value, H.value, props.step, props.brightnessTh)

  // 首次：创建节点；其后：复用节点并重映射目标
  if (nodes.length === 0) {
    // 节点从四周随机圈入场
    const R = Math.hypot(W.value, H.value)
    nodes = pts.map(p => {
      const a = Math.random()*Math.PI*2
      return { x: W.value/2 + Math.cos(a)*R,
               y: H.value/2 + Math.sin(a)*R,
               vx:0, vy:0, tx:p.x, ty:p.y, a:1 }
    })
  } else {
    const targets = mapTargets(nodes, pts)
    for (let i=0;i<nodes.length;i++) {
      const t = targets[i % targets.length]
      nodes[i].tx = t.tx
      nodes[i].ty = t.ty
      nodes[i].a  = 1
    }
  }

  if (!sim) {
    sim = d3.forceSimulation(nodes)
      .alpha(1)
      .alphaDecay(0.05)
      .velocityDecay(0.3)
      .force('x', d3.forceX<P>(d=>d.tx).strength(0.15))
      .force('y', d3.forceY<P>(d=>d.ty).strength(0.15))
      .force('collide', d3.forceCollide<P>(props.pointSize*0.9))
      .force('nudge', () => { // 鼠标软排斥：每 tick 轻推一点速度
        if (mouseX < 0) return
        const r2 = props.repelRadius*props.repelRadius
        for (const p of nodes) {
          const dx = p.x - mouseX, dy = p.y - mouseY
          const d2 = dx*dx + dy*dy
          if (d2 > 0 && d2 < r2) {
            const d = Math.sqrt(d2)
            const f = (1 - d/props.repelRadius) * props.repelStrength
            p.vx += (dx/d) * f
            p.vy += (dy/d) * f
          }
        }
      })
      .on('tick', () => {})
  } else {
    sim.alpha(0.9).restart()
  }
}

function drawLoop() {
  const cvs = canvasRef.value!
  const ctx = cvs.getContext('2d')!
  const ps = props.pointSize

  const render = () => {
    ctx.clearRect(0,0,W.value,H.value)

    // 轻微星点背景（主层也撒少量，提升层次）
    ctx.globalAlpha = 0.3
    for (let i=0;i<18;i++) {
      const x = ((i*97)%W.value), y = ((i*233)%H.value)
      ctx.fillRect(x, y, 1, 1)
    }
    ctx.globalAlpha = 1

    // 逐点绘制
    ctx.fillStyle = '#fff'
    for (const p of nodes) {
      // 近目标时轻微抖动（更像官网的颗粒感）
      const j = 0.2
      const x = p.x + (Math.random()-0.5)*j
      const y = p.y + (Math.random()-0.5)*j
      ctx.fillRect(x - ps/2, y - ps/2, ps, ps)
    }

    rafId = requestAnimationFrame(render)
  }
  rafId = requestAnimationFrame(render)
}

function drawStars() {
  const cvs = starsRef.value!
  const ctx = cvs.getContext('2d')!
  const N = 40
  const stars = Array.from({length:N}, () => ({
    x: Math.random()*W.value,
    y: Math.random()*H.value,
    r: Math.random()*1.5 + 0.5,
    w: Math.random()*2*Math.PI,
    s: 0.5 + Math.random()*0.8
  }))

  const loop = (t:number) => {
    ctx.clearRect(0,0,W.value,H.value)
    for (const st of stars) {
      const a = (Math.sin(t*0.001*st.s + st.w)*0.5 + 0.5) * 0.9
      ctx.globalAlpha = a
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(st.x, st.y, st.r, 0, Math.PI*2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    rafStars = requestAnimationFrame(loop)
  }
  rafStars = requestAnimationFrame(loop)
}

// ---------- Events ----------
function onMouseMove(e: MouseEvent) {
  const rect = canvasRef.value!.getBoundingClientRect()
  mouseX = (e.clientX - rect.left)
  mouseY = (e.clientY - rect.top)
  if (sim && sim.alpha() < 0.2) sim.alpha(0.2).restart()
}
function onMouseLeave() { mouseX = mouseY = -1e3 }

async function nextShape() {
  // shapeIdx = (shapeIdx + 1) % props.sources.length
  // await buildShape(props.sources[shapeIdx])
  shapeIdx = (shapeIdx + 1) % resolvedSources.value.length
  await buildShape(resolvedSources.value[shapeIdx])
}

// ---------- Mount ----------
onMounted(async () => {
  // 尺寸取卡片内容盒子
  const card = (canvasRef.value?.parentElement?.parentElement as HTMLElement) || document.body
  const rect = card.getBoundingClientRect()
  W.value = Math.max(800, Math.floor(rect.width))
  H.value = Math.max(520, Math.floor(rect.height))

  // init canvases
  const ctxMain  = resizeCanvas(canvasRef.value!, W.value, H.value)
  const ctxStars = resizeCanvas(starsRef.value!, W.value, H.value)
  ctxMain.imageSmoothingEnabled = false
  ctxStars.imageSmoothingEnabled = true

  // await buildShape(props.sources[shapeIdx])
  await buildShape(resolvedSources.value[shapeIdx])
  drawLoop()
  drawStars()

  // 响应式：窗口变化时重建当前形状（与官网类似是定幅，但这里做自适应）
  const onResize = async () => {
    const r = card.getBoundingClientRect()
    W.value = Math.max(800, Math.floor(r.width))
    H.value = Math.max(520, Math.floor(r.height))
    resizeCanvas(canvasRef.value!, W.value, H.value)
    resizeCanvas(starsRef.value!, W.value, H.value)
    // await buildShape(props.sources[shapeIdx])
    await buildShape(resolvedSources.value[shapeIdx])
  }
  window.addEventListener('resize', onResize)
  ;(onBeforeUnmount as any)(() => window.removeEventListener('resize', onResize))
})

onBeforeUnmount(() => {
  if (sim) sim.stop()
  if (rafId) cancelAnimationFrame(rafId)
  if (rafStars) cancelAnimationFrame(rafStars)
})
</script>

<style scoped>
.ark-wrap {
  position: relative;
  width: 100%;
  min-height: 1560px;
  background: #000;
  overflow: hidden;
}

/* 背景菱形网格（两组对角重复渐变叠加） */
.ark-grid {
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient( 45deg, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, transparent 1px, transparent 40px),
    repeating-linear-gradient(-45deg, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, transparent 1px, transparent 40px);
  pointer-events: none;
  mix-blend-mode: screen;
}

/* 星点与主层分层，减轻 overdraw */
.ark-stars, .ark-main {
  position: absolute; inset: 0;
  display: block;
}

.ark-next {
  position: absolute; right: 14px; top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none; color: rgba(255,255,255,.45);
  font-size: 46px; line-height: 1; cursor: pointer;
  transition: color .2s ease;
}
.ark-next:hover { color: #fff; }
</style>

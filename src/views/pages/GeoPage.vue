<template>
  <v-app>
    <v-main class="bg-grey-lighten-5">
      <div class="pa-4">

        <v-row dense>
          <v-col cols="12" lg="6">
            <v-card height="420" elevation="2">
              <v-card-title>Step 1: 绘制第一张世界地图</v-card-title>
              <v-card-subtitle>获取 GeoJSON → 创建投影 → 使用路径生成器绘制</v-card-subtitle>
              <v-card-text>
                <svg ref="step1Ref" width="100%" height="320" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" lg="6">
            <v-card height="420" elevation="2">
              <v-card-title>Step 2: 添加标记 (点、线、圆)</v-card-title>
              <v-card-subtitle>路径生成器可绘制任意 GeoJSON 几何体</v-card-subtitle>
              <v-card-text>
                <svg ref="step2Ref" width="100%" height="320" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row dense class="mt-4">
          <v-col cols="12" lg="6">
            <v-card height="420" elevation="2">
              <v-card-title>Step 3: 交互式地球仪</v-card-title>
              <v-card-subtitle>Orthographic 投影 + 拖拽旋转交互</v-card-subtitle>
              <v-card-text>
                <svg ref="step3Ref" width="100%" height="320" class="demo-svg globe-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" lg="6">
            <v-card height="420" elevation="2">
              <v-card-title>空位（扩展 Demo）</v-card-title>
              <v-card-subtitle>后续可放 Mapbox 联动或交互模块</v-card-subtitle>
              <v-card-text class="d-flex align-center justify-center text-medium-emphasis fill-height">
                <span>— 保留占位 —</span>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="12">
            <v-card height="600" elevation="2">
              <v-card-title>Step 4: 投影的画廊</v-card-title>
              <v-card-subtitle>不同的投影 "镜头" 会如何扭曲地球？</v-card-subtitle>
              <v-card-text>
                <svg ref="step4Ref" width="100%" height="500" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="12">
            <v-card height="600" elevation="2">
              <v-card-title>Step 5: 交互式投影控制器</v-card-title>
              <v-card-subtitle>实时调整镜头的 "对焦点"、"旋转" 和 "焦距"</v-card-subtitle>
              <v-card-text>
                <svg ref="step5Ref" width="100%" height="400" class="demo-svg mb-2"></svg>
                <v-row dense>
                  <v-col cols="6" md="3">
                    <v-slider v-model="lon" label="中心经度" min="-180" max="180" thumb-label dense hide-details />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-slider v-model="lat" label="中心纬度" min="-90" max="90" thumb-label dense hide-details />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-slider v-model="scale" label="缩放" min="50" max="1000" thumb-label dense hide-details />
                  </v-col>
                  <v-col cols="6" md="3">
                    <v-slider v-model="yaw" label="旋转(Yaw)" min="-180" max="180" thumb-label dense hide-details />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" lg="6">
            <v-card height="420" elevation="2">
              <v-card-title>Step 7: 定制球面形状</v-card-title>
              <v-card-subtitle>使用 d3.geoGraticule 和 d3.geoCircle</v-card-subtitle>
              <v-card-text>
                <svg ref="step7Ref" width="100%" height="320" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" lg="6">
            <v-card height="420" elevation="2">
              <v-card-title>Step 8: 交互式地理计算</v-card-title>
              <v-card-subtitle>单击查询国家，双击计算距离</v-card-subtitle>
              <v-card-text>
                <div class="text-caption mb-1">
                  <span>点击位置: <strong class="text-primary">{{ clickedCountry }}</strong></span>
                  <span class="ml-4">距离: <strong class="text-primary">{{ greatArcDistance }}</strong></span>
                </div>
                <svg ref="step8Ref" width="100%" height="290" class="demo-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card height="600" elevation="2">
              <v-card-title>Step 9: 球面动画 (geoInterpolate)</v-card-title>
              <v-card-subtitle>模拟从旧金山到东京的飞行轨迹</v-card-subtitle>
              <v-card-text>
                <svg ref="step9Ref" width="100%" height="500" class="demo-svg globe-svg"></svg>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { feature } from 'topojson-client'
import type { Topology } from 'topojson-specification'
import type { FeatureCollection, Feature as GeoFeature, Geometry, LineString, Point } from 'geojson'

// ---------------------- 小工具：尺寸与类型 ----------------------
function getSvgSize(el: SVGSVGElement, fallbackH = 300) {
  // 优先 DOMRect，必要时回退到父元素宽度与 <svg height="…">
  const rect = el.getBoundingClientRect()
  let width = Math.round(rect.width)
  let height = Math.round(rect.height)
  if (!width) width = el.parentElement?.clientWidth ?? 0
  if (!height) height = Number(el.getAttribute('height')) || fallbackH
  return { width, height }
}

// 封装：明确 countries 返回 FeatureCollection、land 返回 Feature
function toFeatureCollection(topo: Topology, obj: any) {
  return feature(topo, obj) as unknown as FeatureCollection<Geometry>
}
function toFeature(topo: Topology, obj: any) {
  return feature(topo, obj) as unknown as GeoFeature<Geometry>
}

// ---------------------- Refs & 状态 ----------------------
const step1Ref = ref<SVGSVGElement | null>(null)
const step2Ref = ref<SVGSVGElement | null>(null)
const step3Ref = ref<SVGSVGElement | null>(null)
const step4Ref = ref<SVGSVGElement | null>(null)
const step5Ref = ref<SVGSVGElement | null>(null)
const step7Ref = ref<SVGSVGElement | null>(null)
const step8Ref = ref<SVGSVGElement | null>(null)
const step9Ref = ref<SVGSVGElement | null>(null)

const lon = ref(0)
const lat = ref(0)
const scale = ref(120)
const yaw = ref(0)

const clickedCountry = ref('N/A')
const greatArcDistance = ref('N/A')

const worldAtlasUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json' // 含 countries + land + properties.name
// 说明：world-atlas 的 countries-110m.json/50m/10m 均含 countries & land 两个对象。:contentReference[oaicite:3]{index=3}

const resizeObservers = new Map<SVGSVGElement, ResizeObserver>()

function observeAndRedraw(el: SVGSVGElement, draw: () => void) {
  // 先断开该元素之前的 observer
  const oldObs = resizeObservers.get(el)
  if (oldObs) oldObs.disconnect()
  
  // 创建新的 observer
  const newObs = new ResizeObserver(() => draw())
  newObs.observe(el)
  resizeObservers.set(el, newObs)
}
// function observeAndRedraw(el: SVGSVGElement, draw: () => void) {
//   if (resizeObs) resizeObs.disconnect()
//   resizeObs = new ResizeObserver(() => draw())
//   resizeObs.observe(el)
// }

// ---------------------- 渲染步骤 ----------------------
async function renderStep1() {
  if (!step1Ref.value) return
  const svg = d3.select(step1Ref.value)
  svg.selectAll('*').remove()
  const { width, height } = getSvgSize(step1Ref.value, 320)

  const world = await d3.json<Topology>(worldAtlasUrl)
  if (!world) return
  const countries = toFeatureCollection(world, world.objects.countries)

  const projection = d3.geoMercator().fitSize([width, height], { type: 'Sphere' } as any)
  const path = d3.geoPath(projection)

  svg.append('g')
    .selectAll('path')
    .data(countries.features)
    .join('path')
    .attr('d', path)
    .attr('fill', '#ccc')
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)
}

async function renderStep2() {
  if (!step2Ref.value) return
  const svg = d3.select(step2Ref.value)
  svg.selectAll('*').remove()
  const { width, height } = getSvgSize(step2Ref.value, 320)

  const world = await d3.json<Topology>(worldAtlasUrl)
  if (!world) return
  const countries = toFeatureCollection(world, world.objects.countries)

  const projection = d3.geoMercator().fitSize([width, height], { type: 'Sphere' } as any)
  const path = d3.geoPath(projection)

  svg.append('g')
    .selectAll('path')
    .data(countries.features)
    .join('path')
    .attr('d', path)
    .attr('fill', '#e0e0e0')
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)

  const beijing: Point = { type: 'Point', coordinates: [116.40, 39.90] }
  const tokyo: Point = { type: 'Point', coordinates: [139.69, 35.68] }
  const newYork: Point = { type: 'Point', coordinates: [-74.0, 40.71] }
  const flightPath: LineString = { type: 'LineString', coordinates: [beijing.coordinates, newYork.coordinates] }

  svg.append('path')
    .datum(flightPath)
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', 'steelblue')
    .attr('stroke-width', 2)

  const circle = d3.geoCircle().center(tokyo.coordinates).radius(15)
  svg.append('path')
    .datum(circle())
    .attr('d', path)
    .attr('fill', 'rgba(113,88,226,0.2)')
    .attr('stroke', 'purple')

  svg.append('g')
    .selectAll('circle')
    .data([beijing, tokyo, newYork])
    .join('circle')
    .attr('cx', d => projection(d.coordinates)![0])
    .attr('cy', d => projection(d.coordinates)![1])
    .attr('r', 4)
    .attr('fill', 'orangered')
    .attr('stroke', 'white')
}

async function renderStep3() {
  if (!step3Ref.value) return
  const svg = d3.select(step3Ref.value)
  svg.selectAll('*').remove()
  const { width, height } = getSvgSize(step3Ref.value, 320)

  const world = await d3.json<Topology>(worldAtlasUrl)
  if (!world) return
  const countries = toFeatureCollection(world, world.objects.countries)

  const projection = d3.geoOrthographic()
    .fitSize([width, height], { type: 'Sphere' } as any)
    .rotate([0, 0, 0])
  const path = d3.geoPath(projection)

  const sphere = svg.append('path').datum({ type: 'Sphere' } as any)
    .attr('d', path).attr('fill', '#a0d1f0').attr('stroke', '#ccc')

  const graticule = svg.append('path').datum(d3.geoGraticule10())
    .attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(128,128,128,0.5)').attr('stroke-width', 0.5)

  const countryPaths = svg.append('g')
    .selectAll('path')
    .data(countries.features)
    .join('path')
    .attr('d', path)
    .attr('fill', '#4caf50')
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)

  const drag = d3.drag<SVGSVGElement, unknown>()
    .on('drag', (event) => {
      const r = projection.rotate()
      const s = 0.25
      projection.rotate([r[0] + event.dx * s, r[1] - event.dy * s, r[2]])
      sphere.attr('d', path); graticule.attr('d', path); countryPaths.attr('d', path)
    })
  svg.call(drag)
}

async function renderStep4() {
  if (!step4Ref.value) return
  const svg = d3.select(step4Ref.value)
  svg.selectAll('*').remove()
  const { width, height } = getSvgSize(step4Ref.value, 500)

  const world = await d3.json<Topology>(worldAtlasUrl)
  if (!world) return
  const countries = toFeatureCollection(world, world.objects.countries)

  const projections = [
    { name: '墨卡托 (Mercator)', projection: d3.geoMercator() },
    { name: '自然地球 (Natural Earth)', projection: d3.geoNaturalEarth1() },
    { name: '等面积圆锥 (Conic Equal Area)', projection: d3.geoConicEqualArea() },
    { name: '球体 (Orthographic)', projection: d3.geoOrthographic() },
  ]

  const smallW = width / projections.length
  const smallH = height

  const groups = svg.selectAll('g').data(projections).join('g')
    .attr('transform', (_, i) => `translate(${i * smallW},0)`)

  groups.each(function(p) {
    const g = d3.select(this)
    p.projection.fitSize([smallW - 10, smallH - 40], countries as any)
    const path = d3.geoPath(p.projection)
    g.selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('d', path)
      .attr('fill', '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
    g.append('text')
      .attr('x', smallW / 2).attr('y', smallH - 15)
      .attr('text-anchor', 'middle').attr('font-size', '12px')
      .text(p.name)
  })
}

async function renderStep5() {
  if (!step5Ref.value) return
  const svg = d3.select(step5Ref.value)
  const { width, height } = getSvgSize(step5Ref.value, 400)

  const world = await d3.json<Topology>(worldAtlasUrl)
  if (!world) return
  const countries = toFeatureCollection(world, world.objects.countries)

  const redraw = () => {
    svg.selectAll('*').remove()
    const projection = d3.geoMercator()
      .scale(scale.value)
      .center([lon.value, lat.value])
      .rotate([yaw.value, 0, 0])
      .translate([width / 2, height / 2])
    const path = d3.geoPath(projection)
    svg.append('g').selectAll('path').data(countries.features).join('path')
      .attr('d', path).attr('fill', '#777').attr('stroke', '#fff').attr('stroke-width', 0.5)
  }
  watch([lon, lat, scale, yaw], redraw)
  redraw()
}

async function renderStep7() {
  if (!step7Ref.value) return
  const svg = d3.select(step7Ref.value)
  svg.selectAll('*').remove()
  const { width, height } = getSvgSize(step7Ref.value, 320)

  const projection = d3.geoAzimuthalEqualArea()
    .fitSize([width, height], { type: 'Sphere' } as any)
    .rotate([-10, -52, 0])
  const path = d3.geoPath(projection)

  const world = await d3.json<Topology>(worldAtlasUrl)
  if (!world) return
  const land = toFeature(world, world.objects.land) // ✅ land 是 Feature
  svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', '#a0d1f0')
  svg.append('path').datum(land).attr('d', path).attr('fill', '#ccc')

  const graticule = d3.geoGraticule().stepMinor([5,5]).stepMajor([20,20])
  svg.append('path').datum(graticule.minor()).attr('d', path)
    .attr('fill', 'none').attr('stroke', '#fff').attr('stroke-opacity', 0.5)
  svg.append('path').datum(graticule.major()).attr('d', path)
    .attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', 1.5)

  const rome: [number, number] = [12.49, 41.90]
  const circle = d3.geoCircle().center(rome).radius(25)
  svg.append('path').datum(circle()).attr('d', path)
    .attr('fill', 'rgba(255, 87, 34, 0.4)').attr('stroke', 'orangered')
}

async function renderStep8() {
  if (!step8Ref.value) return
  const svg = d3.select(step8Ref.value)

  const draw = async () => {
    const { width, height } = getSvgSize(step8Ref.value!, 290)
    if (!width) { 
      await nextTick()
      requestAnimationFrame(draw)
      return
    }

    svg.selectAll('*').remove()
    const world = await d3.json<Topology>(worldAtlasUrl)
    if (!world) return
    const countries = toFeatureCollection(world, world.objects.countries)

    const projection = d3.geoMercator().fitSize([width, height], { type: 'Sphere' } as any)
    const path = d3.geoPath(projection)

    svg.append('g').selectAll('path').data(countries.features).join('path')
      .attr('d', path).attr('fill', '#ccc').attr('stroke', '#fff').attr('stroke-width', 0.5)

    let distancePoints: [number, number][] = []

    svg.on('click', (event) => {
      const [x, y] = d3.pointer(event, svg.node() as any)
      const [lon, lat] = projection.invert([x, y])!
      const f = countries.features.find(ft => d3.geoContains(ft as any, [lon, lat]))
      clickedCountry.value = (f?.properties as any)?.name ?? String((f as any)?.id ?? '海洋')
    })

    svg.on('dblclick', (event) => {
      const [x, y] = d3.pointer(event, svg.node() as any)
      const [lon, lat] = projection.invert([x, y])!
      distancePoints.push([lon, lat])

      svg.selectAll('.marker-point').data(distancePoints)
        .join('circle')
        .attr('class', 'marker-point')
        .attr('cx', d => projection(d)![0])
        .attr('cy', d => projection(d)![1])
        .attr('r', 4).attr('fill', 'orangered')

      if (distancePoints.length === 2) {
        svg.selectAll('.marker-line').remove()
        const rad = d3.geoDistance(distancePoints[0], distancePoints[1])
        const km = rad * 6371
        greatArcDistance.value = `${km.toFixed(0)} km`

        const line: LineString = { type: 'LineString', coordinates: distancePoints }
        svg.append('path').datum(line)
          .attr('class', 'marker-line').attr('d', path)
          .attr('fill', 'none').attr('stroke', 'orangered').attr('stroke-width', 2)

        distancePoints = []
        svg.selectAll('.marker-point').remove()
      }
    })
  }
  
  await draw()
  observeAndRedraw(step8Ref.value, draw)
}
let step9Timer: d3.Timer | null = null

async function renderStep9() {
  if (!step9Ref.value) return
  const svg = d3.select(step9Ref.value)

  const draw = async () => {
    const { width, height } = getSvgSize(step9Ref.value!, 500)
    if (!width) {
      await nextTick()
      requestAnimationFrame(draw)
      return
    }

    // 清理旧的 timer
    if (step9Timer) step9Timer.stop()
    
    svg.selectAll('*').remove()
    const projection = d3.geoOrthographic().fitSize([width, height], { type: 'Sphere' } as any)
    const path = d3.geoPath(projection)

    const world = await d3.json<Topology>(worldAtlasUrl)
    if (!world) return
    const land = toFeature(world, world.objects.land)

    const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('d', path).attr('fill', '#a0d1f0')
    const landPath = svg.append('path').datum(land).attr('d', path).attr('fill', '#ccc')

    const sanFrancisco: [number, number] = [-122.4, 37.7]
    const tokyo: [number, number] = [139.7, 35.7]
    const route: LineString = { type: 'LineString', coordinates: [sanFrancisco, tokyo] }
    const routePath = svg.append('path').datum(route)
      .attr('d', path).attr('fill', 'none').attr('stroke', 'rgba(255,255,255,0.5)').attr('stroke-width', 1.5)

    const plane = svg.append('path')
      .attr('d', 'M0,-5L5,5L0,2L-5,5Z')
      .attr('fill', 'orangered')
      .style('pointer-events', 'none')

    const interpolate = d3.geoInterpolate(sanFrancisco, tokyo)
    const duration = 10000
    
    step9Timer = d3.timer((elapsed) => {
      const t = (elapsed % duration) / duration
      const pos = interpolate(t)
      projection.rotate([-pos[0], -pos[1]])
      sphere.attr('d', path)
      landPath.attr('d', path)
      routePath.attr('d', path)
      const [x, y] = projection(pos)!
      plane.attr('transform', `translate(${x},${y}) rotate(${projection.rotate()[0]})`)
    })
  }
  
  await draw()
  observeAndRedraw(step9Ref.value, draw)
}
onMounted(async () => {
  await nextTick()
  await renderStep1()
  await renderStep2()
  await renderStep3()
  await renderStep4()
  await renderStep5()

  await renderStep8()
  await renderStep9()
    await renderStep7()
})

onBeforeUnmount(() => {
  resizeObservers.forEach(obs => obs.disconnect())
  resizeObservers.clear()
  if (step9Timer) step9Timer.stop()
})
</script>

<style scoped>
.demo-svg {
  background-color: white;
  border-radius: 4px;
  display: block;
}
.globe-svg {
  cursor: move;
}
</style>

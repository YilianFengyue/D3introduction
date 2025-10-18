<template>
  <v-app>
    <!-- 主容器 -->
    <v-container fluid class="pa-0 fill-height">
      <!-- 地图容器 -->
      <div id="map" ref="mapContainer" class="map-container"></div>

      <!-- 控制面板 -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
        location="left"
        class="elevation-4"
      >
        <v-list-item
          prepend-icon="mdi-map-legend"
          title="建筑地图控制"
          subtitle="Architecture Map Control"
        >
          <template v-slot:append>
            <v-btn
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item>

        <v-divider></v-divider>

        <v-list density="compact" nav>
          <!-- 地图样式选择 -->
          <v-list-group value="style">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-palette"
                title="地图样式"
              ></v-list-item>
            </template>

            <v-list-item
              v-for="style in mapStyles"
              :key="style.id"
              :title="style.name"
              @click="changeMapStyle(style.id)"
              :active="currentStyle === style.id"
            >
              <template v-slot:prepend>
                <v-icon size="small">mdi-map</v-icon>
              </template>
            </v-list-item>
          </v-list-group>

          <!-- 图层控制 -->
          <v-list-group value="layers">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-layers"
                title="图层控制"
              ></v-list-item>
            </template>

            <v-list-item>
              <v-switch
                v-model="layers.buildings3D"
                label="3D建筑"
                color="primary"
                density="compact"
                hide-details
                @update:model-value="toggle3DBuildings"
              ></v-switch>
            </v-list-item>

            <v-list-item>
              <v-switch
                v-model="layers.greenSpace"
                label="绿地"
                color="green"
                density="compact"
                hide-details
                @update:model-value="toggleGreenSpace"
              ></v-switch>
            </v-list-item>

            <v-list-item>
              <v-switch
                v-model="layers.water"
                label="水体"
                color="blue"
                density="compact"
                hide-details
                @update:model-value="toggleWater"
              ></v-switch>
            </v-list-item>

            <v-list-item>
              <v-switch
                v-model="layers.roads"
                label="路网"
                color="orange"
                density="compact"
                hide-details
                @update:model-value="toggleRoads"
              ></v-switch>
            </v-list-item>

            <v-list-item>
              <v-switch
                v-model="layers.labels"
                label="标注"
                color="purple"
                density="compact"
                hide-details
                @update:model-value="toggleLabels"
              ></v-switch>
            </v-list-item>
          </v-list-group>

          <!-- 配色方案 -->
          <v-list-group value="colors">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-palette-advanced"
                title="配色方案"
              ></v-list-item>
            </template>

            <v-list-item>
              <v-select
                v-model="colorScheme"
                :items="colorSchemes"
                label="选择配色"
                density="compact"
                hide-details
                @update:model-value="applyColorScheme"
              ></v-select>
            </v-list-item>

            <v-list-item>
              <v-color-picker
                v-model="customColors.building"
                label="建筑颜色"
                mode="hex"
                hide-details
                density="compact"
                @update:model-value="updateBuildingColor"
              ></v-color-picker>
            </v-list-item>
          </v-list-group>

          <!-- 视觉效果 -->
          <v-list-group value="effects">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                prepend-icon="mdi-tune"
                title="视觉效果"
              ></v-list-item>
            </template>

            <v-list-item>
              <v-slider
                v-model="opacity.buildings"
                label="建筑透明度"
                :min="0"
                :max="1"
                :step="0.1"
                thumb-label
                hide-details
                @update:model-value="updateBuildingOpacity"
              ></v-slider>
            </v-list-item>

            <v-list-item>
              <v-slider
                v-model="buildingHeight"
                label="建筑高度系数"
                :min="0.5"
                :max="3"
                :step="0.1"
                thumb-label
                hide-details
                @update:model-value="updateBuildingHeight"
              ></v-slider>
            </v-list-item>

            <v-list-item>
              <v-switch
                v-model="effects.shadows"
                label="阴影效果"
                color="grey"
                density="compact"
                hide-details
                @update:model-value="toggleShadows"
              ></v-switch>
            </v-list-item>

            <v-list-item>
              <v-switch
                v-model="effects.texture"
                label="纹理叠加"
                color="brown"
                density="compact"
                hide-details
                @update:model-value="toggleTexture"
              ></v-switch>
            </v-list-item>
          </v-list-group>
        </v-list>

        <template v-slot:append>
          <v-divider></v-divider>
          <div class="pa-2">
            <v-btn
              block
              color="primary"
              variant="tonal"
              @click="exportMap"
              prepend-icon="mdi-download"
            >
              导出地图
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- 工具栏 -->
      <v-app-bar
        color="transparent"
        flat
        class="toolbar-overlay"
        height="48"
      >
        <v-spacer></v-spacer>

        <v-btn-toggle
          v-model="viewMode"
          mandatory
          color="primary"
          class="mr-4"
        >
          <v-btn icon="mdi-earth" value="globe"></v-btn>
          <v-btn icon="mdi-map" value="map"></v-btn>
        </v-btn-toggle>

        <v-btn
          icon="mdi-crosshairs-gps"
          @click="resetView"
          class="mr-2"
        ></v-btn>

        <v-btn
          icon="mdi-fullscreen"
          @click="toggleFullscreen"
        ></v-btn>
      </v-app-bar>

      <!-- 信息面板 -->
      <v-card
        v-if="selectedFeature"
        class="info-panel"
        elevation="8"
        max-width="320"
      >
        <v-card-title>
          <v-icon class="mr-2">mdi-office-building</v-icon>
          建筑信息
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-list density="compact">
            <v-list-item
              v-for="(value, key) in selectedFeature.properties"
              :key="key"
            >
              <v-list-item-title>{{ key }}</v-list-item-title>
              <v-list-item-subtitle>{{ value }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text="关闭"
            @click="selectedFeature = null"
          ></v-btn>
        </v-card-actions>
      </v-card>

      <!-- 加载提示 -->
      <v-overlay
        v-model="loading"
        persistent
        class="align-center justify-center"
      >
        <v-progress-circular
          indeterminate
          size="64"
          color="primary"
        ></v-progress-circular>
        <div class="text-center mt-4">加载地图中...</div>
      </v-overlay>

      <!-- 比例尺 -->
      <div id="scale-control" class="scale-control"></div>

      <!-- 统计图表 -->
      <v-card
        v-if="showStats"
        class="stats-panel"
        elevation="8"
        max-width="400"
      >
        <v-card-title>
          <v-icon class="mr-2">mdi-chart-bar</v-icon>
          区域统计
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            size="small"
            variant="text"
            @click="showStats = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <div id="d3-chart" style="height: 300px;"></div>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- 快捷键提示 -->
    <v-snackbar
      v-model="snackbar"
      :timeout="3000"
      color="info"
    >
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="snackbar = false"
        >
          关闭
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import mapboxgl from 'mapbox-gl'
import * as d3 from 'd3'
import 'mapbox-gl/dist/mapbox-gl.css'

// Mapbox Token - 替换为你的token
const MAPBOX_TOKEN = 'pk.eyJ1IjoiZ3Vjd3Z6ZnEiLCJhIjoiY21mdXd2NmxlMDFlNjJpcHBqZTduNTZ2YiJ9.MqM1NGDWTacT9FsCaV4bhg'

// 响应式数据
const mapContainer = ref(null)
const map = ref(null)
const drawer = ref(true)
const rail = ref(false)
const loading = ref(true)
const snackbar = ref(false)
const snackbarText = ref('')
const selectedFeature = ref(null)
const showStats = ref(false)
const viewMode = ref('map')

// 地图样式配置
const mapStyles = [
  { id: 'satellite', name: '卫星地图', url: 'mapbox://styles/mapbox/satellite-v9' },
  { id: 'streets', name: '街道地图', url: 'mapbox://styles/mapbox/streets-v12' },
  { id: 'light', name: '浅色地图', url: 'mapbox://styles/mapbox/light-v11' },
  { id: 'dark', name: '深色地图', url: 'mapbox://styles/mapbox/dark-v11' },
  { id: 'outdoors', name: '户外地图', url: 'mapbox://styles/mapbox/outdoors-v12' },
]

const currentStyle = ref('light')

// 图层控制
const layers = ref({
  buildings3D: true,
  greenSpace: true,
  water: true,
  roads: true,
  labels: true,
})

// 配色方案
const colorSchemes = [
  '默认配色',
  '建筑风格',
  '生态绿色',
  '科技蓝调',
  '暖色调',
  '黑白简约',
]

const colorScheme = ref('默认配色')

// 自定义颜色
const customColors = ref({
  building: '#B0BEC5',
  green: '#66BB6A',
  water: '#42A5F5',
  road: '#FFB74D',
})

// 透明度控制
const opacity = ref({
  buildings: 0.8,
  green: 0.6,
  water: 0.7,
})

// 建筑高度系数
const buildingHeight = ref(1)

// 效果控制
const effects = ref({
  shadows: true,
  texture: false,
})

// 配色方案配置
const colorSchemesConfig = {
  '默认配色': {
    building: '#B0BEC5',
    buildingHighlight: '#78909C',
    green: '#66BB6A',
    water: '#42A5F5',
    road: '#FFB74D',
  },
  '建筑风格': {
    building: '#8D6E63',
    buildingHighlight: '#6D4C41',
    green: '#81C784',
    water: '#64B5F6',
    road: '#A1887F',
  },
  '生态绿色': {
    building: '#90A4AE',
    buildingHighlight: '#607D8B',
    green: '#4CAF50',
    water: '#00ACC1',
    road: '#AED581',
  },
  '科技蓝调': {
    building: '#546E7A',
    buildingHighlight: '#37474F',
    green: '#26A69A',
    water: '#0288D1',
    road: '#5C6BC0',
  },
  '暖色调': {
    building: '#FFAB91',
    buildingHighlight: '#FF8A65',
    green: '#A5D6A7',
    water: '#80DEEA',
    road: '#FFCC80',
  },
  '黑白简约': {
    building: '#9E9E9E',
    buildingHighlight: '#616161',
    green: '#E0E0E0',
    water: '#BDBDBD',
    road: '#757575',
  },
}

// 初始化地图
const initMap = () => {
  mapboxgl.accessToken = MAPBOX_TOKEN

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/light-v11',
    center: [121.4737, 31.2304], // 上海坐标
    zoom: 15,
    pitch: 45,
    bearing: -17.6,
    antialias: true,
  })

  // 添加导航控件
  map.value.addControl(new mapboxgl.NavigationControl(), 'top-right')

  // 添加比例尺
  const scale = new mapboxgl.ScaleControl({
    maxWidth: 200,
    unit: 'metric',
  })
  map.value.addControl(scale, 'bottom-right')

  // 地图加载完成
  map.value.on('load', () => {
    loading.value = false

    // 添加3D建筑图层
    add3DBuildings()

    // 添加自定义图层
    addCustomLayers()

    // 设置光照
    setupLighting()

    // 添加交互
    setupInteractions()

    // 初始化D3可视化
    initD3Visualization()

    showSnackbar('地图加载完成')
  })
}

// 添加3D建筑
const add3DBuildings = () => {
  // 添加3D建筑图层
  const layers = map.value.getStyle().layers

  let labelLayerId
  for (let i = 0; i < layers.length; i++) {
    if (layers[i].type === 'symbol' && layers[i].layout['text-field']) {
      labelLayerId = layers[i].id
      break
    }
  }

  map.value.addLayer({
    'id': '3d-buildings',
    'source': 'composite',
    'source-layer': 'building',
    'filter': ['==', 'extrude', 'true'],
    'type': 'fill-extrusion',
    'minzoom': 15,
    'paint': {
      'fill-extrusion-color': [
        'interpolate',
        ['linear'],
        ['get', 'height'],
        0, customColors.value.building,
        200, '#78909C'
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, 0,
        15.05, ['*', ['get', 'height'], buildingHeight.value]
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': opacity.value.buildings,
    }
  }, labelLayerId)
}

// 添加自定义图层
const addCustomLayers = () => {
  // 绿地图层
  if (!map.value.getSource('green-space')) {
    map.value.addSource('green-space', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    })

    map.value.addLayer({
      id: 'green-space-layer',
      type: 'fill',
      source: 'green-space',
      paint: {
        'fill-color': customColors.value.green,
        'fill-opacity': opacity.value.green,
      }
    })
  }

  // 水体图层样式调整
  const waterLayers = ['water', 'waterway']
  waterLayers.forEach(layerId => {
    if (map.value.getLayer(layerId)) {
      map.value.setPaintProperty(layerId, 'fill-color', customColors.value.water)
      map.value.setPaintProperty(layerId, 'fill-opacity', opacity.value.water)
    }
  })
}

// 设置光照
const setupLighting = () => {
  // 设置光照和阴影
  map.value.setLight({
    'anchor': 'viewport',
    'color': 'white',
    'intensity': 0.4,
    'position': [1.15, 210, 30],
  })

  // 添加雾效
  map.value.setFog({
    'color': 'rgb(220, 220, 230)',
    'high-color': 'rgb(245, 245, 255)',
    'horizon-blend': 0.02,
    'space-color': 'rgb(220, 220, 230)',
    'star-intensity': 0.0
  })
}

// 设置交互
const setupInteractions = () => {
  // 鼠标悬停效果
  map.value.on('mousemove', '3d-buildings', (e) => {
    map.value.getCanvas().style.cursor = 'pointer'

    // 高亮建筑
    if (e.features.length > 0) {
      const feature = e.features[0]

      // 创建弹出提示
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      })

      popup.setLngLat(e.lngLat)
        .setHTML(`<div class="popup-content">
          <strong>建筑高度:</strong> ${feature.properties.height || 'N/A'}m<br>
          <strong>建筑层数:</strong> ${Math.floor((feature.properties.height || 0) / 3)}层
        </div>`)
        .addTo(map.value)
    }
  })

  map.value.on('mouseleave', '3d-buildings', () => {
    map.value.getCanvas().style.cursor = ''
    // 移除所有弹出框
    const popups = document.getElementsByClassName('mapboxgl-popup')
    for (let popup of popups) {
      popup.remove()
    }
  })

  // 点击建筑显示信息
  map.value.on('click', '3d-buildings', (e) => {
    if (e.features.length > 0) {
      selectedFeature.value = e.features[0]
    }
  })
}

// 初始化D3可视化
const initD3Visualization = () => {
  // 创建D3图表容器
  const chartContainer = d3.select('#d3-chart')

  if (chartContainer.empty()) return

  // 示例数据
  const data = [
    { category: '住宅', value: 45 },
    { category: '商业', value: 25 },
    { category: '办公', value: 20 },
    { category: '其他', value: 10 },
  ]

  const margin = { top: 20, right: 20, bottom: 40, left: 60 }
  const width = 360 - margin.left - margin.right
  const height = 300 - margin.top - margin.bottom

  // 清空容器
  chartContainer.selectAll('*').remove()

  const svg = chartContainer
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // 创建比例尺
  const x = d3.scaleBand()
    .range([0, width])
    .domain(data.map(d => d.category))
    .padding(0.1)

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.value)])
    .range([height, 0])

  // 添加条形图
  svg.selectAll('.bar')
    .data(data)
    .enter().append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.category))
    .attr('width', x.bandwidth())
    .attr('y', d => y(d.value))
    .attr('height', d => height - y(d.value))
    .attr('fill', '#1976D2')

  // 添加X轴
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))

  // 添加Y轴
  svg.append('g')
    .call(d3.axisLeft(y))

  // 添加标题
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 0 - (margin.top / 2))
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .text('建筑类型分布')
}

// 切换地图样式
const changeMapStyle = (styleId) => {
  const style = mapStyles.find(s => s.id === styleId)
  if (style && map.value) {
    currentStyle.value = styleId
    map.value.setStyle(style.url)

    // 重新添加自定义图层
    map.value.once('style.load', () => {
      add3DBuildings()
      addCustomLayers()
      setupLighting()
    })

    showSnackbar(`切换到${style.name}`)
  }
}

// 应用配色方案
const applyColorScheme = (scheme) => {
  const colors = colorSchemesConfig[scheme]
  if (colors && map.value) {
    customColors.value = { ...colors }

    // 更新建筑颜色
    if (map.value.getLayer('3d-buildings')) {
      map.value.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['get', 'height'],
        0, colors.building,
        200, colors.buildingHighlight
      ])
    }

    // 更新其他图层颜色
    updateLayerColors()

    showSnackbar(`应用${scheme}`)
  }
}

// 更新图层颜色
const updateLayerColors = () => {
  if (!map.value) return

  // 更新绿地颜色
  if (map.value.getLayer('green-space-layer')) {
    map.value.setPaintProperty('green-space-layer', 'fill-color', customColors.value.green)
  }

  // 更新水体颜色
  const waterLayers = ['water', 'waterway']
  waterLayers.forEach(layerId => {
    if (map.value.getLayer(layerId)) {
      map.value.setPaintProperty(layerId, 'fill-color', customColors.value.water)
    }
  })
}

// 切换3D建筑
const toggle3DBuildings = (value) => {
  if (map.value && map.value.getLayer('3d-buildings')) {
    map.value.setLayoutProperty(
      '3d-buildings',
      'visibility',
      value ? 'visible' : 'none'
    )
  }
}

// 切换绿地
const toggleGreenSpace = (value) => {
  if (map.value && map.value.getLayer('green-space-layer')) {
    map.value.setLayoutProperty(
      'green-space-layer',
      'visibility',
      value ? 'visible' : 'none'
    )
  }
}

// 切换水体
const toggleWater = (value) => {
  const waterLayers = ['water', 'waterway']
  waterLayers.forEach(layerId => {
    if (map.value && map.value.getLayer(layerId)) {
      map.value.setLayoutProperty(
        layerId,
        'visibility',
        value ? 'visible' : 'none'
      )
    }
  })
}

// 切换路网
const toggleRoads = (value) => {
  const roadLayers = map.value.getStyle().layers.filter(
    layer => layer.id.includes('road') || layer.id.includes('street')
  )

  roadLayers.forEach(layer => {
    map.value.setLayoutProperty(
      layer.id,
      'visibility',
      value ? 'visible' : 'none'
    )
  })
}

// 切换标注
const toggleLabels = (value) => {
  const labelLayers = map.value.getStyle().layers.filter(
    layer => layer.type === 'symbol'
  )

  labelLayers.forEach(layer => {
    map.value.setLayoutProperty(
      layer.id,
      'visibility',
      value ? 'visible' : 'none'
    )
  })
}

// 更新建筑颜色
const updateBuildingColor = (color) => {
  if (map.value && map.value.getLayer('3d-buildings')) {
    map.value.setPaintProperty('3d-buildings', 'fill-extrusion-color', color)
  }
}

// 更新建筑透明度
const updateBuildingOpacity = (value) => {
  if (map.value && map.value.getLayer('3d-buildings')) {
    map.value.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', value)
  }
}

// 更新建筑高度
const updateBuildingHeight = (value) => {
  if (map.value && map.value.getLayer('3d-buildings')) {
    map.value.setPaintProperty('3d-buildings', 'fill-extrusion-height', [
      'interpolate',
      ['linear'],
      ['zoom'],
      15, 0,
      15.05, ['*', ['get', 'height'], value]
    ])
  }
}

// 切换阴影
const toggleShadows = (value) => {
  if (map.value) {
    map.value.setLight({
      'anchor': 'viewport',
      'color': 'white',
      'intensity': value ? 0.4 : 0.1,
      'position': [1.15, 210, 30],
    })
  }
}

// 切换纹理
const toggleTexture = (value) => {
  // 这里可以添加纹理叠加的逻辑
  showSnackbar(value ? '纹理效果已开启' : '纹理效果已关闭')
}

// 重置视图
const resetView = () => {
  if (map.value) {
    map.value.flyTo({
      center: [121.4737, 31.2304],
      zoom: 15,
      pitch: 45,
      bearing: -17.6,
      duration: 2000,
    })
    showSnackbar('视图已重置')
  }
}

// 切换全屏
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
  } else {
    document.exitFullscreen()
  }
}

// 导出地图
const exportMap = () => {
  if (map.value) {
    const canvas = map.value.getCanvas()
    const dataURL = canvas.toDataURL('image/png')

    const link = document.createElement('a')
    link.download = 'architecture-map.png'
    link.href = dataURL
    link.click()

    showSnackbar('地图已导出')
  }
}

// 显示提示
const showSnackbar = (text) => {
  snackbarText.value = text
  snackbar.value = true
}

// 视图模式切换
watch(viewMode, (newMode) => {
  if (map.value) {
    if (newMode === 'globe') {
      map.value.setProjection('globe')
      showSnackbar('切换到地球视图')
    } else {
      map.value.setProjection('mercator')
      showSnackbar('切换到地图视图')
    }
  }
})

// 生命周期
onMounted(() => {
  initMap()

  // 添加键盘快捷键
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen()
    } else if (e.key === 'r' || e.key === 'R') {
      resetView()
    } else if (e.key === 's' || e.key === 'S') {
      showStats.value = !showStats.value
      if (showStats.value) {
        nextTick(() => {
          initD3Visualization()
        })
      }
    }
  })
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100vh;
  position: relative;
}

.toolbar-overlay {
  position: absolute !important;
  top: 0;
  right: 0;
  left: 256px;
  z-index: 1;
  background: linear-gradient(to bottom, rgba(255,255,255,0.9), transparent) !important;
}

.info-panel {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 2;
}

.stats-panel {
  position: absolute;
  bottom: 40px;
  right: 20px;
  z-index: 2;
}

.scale-control {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 1;
}

/* Mapbox弹出框样式 */
:deep(.mapboxgl-popup-content) {
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 3px 14px rgba(0,0,0,0.4);
  font-size: 12px;
}

:deep(.mapboxgl-popup-anchor-bottom .mapboxgl-popup-tip) {
  border-top-color: white;
}

/* D3图表样式 */
:deep(.bar) {
  transition: fill 0.3s;
}

:deep(.bar:hover) {
  fill: #1565C0;
}

/* 响应式调整 */
@media (max-width: 960px) {
  .toolbar-overlay {
    left: 56px;
  }
}
</style>

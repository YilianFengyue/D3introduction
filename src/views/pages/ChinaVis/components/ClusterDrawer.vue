<template>
  <v-navigation-drawer
    v-model="isOpen"
    location="right"
    temporary
    width="360"
  >
    <v-card flat class="drawer-card">
      <!-- 标题栏 -->
      <v-card-title class="d-flex align-center pa-3 bg-primary">
        <v-icon color="white" class="mr-2">mdi-tune-variant</v-icon>
        <span class="text-white">Cluster Configuration</span>
        <v-spacer />
        <v-btn
          icon
          size="small"
          variant="text"
          color="white"
          @click="isOpen = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- 配置内容 -->
      <v-card-text class="drawer-content pa-4">
        <!-- 1. 聚类数量 -->
        <div class="config-section">
          <div class="text-subtitle-2 mb-2 font-weight-bold">
            <v-icon size="18" class="mr-1">mdi-group</v-icon>
            聚类数量
          </div>
          <v-radio-group
            v-model="localClusterCount"
            inline
            density="compact"
            hide-details
          >
            <v-radio
              v-for="k in [2, 3, 4, 5]"
              :key="k"
              :label="`${k} 类`"
              :value="k"
            />
          </v-radio-group>
        </div>

        <v-divider class="my-4" />

        <!-- 2. 特征选择 -->
        <div class="config-section">
          <div class="text-subtitle-2 mb-2 font-weight-bold">
            <v-icon size="18" class="mr-1">mdi-view-list</v-icon>
            使用特征
            <v-chip size="x-small" class="ml-2">
              {{ localEnabledFeatures.length }}/8
            </v-chip>
          </div>
          <v-alert
            v-if="localEnabledFeatures.length < 3"
            type="warning"
            density="compact"
            class="mb-2"
          >
            至少选择 3 个特征
          </v-alert>
          <div class="feature-checkboxes">
            <v-checkbox
              v-for="feature in FEATURE_DEFS"
              :key="feature.key"
              v-model="localEnabledFeatures"
              :value="feature.key"
              :label="feature.label"
              density="compact"
              hide-details
              class="mb-1"
            >
              <template #label>
                <div class="text-caption">
                  {{ feature.label }}
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon
                        size="14"
                        v-bind="props"
                        class="ml-1"
                        color="grey-lighten-1"
                      >
                        mdi-information
                      </v-icon>
                    </template>
                    {{ feature.description }}
                  </v-tooltip>
                </div>
              </template>
            </v-checkbox>
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- 3. 班级筛选 -->
        <div class="config-section">
          <div class="text-subtitle-2 mb-2 font-weight-bold">
            <v-icon size="18" class="mr-1">mdi-school</v-icon>
            班级筛选
          </div>
          <v-select
            v-model="localSelectedClasses"
            :items="allClasses"
            label="选择班级"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          >
            <template #prepend-item>
              <v-list-item
                title="全选"
                @click="toggleAllClasses"
              >
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="localSelectedClasses.length === allClasses.length"
                    :indeterminate="localSelectedClasses.length > 0 && localSelectedClasses.length < allClasses.length"
                  />
                </template>
              </v-list-item>
              <v-divider />
            </template>
          </v-select>
        </div>

        <v-divider class="my-4" />

        <!-- 4. 专业筛选 -->
        <div class="config-section">
          <div class="text-subtitle-2 mb-2 font-weight-bold">
            <v-icon size="18" class="mr-1">mdi-certificate</v-icon>
            专业筛选
          </div>
          <v-select
            v-model="localSelectedMajors"
            :items="allMajors"
            label="选择专业"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          >
            <template #prepend-item>
              <v-list-item
                title="全选"
                @click="toggleAllMajors"
              >
                <template #prepend>
                  <v-checkbox-btn
                    :model-value="localSelectedMajors.length === allMajors.length"
                    :indeterminate="localSelectedMajors.length > 0 && localSelectedMajors.length < allMajors.length"
                  />
                </template>
              </v-list-item>
              <v-divider />
            </template>
          </v-select>
        </div>
      </v-card-text>

      <!-- 底部按钮 -->
      <v-divider />
      <v-card-actions class="drawer-footer pa-3">
        <v-btn
          variant="outlined"
          @click="resetToDefault"
        >
          重置
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="isOpen = false"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="localEnabledFeatures.length < 3"
          @click="applyConfig"
        >
          确认应用
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
/* ===== [PATCH START] 修复 defineModel + 动态数据源 ===== */
import { ref, computed, watch } from 'vue';
import { useVisStore } from '../stores/useVisStore';
import { useScatterData } from '../composables/useScatterData';
import { FEATURE_DEFS } from '../lib/constants';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const store = useVisStore();
const scatterData = useScatterData();

// 控制抽屉开关（改用 computed）
const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

// 本地配置（编辑中）
const localClusterCount = ref(store.clusterCount);
const localEnabledFeatures = ref([...store.enabledFeatures]);
const localSelectedClasses = ref<string[]>([]);
const localSelectedMajors = ref<string[]>([]);

// 动态获取所有班级（从真实数据）
const allClasses = computed(() => {
  if (!scatterData.rawData?.value) return [];
  const { records } = scatterData.rawData.value;
  const classes = new Set(records.map(r => r.class));
  return Array.from(classes).sort();
});

// 动态获取所有专业（从真实数据）
const allMajors = computed(() => {
  if (!scatterData.rawData?.value) return [];
  const { studentMap } = scatterData.rawData.value;
  const majors = new Set(
    Array.from(studentMap.values())
      .map(s => s.major)
      .filter(m => m && m !== '')
  );
  return Array.from(majors).sort();
});

// 初始化时同步 store 状态
watch(() => props.modelValue, (open) => {
  if (open) {
    localClusterCount.value = store.clusterCount;
    localEnabledFeatures.value = [...store.enabledFeatures];
    
    // 班级筛选：如果 store 为空则全选
    localSelectedClasses.value = store.selectedClasses.length > 0 
      ? [...store.selectedClasses] 
      : [...allClasses.value];
    
    // 专业筛选：如果 store 为空则全选
    localSelectedMajors.value = store.selectedMajors.length > 0
      ? [...store.selectedMajors]
      : [...allMajors.value];
  }
});

function toggleAllClasses() {
  if (localSelectedClasses.value.length === allClasses.value.length) {
    localSelectedClasses.value = [];
  } else {
    localSelectedClasses.value = [...allClasses.value];
  }
}

function toggleAllMajors() {
  if (localSelectedMajors.value.length === allMajors.value.length) {
    localSelectedMajors.value = [];
  } else {
    localSelectedMajors.value = [...allMajors.value];
  }
}

function resetToDefault() {
  localClusterCount.value = 3;
  localEnabledFeatures.value = FEATURE_DEFS.map(f => f.key as string);
  localSelectedClasses.value = [...allClasses.value];
  localSelectedMajors.value = [...allMajors.value];
}

function applyConfig() {
  // 更新 store（触发重新聚类）
  store.clusterCount = localClusterCount.value;
  store.enabledFeatures = [...localEnabledFeatures.value];
  store.selectedClasses = [...localSelectedClasses.value];
  store.selectedMajors = [...localSelectedMajors.value];
  
  isOpen.value = false;
}
/* ===== [PATCH END] ===== */
</script>

<style scoped>
.config-section {
  margin-bottom: 16px;
}

.feature-checkboxes {
  max-height: 280px;
  overflow-y: auto;
}
/* ===== [PATCH START] 添加 Flexbox 布局样式 ===== */
.drawer-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.drawer-footer {
  flex-shrink: 0;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  background: white;
}

</style>
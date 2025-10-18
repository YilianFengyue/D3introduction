<template>
  <v-card elevation="2" class="question-card">
    <!-- 标题 -->
    <v-card-title class="d-flex align-center py-2 px-3">
      <v-icon size="20" class="mr-2">mdi-file-document</v-icon>
      <span class="text-subtitle-1 font-weight-medium">Question View</span>
      
      <v-spacer />
      
      <!-- 选中的知识点 -->
      <v-chip
        v-if="store.selectedKnowledge"
        size="small"
        closable
        @click:close="store.setSelectedKnowledge(null)"
      >
        {{ store.selectedKnowledge }}
      </v-chip>
      
      <!-- 排序按钮 -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon size="small" variant="text" v-bind="props">
            <v-icon>mdi-sort</v-icon>
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item @click="sortBy = 'difficulty'">
            <v-list-item-title>按难度排序</v-list-item-title>
          </v-list-item>
          <v-list-item @click="sortBy = 'avgScore'">
            <v-list-item-title>按得分排序</v-list-item-title>
          </v-list-item>
          <v-list-item @click="sortBy = 'avgAttempts'">
            <v-list-item-title>按提交次数排序</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-card-title>

    <v-divider />

    <!-- 加载状态 -->
    <v-card-text v-if="questionData.loading.value" class="text-center pa-8">
      <v-progress-circular indeterminate color="primary" size="48" />
    </v-card-text>

    <!-- 题目列表 -->
    <v-card-text v-else class="pa-3" style="height: calc(100% - 60px); overflow-y: auto;">
      <div v-if="sortedQuestions.length === 0" class="text-center pa-8 text-grey">
        <v-icon size="64">mdi-information-outline</v-icon>
        <div class="mt-2">暂无题目数据</div>
      </div>

      <!-- 题目网格 -->
      <div class="question-grid">
        <div
          v-for="q in sortedQuestions"
          :key="q.title_ID"
          class="question-item"
          @click="selectQuestion(q)"
        >
          <!-- 圆环图 -->
          <svg :width="120" :height="120" class="question-svg">
            <g :transform="`translate(60, 60)`">
              <!-- 外圈：提交次数 -->
              <circle
                r="50"
                fill="none"
                :stroke="getDifficultyColor(q.difficulty)"
                :stroke-width="Math.min(q.avgAttempts * 2, 20)"
                opacity="0.3"
              />
              
              <!-- 内圈：得分 -->
              <circle
                :r="q.avgScore * 40"
                :fill="getDifficultyColor(q.difficulty)"
                opacity="0.6"
              />
              
              <!-- 中心文字 -->
              <text
                text-anchor="middle"
                dy="0.3em"
                font-size="12"
                fill="#333"
                font-weight="bold"
              >
                {{ (q.avgScore * 100).toFixed(0) }}%
              </text>
            </g>
          </svg>

          <!-- 题目信息 -->
          <div class="question-info">
            <div class="question-title">{{ q.title_ID.slice(-6) }}</div>
            <v-chip
              :color="getDifficultyColor(q.difficulty)"
              size="x-small"
              class="mt-1"
            >
              {{ q.difficulty }}
            </v-chip>
            <div class="question-stats">
              <div>尝试: {{ q.avgAttempts.toFixed(1) }}</div>
              <div>得分: {{ q.avgScore.toFixed(2) }}</div>
            </div>
          </div>

          <!-- 时间分布小图 -->
          <div class="time-distribution">
            <svg width="100" height="30">
               <g v-for="[week, count] in Array.from(q.timeDistribution.entries())" :key="week">
                <rect
                  :x="week * 5"
                  :y="30 - count * 2"
                  width="4"
                  :height="count * 2"
                  :fill="getDifficultyColor(q.difficulty)"
                  opacity="0.5"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuestionData } from '../composables/useQuestionData';
import { useVisStore } from '../stores/useVisStore';
import type { QuestionStats } from '../lib/aggregateTitle';

// ============================================
// Setup
// ============================================

const questionData = useQuestionData();
const store = useVisStore();

const sortBy = ref<'difficulty' | 'avgScore' | 'avgAttempts'>('difficulty');

// ============================================
// 计算属性
// ============================================

const sortedQuestions = computed(() => {
  const questions = [...questionData.filteredQuestions.value];
  
  switch (sortBy.value) {
    case 'avgScore':
      return questions.sort((a, b) => a.avgScore - b.avgScore);
    case 'avgAttempts':
      return questions.sort((a, b) => b.avgAttempts - a.avgAttempts);
    case 'difficulty':
    default:
      const order = { 'Hard': 0, 'Medium': 1, 'Easy': 2 };
      return questions.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
  }
});

// ============================================
// 方法
// ============================================

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'Hard': return '#D63031';
    case 'Medium': return '#F39C12';
    case 'Easy': return '#10AC84';
    default: return '#95a5a6';
  }
}

function selectQuestion(question: QuestionStats) {
  console.log('Selected question:', question);
  // 可以在这里添加详情面板
}
</script>

<style scoped>
.question-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.question-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.question-item {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.question-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.question-svg {
  display: block;
}

.question-info {
  text-align: center;
  margin-top: 8px;
  width: 100%;
}

.question-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.question-stats {
  font-size: 11px;
  color: #666;
  margin-top: 4px;
  display: flex;
  justify-content: space-around;
}

.time-distribution {
  margin-top: 8px;
  width: 100%;
}
</style>
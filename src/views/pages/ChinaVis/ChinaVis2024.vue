<script setup lang="ts">

import PortraitCard from "./components/PortraitCard.vue";
import ScatterCard from "./components/ScatterCard.vue";
import QuestionCard from "./components/QuestionCard.vue";
import WeekCard from "./components/WeekCard.vue";  // ← 新增
import StudentCard from "./components/StudentCard.vue";
import ClusterDrawer from "./components/ClusterDrawer.vue";

import { ref } from 'vue';

const drawerOpen = ref(false);

</script>
<template>
  <div class="pa-5">

    <!-- ===== [PATCH START] 修改 Toolbar 添加设置按钮 ===== -->
<v-toolbar class="mb-3 font-weight-bold" color="white" elevation="2">
  <v-icon class="ml-3" color="primary">mdi-school</v-icon>
  <v-toolbar-title class="ml-2">LearnClusterVis</v-toolbar-title>
  
  <v-spacer />
  
  <v-chip size="small" class="mr-2" color="grey-lighten-3">
    <v-icon start size="16">mdi-calendar</v-icon>
    2023-2024 学年
  </v-chip>
  
  <v-btn
    icon
    variant="text"
    @click="drawerOpen = true"
  >
    <v-icon>mdi-tune-variant</v-icon>
    <v-tooltip activator="parent" location="bottom">
      聚类设置
    </v-tooltip>
  </v-btn>
  
  <v-btn icon variant="text">
    <v-icon>mdi-help-circle-outline</v-icon>
    <v-tooltip activator="parent" location="bottom">
      帮助
    </v-tooltip>
  </v-btn>
</v-toolbar>
<!-- ===== [PATCH END] ===== -->

    <!-- ---------------------------------------------- -->
    <!---First Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="flex-0" dense>
      <v-col cols="7" xl="4">
        <!-- Sales Card -->
        <v-card class="card-shadow" height="620">
          <!-- <sales-card></sales-card> -->
            <ScatterCard/>
        </v-card>
      </v-col>
      <v-col cols="5" xl="6">
        <v-card class="card-shadow" height="620"
          ><PortraitCard/>
        </v-card>
      </v-col>
    </v-row>
    <!-- ---------------------------------------------- -->
    <!---Second Row -->
    <!-- ---------------------------------------------- -->
    <v-row class=" flex-0" dense> 
        <v-col cols="5" xl="4">
        <!-- Sales Card -->
        <v-card class="card-shadow" height="600">
          <QuestionCard />
        </v-card>
      </v-col>
      <v-col cols="7" xl="6">
         <v-card class="card-shadow" height="600">
          <!-- <sales-card></sales-card> -->
           <WeekCard />
        </v-card>
      </v-col>
    </v-row>
    <!-- ---------------------------------------------- -->
    <!---Third Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="card-shadow flex-grow-0" dense> </v-row>
    <!-- ===== [PATCH START] StudentView 布局 ===== -->
    <v-row class="flex-0" dense>
      <v-col cols="12">
        <v-card class="card-shadow" height="500">
          <StudentCard />
        </v-card>
      </v-col>
    </v-row>
<!-- ===== [PATCH END] ===== -->
  </div>


  <ClusterDrawer v-model="drawerOpen" />
</template>
<style lang="scss" scoped></style>

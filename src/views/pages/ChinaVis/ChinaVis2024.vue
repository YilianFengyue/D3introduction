<script setup lang="ts">

import PortraitCard from "./components/PortraitCard.vue";
import ScatterCard from "./components/ScatterCard.vue";

</script>
<template>
  <div class="pa-5">

    <v-toolbar  title="Toolbar" class="mb-3 font-weight-bold" color="white">
      <template v-slot:append>
        <div class="d-flex ga-1">
          <v-btn icon="mdi-magnify"></v-btn>

          <v-btn icon="mdi-dots-vertical"></v-btn>
        </div>
      </template>
    </v-toolbar>

    <!-- ---------------------------------------------- -->
    <!---First Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="flex-0" dense>
      <v-col cols="4" xl="4">
        <!-- Sales Card -->
        <v-card class="card-shadow" height="420">
          <!-- <sales-card></sales-card> -->
            <ScatterCard/>
        </v-card>
      </v-col>
      <v-col cols="8" xl="6">
        <v-card class="card-shadow" height="420"
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
          <!-- <sales-card></sales-card> -->
          <v-card-title>QuestionView</v-card-title>
        </v-card>
      </v-col>
      <v-col cols="7" xl="6">
         <v-card class="card-shadow" height="600">
          <!-- <sales-card></sales-card> -->
          <v-card-title>WeekView</v-card-title>
        </v-card>
      </v-col>
    </v-row>
    <!-- ---------------------------------------------- -->
    <!---Third Row -->
    <!-- ---------------------------------------------- -->
    <v-row class="card-shadow flex-grow-0" dense> </v-row>
  </div>
</template>
<style lang="scss" scoped></style>

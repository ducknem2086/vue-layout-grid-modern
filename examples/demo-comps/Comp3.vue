<script setup lang="ts">
/**
 * Chart Component
 * A simple bar chart using CSS (no external dependencies)
 */

interface Props {
  title?: string;
  chartType?: "bar" | "horizontal";
}

withDefaults(defineProps<Props>(), {
  title: "Sales Chart",
  chartType: "bar"
});

// Mock chart data
const chartData = [
  { label: "Jan", value: 65, color: "#4a90d9" },
  { label: "Feb", value: 45, color: "#50c878" },
  { label: "Mar", value: 80, color: "#f5a623" },
  { label: "Apr", value: 55, color: "#e74c3c" },
  { label: "May", value: 90, color: "#9b59b6" },
  { label: "Jun", value: 70, color: "#1abc9c" }
];

const maxValue = Math.max(...chartData.map(d => d.value));
</script>

<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="chart-body">
      <!-- Vertical Bar Chart -->
      <div v-if="chartType === 'bar'" class="bar-chart">
        <div
          v-for="item in chartData"
          :key="item.label"
          class="bar-wrapper"
        >
          <div class="bar-value">{{ item.value }}</div>
          <div
            class="bar"
            :style="{
              height: `${(item.value / maxValue) * 100}%`,
              background: item.color
            }"
          ></div>
          <div class="bar-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- Horizontal Bar Chart -->
      <div v-else class="horizontal-chart">
        <div
          v-for="item in chartData"
          :key="item.label"
          class="horizontal-bar-wrapper"
        >
          <div class="horizontal-label">{{ item.label }}</div>
          <div class="horizontal-bar-container">
            <div
              class="horizontal-bar"
              :style="{
                width: `${(item.value / maxValue) * 100}%`,
                background: item.color
              }"
            ></div>
          </div>
          <div class="horizontal-value">{{ item.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  box-sizing: border-box;
}

.chart-header {
  background: #9b59b6;
  color: white;
  padding: 12px 16px;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.chart-body {
  flex: 1;
  padding: 16px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

/* Vertical Bar Chart */
.bar-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  gap: 8px;
}

.bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  height: 100%;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.bar {
  width: 100%;
  max-width: 40px;
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
  margin-top: auto;
}

.bar-label {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

/* Horizontal Bar Chart */
.horizontal-chart {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.horizontal-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.horizontal-label {
  width: 40px;
  font-size: 12px;
  color: #666;
  text-align: right;
}

.horizontal-bar-container {
  flex: 1;
  height: 20px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.horizontal-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.horizontal-value {
  width: 30px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}
</style>

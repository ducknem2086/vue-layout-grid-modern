<script setup lang="ts">
import type { LayoutItem } from "../../src/core/types";

defineProps<{
  item: LayoutItem;
}>();
</script>

<template>
  <div class="widget chart-widget">
    <div class="widget-header">
      <span class="widget-icon">📊</span>
      <span class="widget-title">Chart Widget</span>
    </div>
    <div class="widget-body">
      <div class="chart-placeholder">
        <div class="bar" style="height: 60%"></div>
        <div class="bar" style="height: 80%"></div>
        <div class="bar" style="height: 45%"></div>
        <div class="bar" style="height: 90%"></div>
        <div class="bar" style="height: 70%"></div>
      </div>
    </div>
    <div class="widget-footer">
      <span class="widget-id">{{ item.i }}</span>
      <span class="widget-size">{{ item.w }}x{{ item.h }}</span>
    </div>
  </div>
</template>

<style scoped>
.chart-widget {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.chart-placeholder {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 8px;
  height: 100%;
  padding: 10px;
}

.bar {
  width: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
}
</style>

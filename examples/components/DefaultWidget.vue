<script setup lang="ts">
import type { LayoutItem } from "../../src/core/types";

defineProps<{
  item: LayoutItem;
}>();
</script>

<template>
  <div class="widget default-widget">
    <div class="widget-header">
      <span class="widget-icon">📦</span>
      <span class="widget-title">Widget</span>
    </div>
    <div class="widget-body">
      <span>No component assigned</span>
    </div>
    <div class="widget-footer">
      <span class="widget-id">{{ item.i }}</span>
      <span class="widget-size">{{ item.w }}x{{ item.h }}</span>
    </div>
  </div>
</template>

<style scoped>
.default-widget {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.default-widget .widget-body {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0.7;
}
</style>

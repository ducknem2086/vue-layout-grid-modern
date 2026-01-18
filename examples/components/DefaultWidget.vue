<script setup lang="ts">
import type { LayoutItem } from "../../src/core/types";

defineProps<{
  item: LayoutItem;
}>();

const emit = defineEmits<{
  (e: "maximize"): void;
}>();
</script>

<template>
  <div class="widget default-widget">
    <div class="widget-header">
      <span class="widget-icon">📦</span>
      <span class="widget-title">Widget</span>
      <div class="widget-actions">
        <button class="widget-action-btn" @click.stop="emit('maximize')" title="Maximize">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>
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

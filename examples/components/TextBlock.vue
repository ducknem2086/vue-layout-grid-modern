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
  <div class="widget text-widget">
    <div class="widget-header">
      <span class="widget-icon">📝</span>
      <span class="widget-title">Text Block</span>
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
      <div class="text-placeholder">
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      </div>
    </div>
    <div class="widget-footer">
      <span class="widget-id">{{ item.i }}</span>
      <span class="widget-size">{{ item.w }}x{{ item.h }}</span>
    </div>
  </div>
</template>

<style scoped>
.text-widget {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.text-placeholder {
  padding: 10px;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
}

.text-placeholder p {
  margin: 0;
  opacity: 0.9;
}
</style>

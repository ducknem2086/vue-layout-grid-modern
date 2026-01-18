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
  <div class="widget table-widget">
    <div class="widget-header">
      <span class="widget-icon">📋</span>
      <span class="widget-title">Data Table</span>
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
      <div class="table-placeholder">
        <div class="table-row header">
          <span>ID</span>
          <span>Name</span>
          <span>Value</span>
        </div>
        <div class="table-row">
          <span>1</span>
          <span>Item A</span>
          <span>100</span>
        </div>
        <div class="table-row">
          <span>2</span>
          <span>Item B</span>
          <span>250</span>
        </div>
        <div class="table-row">
          <span>3</span>
          <span>Item C</span>
          <span>175</span>
        </div>
      </div>
    </div>
    <div class="widget-footer">
      <span class="widget-id">{{ item.i }}</span>
      <span class="widget-size">{{ item.w }}x{{ item.h }}</span>
    </div>
  </div>
</template>

<style scoped>
.table-widget {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.table-placeholder {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  overflow: hidden;
}

.table-row {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  font-size: 11px;
}

.table-row.header {
  background: rgba(255, 255, 255, 0.4);
  font-weight: bold;
}

.table-row span {
  flex: 1;
  text-align: center;
}
</style>

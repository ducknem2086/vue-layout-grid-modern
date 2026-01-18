<script setup lang="ts">
import type { LayoutItem } from "../../src/core/types";

defineProps<{
  item: LayoutItem;
}>();
</script>

<template>
  <div class="widget image-widget">
    <div class="widget-header">
      <span class="widget-icon">🖼️</span>
      <span class="widget-title">Image</span>
    </div>
    <div class="widget-body">
      <div class="image-placeholder">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="100" height="100" fill="rgba(255,255,255,0.1)"/>
          <circle cx="35" cy="35" r="12" fill="rgba(255,255,255,0.6)"/>
          <path d="M10 70 L40 45 L60 60 L90 35 L90 90 L10 90 Z" fill="rgba(255,255,255,0.4)"/>
        </svg>
      </div>
    </div>
    <div class="widget-footer">
      <span class="widget-id">{{ item.i }}</span>
      <span class="widget-size">{{ item.w }}x{{ item.h }}</span>
    </div>
  </div>
</template>

<style scoped>
.image-widget {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 10px;
}

.image-placeholder svg {
  width: 100%;
  height: 100%;
  max-width: 120px;
  max-height: 120px;
  border-radius: 8px;
  overflow: hidden;
}
</style>

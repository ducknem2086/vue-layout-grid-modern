<script setup lang="ts">
import type { LayoutItem } from "../../src/core/types";

defineProps<{
  item: LayoutItem;
}>();
</script>

<template>
  <div class="widget text-widget">
    <div class="widget-header">
      <span class="widget-icon">📝</span>
      <span class="widget-title">Text Block</span>
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

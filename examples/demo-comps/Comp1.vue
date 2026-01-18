<script setup lang="ts">
/**
 * Simple Card Component
 * A card with title, content and customizable color
 */

interface Props {
  title?: string;
  color?: string;
}

withDefaults(defineProps<Props>(), {
  title: "Card Title",
  color: "#4a90d9"
});
</script>

<template>
  <div class="simple-card " :style="{ '--card-color': color }">
    <div class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="card-body">
      <slot>
        <p>Card content goes here</p>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.simple-card {
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

.card-header {
  background: var(--card-color);
  color: white;
  padding: 12px 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.card-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.card-body p {
  margin: 0;
  color: #666;
}
</style>

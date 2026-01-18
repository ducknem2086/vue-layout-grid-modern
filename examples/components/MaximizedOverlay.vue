<script setup lang="ts">
import type { LayoutItem } from "../../src/core/types";

defineProps<{
  item: LayoutItem;
}>();

const emit = defineEmits<{
  (e: "minimize"): void;
}>();

const onMinimize = () => {
  emit("minimize");
};

// Close on Escape key
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    onMinimize();
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      class="maximized-overlay"
      @keydown="handleKeydown"
      tabindex="0"
      ref="overlayRef"
    >
      <div class="maximized-header">
        <span class="maximized-title">
          <slot name="title">Item {{ item.i }}</slot>
        </span>
        <button
          class="action-btn minimize-btn"
          @click="onMinimize"
          title="Minimize (Esc)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 14 10 14 10 20"></polyline>
            <polyline points="20 10 14 10 14 4"></polyline>
            <line x1="14" y1="10" x2="21" y2="3"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
        </button>
      </div>
      <div class="maximized-content">
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.maximized-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  background: #1a1a2e;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.maximized-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.maximized-title {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.action-btn svg {
  width: 20px;
  height: 20px;
}

.minimize-btn:hover {
  background: rgba(99, 102, 241, 0.6);
}

.maximized-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}
</style>

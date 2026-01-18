<script setup lang="ts">
/**
 * GridItem component
 *
 * Individual grid item with native drag and resize support.
 */

import {
  ref,
  computed,
  onUnmounted,
  type CSSProperties
} from "vue";
import clsx from "clsx";
import type {
  LayoutItem,
  ResizeHandleAxis,
  PositionStrategy,
  LayoutConstraint,
  GridDragEvent,
  GridResizeEvent
} from "../core/types";
import type { PositionParams } from "../core/calculate";
import {
  calcGridItemPosition,
  calcGridColWidth,
  calcGridItemWHPx,
  calcXYRaw,
  calcWHRaw,
  clamp
} from "../core/calculate";
import { resizeItemInDirection } from "../core/position";
import {
  applyPositionConstraints,
  applySizeConstraints,
  defaultConstraints
} from "../core/constraints";

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  /** Layout item data */
  layoutItem: LayoutItem;
  /** Number of columns */
  cols: number;
  /** Container width in pixels */
  containerWidth: number;
  /** Row height in pixels */
  rowHeight: number;
  /** Margin between items [x, y] */
  margin: readonly [number, number];
  /** Container padding [x, y] */
  containerPadding: readonly [number, number];
  /** Maximum rows */
  maxRows: number;
  /** Whether item can be dragged */
  isDraggable?: boolean;
  /** Whether item can be resized */
  isResizable?: boolean;
  /** Whether item is bounded to container */
  isBounded?: boolean;
  /** Use CSS transforms for positioning */
  useCssTransforms?: boolean;
  /** Position strategy for styling */
  positionStrategy: PositionStrategy;
  /** Drag threshold in pixels */
  dragThreshold?: number;
  /** Resize handles to show */
  resizeHandles?: ResizeHandleAxis[];
  /** Layout constraints */
  constraints?: LayoutConstraint[];
  /** Handle CSS selector */
  handle?: string;
  /** Cancel CSS selector */
  cancel?: string;
  /** Whether this item is selected */
  isSelected?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDraggable: true,
  isResizable: true,
  isBounded: false,
  useCssTransforms: true,
  dragThreshold: 3,
  resizeHandles: () => ["se"],
  constraints: () => defaultConstraints,
  isSelected: false
});

const emit = defineEmits<{
  (
    e: "dragStart",
    i: string,
    x: number,
    y: number,
    data: GridDragEvent
  ): void;
  (e: "drag", i: string, x: number, y: number, data: GridDragEvent): void;
  (
    e: "dragStop",
    i: string,
    x: number,
    y: number,
    data: GridDragEvent
  ): void;
  (
    e: "resizeStart",
    i: string,
    w: number,
    h: number,
    data: GridResizeEvent
  ): void;
  (
    e: "resize",
    i: string,
    w: number,
    h: number,
    data: GridResizeEvent
  ): void;
  (
    e: "resizeStop",
    i: string,
    w: number,
    h: number,
    data: GridResizeEvent
  ): void;
  (e: "select", i: string): void;
}>();

// ============================================================================
// Refs & State
// ============================================================================

const itemRef = ref<HTMLDivElement | null>(null);

// Drag state
const dragging = ref(false);
const dragPosition = ref({ left: 0, top: 0 });

// Resize state
const resizing = ref(false);
const resizePosition = ref({ left: 0, top: 0, width: 0, height: 0 });

// Drag threshold tracking
let dragPending = false;
let initialDragClient = { x: 0, y: 0 };
let thresholdExceeded = false;
let currentResizeHandle: ResizeHandleAxis | null = null;

// ============================================================================
// Computed
// ============================================================================

const positionParams = computed<PositionParams>(() => ({
  cols: props.cols,
  containerPadding: props.containerPadding as [number, number],
  containerWidth: props.containerWidth,
  margin: props.margin as [number, number],
  maxRows: props.maxRows,
  rowHeight: props.rowHeight
}));

const position = computed(() => {
  const { x, y, w, h } = props.layoutItem;
  return calcGridItemPosition(
    positionParams.value,
    x,
    y,
    w,
    h,
    dragging.value ? dragPosition.value : null,
    resizing.value ? resizePosition.value : null
  );
});

const itemStyle = computed<CSSProperties>(() =>
  props.positionStrategy.calcStyle(position.value)
);

const itemClasses = computed(() =>
  clsx("vue-grid-item", {
    static: props.layoutItem.static,
    resizing: resizing.value,
    "vue-draggable": props.isDraggable,
    "vue-draggable-dragging": dragging.value,
    cssTransforms: props.useCssTransforms,
    "vue-grid-item-selected": props.isSelected
  })
);

// ============================================================================
// Constraint Context
// ============================================================================

const getConstraintContext = () => ({
  cols: props.cols,
  maxRows: props.maxRows,
  containerWidth: props.containerWidth,
  containerHeight: 0,
  rowHeight: props.rowHeight,
  margin: props.margin,
  layout: []
});

// ============================================================================
// Selection Handling
// ============================================================================

const handleClick = () => {
  // Don't select if we just finished dragging or resizing
  if (dragging.value || resizing.value) return;

  // Emit select event
  emit("select", props.layoutItem.i);
};

// ============================================================================
// Drag Handling
// ============================================================================

const handleMouseDown = (e: MouseEvent) => {
  if (!props.isDraggable) return;
  if (e.button !== 0) return; // Left click only

  // Check handle/cancel selectors
  if (props.handle) {
    const target = e.target as HTMLElement;
    if (!target.closest(props.handle)) return;
  }
  if (props.cancel) {
    const target = e.target as HTMLElement;
    if (target.closest(props.cancel)) return;
  }

  startDrag(e);
};

const handleTouchStart = (e: TouchEvent) => {
  if (!props.isDraggable) return;

  // Check handle/cancel selectors
  if (props.handle) {
    const target = e.target as HTMLElement;
    if (!target.closest(props.handle)) return;
  }
  if (props.cancel) {
    const target = e.target as HTMLElement;
    if (target.closest(props.cancel)) return;
  }

  startDrag(e.touches[0] as unknown as MouseEvent);
};

const startDrag = (e: MouseEvent) => {
  const node = itemRef.value;
  if (!node) return;

  const { offsetParent } = node;
  if (!offsetParent) return;

  const parentRect = offsetParent.getBoundingClientRect();
  const clientRect = node.getBoundingClientRect();
  const scale = props.positionStrategy.scale;

  const newPosition = {
    left:
      (clientRect.left - parentRect.left) / scale +
      (offsetParent as HTMLElement).scrollLeft,
    top:
      (clientRect.top - parentRect.top) / scale +
      (offsetParent as HTMLElement).scrollTop
  };

  dragPosition.value = newPosition;

  if (props.dragThreshold > 0) {
    initialDragClient = { x: e.clientX, y: e.clientY };
    dragPending = true;
    thresholdExceeded = false;
  } else {
    emitDragStart(e, newPosition);
  }

  dragging.value = true;

  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", handleDragStop);
  document.addEventListener("touchmove", handleDrag as EventListener);
  document.addEventListener("touchend", handleDragStop as EventListener);
};

const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (!dragging.value) return;

  const touch = "touches" in e ? e.touches[0] : e;
  if (!touch) return;

  // Check threshold
  if (dragPending && !thresholdExceeded) {
    const dx = touch.clientX - initialDragClient.x;
    const dy = touch.clientY - initialDragClient.y;
    const distance = Math.hypot(dx, dy);

    if (distance < props.dragThreshold) return;

    thresholdExceeded = true;
    dragPending = false;
    emitDragStart(touch as unknown as MouseEvent, dragPosition.value);
  }

  // Calculate new position
  const scale = props.positionStrategy.scale;
  const dx = (touch.clientX - initialDragClient.x) / scale;
  const dy = (touch.clientY - initialDragClient.y) / scale;

  let top = dragPosition.value.top + dy;
  let left = dragPosition.value.left + dx;

  // Update initial for delta calculation
  initialDragClient = { x: touch.clientX, y: touch.clientY };

  // Boundary clamping
  if (props.isBounded) {
    const node = itemRef.value;
    if (node?.offsetParent) {
      const { h, w } = props.layoutItem;
      const colWidth = calcGridColWidth(positionParams.value);
      const bottomBoundary =
        (node.offsetParent as HTMLElement).clientHeight -
        calcGridItemWHPx(h, props.rowHeight, props.margin[1]);
      const rightBoundary =
        props.containerWidth - calcGridItemWHPx(w, colWidth, props.margin[0]);
      top = clamp(top, 0, bottomBoundary);
      left = clamp(left, 0, rightBoundary);
    }
  }

  dragPosition.value = { top, left };

  // Calculate grid units and emit
  const rawPos = calcXYRaw(positionParams.value, top, left);
  const constrained = applyPositionConstraints(
    props.constraints,
    props.layoutItem,
    rawPos.x,
    rawPos.y,
    getConstraintContext()
  );

  emit("drag", props.layoutItem.i, constrained.x, constrained.y, {
    e: e as unknown as Event,
    node: itemRef.value!,
    newPosition: dragPosition.value
  });
};

const handleDragStop = (e: MouseEvent | TouchEvent) => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", handleDragStop);
  document.removeEventListener("touchmove", handleDrag as EventListener);
  document.removeEventListener("touchend", handleDragStop as EventListener);

  if (!dragging.value) return;

  // Skip if threshold never exceeded
  if (dragPending) {
    dragPending = false;
    thresholdExceeded = false;
    dragging.value = false;
    dragPosition.value = { left: 0, top: 0 };
    return;
  }

  const { top, left } = dragPosition.value;
  const rawPos = calcXYRaw(positionParams.value, top, left);
  const constrained = applyPositionConstraints(
    props.constraints,
    props.layoutItem,
    rawPos.x,
    rawPos.y,
    getConstraintContext()
  );

  emit("dragStop", props.layoutItem.i, constrained.x, constrained.y, {
    e: e as unknown as Event,
    node: itemRef.value!,
    newPosition: dragPosition.value
  });

  dragging.value = false;
  dragPosition.value = { left: 0, top: 0 };
};

const emitDragStart = (
  e: MouseEvent,
  startPosition: { left: number; top: number }
) => {
  const rawPos = calcXYRaw(
    positionParams.value,
    startPosition.top,
    startPosition.left
  );
  emit("dragStart", props.layoutItem.i, rawPos.x, rawPos.y, {
    e: e as unknown as Event,
    node: itemRef.value!,
    newPosition: startPosition
  });
};

// ============================================================================
// Resize Handling
// ============================================================================

const handleResizeStart = (e: MouseEvent | TouchEvent, handle: ResizeHandleAxis) => {
  if (!props.isResizable) return;

  e.stopPropagation();
  e.preventDefault();

  const node = itemRef.value;
  if (!node) return;

  currentResizeHandle = handle;

  const { offsetParent } = node;
  if (!offsetParent) return;

  const parentRect = offsetParent.getBoundingClientRect();
  const clientRect = node.getBoundingClientRect();
  const scale = props.positionStrategy.scale;

  resizePosition.value = {
    left:
      (clientRect.left - parentRect.left) / scale +
      (offsetParent as HTMLElement).scrollLeft,
    top:
      (clientRect.top - parentRect.top) / scale +
      (offsetParent as HTMLElement).scrollTop,
    width: clientRect.width / scale,
    height: clientRect.height / scale
  };

  const touch = "touches" in e ? e.touches[0] : e;
  initialDragClient = { x: touch!.clientX, y: touch!.clientY };

  resizing.value = true;

  // Calculate initial grid size
  const rawSize = calcWHRaw(
    positionParams.value,
    resizePosition.value.width,
    resizePosition.value.height
  );

  emit("resizeStart", props.layoutItem.i, rawSize.w, rawSize.h, {
    e: e as unknown as Event,
    node: itemRef.value!,
    size: { width: resizePosition.value.width, height: resizePosition.value.height },
    handle
  });

  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", handleResizeStop);
  document.addEventListener("touchmove", handleResize as EventListener);
  document.addEventListener("touchend", handleResizeStop as EventListener);
};

const handleResize = (e: MouseEvent | TouchEvent) => {
  if (!resizing.value || !currentResizeHandle) return;

  const touch = "touches" in e ? e.touches[0] : e;
  if (!touch) return;

  const scale = props.positionStrategy.scale;
  const dx = (touch.clientX - initialDragClient.x) / scale;
  const dy = (touch.clientY - initialDragClient.y) / scale;

  // Calculate new dimensions based on handle
  const currentSize = {
    left: resizePosition.value.left,
    top: resizePosition.value.top,
    width: resizePosition.value.width,
    height: resizePosition.value.height
  };

  const newSize = {
    left: currentSize.left,
    top: currentSize.top,
    width: currentSize.width + dx,
    height: currentSize.height + dy
  };

  // Apply directional constraints
  const constrained = resizeItemInDirection(
    currentResizeHandle,
    currentSize,
    newSize,
    props.containerWidth
  );

  resizePosition.value = constrained;
  initialDragClient = { x: touch.clientX, y: touch.clientY };

  // Calculate grid units
  const rawSize = calcWHRaw(
    positionParams.value,
    constrained.width,
    constrained.height
  );

  const constrainedSize = applySizeConstraints(
    props.constraints,
    props.layoutItem,
    rawSize.w,
    rawSize.h,
    currentResizeHandle,
    getConstraintContext()
  );

  emit("resize", props.layoutItem.i, constrainedSize.w, constrainedSize.h, {
    e: e as unknown as Event,
    node: itemRef.value!,
    size: { width: constrained.width, height: constrained.height },
    handle: currentResizeHandle
  });
};

const handleResizeStop = (e: MouseEvent | TouchEvent) => {
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", handleResizeStop);
  document.removeEventListener("touchmove", handleResize as EventListener);
  document.removeEventListener("touchend", handleResizeStop as EventListener);

  if (!resizing.value || !currentResizeHandle) return;

  const rawSize = calcWHRaw(
    positionParams.value,
    resizePosition.value.width,
    resizePosition.value.height
  );

  const constrainedSize = applySizeConstraints(
    props.constraints,
    props.layoutItem,
    rawSize.w,
    rawSize.h,
    currentResizeHandle,
    getConstraintContext()
  );

  emit("resizeStop", props.layoutItem.i, constrainedSize.w, constrainedSize.h, {
    e: e as unknown as Event,
    node: itemRef.value!,
    size: {
      width: resizePosition.value.width,
      height: resizePosition.value.height
    },
    handle: currentResizeHandle
  });

  resizing.value = false;
  resizePosition.value = { left: 0, top: 0, width: 0, height: 0 };
  currentResizeHandle = null;
};

// ============================================================================
// Lifecycle
// ============================================================================

onUnmounted(() => {
  document.removeEventListener("mousemove", handleDrag);
  document.removeEventListener("mouseup", handleDragStop);
  document.removeEventListener("touchmove", handleDrag as EventListener);
  document.removeEventListener("touchend", handleDragStop as EventListener);
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", handleResizeStop);
  document.removeEventListener("touchmove", handleResize as EventListener);
  document.removeEventListener("touchend", handleResizeStop as EventListener);
});
</script>

<template>
  <div
    ref="itemRef"
    :class="itemClasses"
    :style="itemStyle"
    @click="handleClick"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <slot />

    <!-- Resize handles -->
    <template v-if="isResizable && !layoutItem.static">
      <div
        v-for="handle in resizeHandles"
        :key="handle"
        :class="['vue-resizable-handle', `vue-resizable-handle-${handle}`]"
        @mousedown.stop="(e) => handleResizeStart(e, handle)"
        @touchstart.stop="(e) => handleResizeStart(e, handle)"
      />
    </template>
  </div>
</template>

<style>
.vue-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
  position: absolute;
}

.vue-grid-item > *:first-child:not(.vue-resizable-handle) {
  width: 100%;
  height: 100%;
}

.vue-grid-item img {
  pointer-events: none;
  user-select: none;
}

.vue-grid-item.cssTransforms {
  transition-property: transform, width, height;
}

.vue-grid-item.resizing {
  transition: none;
  z-index: 1;
  will-change: width, height;
}

.vue-grid-item.vue-draggable-dragging {
  transition: none;
  z-index: 3;
  will-change: transform;
}

.vue-grid-item.dropping {
  visibility: hidden;
}

.vue-grid-item > .vue-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  opacity: 0;
}

.vue-grid-item:hover > .vue-resizable-handle {
  opacity: 1;
}

.vue-grid-item > .vue-resizable-handle::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-right: 2px solid rgba(0, 0, 0, 0.4);
  border-bottom: 2px solid rgba(0, 0, 0, 0.4);
}

.vue-resizable-hide > .vue-resizable-handle {
  display: none;
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  transform: rotate(90deg);
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
  transform: rotate(180deg);
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
  transform: rotate(270deg);
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-w,
.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-e {
  top: 50%;
  margin-top: -10px;
  cursor: ew-resize;
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-w {
  left: 0;
  transform: rotate(135deg);
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-e {
  right: 0;
  transform: rotate(315deg);
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-n,
.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-s {
  left: 50%;
  margin-left: -10px;
  cursor: ns-resize;
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-n {
  top: 0;
  transform: rotate(225deg);
}

.vue-grid-item > .vue-resizable-handle.vue-resizable-handle-s {
  bottom: 0;
  transform: rotate(45deg);
}

.vue-grid-item.vue-grid-item-selected {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  z-index: 2;
}

.vue-grid-item.vue-grid-item-selected::before {
  content: "ESC to delete";
  position: absolute;
  top: 4px;
  right: 4px;
  background: #3b82f6;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  z-index: 10;
  pointer-events: none;
}
</style>

<script setup lang="ts">
/**
 * GridLayout component
 *
 * Main grid layout component with drag and resize support.
 */

import { ref, computed, watch, onMounted, onUnmounted, type CSSProperties } from "vue";
import { deepEqual } from "fast-equals";
import clsx from "clsx";
import type {
  Layout,
  LayoutItem,
  GridConfig,
  DragConfig,
  ResizeConfig,
  DropConfig,
  PositionStrategy,
  Compactor,
  LayoutConstraint,
  EventCallback,
  GridDragEvent,
  GridResizeEvent,
  ResizeHandleAxis
} from "../core/types";
import {
  defaultGridConfig,
  defaultDragConfig,
  defaultResizeConfig,
  defaultDropConfig
} from "../core/types";
import {
  bottom,
  cloneLayoutItem,
  cloneLayout,
  getLayoutItem,
  moveElement,
  resizeElement,
  correctBounds
} from "../core/layout";
import { getCompactor } from "../core/compactors";
import { calcGridItemPosition } from "../core/calculate";
import { defaultPositionStrategy } from "../core/position";
import { defaultConstraints } from "../core/constraints";
import GridItem from "./GridItem.vue";

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  /** Layout data */
  layout: Layout;
  /** Container width in pixels */
  width: number;
  /** Grid configuration */
  gridConfig?: Partial<GridConfig>;
  /** Drag configuration */
  dragConfig?: Partial<DragConfig>;
  /** Resize configuration */
  resizeConfig?: Partial<ResizeConfig>;
  /** Drop configuration */
  dropConfig?: Partial<DropConfig>;
  /** Position strategy (transform or absolute) */
  positionStrategy?: PositionStrategy;
  /** Compactor for layout compaction */
  compactor?: Compactor;
  /** Layout constraints */
  constraints?: LayoutConstraint[];
  /** Auto-size container height */
  autoSize?: boolean;
  /** Additional CSS class */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  autoSize: true,
  positionStrategy: () => defaultPositionStrategy,
  constraints: () => defaultConstraints
});

const emit = defineEmits<{
  (e: "update:layout", layout: Layout): void;
  (e: "layoutChange", layout: Layout): void;
  (e: "dragStart", ...args: Parameters<EventCallback>): void;
  (e: "drag", ...args: Parameters<EventCallback>): void;
  (e: "dragStop", ...args: Parameters<EventCallback>): void;
  (e: "resizeStart", ...args: Parameters<EventCallback>): void;
  (e: "resize", ...args: Parameters<EventCallback>): void;
  (e: "resizeStop", ...args: Parameters<EventCallback>): void;
  (
    e: "drop",
    layout: Layout,
    item: LayoutItem | undefined,
    event: Event
  ): void;
  (e: "itemSelected", i: string | null): void;
  (e: "itemRemove", i: string, item: LayoutItem): void;
}>();

// ============================================================================
// Resolved Configs
// ============================================================================

const gridConfig = computed<GridConfig>(() => ({
  ...defaultGridConfig,
  ...props.gridConfig
}));

const dragConfig = computed<DragConfig>(() => ({
  ...defaultDragConfig,
  ...props.dragConfig
}));

const resizeConfig = computed<ResizeConfig>(() => ({
  ...defaultResizeConfig,
  ...props.resizeConfig
}));

const dropConfig = computed<DropConfig>(() => ({
  ...defaultDropConfig,
  ...props.dropConfig
}));

const effectiveCompactor = computed<Compactor>(
  () => props.compactor ?? getCompactor("vertical")
);

const effectiveContainerPadding = computed<readonly [number, number]>(
  () => gridConfig.value.containerPadding ?? gridConfig.value.margin
);

// ============================================================================
// Internal State
// ============================================================================

const synchronizeLayout = (inputLayout: Layout): Layout => {
  const corrected = correctBounds(cloneLayout(inputLayout), {
    cols: gridConfig.value.cols
  });
  return effectiveCompactor.value.compact(corrected, gridConfig.value.cols);
};

const internalLayout = ref<Layout>(synchronizeLayout(props.layout));
const activeDrag = ref<LayoutItem | null>(null);
const resizingItem = ref<boolean>(false);
const oldDragItem = ref<LayoutItem | null>(null);
const oldLayout = ref<Layout | null>(null);

// Track drag state
let isDragging = false;

// Container ref
const containerRef = ref<HTMLDivElement | null>(null);

// Selected item for deletion
const selectedItem = ref<string | null>(null);

// ============================================================================
// Computed Styles
// ============================================================================

const containerStyle = computed<CSSProperties>(() => {
  if (!props.autoSize) return {};

  const nbRow = bottom(internalLayout.value);
  const paddingY = effectiveContainerPadding.value[1];
  const height =
    nbRow * gridConfig.value.rowHeight +
    (nbRow - 1) * gridConfig.value.margin[1] +
    paddingY * 2;

  return { height: `${height}px` };
});

const placeholderStyle = computed<CSSProperties>(() => {
  if (!activeDrag.value) return { display: "none" };

  const pos = calcGridItemPosition(
    {
      cols: gridConfig.value.cols,
      margin: gridConfig.value.margin as [number, number],
      containerWidth: props.width,
      rowHeight: gridConfig.value.rowHeight,
      maxRows: gridConfig.value.maxRows,
      containerPadding: effectiveContainerPadding.value as [number, number]
    },
    activeDrag.value.x,
    activeDrag.value.y,
    activeDrag.value.w,
    activeDrag.value.h
  );

  return props.positionStrategy.calcStyle(pos);
});

const containerClasses = computed(() =>
  clsx("vue-grid-layout", props.class)
);

// ============================================================================
// Helper Functions
// ============================================================================

const isItemDraggable = (item: LayoutItem): boolean => {
  if (item.static) return false;
  if (typeof item.isDraggable === "boolean") return item.isDraggable;
  return dragConfig.value.enabled;
};

const isItemResizable = (item: LayoutItem): boolean => {
  if (item.static) return false;
  if (typeof item.isResizable === "boolean") return item.isResizable;
  return resizeConfig.value.enabled;
};

/**
 * Calculate new x, y position based on resize handle and dimension changes.
 * West handles (w, nw, sw): x decreases as width increases
 * North handles (n, nw, ne): y decreases as height increases
 */
const calculateResizePosition = (
  item: LayoutItem,
  newW: number,
  newH: number,
  handle: ResizeHandleAxis
): { x: number | undefined; y: number | undefined } => {
  let x: number | undefined;
  let y: number | undefined;

  // West handles: x changes when width changes (resizing from left edge)
  if (handle === "w" || handle === "nw" || handle === "sw") {
    const deltaW = newW - item.w;
    x = item.x - deltaW;
  }

  // North handles: y changes when height changes (resizing from top edge)
  if (handle === "n" || handle === "nw" || handle === "ne") {
    const deltaH = newH - item.h;
    y = item.y - deltaH;
  }

  return { x, y };
};

// ============================================================================
// Sync Layout from Props
// ============================================================================

watch(
  () => props.layout,
  (newLayout) => {
    if (isDragging) return;
    if (!deepEqual(newLayout, internalLayout.value)) {
      internalLayout.value = synchronizeLayout(newLayout);
    }
  },
  { deep: true }
);

// ============================================================================
// Drag Handlers
// ============================================================================

const onDragStart = (
  i: string,
  _x: number,
  _y: number,
  event: GridDragEvent
) => {
  const l = getLayoutItem(internalLayout.value, i);
  if (!l) return;

  isDragging = true;
  oldDragItem.value = cloneLayoutItem(l);
  oldLayout.value = cloneLayout(internalLayout.value);
  activeDrag.value = { w: l.w, h: l.h, x: l.x, y: l.y, i };

  emit(
    "dragStart",
    internalLayout.value,
    l,
    l,
    null,
    event.e,
    event.node
  );
};

const onDrag = (i: string, x: number, y: number, event: GridDragEvent) => {
  const l = getLayoutItem(internalLayout.value, i);
  if (!l) return;

  activeDrag.value = { ...activeDrag.value!, x, y };

  const newLayout = moveElement(
    internalLayout.value,
    l,
    x,
    y,
    true,
    effectiveCompactor.value.preventCollision ?? false,
    effectiveCompactor.value.type,
    gridConfig.value.cols,
    effectiveCompactor.value.allowOverlap
  );

  internalLayout.value = effectiveCompactor.value.compact(
    newLayout,
    gridConfig.value.cols
  );

  emit(
    "drag",
    internalLayout.value,
    oldDragItem.value,
    l,
    activeDrag.value,
    event.e,
    event.node
  );
};

const onDragStop = (i: string, x: number, y: number, event: GridDragEvent) => {
  if (!activeDrag.value) return;

  const l = getLayoutItem(internalLayout.value, i);
  if (!l) return;

  const newLayout = moveElement(
    internalLayout.value,
    l,
    x,
    y,
    true,
    effectiveCompactor.value.preventCollision ?? false,
    effectiveCompactor.value.type,
    gridConfig.value.cols,
    effectiveCompactor.value.allowOverlap
  );

  const finalLayout = effectiveCompactor.value.compact(
    newLayout,
    gridConfig.value.cols
  );

  emit(
    "dragStop",
    finalLayout,
    oldDragItem.value,
    l,
    null,
    event.e,
    event.node
  );

  if (oldLayout.value && !deepEqual(oldLayout.value, finalLayout)) {
    emit("update:layout", finalLayout);
    emit("layoutChange", finalLayout);
  }

  isDragging = false;
  activeDrag.value = null;
  oldDragItem.value = null;
  oldLayout.value = null;
  internalLayout.value = finalLayout;
};

// ============================================================================
// Resize Handlers
// ============================================================================

const onResizeStart = (
  i: string,
  _w: number,
  _h: number,
  event: GridResizeEvent
) => {
  const l = getLayoutItem(internalLayout.value, i);
  if (!l) return;

  resizingItem.value = true;
  oldDragItem.value = cloneLayoutItem(l);
  oldLayout.value = cloneLayout(internalLayout.value);

  emit(
    "resizeStart",
    internalLayout.value,
    l,
    l,
    null,
    event.e,
    event.node
  );
};

const onResize = (i: string, w: number, h: number, event: GridResizeEvent) => {
  const l = getLayoutItem(internalLayout.value, i);
  if (!l) return;

  // Calculate position changes for handles that move the item (w, nw, sw, n, ne)
  const { x, y } = calculateResizePosition(l, w, h, event.handle);

  const newLayout = resizeElement(
    internalLayout.value,
    l,
    w,
    h,
    x,
    y,
    true,
    effectiveCompactor.value.preventCollision ?? false,
    effectiveCompactor.value.type,
    gridConfig.value.cols,
    effectiveCompactor.value.allowOverlap
  );

  const corrected = correctBounds(newLayout, { cols: gridConfig.value.cols });
  const compacted = effectiveCompactor.value.compact(
    corrected,
    gridConfig.value.cols
  );

  internalLayout.value = compacted;

  const updatedItem = getLayoutItem(compacted, i);

  emit(
    "resize",
    compacted,
    oldDragItem.value,
    updatedItem ?? null,
    null,
    event.e,
    event.node
  );
};

const onResizeStop = (
  i: string,
  w: number,
  h: number,
  event: GridResizeEvent
) => {
  const l = getLayoutItem(internalLayout.value, i);
  if (!l) return;

  // Calculate position changes for handles that move the item
  const { x, y } = calculateResizePosition(l, w, h, event.handle);

  const newLayout = resizeElement(
    internalLayout.value,
    l,
    w,
    h,
    x,
    y,
    true,
    effectiveCompactor.value.preventCollision ?? false,
    effectiveCompactor.value.type,
    gridConfig.value.cols,
    effectiveCompactor.value.allowOverlap
  );

  const corrected = correctBounds(newLayout, { cols: gridConfig.value.cols });
  const compacted = effectiveCompactor.value.compact(
    corrected,
    gridConfig.value.cols
  );

  const updatedItem = getLayoutItem(compacted, i);

  emit(
    "resizeStop",
    compacted,
    oldDragItem.value,
    updatedItem ?? null,
    null,
    event.e,
    event.node
  );

  if (oldLayout.value && !deepEqual(oldLayout.value, compacted)) {
    emit("update:layout", compacted);
    emit("layoutChange", compacted);
  }

  resizingItem.value = false;
  oldDragItem.value = null;
  oldLayout.value = null;
  internalLayout.value = compacted;
};

// ============================================================================
// Drop Handlers (External drag-in)
// ============================================================================

let dragEnterCounter = 0;

const handleDragEnter = (_e: DragEvent) => {
  if (!dropConfig.value.enabled) return;
  dragEnterCounter++;
};

const handleDragLeave = (_e: DragEvent) => {
  if (!dropConfig.value.enabled) return;
  dragEnterCounter--;

  if (dragEnterCounter === 0) {
    // Remove dropping placeholder
    const newLayout = internalLayout.value.filter(
      (item) => item.i !== "__dropping-elem__"
    );
    internalLayout.value = newLayout;
  }
};

const handleDragOver = (e: DragEvent) => {
  if (!dropConfig.value.enabled) return;

  e.preventDefault();

  // TODO: Implement drop handling with position calculation
};

const handleDrop = (e: DragEvent) => {
  if (!dropConfig.value.enabled) return;

  e.preventDefault();
  dragEnterCounter = 0;

  // TODO: Implement drop finalization
};

// ============================================================================
// Selection & Remove Handlers
// ============================================================================

const onItemSelect = (i: string) => {
  selectedItem.value = i;
  emit("itemSelected", i);
};

const clearSelection = () => {
  if (selectedItem.value !== null) {
    selectedItem.value = null;
    emit("itemSelected", null);
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && selectedItem.value) {
    const item = getLayoutItem(internalLayout.value, selectedItem.value);
    if (item) {
      // Emit remove event so parent can handle it
      emit("itemRemove", selectedItem.value, item);

      // Remove from layout
      const newLayout = internalLayout.value.filter(
        (l) => l.i !== selectedItem.value
      );
      internalLayout.value = effectiveCompactor.value.compact(
        newLayout,
        gridConfig.value.cols
      );

      emit("update:layout", internalLayout.value);
      emit("layoutChange", internalLayout.value);
    }
    selectedItem.value = null;
    emit("itemSelected", null);
  }
};

// Setup keyboard listener
onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    ref="containerRef"
    :class="containerClasses"
    :style="containerStyle"
    @click="clearSelection"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @dragover="handleDragOver"
    @drop="handleDrop"
  >
    <GridItem
      v-for="item in internalLayout"
      :key="item.i"
      :layout-item="item"
      :cols="gridConfig.cols"
      :row-height="gridConfig.rowHeight"
      :margin="gridConfig.margin"
      :container-padding="effectiveContainerPadding"
      :container-width="width"
      :max-rows="gridConfig.maxRows"
      :is-draggable="isItemDraggable(item)"
      :is-resizable="isItemResizable(item)"
      :is-bounded="dragConfig.bounded"
      :use-css-transforms="positionStrategy.type === 'transform'"
      :position-strategy="positionStrategy"
      :drag-threshold="dragConfig.threshold"
      :resize-handles="(item.resizeHandles ?? resizeConfig.handles) as ResizeHandleAxis[]"
      :constraints="constraints"
      :handle="dragConfig.handle"
      :cancel="dragConfig.cancel"
      :is-selected="selectedItem === item.i"
      @click.stop
      @select="onItemSelect"
      @drag-start="onDragStart"
      @drag="onDrag"
      @drag-stop="onDragStop"
      @resize-start="onResizeStart"
      @resize="onResize"
      @resize-stop="onResizeStop"
    >
      <slot :name="item.i" :item="item">
        <!-- Default slot for item content -->
      </slot>
    </GridItem>

    <!-- Placeholder during drag -->
    <div
      v-if="activeDrag"
      class="vue-grid-placeholder"
      :class="{ 'placeholder-resizing': resizingItem }"
      :style="placeholderStyle"
    />
  </div>
</template>

<style>
.vue-grid-layout {
  position: relative;
  transition: height 200ms ease;
}

.vue-grid-placeholder {
  background: red;
  opacity: 0.2;
  transition-duration: 100ms;
  z-index: 2;
  user-select: none;
  position: absolute;
}

.vue-grid-placeholder.placeholder-resizing {
  transition: none;
}
</style>

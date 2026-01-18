<script setup lang="ts">
import { ref, computed } from "vue";
import { GridLayout, ComponentSelector, useContainerWidth } from "../src";
import type { Layout, LayoutItem, CompactType, ResizeHandleAxis } from "../src/core/types";
import type { ComponentOption, NewItemPayload } from "../src/components/ComponentSelector.vue";
import { getCompactor } from "../src/core/compactors";
import { getWidgetComponent } from "./components";
import MaximizedOverlay from "./components/MaximizedOverlay.vue";
import "./components/widget-styles.css";

// Use the container width composable
const { width, containerRef, mounted } = useContainerWidth();

// Component options for the selector
const componentOptions: ComponentOption[] = [
  {
    id: "chart",
    label: "Chart Widget",
    defaultW: 3,
    defaultH: 2,
    minW: 2,
    minH: 2
  },
  {
    id: "table",
    label: "Data Table",
    defaultW: 4,
    defaultH: 3,
    minW: 2,
    minH: 2
  },
  {
    id: "text",
    label: "Text Block",
    defaultW: 2,
    defaultH: 1,
    minW: 1,
    minH: 1
  },
  {
    id: "image",
    label: "Image",
    defaultW: 2,
    defaultH: 2,
    minW: 1,
    minH: 1,
    maxW: 4,
    maxH: 4
  }
];

// Extended layout item type with component info
interface GridItemWithComponent {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  isResizable?: boolean;
  isDraggable?: boolean;
  static?: boolean;
  resizeHandles?: ResizeHandleAxis[];
  componentId?: string;
}

// Store componentId mapping separately (survives layout updates)
const componentMap = ref<Record<string, string>>({
  a: "text",
  b: "chart",
  c: "image",
  d: "table"
});

// Initial layout with resize constraints
const layout = ref<GridItemWithComponent[]>([
  { i: "a", x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1, maxW: 4, maxH: 4 },
  { i: "b", x: 2, y: 0, w: 2, h: 3, minW: 2, minH: 2 },
  { i: "c", x: 4, y: 0, w: 2, h: 2 },
  { i: "d", x: 0, y: 2, w: 2, h: 2, isResizable: false },
  { i: "e", x: 2, y: 3, w: 2, h: 2 },
  { i: "f", x: 4, y: 2, w: 2, h: 2 }
]);



// Compaction type
const compactType = ref<CompactType>("vertical");

// Get compactor based on type
const compactor = computed(() => getCompactor(compactType.value));

// Resize handles options (for demo toggle UI)
const resizeHandlesOptions: ResizeHandleAxis[] = ["s", "w", "e", "n", "sw", "nw", "se", "ne"];
const selectedHandles = ref<ResizeHandleAxis[]>(resizeHandlesOptions);

// Grid config
const gridConfig = computed(() => ({
  cols: 6,
  rowHeight: 100,
  margin: [10, 10] as readonly [number, number],
  containerPadding: [10, 10] as readonly [number, number]
}));

// Resize config
const resizeConfig = computed(() => ({
  enabled: true,
  handles: selectedHandles.value
}));

// Handle layout change
const onLayoutChange = (newLayout: Layout) => {
  console.log("Layout changed:", newLayout);
};

// Handle resize events
const onResizeStart = (...args: unknown[]) => {
  console.log("Resize started:", args);
};

const onResize = (...args: unknown[]) => {
  console.log("Resizing:", args);
};

const onResizeStop = (...args: unknown[]) => {
  console.log("Resize stopped:", args);
};

// Handle component selection - add new item from ComponentSelector
const onAddComponent = (payload: NewItemPayload) => {
  const newItem: GridItemWithComponent = {
    i: payload.i,
    x: payload.x,
    y: payload.y,
    w: payload.w,
    h: payload.h,
    minW: payload.minW,
    minH: payload.minH,
    maxW: payload.maxW,
    maxH: payload.maxH,
    isResizable: payload.isResizable,
    isDraggable: payload.isDraggable
  };
  // Store componentId in separate map (survives layout updates)
  if (payload.componentId) {
    componentMap.value[payload.i] = payload.componentId;
  }
  layout.value = [...layout.value, newItem];
  console.log("Added component:", payload.componentId, newItem);
};

// Remove last item
const removeItem = () => {
  if (layout.value.length > 1) {
    const removedItem = layout.value[layout.value.length - 1];
    // Clean up componentMap
    if (removedItem) {
      delete componentMap.value[removedItem.i];
    }
    layout.value = layout.value.slice(0, -1);
  }
};

// Get component ID by item ID from the separate map
const getComponentId = (itemId: string): string | undefined => {
  return componentMap.value[itemId];
};

// Maximize state
const maximizedItemId = ref<string | null>(null);

const maximizedItem = computed<LayoutItem | null>(() => {
  if (!maximizedItemId.value) return null;
  return layout.value.find(item => item.i === maximizedItemId.value) ?? null;
});

const onMaximize = (itemId: string) => {
  maximizedItemId.value = itemId;
};

const onMinimize = () => {
  maximizedItemId.value = null;
};
</script>

<template>
  <div>
    <h1>Vue3 Grid Layout - Resize Example</h1>

    <div class="controls">
      <ComponentSelector
        :options="componentOptions"
        placeholder="Add component..."
        @add="onAddComponent"
      />
      <button @click="removeItem">Remove Last</button>
      <select v-model="compactType">
        <option value="vertical">Vertical Compaction</option>
        <option value="horizontal">Horizontal Compaction</option>
        <option :value="null">No Compaction</option>
      </select>
    </div>

    <!-- <div class="controls">
      <span>Resize Handles:</span>
      <label v-for="handle in resizeHandlesOptions" :key="handle" class="checkbox-label">
        <input
          type="checkbox"
          :value="handle"
          v-model="selectedHandles"
        />
        {{ handle }}
      </label>
    </div> -->

    <div class="legend">
      <span><strong>Components:</strong></span>
      <span v-for="opt in componentOptions" :key="opt.id" class="legend-item">
        <span class="component-badge" :class="opt.id">{{ opt.label }}</span>
        ({{ opt.defaultW }}x{{ opt.defaultH }})
      </span>
    </div>

    <div ref="containerRef" class="grid-container">
      <GridLayout
        v-if="mounted"
        v-model:layout="layout"
        :width="width"
        :grid-config="gridConfig"
        :resize-config="resizeConfig"
        :compactor="compactor"
        @layout-change="onLayoutChange"
        @resize-start="onResizeStart"
        @resize="onResize"
        @resize-stop="onResizeStop"
      >
        <template v-for="item in layout" :key="item.i" #[item.i]="{ item: layoutItem }">
          <component
            :is="getWidgetComponent(getComponentId(layoutItem.i))"
            :item="layoutItem"
            @maximize="onMaximize(layoutItem.i)"
          />
        </template>
      </GridLayout>
    </div>

    <div style="margin-top: 20px; padding: 10px; background: #fff; border-radius: 4px;">
      <h3>Current Layout:</h3>
      <pre>{{ JSON.stringify(layout, null, 2) }}</pre>
    </div>

    <!-- Maximized Overlay -->
    <MaximizedOverlay
      v-if="maximizedItem"
      :item="maximizedItem"
      @minimize="onMinimize"
    >
      <template #title>
        {{ getComponentId(maximizedItem.i)?.toUpperCase() || 'Widget' }} - {{ maximizedItem.i }}
      </template>
      <component
        :is="getWidgetComponent(getComponentId(maximizedItem.i))"
        :item="maximizedItem"
        class="maximized-widget"
      />
    </MaximizedOverlay>
  </div>
</template>

<style scoped>
.controls {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.legend {
  margin-bottom: 10px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 14px;
}

.grid-container {
  background: #e0e0e0;
  min-height: 400px;
}

.grid-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.item-id {
  font-size: 24px;
  font-weight: bold;
}

.item-size {
  font-size: 14px;
  color: #666;
}

.item-badge {
  margin-top: 4px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.item-badge.static {
  background: #ffeb3b;
  color: #333;
}

.item-badge.no-resize {
  background: #bdbdbd;
  color: #333;
}

/* Legend styles */
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.component-badge {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  color: #fff;
}

.component-badge.chart {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.component-badge.table {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.component-badge.text {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.component-badge.image {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

/* Maximized widget fills the overlay content area */
.maximized-widget {
  height: 100%;
  min-height: calc(100dvh - 100px);
}
</style>

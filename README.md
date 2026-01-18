# Vue3 Grid Layout

A draggable and resizable grid layout system for Vue 3, inspired by [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout).

## Features

- Draggable grid items
- Resizable grid items with **all 8 resize handles** enabled by default (N, S, E, W, NE, NW, SE, SW)
- **Maximize/Minimize overlay** for fullscreen item viewing
- Responsive breakpoints support
- Vertical, horizontal, and no compaction modes
- Collision detection and prevention
- CSS transform-based positioning for performance
- TypeScript support
- Customizable constraints (min/max size, aspect ratio, bounds)
- Component selector for dynamic widget creation

## Installation

```bash
npm install vue3-grid-layout
```

## Basic Usage

```vue
<script setup lang="ts">
import { ref } from "vue";
import { GridLayout, useContainerWidth } from "vue3-grid-layout";
import type { Layout } from "vue3-grid-layout";

const { width, containerRef, mounted } = useContainerWidth();

const layout = ref<Layout>([
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 2, h: 2 },
  { i: "c", x: 4, y: 0, w: 2, h: 2 }
]);
</script>

<template>
  <div ref="containerRef">
    <GridLayout
      v-if="mounted"
      v-model:layout="layout"
      :width="width"
    >
      <template v-for="item in layout" :key="item.i" #[item.i]="{ item: layoutItem }">
        <div class="grid-item">
          {{ layoutItem.i }}
        </div>
      </template>
    </GridLayout>
  </div>
</template>
```

## Components

### GridLayout

The main grid container component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `layout` | `Layout` | required | Array of layout items (use `v-model:layout`) |
| `width` | `number` | required | Container width in pixels |
| `gridConfig` | `GridConfig` | `defaultGridConfig` | Grid configuration |
| `dragConfig` | `DragConfig` | `defaultDragConfig` | Drag behavior configuration |
| `resizeConfig` | `ResizeConfig` | `defaultResizeConfig` | Resize behavior configuration |
| `compactor` | `Compactor` | `verticalCompactor` | Compaction strategy |
| `positionStrategy` | `PositionStrategy` | `transformStrategy` | CSS positioning strategy |
| `constraints` | `LayoutConstraint[]` | `defaultConstraints` | Layout constraints |
| `autoSize` | `boolean` | `true` | Auto-adjust container height |

#### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:layout` | `Layout` | Layout changed (for v-model) |
| `layoutChange` | `Layout` | Layout changed |
| `dragStart` | `EventCallback` args | Drag started |
| `drag` | `EventCallback` args | Dragging |
| `dragStop` | `EventCallback` args | Drag stopped |
| `resizeStart` | `EventCallback` args | Resize started |
| `resize` | `EventCallback` args | Resizing |
| `resizeStop` | `EventCallback` args | Resize stopped |
| `itemSelected` | `string \| null` | Item selected/deselected |
| `itemRemove` | `string, LayoutItem` | Item removed (ESC key) |

### ResponsiveGridLayout

Grid layout with responsive breakpoint support.

```vue
<script setup>
import { ResponsiveGridLayout } from "vue3-grid-layout";

const layouts = ref({
  lg: [{ i: "a", x: 0, y: 0, w: 4, h: 2 }],
  md: [{ i: "a", x: 0, y: 0, w: 3, h: 2 }],
  sm: [{ i: "a", x: 0, y: 0, w: 2, h: 2 }]
});
</script>

<template>
  <ResponsiveGridLayout v-model:layouts="layouts">
    <!-- slots -->
  </ResponsiveGridLayout>
</template>
```

### ComponentSelector

A dropdown selector for dynamically adding grid items.

```vue
<script setup>
import { ComponentSelector } from "vue3-grid-layout";
import type { ComponentOption, NewItemPayload } from "vue3-grid-layout";

const options: ComponentOption[] = [
  { id: "chart", label: "Chart", defaultW: 3, defaultH: 2 },
  { id: "table", label: "Table", defaultW: 4, defaultH: 3 }
];

const onAdd = (payload: NewItemPayload) => {
  // Add new item to layout
  layout.value.push({
    i: payload.i,
    x: payload.x,
    y: payload.y,
    w: payload.w,
    h: payload.h
  });
};
</script>

<template>
  <ComponentSelector :options="options" @add="onAdd" />
</template>
```

### MaximizedOverlay

A fullscreen overlay component for displaying grid items in maximized view.

```vue
<script setup>
import { ref, computed } from "vue";
import { GridLayout, MaximizedOverlay } from "vue3-grid-layout";
import type { LayoutItem } from "vue3-grid-layout";

const layout = ref([
  { i: "a", x: 0, y: 0, w: 2, h: 2 },
  { i: "b", x: 2, y: 0, w: 2, h: 2 }
]);

// Track which item is maximized
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
  <GridLayout v-model:layout="layout" :width="width">
    <template v-for="item in layout" :key="item.i" #[item.i]="{ item: layoutItem }">
      <div class="my-widget">
        <button @click="onMaximize(layoutItem.i)">Maximize</button>
        {{ layoutItem.i }}
      </div>
    </template>
  </GridLayout>

  <!-- Maximized Overlay -->
  <MaximizedOverlay
    v-if="maximizedItem"
    :item="maximizedItem"
    @minimize="onMinimize"
  >
    <template #title>
      Widget {{ maximizedItem.i }}
    </template>
    <div class="maximized-content">
      <!-- Your maximized widget content -->
    </div>
  </MaximizedOverlay>
</template>
```

#### MaximizedOverlay Props

| Prop | Type | Description |
|------|------|-------------|
| `item` | `LayoutItem` | The layout item being maximized |

#### MaximizedOverlay Events

| Event | Payload | Description |
|-------|---------|-------------|
| `minimize` | - | Emitted when minimize button clicked or ESC key pressed |

#### MaximizedOverlay Slots

| Slot | Props | Description |
|------|-------|-------------|
| `default` | - | Content to display in the maximized view |
| `title` | - | Custom title in the overlay header |

#### MaximizedOverlay Features

- **Fullscreen display**: Uses `100dvw` x `100dvh` for proper viewport coverage
- **Teleport to body**: Renders outside the grid container for proper z-index stacking
- **ESC key support**: Press Escape to minimize
- **Auto-focus**: Overlay automatically receives focus for keyboard events
- **Smooth animation**: Fade-in animation on open

## Layout Item Properties

| Property | Type | Description |
|----------|------|-------------|
| `i` | `string` | Unique identifier |
| `x` | `number` | X position in grid units |
| `y` | `number` | Y position in grid units |
| `w` | `number` | Width in grid units |
| `h` | `number` | Height in grid units |
| `minW` | `number?` | Minimum width |
| `minH` | `number?` | Minimum height |
| `maxW` | `number?` | Maximum width |
| `maxH` | `number?` | Maximum height |
| `static` | `boolean?` | If true, item cannot be moved or resized |
| `isDraggable` | `boolean?` | Override grid-level draggable setting |
| `isResizable` | `boolean?` | Override grid-level resizable setting |
| `resizeHandles` | `ResizeHandleAxis[]?` | Override resize handles |

## Grid Configuration

```typescript
const gridConfig = {
  cols: 12,              // Number of columns
  rowHeight: 150,        // Row height in pixels
  margin: [10, 10],      // [horizontal, vertical] margin
  containerPadding: [10, 10], // Container padding
  maxRows: Infinity      // Maximum rows
};
```

## Compaction Modes

```typescript
import { getCompactor } from "vue3-grid-layout";

// Vertical compaction (default) - items move up
const vertical = getCompactor("vertical");

// Horizontal compaction - items move left
const horizontal = getCompactor("horizontal");

// No compaction - free positioning
const none = getCompactor(null);
```

## Resize Handles

By default, **all 8 resize handles are enabled** for maximum flexibility. Users can resize items from any edge or corner.

### Available Handle Positions

| Handle | Position | Description |
|--------|----------|-------------|
| `n` | North | Top edge |
| `s` | South | Bottom edge |
| `e` | East | Right edge |
| `w` | West | Left edge |
| `ne` | Northeast | Top-right corner |
| `nw` | Northwest | Top-left corner |
| `se` | Southeast | Bottom-right corner |
| `sw` | Southwest | Bottom-left corner |

### Default Configuration

```typescript
// All 8 handles enabled by default
const resizeConfig = {
  enabled: true,
  handles: ["s", "w", "e", "n", "sw", "nw", "se", "ne"]
};
```

### Custom Handle Configuration

You can customize which handles are available:

```typescript
// Only corner handles
const resizeConfig = {
  enabled: true,
  handles: ["se", "sw", "ne", "nw"]
};

// Only bottom-right (classic behavior)
const resizeConfig = {
  enabled: true,
  handles: ["se"]
};

// Horizontal resize only
const resizeConfig = {
  enabled: true,
  handles: ["e", "w"]
};
```

### Per-Item Handle Override

Individual items can override the global resize handles:

```typescript
const layout = [
  { i: "a", x: 0, y: 0, w: 2, h: 2 }, // Uses global handles
  { i: "b", x: 2, y: 0, w: 2, h: 2, resizeHandles: ["se"] }, // Only SE handle
  { i: "c", x: 4, y: 0, w: 2, h: 2, isResizable: false } // No resize
];
```

### Resize Events

The GridLayout emits resize events with handle information:

```vue
<GridLayout
  @resize-start="onResizeStart"
  @resize="onResize"
  @resize-stop="onResizeStop"
>
```

```typescript
const onResizeStart = (layout, oldItem, newItem, placeholder, event, node) => {
  console.log("Resize started");
};

const onResize = (layout, oldItem, newItem, placeholder, event, node) => {
  console.log("Resizing:", newItem.w, "x", newItem.h);
};

const onResizeStop = (layout, oldItem, newItem, placeholder, event, node) => {
  console.log("Resize stopped");
};
```

## Composables

### useContainerWidth

Reactive container width measurement.

```typescript
const { width, containerRef, mounted } = useContainerWidth();
```

### useGridLayout

Programmatic grid layout control.

```typescript
const { layout, addItem, removeItem, moveItem } = useGridLayout(options);
```

### useResponsiveLayout

Responsive breakpoint management.

```typescript
const { currentBreakpoint, layouts, cols } = useResponsiveLayout(options);
```

## Constraints

Built-in constraints for layout items:

```typescript
import { gridBounds, minMaxSize, aspectRatio } from "vue3-grid-layout";

const constraints = [
  gridBounds,           // Keep items within grid bounds
  minMaxSize,           // Enforce min/max size
  aspectRatio(16/9)     // Maintain aspect ratio
];
```

## Styling

The library automatically injects required CSS styles. Grid items receive these classes:

- `.vue-grid-item` - Base class
- `.vue-draggable` - Draggable item
- `.vue-draggable-dragging` - Currently dragging
- `.resizing` - Currently resizing
- `.static` - Static item
- `.vue-grid-item-selected` - Selected item

## TypeScript

Full TypeScript support with exported types:

```typescript
// Components
import {
  GridLayout,
  GridItem,
  ResponsiveGridLayout,
  ComponentSelector,
  MaximizedOverlay
} from "vue3-grid-layout";

// Types
import type {
  Layout,
  LayoutItem,
  GridConfig,
  DragConfig,
  ResizeConfig,
  CompactType,
  ResizeHandleAxis,
  Compactor,
  PositionStrategy,
  LayoutConstraint,
  ComponentOption,
  NewItemPayload
} from "vue3-grid-layout";
```

## License

MIT

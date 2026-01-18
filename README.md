# Vue3 Grid Layout

A draggable and resizable grid layout system for Vue 3, inspired by [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout).

## Features

- Draggable grid items
- Resizable grid items with multiple handle positions
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

Available resize handle positions:

- `s` - South (bottom)
- `n` - North (top)
- `e` - East (right)
- `w` - West (left)
- `se` - Southeast (bottom-right)
- `sw` - Southwest (bottom-left)
- `ne` - Northeast (top-right)
- `nw` - Northwest (top-left)

```typescript
const resizeConfig = {
  enabled: true,
  handles: ["se", "sw", "ne", "nw"] // Corner handles
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
  LayoutConstraint
} from "vue3-grid-layout";
```

## License

MIT

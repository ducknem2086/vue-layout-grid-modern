<script setup lang="ts">
/**
 * ResponsiveGridLayout component
 *
 * A responsive grid layout that automatically adjusts to container width.
 */

import { ref, computed, watch } from "vue";
import { deepEqual } from "fast-equals";
import type {
  Layout,
  LayoutItem,
  Breakpoints,
  ResponsiveLayouts,
  Compactor,
  DragConfig,
  ResizeConfig,
  DropConfig,
  PositionStrategy,
  LayoutConstraint,
  EventCallback
} from "../core/types";
import { cloneLayout, correctBounds } from "../core/layout";
import {
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  findOrGenerateResponsiveLayout,
  getIndentationValue
} from "../core/responsive";
import { getCompactor } from "../core/compactors";
import GridLayout from "./GridLayout.vue";

// ============================================================================
// Types
// ============================================================================

// Type for default breakpoints (used internally)
// type DefaultBreakpoints = "lg" | "md" | "sm" | "xs" | "xxs";

// ============================================================================
// Props & Emits
// ============================================================================

interface Props {
  /** Container width in pixels */
  width: number;
  /** Current breakpoint (optional, auto-detected from width) */
  breakpoint?: string;
  /** Breakpoint definitions (name → min-width) */
  breakpoints?: Breakpoints;
  /** Column counts per breakpoint */
  cols?: Breakpoints;
  /** Layouts for each breakpoint */
  layouts?: ResponsiveLayouts;
  /** Row height (default: 150) */
  rowHeight?: number;
  /** Maximum rows (default: Infinity) */
  maxRows?: number;
  /** Margin between items - can be fixed or per-breakpoint */
  margin?: readonly [number, number] | Partial<Record<string, readonly [number, number]>>;
  /** Container padding - can be fixed or per-breakpoint */
  containerPadding?:
    | readonly [number, number]
    | Partial<Record<string, readonly [number, number] | null>>
    | null;
  /** Compactor for layout compaction */
  compactor?: Compactor;
  /** Drag configuration */
  dragConfig?: Partial<DragConfig>;
  /** Resize configuration */
  resizeConfig?: Partial<ResizeConfig>;
  /** Drop configuration */
  dropConfig?: Partial<DropConfig>;
  /** Position strategy (transform or absolute) */
  positionStrategy?: PositionStrategy;
  /** Layout constraints */
  constraints?: LayoutConstraint[];
  /** Auto-size container height */
  autoSize?: boolean;
  /** Additional CSS class */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  breakpoints: () => ({
    lg: 1200,
    md: 996,
    sm: 768,
    xs: 480,
    xxs: 0
  }),
  cols: () => ({
    lg: 12,
    md: 10,
    sm: 6,
    xs: 4,
    xxs: 2
  }),
  layouts: () => ({}),
  rowHeight: 150,
  maxRows: Infinity,
  margin: () => [10, 10] as readonly [number, number],
  containerPadding: null,
  autoSize: true
});

const emit = defineEmits<{
  (e: "update:layouts", layouts: ResponsiveLayouts): void;
  (e: "layoutChange", layout: Layout, layouts: ResponsiveLayouts): void;
  (e: "breakpointChange", newBreakpoint: string, cols: number): void;
  (e: "widthChange", width: number, margin: readonly [number, number], cols: number, padding: readonly [number, number] | null): void;
  (e: "dragStart", ...args: Parameters<EventCallback>): void;
  (e: "drag", ...args: Parameters<EventCallback>): void;
  (e: "dragStop", ...args: Parameters<EventCallback>): void;
  (e: "resizeStart", ...args: Parameters<EventCallback>): void;
  (e: "resize", ...args: Parameters<EventCallback>): void;
  (e: "resizeStop", ...args: Parameters<EventCallback>): void;
  (e: "drop", layout: Layout, item: LayoutItem | undefined, event: Event): void;
}>();

// ============================================================================
// Slots
// ============================================================================

const slots = defineSlots<{
  [key: string]: (props: { item: LayoutItem }) => unknown;
}>();

// ============================================================================
// Computed / Derived State
// ============================================================================

const effectiveCompactor = computed<Compactor>(
  () => props.compactor ?? getCompactor("vertical")
);

// Calculate initial breakpoint
const getInitialBreakpoint = (): string => {
  return props.breakpoint ?? getBreakpointFromWidth(props.breakpoints, props.width);
};

// Calculate initial cols
const getInitialCols = (bp: string): number => {
  return getColsFromBreakpoint(bp, props.cols);
};

// Calculate initial layout
const getInitialLayout = (bp: string, cols: number): Layout => {
  return findOrGenerateResponsiveLayout(
    props.layouts,
    props.breakpoints,
    bp,
    bp,
    cols,
    effectiveCompactor.value.type
  );
};

// ============================================================================
// State
// ============================================================================

const initialBp = getInitialBreakpoint();
const initialCols = getInitialCols(initialBp);

const currentBreakpoint = ref<string>(initialBp);
const currentCols = ref<number>(initialCols);
const currentLayout = ref<Layout>(getInitialLayout(initialBp, initialCols));
const internalLayouts = ref<ResponsiveLayouts>({ ...props.layouts });

// Track previous values for change detection
let prevWidth = props.width;
let prevBreakpointProp = props.breakpoint;
let prevBreakpoints = props.breakpoints;
let prevColsConfig = props.cols;
let prevCompactType = effectiveCompactor.value.type;

// ============================================================================
// Computed Values
// ============================================================================

const currentMargin = computed<readonly [number, number]>(() => {
  return getIndentationValue(
    props.margin as Parameters<typeof getIndentationValue>[0],
    currentBreakpoint.value
  );
});

const currentContainerPadding = computed<readonly [number, number] | null>(() => {
  if (props.containerPadding === null) return null;
  return getIndentationValue(
    props.containerPadding as Parameters<typeof getIndentationValue>[0],
    currentBreakpoint.value
  );
});

const gridConfig = computed(() => ({
  cols: currentCols.value,
  rowHeight: props.rowHeight,
  maxRows: props.maxRows,
  margin: currentMargin.value,
  containerPadding: currentContainerPadding.value
}));

// ============================================================================
// Watchers
// ============================================================================

// Watch for props.layouts changes
watch(
  () => props.layouts,
  (newLayouts) => {
    if (!deepEqual(newLayouts, internalLayouts.value)) {
      const newLayout = findOrGenerateResponsiveLayout(
        newLayouts,
        props.breakpoints,
        currentBreakpoint.value,
        currentBreakpoint.value,
        currentCols.value,
        effectiveCompactor.value
      );
      currentLayout.value = newLayout;
      internalLayouts.value = { ...newLayouts };
    }
  },
  { deep: true }
);

// Watch for compactor type changes
watch(
  () => effectiveCompactor.value.type,
  (newCompactType) => {
    if (newCompactType !== prevCompactType) {
      const newLayout = effectiveCompactor.value.compact(
        cloneLayout(currentLayout.value),
        currentCols.value
      );
      const newLayouts = {
        ...internalLayouts.value,
        [currentBreakpoint.value]: newLayout
      };

      currentLayout.value = newLayout;
      internalLayouts.value = newLayouts;
      emit("layoutChange", newLayout, newLayouts);
      emit("update:layouts", newLayouts);
      prevCompactType = newCompactType;
    }
  }
);

// Watch for width and breakpoint-related changes
watch(
  [
    () => props.width,
    () => props.breakpoint,
    () => props.breakpoints,
    () => props.cols
  ],
  ([newWidth, newBreakpointProp, newBreakpoints, newColsConfig]) => {
    const widthChanged = newWidth !== prevWidth;
    const breakpointPropChanged = newBreakpointProp !== prevBreakpointProp;
    const breakpointsChanged = !deepEqual(newBreakpoints, prevBreakpoints);
    const colsChanged = !deepEqual(newColsConfig, prevColsConfig);

    if (widthChanged || breakpointPropChanged || breakpointsChanged || colsChanged) {
      const newBreakpoint = newBreakpointProp ?? getBreakpointFromWidth(newBreakpoints, newWidth);
      const newCols = getColsFromBreakpoint(newBreakpoint, newColsConfig);
      const lastBreakpoint = currentBreakpoint.value;

      // Breakpoint change
      if (lastBreakpoint !== newBreakpoint || breakpointsChanged || colsChanged) {
        const newLayouts = { ...internalLayouts.value };

        // Preserve current layout if not in layouts
        if (!newLayouts[lastBreakpoint]) {
          newLayouts[lastBreakpoint] = cloneLayout(currentLayout.value);
        }

        // Find or generate new layout
        let newLayout = findOrGenerateResponsiveLayout(
          newLayouts,
          newBreakpoints,
          newBreakpoint,
          lastBreakpoint,
          newCols,
          effectiveCompactor.value
        );

        // Correct bounds and compact
        newLayout = correctBounds([...newLayout], { cols: newCols });
        newLayout = effectiveCompactor.value.compact(newLayout, newCols);

        // Store new layout
        newLayouts[newBreakpoint] = newLayout;

        // Update state
        currentBreakpoint.value = newBreakpoint;
        currentCols.value = newCols;
        currentLayout.value = newLayout;
        internalLayouts.value = newLayouts;

        // Emit events
        emit("breakpointChange", newBreakpoint, newCols);
        emit("layoutChange", newLayout, newLayouts);
        emit("update:layouts", newLayouts);
      }

      // Get margin and padding for width change callback
      const margin = getIndentationValue(
        props.margin as Parameters<typeof getIndentationValue>[0],
        newBreakpoint
      );
      const padding = props.containerPadding
        ? getIndentationValue(
            props.containerPadding as Parameters<typeof getIndentationValue>[0],
            newBreakpoint
          )
        : null;

      emit("widthChange", newWidth, margin, newCols, padding);

      // Update prev values
      prevWidth = newWidth;
      prevBreakpointProp = newBreakpointProp;
      prevBreakpoints = newBreakpoints;
      prevColsConfig = newColsConfig;
    }
  },
  { immediate: false }
);

// ============================================================================
// Event Handlers
// ============================================================================

const handleLayoutChange = (newLayout: Layout) => {
  const newLayouts = {
    ...internalLayouts.value,
    [currentBreakpoint.value]: newLayout
  };

  currentLayout.value = newLayout;
  internalLayouts.value = newLayouts;
  emit("layoutChange", newLayout, newLayouts);
  emit("update:layouts", newLayouts);
};

// Forward events from GridLayout
const onDragStart = (...args: Parameters<EventCallback>) => emit("dragStart", ...args);
const onDrag = (...args: Parameters<EventCallback>) => emit("drag", ...args);
const onDragStop = (...args: Parameters<EventCallback>) => emit("dragStop", ...args);
const onResizeStart = (...args: Parameters<EventCallback>) => emit("resizeStart", ...args);
const onResize = (...args: Parameters<EventCallback>) => emit("resize", ...args);
const onResizeStop = (...args: Parameters<EventCallback>) => emit("resizeStop", ...args);
const onDrop = (layout: Layout, item: LayoutItem | undefined, event: Event) => {
  emit("drop", layout, item, event);
};
</script>

<template>
  <GridLayout
    :layout="currentLayout"
    :width="width"
    :grid-config="gridConfig"
    :drag-config="dragConfig"
    :resize-config="resizeConfig"
    :drop-config="dropConfig"
    :position-strategy="positionStrategy"
    :compactor="effectiveCompactor"
    :constraints="constraints"
    :auto-size="autoSize"
    :class="props.class"
    @update:layout="handleLayoutChange"
    @layout-change="handleLayoutChange"
    @drag-start="onDragStart"
    @drag="onDrag"
    @drag-stop="onDragStop"
    @resize-start="onResizeStart"
    @resize="onResize"
    @resize-stop="onResizeStop"
    @drop="onDrop"
  >
    <template v-for="(_, slotName) in slots" :key="slotName" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps" />
    </template>
  </GridLayout>
</template>

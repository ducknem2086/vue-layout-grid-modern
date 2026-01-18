/**
 * useGridLayout composable
 *
 * Core composable for managing grid layout state, including drag, resize, and drop operations.
 * This extracts the state management logic into a reusable composable.
 */

import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import { deepEqual } from "fast-equals";
import type {
  Layout,
  LayoutItem,
  DroppingPosition,
  Compactor,
  Mutable
} from "../core/types";
import {
  cloneLayout,
  cloneLayoutItem,
  moveElement,
  correctBounds,
  bottom,
  getLayoutItem
} from "../core/layout";
import { verticalCompactor } from "../core/compactors";

// ============================================================================
// Types
// ============================================================================

export interface DragState {
  /** Currently dragging item placeholder */
  activeDrag: LayoutItem | null;
  /** Original item before drag started */
  oldDragItem: LayoutItem | null;
  /** Layout before drag started */
  oldLayout: Layout | null;
}

export interface ResizeState {
  /** Whether a resize is in progress */
  resizing: boolean;
  /** Original item before resize started */
  oldResizeItem: LayoutItem | null;
  /** Layout before resize started */
  oldLayout: Layout | null;
}

export interface DropState {
  /** Current drop position */
  droppingPosition: DroppingPosition | null;
}

export interface UseGridLayoutOptions {
  /** Initial layout (can be a ref for reactive binding) */
  layout: Ref<Layout> | Layout;
  /** Number of columns */
  cols: number;
  /** Prevent collisions when moving items */
  preventCollision?: boolean;
  /** Called when layout changes */
  onLayoutChange?: (layout: Layout) => void;
  /** Compactor for layout compaction (default: verticalCompactor) */
  compactor?: Compactor;
}

export interface UseGridLayoutResult {
  /** Current layout */
  layout: Ref<Layout>;
  /** Set layout directly */
  setLayout: (layout: Layout) => void;
  /** Drag state */
  dragState: Ref<DragState>;
  /** Resize state */
  resizeState: Ref<ResizeState>;
  /** Drop state */
  dropState: Ref<DropState>;
  /** Start dragging an item */
  onDragStart: (itemId: string, x: number, y: number) => LayoutItem | null;
  /** Update drag position */
  onDrag: (itemId: string, x: number, y: number) => void;
  /** Stop dragging */
  onDragStop: (itemId: string, x: number, y: number) => void;
  /** Start resizing an item */
  onResizeStart: (itemId: string) => LayoutItem | null;
  /** Update resize dimensions */
  onResize: (
    itemId: string,
    w: number,
    h: number,
    x?: number,
    y?: number
  ) => void;
  /** Stop resizing */
  onResizeStop: (itemId: string, w: number, h: number) => void;
  /** Start dropping (external drag-in) */
  onDropDragOver: (
    droppingItem: LayoutItem,
    position: DroppingPosition
  ) => void;
  /** Update drop position */
  onDropDragLeave: () => void;
  /** Complete drop */
  onDrop: (droppingItem: LayoutItem) => void;
  /** Container height in rows */
  containerHeight: ComputedRef<number>;
  /** Whether any drag/resize is active */
  isInteracting: ComputedRef<boolean>;
  /** Get the compactor being used */
  compactor: Compactor;
}

// ============================================================================
// Composable Implementation
// ============================================================================

/**
 * Composable for managing grid layout state.
 *
 * Handles all layout state including drag, resize, and drop operations.
 * Uses immutable updates and provides callbacks for all interactions.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useGridLayout } from 'vue3-grid-layout';
 *
 * const {
 *   layout,
 *   onDragStart,
 *   onDrag,
 *   onDragStop,
 *   containerHeight
 * } = useGridLayout({
 *   layout: initialLayout,
 *   cols: 12
 * });
 * </script>
 *
 * <template>
 *   <div :style="{ height: `${containerHeight}px` }">
 *     <GridItem
 *       v-for="item in layout"
 *       :key="item.i"
 *       v-bind="item"
 *       @drag-start="() => onDragStart(item.i, item.x, item.y)"
 *     />
 *   </div>
 * </template>
 * ```
 */
export function useGridLayout(
  options: UseGridLayoutOptions
): UseGridLayoutResult {
  const {
    cols,
    preventCollision = false,
    onLayoutChange,
    compactor = verticalCompactor
  } = options;

  // Handle both reactive ref and plain layout input
  const propsLayout = ref(
    "value" in options.layout ? options.layout.value : options.layout
  ) as Ref<Layout>;

  // Track if we're currently dragging to block prop updates
  let isDragging = false;

  // Initialize layout with compaction using the compactor
  const initializeLayout = (inputLayout: Layout): Layout => {
    const corrected = correctBounds(cloneLayout(inputLayout), { cols });
    return compactor.compact(corrected, cols);
  };

  const layout = ref<Layout>(initializeLayout(propsLayout.value));

  // Drag state
  const dragState = ref<DragState>({
    activeDrag: null,
    oldDragItem: null,
    oldLayout: null
  });

  // Resize state
  const resizeState = ref<ResizeState>({
    resizing: false,
    oldResizeItem: null,
    oldLayout: null
  });

  // Drop state
  const dropState = ref<DropState>({
    droppingPosition: null
  });

  // Track previous layout for change detection
  let prevLayout: Layout = layout.value;

  // Set layout with optional compaction
  const setLayout = (newLayout: Layout) => {
    const corrected = correctBounds(cloneLayout(newLayout), { cols });
    const compacted = compactor.compact(corrected, cols);
    layout.value = compacted;
  };

  // Sync layout from props when not dragging
  if ("value" in options.layout) {
    watch(
      () => (options.layout as Ref<Layout>).value,
      (newLayout) => {
        if (isDragging) return;
        if (!deepEqual(newLayout, prevLayout)) {
          setLayout(newLayout);
        }
      },
      { deep: true }
    );
  }

  // Notify layout changes
  watch(
    layout,
    (newLayout) => {
      if (!deepEqual(newLayout, prevLayout)) {
        prevLayout = newLayout;
        onLayoutChange?.(newLayout);
      }
    },
    { deep: true }
  );

  // ============================================================================
  // Drag Handlers
  // ============================================================================

  const onDragStart = (
    itemId: string,
    x: number,
    y: number
  ): LayoutItem | null => {
    const item = getLayoutItem(layout.value, itemId);
    if (!item) return null;

    isDragging = true;

    const placeholder: LayoutItem = {
      ...cloneLayoutItem(item),
      x,
      y,
      static: false,
      moved: false
    };

    dragState.value = {
      activeDrag: placeholder,
      oldDragItem: cloneLayoutItem(item),
      oldLayout: cloneLayout(layout.value)
    };

    return placeholder;
  };

  const onDrag = (itemId: string, x: number, y: number) => {
    const item = getLayoutItem(layout.value, itemId);
    if (!item) return;

    // Update placeholder position
    if (dragState.value.activeDrag) {
      dragState.value = {
        ...dragState.value,
        activeDrag: { ...dragState.value.activeDrag, x, y }
      };
    }

    // Move element and update layout
    const newLayout = moveElement(
      layout.value,
      item,
      x,
      y,
      true, // isUserAction
      preventCollision,
      compactor.type,
      cols,
      compactor.allowOverlap
    );

    // Compact layout
    const compacted = compactor.compact(newLayout, cols);
    layout.value = compacted;
  };

  const onDragStop = (itemId: string, x: number, y: number) => {
    const item = getLayoutItem(layout.value, itemId);
    if (!item) return;

    // Final move
    const newLayout = moveElement(
      layout.value,
      item,
      x,
      y,
      true,
      preventCollision,
      compactor.type,
      cols,
      compactor.allowOverlap
    );

    // Compact and finalize
    const compacted = compactor.compact(newLayout, cols);

    isDragging = false;

    dragState.value = {
      activeDrag: null,
      oldDragItem: null,
      oldLayout: null
    };

    layout.value = compacted;
  };

  // ============================================================================
  // Resize Handlers
  // ============================================================================

  const onResizeStart = (itemId: string): LayoutItem | null => {
    const item = getLayoutItem(layout.value, itemId);
    if (!item) return null;

    resizeState.value = {
      resizing: true,
      oldResizeItem: cloneLayoutItem(item),
      oldLayout: cloneLayout(layout.value)
    };

    return item;
  };

  const onResize = (
    itemId: string,
    w: number,
    h: number,
    x?: number,
    y?: number
  ) => {
    const newLayout = layout.value.map((item) => {
      if (item.i === itemId) {
        const updated: LayoutItem = {
          ...item,
          w,
          h
        };
        if (x !== undefined) (updated as Mutable<LayoutItem>).x = x;
        if (y !== undefined) (updated as Mutable<LayoutItem>).y = y;
        return updated;
      }
      return item;
    });

    // Correct bounds and compact
    const corrected = correctBounds(newLayout, { cols });
    const compacted = compactor.compact(corrected, cols);

    layout.value = compacted;
  };

  const onResizeStop = (itemId: string, w: number, h: number) => {
    // Apply final resize
    onResize(itemId, w, h);

    resizeState.value = {
      resizing: false,
      oldResizeItem: null,
      oldLayout: null
    };
  };

  // ============================================================================
  // Drop Handlers
  // ============================================================================

  const onDropDragOver = (
    droppingItem: LayoutItem,
    position: DroppingPosition
  ) => {
    // Check if item already exists in layout
    const existingItem = getLayoutItem(layout.value, droppingItem.i);

    if (!existingItem) {
      // Add dropping item to layout
      const newLayout = [...layout.value, droppingItem];
      const corrected = correctBounds(newLayout, { cols });
      const compacted = compactor.compact(corrected, cols);
      layout.value = compacted;
    }

    dropState.value = {
      droppingPosition: position
    };
  };

  const onDropDragLeave = () => {
    // Remove dropping placeholder from layout
    const newLayout = layout.value.filter(
      (item) => item.i !== "__dropping-elem__"
    );
    layout.value = newLayout;

    dropState.value = {
      droppingPosition: null
    };
  };

  const onDrop = (droppingItem: LayoutItem) => {
    // Replace placeholder with actual item
    const newLayout = layout.value.map((item) => {
      if (item.i === "__dropping-elem__") {
        return {
          ...item,
          i: droppingItem.i,
          static: false
        };
      }
      return item;
    });

    const corrected = correctBounds(newLayout, { cols });
    const compacted = compactor.compact(corrected, cols);
    layout.value = compacted;

    dropState.value = {
      droppingPosition: null
    };
  };

  // ============================================================================
  // Computed Values
  // ============================================================================

  const containerHeight = computed(() => bottom(layout.value));

  const isInteracting = computed(
    () =>
      dragState.value.activeDrag !== null ||
      resizeState.value.resizing ||
      dropState.value.droppingPosition !== null
  );

  return {
    layout,
    setLayout,
    dragState,
    resizeState,
    dropState,
    onDragStart,
    onDrag,
    onDragStop,
    onResizeStart,
    onResize,
    onResizeStop,
    onDropDragOver,
    onDropDragLeave,
    onDrop,
    containerHeight,
    isInteracting,
    compactor
  };
}

export default useGridLayout;

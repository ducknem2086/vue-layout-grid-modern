/**
 * useResponsiveLayout composable
 *
 * Manages responsive breakpoints and layout generation for different screen sizes.
 * Extracts state management into a reusable composable.
 */

import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import { deepEqual } from "fast-equals";
import type {
  Layout,
  Breakpoint,
  Breakpoints,
  ResponsiveLayouts,
  Compactor
} from "../core/types";
import { cloneLayout } from "../core/layout";
import {
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  findOrGenerateResponsiveLayout,
  sortBreakpoints
} from "../core/responsive";
import { verticalCompactor } from "../core/compactors";

// ============================================================================
// Types
// ============================================================================

/** Default breakpoint names */
export type DefaultBreakpoints = "lg" | "md" | "sm" | "xs" | "xxs";

/** Default breakpoint widths */
export const DEFAULT_BREAKPOINTS: Breakpoints<DefaultBreakpoints> = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0
};

/** Default column counts per breakpoint */
export const DEFAULT_COLS: Breakpoints<DefaultBreakpoints> = {
  lg: 12,
  md: 10,
  sm: 6,
  xs: 4,
  xxs: 2
};

export interface UseResponsiveLayoutOptions<
  B extends Breakpoint = DefaultBreakpoints
> {
  /** Current container width (can be a ref for reactive binding) */
  width: Ref<number> | number;
  /** Breakpoint definitions (name → min-width) */
  breakpoints?: Breakpoints<B>;
  /** Column counts per breakpoint */
  cols?: Breakpoints<B>;
  /** Layouts for each breakpoint */
  layouts?: ResponsiveLayouts<B>;
  /** Compactor for layout compaction (default: verticalCompactor) */
  compactor?: Compactor;
  /** Called when breakpoint changes */
  onBreakpointChange?: (newBreakpoint: B, cols: number) => void;
  /** Called when layout changes */
  onLayoutChange?: (layout: Layout, layouts: ResponsiveLayouts<B>) => void;
  /** Called when width changes */
  onWidthChange?: (
    width: number,
    margin: readonly [number, number],
    cols: number,
    containerPadding: readonly [number, number] | null
  ) => void;
}

export interface UseResponsiveLayoutResult<
  B extends Breakpoint = DefaultBreakpoints
> {
  /** Current layout for the active breakpoint */
  layout: ComputedRef<Layout>;
  /** All layouts by breakpoint */
  layouts: Ref<ResponsiveLayouts<B>>;
  /** Current active breakpoint */
  breakpoint: Ref<B>;
  /** Column count for the current breakpoint */
  cols: Ref<number>;
  /** Update layouts for a specific breakpoint */
  setLayoutForBreakpoint: (breakpoint: B, layout: Layout) => void;
  /** Update all layouts */
  setLayouts: (layouts: ResponsiveLayouts<B>) => void;
  /** Sorted array of breakpoint names (smallest to largest) */
  sortedBreakpoints: ComputedRef<B[]>;
}

// ============================================================================
// Composable Implementation
// ============================================================================

/**
 * Composable for managing responsive grid layouts.
 *
 * Automatically selects the appropriate layout based on container width
 * and generates layouts for new breakpoints from existing ones.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useContainerWidth, useResponsiveLayout } from 'vue3-grid-layout';
 *
 * const { width, containerRef } = useContainerWidth();
 * const { layout, breakpoint, cols } = useResponsiveLayout({
 *   width,
 *   layouts: {
 *     lg: [...],
 *     md: [...],
 *     sm: [...]
 *   }
 * });
 * </script>
 *
 * <template>
 *   <div ref="containerRef">
 *     <GridLayout
 *       :width="width"
 *       :cols="cols"
 *       :layout="layout"
 *     />
 *   </div>
 * </template>
 * ```
 */
export function useResponsiveLayout<B extends Breakpoint = DefaultBreakpoints>(
  options: UseResponsiveLayoutOptions<B>
): UseResponsiveLayoutResult<B> {
  const {
    breakpoints = DEFAULT_BREAKPOINTS as unknown as Breakpoints<B>,
    cols: colsConfig = DEFAULT_COLS as unknown as Breakpoints<B>,
    layouts: propsLayouts = {} as ResponsiveLayouts<B>,
    compactor = verticalCompactor,
    onBreakpointChange,
    onLayoutChange,
    onWidthChange
  } = options;

  // Handle both reactive ref and plain number input
  const widthRef = computed(() =>
    typeof options.width === "number" ? options.width : options.width.value
  );

  // Sorted breakpoints for consistent ordering
  const sortedBreakpointsComputed = computed(() =>
    sortBreakpoints(breakpoints)
  );

  // Calculate initial breakpoint and cols
  const initialBreakpoint = getBreakpointFromWidth(breakpoints, widthRef.value);
  const initialCols = getColsFromBreakpoint(initialBreakpoint, colsConfig);

  // State
  const breakpoint = ref<B>(initialBreakpoint) as Ref<B>;
  const cols = ref<number>(initialCols);

  // Initialize layouts
  const initializeLayouts = (): ResponsiveLayouts<B> => {
    const cloned = {} as ResponsiveLayouts<B>;
    for (const bp of sortedBreakpointsComputed.value) {
      const layout = propsLayouts[bp];
      if (layout) {
        (cloned as Record<B, Layout>)[bp] = cloneLayout(layout);
      }
    }
    return cloned;
  };

  const layouts = ref<ResponsiveLayouts<B>>(initializeLayouts()) as Ref<
    ResponsiveLayouts<B>
  >;

  // Track previous values for change detection
  let prevWidth = widthRef.value;
  let prevBreakpoint = breakpoint.value;
  let prevPropsLayouts = propsLayouts;
  let prevLayouts = layouts.value;

  // Current layout for the active breakpoint
  const layout = computed(() => {
    return findOrGenerateResponsiveLayout(
      layouts.value,
      breakpoints,
      breakpoint.value,
      prevBreakpoint,
      cols.value,
      compactor
    );
  });

  // Set layout for a specific breakpoint
  const setLayoutForBreakpoint = (bp: B, newLayout: Layout) => {
    layouts.value = {
      ...layouts.value,
      [bp]: cloneLayout(newLayout)
    };
  };

  // Set all layouts
  const setLayouts = (newLayouts: ResponsiveLayouts<B>) => {
    const cloned = {} as ResponsiveLayouts<B>;
    for (const bp of Object.keys(newLayouts) as B[]) {
      const layoutForBp = newLayouts[bp];
      if (layoutForBp) {
        (cloned as Record<B, Layout>)[bp] = cloneLayout(layoutForBp);
      }
    }
    layouts.value = cloned;
  };

  // Handle width changes
  watch(
    widthRef,
    (newWidth) => {
      if (prevWidth === newWidth) return;
      prevWidth = newWidth;

      // Determine new breakpoint
      const newBreakpoint = getBreakpointFromWidth(breakpoints, newWidth);
      const newCols = getColsFromBreakpoint(newBreakpoint, colsConfig);

      // Notify width change
      onWidthChange?.(newWidth, [10, 10], newCols, null);

      // Check if breakpoint changed
      if (newBreakpoint !== breakpoint.value) {
        // Generate layout for new breakpoint
        const newLayout = findOrGenerateResponsiveLayout(
          layouts.value,
          breakpoints,
          newBreakpoint,
          breakpoint.value,
          newCols,
          compactor
        );

        // Update layouts with the new breakpoint layout
        const updatedLayouts: ResponsiveLayouts<B> = {
          ...layouts.value,
          [newBreakpoint]: newLayout
        };

        layouts.value = updatedLayouts;
        breakpoint.value = newBreakpoint;
        cols.value = newCols;

        // Notify breakpoint change
        onBreakpointChange?.(newBreakpoint, newCols);

        prevBreakpoint = newBreakpoint;
      }
    },
    { immediate: false }
  );

  // Sync with prop layouts when they change (for external control)
  watch(
    () => propsLayouts,
    (newPropsLayouts) => {
      if (!deepEqual(newPropsLayouts, prevPropsLayouts)) {
        setLayouts(newPropsLayouts);
        prevPropsLayouts = newPropsLayouts;
      }
    },
    { deep: true }
  );

  // Notify layout changes
  watch(
    layouts,
    (newLayouts) => {
      if (!deepEqual(newLayouts, prevLayouts)) {
        prevLayouts = newLayouts;
        onLayoutChange?.(layout.value, newLayouts);
      }
    },
    { deep: true }
  );

  return {
    layout,
    layouts,
    breakpoint,
    cols,
    setLayoutForBreakpoint,
    setLayouts,
    sortedBreakpoints: sortedBreakpointsComputed
  };
}

export default useResponsiveLayout;

/**
 * useContainerWidth composable
 *
 * Observes container width using ResizeObserver and provides
 * reactive width updates for responsive layouts.
 */

import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface UseContainerWidthOptions {
  /**
   * If true, delays initial render until width is measured.
   * Useful for SSR or when you need accurate initial measurements.
   */
  measureBeforeMount?: boolean;

  /**
   * Initial width to use before measurement.
   * Defaults to 1280.
   */
  initialWidth?: number;
}

export interface UseContainerWidthResult {
  /**
   * Current container width in pixels.
   */
  width: Ref<number>;

  /**
   * Whether the container has been measured at least once.
   */
  mounted: Ref<boolean>;

  /**
   * Ref to attach to the container element.
   */
  containerRef: Ref<HTMLDivElement | null>;

  /**
   * Manually trigger a width measurement.
   * Useful when the container size might change without a resize event.
   */
  measureWidth: () => void;
}

/**
 * Composable to observe and track container width.
 *
 * Replaces the WidthProvider HOC with a more composable approach.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useContainerWidth } from 'vue3-grid-layout';
 *
 * const { width, containerRef, mounted } = useContainerWidth();
 * </script>
 *
 * <template>
 *   <div ref="containerRef">
 *     <GridLayout v-if="mounted" :width="width" v-bind="props" />
 *   </div>
 * </template>
 * ```
 */
export function useContainerWidth(
  options: UseContainerWidthOptions = {}
): UseContainerWidthResult {
  const { measureBeforeMount = false, initialWidth = 1280 } = options;

  const width = ref(initialWidth);
  const mounted = ref(!measureBeforeMount);
  const containerRef = ref<HTMLDivElement | null>(null);

  let observer: ResizeObserver | null = null;
  let rafId: number | null = null;

  const measureWidth = () => {
    const node = containerRef.value;
    if (node) {
      const newWidth = node.offsetWidth;
      width.value = newWidth;
      if (!mounted.value) {
        mounted.value = true;
      }
    }
  };

  onMounted(() => {
    const node = containerRef.value;
    if (!node) return;

    // Initial measurement
    measureWidth();

    // Set up ResizeObserver
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          // Use contentRect.width for consistent measurements
          const newWidth = entry.contentRect.width;

          // Defer state update to next paint cycle to avoid
          // "ResizeObserver loop completed with undelivered notifications" error
          if (rafId !== null) {
            cancelAnimationFrame(rafId);
          }
          rafId = requestAnimationFrame(() => {
            width.value = newWidth;
            rafId = null;
          });
        }
      });

      observer.observe(node);
    }
  });

  onUnmounted(() => {
    // Cancel any pending RAF to prevent state updates on unmounted component
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  });

  return {
    width,
    mounted,
    containerRef,
    measureWidth
  };
}

export default useContainerWidth;

/**
 * Vue 3 Grid Layout
 *
 * A draggable and resizable grid layout system for Vue 3.
 * Ported from react-grid-layout v2.
 */

// Components
export {
  GridItem,
  GridLayout,
  ResponsiveGridLayout,
  ComponentSelector
} from "./components";

// ComponentSelector types
export type { ComponentOption, NewItemPayload } from "./components";

// Composables
export {
  useContainerWidth,
  useGridLayout,
  useResponsiveLayout,
  DEFAULT_BREAKPOINTS,
  DEFAULT_COLS,
  type UseContainerWidthOptions,
  type UseContainerWidthResult,
  type DragState,
  type ResizeState,
  type DropState,
  type UseGridLayoutOptions,
  type UseGridLayoutResult,
  type DefaultBreakpoints,
  type UseResponsiveLayoutOptions,
  type UseResponsiveLayoutResult
} from "./composables";

// Core types
export type {
  Layout,
  LayoutItem,
  Position,
  PartialPosition,
  Size,
  DroppingPosition,
  ResizeHandleAxis,
  CompactType,
  Compactor,
  PositionStrategy,
  LayoutConstraint,
  ConstraintContext,
  GridConfig,
  DragConfig,
  ResizeConfig,
  DropConfig,
  Breakpoint,
  Breakpoints,
  BreakpointCols,
  ResponsiveLayouts,
  EventCallback,
  OnLayoutChangeCallback,
  OnBreakpointChangeCallback,
  GridDragEvent,
  GridResizeEvent
} from "./core/types";

// Core utilities
export {
  // Layout utilities
  bottom,
  cloneLayout,
  cloneLayoutItem,
  getLayoutItem,
  moveElement,
  correctBounds,
  validateLayout,
  // Collision detection
  collides,
  getFirstCollision,
  getAllCollisions,
  // Compactors
  getCompactor,
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  // Position strategies
  transformStrategy,
  absoluteStrategy,
  createScaledStrategy,
  defaultPositionStrategy,
  // Constraints
  gridBounds,
  minMaxSize,
  aspectRatio,
  defaultConstraints,
  applyPositionConstraints,
  applySizeConstraints,
  // Calculations
  calcGridColWidth,
  calcGridItemPosition,
  calcGridItemWHPx,
  calcWH,
  calcXY,
  clamp,
  // Responsive utilities
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  findOrGenerateResponsiveLayout,
  getIndentationValue,
  // Sorting
  sortLayoutItems,
  sortLayoutItemsByRowCol,
  sortLayoutItemsByColRow
} from "./core";

// Default configs
export {
  defaultGridConfig,
  defaultDragConfig,
  defaultResizeConfig,
  defaultDropConfig
} from "./core/types";

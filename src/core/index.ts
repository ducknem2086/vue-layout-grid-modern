/**
 * vue3-grid-layout/core
 *
 * Pure TypeScript layout algorithms and types.
 * No Vue dependencies - can be used with any framework.
 */

// =============================================================================
// Types
// =============================================================================

export type {
  // Resize handles
  ResizeHandleAxis,

  // Layout
  LayoutItem,
  Layout,

  // Position & Size
  Position,
  PartialPosition,
  Size,
  DroppingPosition,

  // Events
  DraggableCallbackData,
  GridDragEvent,
  GridResizeEvent,
  DragOverEvent,

  // Compaction
  CompactType,

  // Callbacks
  EventCallback,
  OnLayoutChangeCallback,

  // Composable interfaces
  Compactor,
  PositionStrategy,
  LayoutConstraint,
  ConstraintContext,

  // Configuration
  GridConfig,
  DragConfig,
  ResizeConfig,
  DropConfig,

  // Responsive
  Breakpoint,
  Breakpoints,
  BreakpointCols,
  ResponsiveLayouts,
  OnBreakpointChangeCallback,

  // Utility types
  Mutable,
  DeepPartial,
  ArrayElement
} from "./types";

// Default configuration objects
export {
  defaultGridConfig,
  defaultDragConfig,
  defaultResizeConfig,
  defaultDropConfig
} from "./types";

// =============================================================================
// Collision Detection
// =============================================================================

export { collides, getFirstCollision, getAllCollisions } from "./collision";

// =============================================================================
// Sorting
// =============================================================================

export {
  sortLayoutItems,
  sortLayoutItemsByRowCol,
  sortLayoutItemsByColRow
} from "./sort";

// =============================================================================
// Layout Utilities
// =============================================================================

export {
  // Queries
  bottom,
  getLayoutItem,
  getStatics,

  // Cloning
  cloneLayoutItem,
  cloneLayout,

  // Modification
  modifyLayout,
  withLayoutItem,

  // Bounds
  correctBounds,

  // Movement
  moveElement,
  moveElementAwayFromCollision,

  // Validation
  validateLayout
} from "./layout";

// =============================================================================
// Compaction
// =============================================================================

// Compactor implementations
export {
  verticalCompactor,
  horizontalCompactor,
  noCompactor,
  verticalOverlapCompactor,
  horizontalOverlapCompactor,
  noOverlapCompactor,
  getCompactor,
  // Helpers for custom compactors
  resolveCompactionCollision,
  compactItemVertical,
  compactItemHorizontal
} from "./compactors";

// Note: Use compactor.compact() via the Compactor interface

// =============================================================================
// Position Calculations
// =============================================================================

export {
  setTransform,
  setTopLeft,
  perc,
  resizeItemInDirection,
  // Position strategies
  transformStrategy,
  absoluteStrategy,
  createScaledStrategy,
  defaultPositionStrategy
} from "./position";

// =============================================================================
// Grid Calculations
// =============================================================================

export type {
  PositionParams,
  GridCellDimensions,
  GridCellConfig
} from "./calculate";

export {
  calcGridColWidth,
  calcGridItemWHPx,
  calcGridItemPosition,
  calcXY,
  calcWH,
  calcXYRaw,
  calcWHRaw,
  clamp,
  calcGridCellDimensions
} from "./calculate";

// =============================================================================
// Layout Constraints
// =============================================================================

export {
  // Built-in constraints
  gridBounds,
  minMaxSize,
  containerBounds,
  boundedX,
  boundedY,
  // Constraint factories
  aspectRatio,
  snapToGrid,
  minSize,
  maxSize,
  // Default constraints
  defaultConstraints,
  // Apply functions
  applyPositionConstraints,
  applySizeConstraints
} from "./constraints";

// =============================================================================
// Responsive Utilities
// =============================================================================

export {
  sortBreakpoints,
  getBreakpointFromWidth,
  getColsFromBreakpoint,
  findOrGenerateResponsiveLayout,
  getIndentationValue
} from "./responsive";

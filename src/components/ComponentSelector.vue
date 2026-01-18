<script setup lang="ts">
/**
 * ComponentSelector component
 *
 * A dropdown selector for adding new grid items with specific component types.
 * When a component option is selected, it emits an event to create a new grid item.
 */

import { ref } from "vue";

/**
 * Component option definition.
 * Describes a component type that can be added to the grid.
 */
export interface ComponentOption {
  /** Unique identifier for this component type */
  id: string;
  /** Display label in the dropdown */
  label: string;
  /** Default width in grid units (default: 2) */
  defaultW?: number;
  /** Default height in grid units (default: 2) */
  defaultH?: number;
  /** Minimum width constraint */
  minW?: number;
  /** Minimum height constraint */
  minH?: number;
  /** Maximum width constraint */
  maxW?: number;
  /** Maximum height constraint */
  maxH?: number;
  /** Whether this item can be resized (default: true) */
  isResizable?: boolean;
  /** Whether this item can be dragged (default: true) */
  isDraggable?: boolean;
  /** Any additional custom data */
  data?: Record<string, unknown>;
}

/**
 * New item payload emitted when a component is selected.
 */
export interface NewItemPayload {
  /** Unique ID for the new grid item */
  i: string;
  /** Component type ID from the selected option */
  componentId: string;
  /** X position in grid units (default: 0) */
  x: number;
  /** Y position in grid units (default: Infinity, placed at bottom) */
  y: number;
  /** Width in grid units */
  w: number;
  /** Height in grid units */
  h: number;
  /** Minimum width constraint */
  minW?: number;
  /** Minimum height constraint */
  minH?: number;
  /** Maximum width constraint */
  maxW?: number;
  /** Maximum height constraint */
  maxH?: number;
  /** Whether this item can be resized */
  isResizable?: boolean;
  /** Whether this item can be dragged */
  isDraggable?: boolean;
  /** Custom data from the component option */
  data?: Record<string, unknown>;
}

interface Props {
  /** List of component options to display in the dropdown */
  options: ComponentOption[];
  /** Placeholder text when no option is selected */
  placeholder?: string;
  /** CSS class for the select element */
  selectClass?: string;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Prefix for generated item IDs (default: "item") */
  idPrefix?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Add component...",
  selectClass: "",
  disabled: false,
  idPrefix: "item"
});

const emit = defineEmits<{
  /** Emitted when a component option is selected */
  (e: "add", payload: NewItemPayload): void;
  /** Emitted when selection changes (including reset to placeholder) */
  (e: "change", option: ComponentOption | null): void;
}>();

// Internal counter for generating unique IDs
let itemCounter = 0;

// Selected value (resets after selection)
const selectedValue = ref("");

/**
 * Generate a unique ID for a new grid item.
 */
const generateId = (): string => {
  itemCounter++;
  return `${props.idPrefix}-${Date.now()}-${itemCounter}`;
};

/**
 * Handle selection change.
 */
const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value;

  if (!value) {
    emit("change", null);
    return;
  }

  const option = props.options.find((opt) => opt.id === value);
  if (!option) return;

  emit("change", option);

  // Create new item payload
  const payload: NewItemPayload = {
    i: generateId(),
    componentId: option.id,
    x: 0,
    y: Infinity, // Place at bottom
    w: option.defaultW ?? 2,
    h: option.defaultH ?? 2,
    minW: option.minW,
    minH: option.minH,
    maxW: option.maxW,
    maxH: option.maxH,
    isResizable: option.isResizable,
    isDraggable: option.isDraggable,
    data: option.data
  };

  emit("add", payload);

  // Reset selection to placeholder
  selectedValue.value = "";
};
</script>

<template>
  <select
    v-model="selectedValue"
    :class="['vue-grid-component-selector', selectClass]"
    :disabled="disabled"
    @change="handleChange"
  >
    <option value="" disabled>{{ placeholder }}</option>
    <option v-for="option in options" :key="option.id" :value="option.id">
      {{ option.label }}
    </option>
  </select>
</template>

<style>
.vue-grid-component-selector {
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: #fff;
  cursor: pointer;
  min-width: 180px;
}

.vue-grid-component-selector:hover:not(:disabled) {
  border-color: #9ca3af;
}

.vue-grid-component-selector:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.vue-grid-component-selector:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}
</style>

import type { Component } from "vue";
import ChartWidget from "./ChartWidget.vue";
import DataTable from "./DataTable.vue";
import TextBlock from "./TextBlock.vue";
import ImageWidget from "./ImageWidget.vue";
import DefaultWidget from "./DefaultWidget.vue";

// Export individual components
export { ChartWidget, DataTable, TextBlock, ImageWidget, DefaultWidget };

// Component registry - maps componentId to Vue component
export const componentRegistry: Record<string, Component> = {
  chart: ChartWidget,
  table: DataTable,
  text: TextBlock,
  image: ImageWidget
};

// Get component by ID, returns DefaultWidget if not found
export function getWidgetComponent(componentId?: string): Component {
  if (!componentId) return DefaultWidget;
  return componentRegistry[componentId] ?? DefaultWidget;
}

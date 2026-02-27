import type { ICellRendererParams } from "ag-grid-community";
import { Badge } from "@mantine/core";

interface BadgeCellRendererProps extends ICellRendererParams {
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
}

export function BadgeCellRenderer({
  value,
  colorMap = {},
  labelMap,
}: BadgeCellRendererProps) {
  if (!value) return null;

  const color = colorMap[value] || "gray";
  const label = labelMap?.[value] ?? value;

  return (
    <Badge color={color} variant="light" size="sm">
      {label}
    </Badge>
  );
}

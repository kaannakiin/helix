import type { ICellRendererParams } from "ag-grid-community";
import { Badge } from "@mantine/core";

interface BadgeCellRendererProps extends ICellRendererParams {
  colorMap?: Record<string, string>;
}

export function BadgeCellRenderer({
  value,
  colorMap = {},
}: BadgeCellRendererProps) {
  if (!value) return null;

  const color = colorMap[value] || "gray";

  return (
    <Badge color={color} variant="light" size="sm">
      {value}
    </Badge>
  );
}

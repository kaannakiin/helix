import { Skeleton } from "@mantine/core";
import type { ColDef, ICellRendererParams } from "ag-grid-community";

function SkeletonCell() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: "var(--ag-row-height)",
      }}
    >
      <Skeleton height={20} width="100%" radius="sm" animate />
    </div>
  );
}

export function createLoadingCellRenderer<TData>(
  originalRenderer?: ColDef<TData>["cellRenderer"],
) {
  return function LoadingCellRenderer(props: ICellRendererParams<TData>) {
    if (props.node.id === undefined) {
      return <SkeletonCell />;
    }

    if (originalRenderer) {
      if (typeof originalRenderer === "function") {
        return originalRenderer(props);
      }

      return props.valueFormatted ?? props.value;
    }

    return props.valueFormatted ?? props.value;
  };
}

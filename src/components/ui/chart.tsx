"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<
  string,
  { label?: string; icon?: React.ComponentType; color?: string; theme?: Record<keyof typeof THEMES, string> }
>;

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) throw new Error("useChart must be used within a <ChartContainer />");
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  const theme = "light";

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart-container
        ref={ref}
        id={chartId}
        className={cn(
          "flex aspect-video w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve]:stroke-primary [&_.recharts-dot]:stroke-primary [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle]:stroke-0 [&_.recharts-sector]:outline-none [&_.recharts-sector]:stroke-0 [&_.recharts-surface]:outline-none",
          className
        )}
        style={
          {
            ...Object.fromEntries(
              Object.entries(config).filter(([, v]) => v?.color).map(([k, v]) => [`--color-${k}`, v?.color])
            ),
          } as React.CSSProperties
        }
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

function ChartTooltip(
  props: React.ComponentProps<typeof RechartsPrimitive.Tooltip>
) {
  const { cursor, ...rest } = props;
  return (
    <RechartsPrimitive.Tooltip
      {...rest}
      cursor={cursor === false ? undefined : cursor}
    />
  );
}

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      formatter?: (value: unknown) => React.ReactNode;
      nameKey?: string;
      labelKey?: string;
    }
>(({ active, payload, className, hideLabel, formatter, nameKey, labelKey, ...props }, ref) => {
  const { config } = useChart();
  if (!active || !payload?.length) return null;
  const first = payload[0];
  const name = nameKey ? (first.payload[nameKey] as string) : first.name;
  const label = labelKey ? (first.payload[labelKey] as string) : first.payload?.label;
  const value = first.value as number;
  const itemConfig = name ? config[name] : undefined;
  const formatted = formatter ? formatter(value) : value;
  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-outline bg-surface px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
      {...props}
    >
      {!hideLabel && (label ?? name) && (
        <div className="font-medium text-[var(--text-lessImportantText)]">{label ?? name}</div>
      )}
      <div className="font-bold text-[var(--text-bodyText)]">
        {itemConfig?.label ? `${itemConfig.label}: ` : ""}
        {formatted}
      </div>
    </div>
  );
});
ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, useChart };

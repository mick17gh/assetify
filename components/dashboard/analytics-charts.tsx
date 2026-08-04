"use client";

import { useEffect, useState } from "react";
import { Cell, Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSET_STATUS, ENUM_LABELS } from "@/constants";

const STATUS_COLORS: Record<string, string> = {
  [ASSET_STATUS.ACTIVE]: "#7C3AED",
  [ASSET_STATUS.UNDER_REPAIR]: "#F59E0B",
  [ASSET_STATUS.FAULTY]: "#EF4444",
  [ASSET_STATUS.IN_STORAGE]: "#6366F1",
  [ASSET_STATUS.MISSING]: "#64748B",
  [ASSET_STATUS.DISPOSED]: "#94A3B8",
  [ASSET_STATUS.DONATED]: "#14B8A6",
  [ASSET_STATUS.SOLD]: "#0EA5E9",
};

const statusChartConfig = Object.fromEntries(
  Object.values(ASSET_STATUS).map((status) => [
    status,
    {
      label: ENUM_LABELS.assetStatus[status] ?? status,
      color: STATUS_COLORS[status] ?? "#A78BFA",
    },
  ]),
) as ChartConfig;

const branchChartConfig = {
  count: { label: "Assets", color: "#7C3AED" },
} as const satisfies ChartConfig;

function ChartPlaceholder() {
  return <div className="h-[260px] w-full rounded-md bg-purple-50/80" aria-hidden />;
}

export function AnalyticsCharts({
  statusData,
  branchData,
}: {
  statusData: Array<{ name: string; count: number }>;
  branchData: Array<{ name: string; count: number }>;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const pieData = statusData.map((item) => ({
    ...item,
    fill: `var(--color-${item.name})`,
  }));

  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      <Card className="border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-purple-950">Asset Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {mounted ? (
            <ChartContainer id="asset-status" config={statusChartConfig} className="h-[260px] w-full">
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="name"
                      labelFormatter={(_, payload) => {
                        const status = String(payload?.[0]?.name ?? "");
                        return ENUM_LABELS.assetStatus[status] ?? status;
                      }}
                    />
                  }
                />
                <Pie data={pieData} dataKey="count" nameKey="name" innerRadius={58} outerRadius={92}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <ChartPlaceholder />
          )}
        </CardContent>
      </Card>
      <Card className="border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-purple-950">Assets by Branch</CardTitle>
        </CardHeader>
        <CardContent>
          {mounted ? (
            <ChartContainer id="assets-by-branch" config={branchChartConfig} className="h-[260px] w-full">
              <BarChart data={branchData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={6} />
              </BarChart>
            </ChartContainer>
          ) : (
            <ChartPlaceholder />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Cell, Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSET_STATUS, ENUM_LABELS } from "@/constants";

const STATUS_COLORS: Record<string, string> = {
  [ASSET_STATUS.ACTIVE]: "#16A34A",
  [ASSET_STATUS.UNDER_REPAIR]: "#F59E0B",
  [ASSET_STATUS.FAULTY]: "#EF4444",
  [ASSET_STATUS.IN_STORAGE]: "#1E3A8A",
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
      color: STATUS_COLORS[status] ?? "#456484",
    },
  ]),
) as ChartConfig;

const branchChartConfig = {
  count: { label: "Assets", color: "#012f6b" },
} as const satisfies ChartConfig;

const BRANCH_LABEL_MAX = 12;

function truncateBranchLabel(value: string) {
  if (value.length <= BRANCH_LABEL_MAX) return value;
  return `${value.slice(0, BRANCH_LABEL_MAX - 1)}…`;
}

function ChartPlaceholder() {
  return <div className="h-[260px] w-full rounded-md bg-navy-50/80" aria-hidden />;
}

export function AnalyticsCharts({
  statusData,
  branchData,
}: {
  statusData: Array<{ name: string; count: number }>;
  branchData: Array<{ name: string; count: number }>;
}) {
  const [layout, setLayout] = useState<"pending" | "narrow" | "wide">("pending");

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setLayout(query.matches ? "narrow" : "wide");
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const pieData = statusData.map((item) => {
    const status = Object.values(ASSET_STATUS).find((value) => (ENUM_LABELS.assetStatus[value] ?? value) === item.name);
    return {
      ...item,
      fill: (status && STATUS_COLORS[status]) || "#456484",
    };
  });

  const ready = layout !== "pending";
  const branchChartHeight = Math.max(220, branchData.length * 40);

  return (
    <section className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
      <Card className="min-w-0 overflow-hidden border-navy-200 shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base text-navy-950">Asset Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-4 sm:px-6">
          {ready ? (
            <>
              <ChartContainer id="asset-status" config={statusChartConfig} className="mx-auto aspect-auto h-[200px] w-full max-w-[280px]">
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
                  <Pie data={pieData} dataKey="count" nameKey="name" innerRadius="48%" outerRadius="78%">
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-navy-800">
                {pieData.map((entry) => (
                  <li key={entry.name} className="flex max-w-full min-w-0 items-center gap-1.5">
                    <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: entry.fill }} />
                    <span className="break-words">{ENUM_LABELS.assetStatus[entry.name] ?? entry.name}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <ChartPlaceholder />
          )}
        </CardContent>
      </Card>
      <Card className="min-w-0 overflow-hidden border-navy-200 shadow-sm">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle className="text-base text-navy-950">Assets by Branch</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 px-4 sm:px-6">
          {ready ? (
            layout === "narrow" ? (
              <ChartContainer
                id="assets-by-branch"
                config={branchChartConfig}
                className="aspect-auto w-full"
                style={{ height: branchChartHeight }}
              >
                <BarChart data={branchData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }}>
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={108}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={truncateBranchLabel}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={6} barSize={16} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="w-full overflow-x-auto">
                <ChartContainer
                  id="assets-by-branch"
                  config={branchChartConfig}
                  className="aspect-auto h-[260px]"
                  style={{ width: Math.max(320, branchData.length * 72), minWidth: "100%" }}
                >
                  <BarChart data={branchData} margin={{ bottom: 8, left: 0, right: 8 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      tick={{ fontSize: 10 }}
                      tickFormatter={truncateBranchLabel}
                      height={40}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={36} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--color-count)" radius={6} />
                  </BarChart>
                </ChartContainer>
              </div>
            )
          ) : (
            <ChartPlaceholder />
          )}
        </CardContent>
      </Card>
    </section>
  );
}

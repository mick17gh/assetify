"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const chartConfig = {
  count: { label: "Assets", color: "#7C3AED" },
  value: { label: "Value", color: "#A78BFA" },
} as const;

export function AnalyticsCharts({
  statusData,
  branchData,
}: {
  statusData: Array<{ name: string; count: number }>;
  branchData: Array<{ name: string; count: number }>;
}) {
  return (
    <section className="mt-5 grid gap-4 lg:grid-cols-2">
      <Card className="border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-purple-950">Asset Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie data={statusData} dataKey="count" nameKey="name" innerRadius={58} outerRadius={92} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="border-purple-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base text-purple-950">Assets by Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={branchData}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={6} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
}

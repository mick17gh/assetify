"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reportConfig = {
  cost: { label: "Replacement Cost", color: "#7C3AED" },
} as const;

export function ReportCharts({
  trendData,
}: {
  trendData: Array<{ month: string; cost: number }>;
}) {
  return (
    <Card className="border-purple-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base text-purple-950">Replacement Cost Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={reportConfig} className="h-[250px] w-full">
          <AreaChart data={trendData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="cost" stroke="var(--color-cost)" fill="var(--color-cost)" fillOpacity={0.25} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

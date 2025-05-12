
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartData = [
  { day: 'Mon', threats: Math.floor(Math.random() * 10) + 5 },
  { day: 'Tue', threats: Math.floor(Math.random() * 10) + 5 },
  { day: 'Wed', threats: Math.floor(Math.random() * 10) + 5 },
  { day: 'Thu', threats: Math.floor(Math.random() * 15) + 5 },
  { day: 'Fri', threats: Math.floor(Math.random() * 15) + 8 },
  { day: 'Sat', threats: Math.floor(Math.random() * 5) + 3 },
  { day: 'Sun', threats: 12 }, // Current value from dashboard
];

const chartConfig = {
  threats: {
    label: 'Active Threats',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function ActiveThreatsChart() {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar dataKey="threats" fill="var(--color-threats)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

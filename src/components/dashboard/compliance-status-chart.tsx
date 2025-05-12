
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell, Legend, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const chartData = [
  { standard: 'ISO 27001', status: 'Compliant', value: 1, fill: 'var(--chart-1)' },
  { standard: 'SOC 2 Type II', status: 'Pending Audit', value: 1, fill: 'var(--chart-2)' },
  { standard: 'GDPR', status: 'Compliant', value: 1, fill: 'var(--chart-1)' },
  { standard: 'PCI DSS', status: 'Needs Review', value: 1, fill: 'var(--chart-3)' },
];

const chartConfig = {
  compliant: {
    label: 'Compliant',
    color: 'hsl(var(--chart-1))',
  },
  pending: {
    label: 'Pending Audit',
    color: 'hsl(var(--chart-2))',
  },
  needsReview: {
    label: 'Needs Review',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;


export function ComplianceStatusChart() {
  // Aggregate data for the pie chart based on status
  const aggregatedData = chartData.reduce((acc, curr) => {
    const existing = acc.find(item => item.status === curr.status);
    if (existing) {
      existing.value += curr.value;
    } else {
      acc.push({ status: curr.status, value: curr.value, fill: curr.fill });
    }
    return acc;
  }, [] as { status: string; value: number; fill: string }[]);

  return (
    <ChartContainer config={chartConfig} className="h-full w-full aspect-square max-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            content={<ChartTooltipContent nameKey="status" hideLabel />}
          />
          <Pie
            data={aggregatedData}
            dataKey="value"
            nameKey="status"
            labelLine={false}
            outerRadius={80}
            
          >
            {aggregatedData.map((entry) => (
              <Cell key={`cell-${entry.status}`} fill={entry.fill} />
            ))}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey="status"/>} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}


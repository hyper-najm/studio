
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

const complianceFrameworks = [
  { name: "ISO 27001", status: "Compliant" },
  { name: "SOC 2 Type II", status: "Pending Audit" },
  { name: "GDPR", status: "Compliant" },
  { name: "PCI DSS", status: "Needs Review" },
  { name: "HIPAA", status: "Compliant" },
  { name: "CCPA", status: "Compliant" },
  { name: "FedRAMP", status: "Pending Audit" },
  { name: "NIST CSF", status: "Needs Review" },
  { name: "ISO 27701", status: "Compliant" },
];

const statusCounts = complianceFrameworks.reduce((acc, framework) => {
  acc[framework.status] = (acc[framework.status] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const chartData = [
  { status: 'Compliant', value: statusCounts['Compliant'] || 0, fill: 'var(--chart-1)' },
  { status: 'Pending Audit', value: statusCounts['Pending Audit'] || 0, fill: 'var(--chart-2)' },
  { status: 'Needs Review', value: statusCounts['Needs Review'] || 0, fill: 'var(--chart-3)' },
].filter(item => item.value > 0);


const chartConfig = {
  'Compliant': { label: 'Compliant', color: 'hsl(var(--chart-1))' },
  'Pending Audit': { label: 'Pending Audit', color: 'hsl(var(--chart-2))' },
  'Needs Review': { label: 'Needs Review', color: 'hsl(var(--chart-3))' },
} satisfies ChartConfig;


export function ComplianceStatusChart() {
  return (
    <ChartContainer config={chartConfig} className="h-full w-full aspect-square max-h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={true} // Show cursor on hover
            content={
              <ChartTooltipContent 
                nameKey="status" 
                formatter={(value, name) => (
                  <>
                    <div className="flex items-center">
                       <span
                        className="w-2.5 h-2.5 mr-2 rounded-full"
                        style={{ backgroundColor: chartConfig[name as keyof typeof chartConfig]?.color || 'transparent' }}
                      />
                      <span>{chartConfig[name as keyof typeof chartConfig]?.label || name}:</span>
                    </div>
                    <div className="ml-4.5 text-right font-medium">{value} Frameworks</div>
                  </>
                )}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="status" // This is used by ChartTooltipContent's nameKey
            labelLine={false}
            outerRadius={80}
            innerRadius={50} 
            paddingAngle={2}
            animationDuration={500}
          >
            {chartData.map((entry) => (
              <Cell key={`cell-${entry.status}`} fill={entry.fill} stroke={entry.fill} />
            ))}
          </Pie>
          <ChartLegend 
            content={<ChartLegendContent nameKey="status" />} 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{paddingTop: 20}}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

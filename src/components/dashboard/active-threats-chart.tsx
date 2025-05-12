
'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  threats: {
    label: 'Active Threats',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function ActiveThreatsChart({ currentThreats }: { currentThreats: number }) {
  // Generate somewhat realistic historical data based on currentThreats
  const generateHistoricalData = (current: number) => {
    const data = [];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = days.length - 1;

    for (let i = 0; i < days.length; i++) {
      if (i === todayIndex) {
        data.push({ day: days[i], threats: current });
      } else {
        // Generate random data that trends somewhat towards the current value
        const fluctuation = (Math.random() - 0.5) * current * 0.6; // Fluctuate by up to 30% of current
        const base = current * (0.7 + Math.random() * 0.4); // Base around 70-110% of current
        let historicalThreats = Math.max(3, Math.floor(base + fluctuation)); // Ensure at least 3 threats
        // slightly decrease values for earlier days
        historicalThreats = Math.max(3, historicalThreats - Math.floor((todayIndex - i) * current * 0.05));
        data.push({ day: days[i], threats: historicalThreats });
      }
    }
    return data;
  };
  
  const chartData = generateHistoricalData(currentThreats);

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
          <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={12} allowDecimals={false} />
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

    
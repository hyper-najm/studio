
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface SecurityScoreDisplayProps {
  score: number;
}

const chartConfig = {
  score: {
    label: 'Score',
  },
  remaining: {
    label: 'Remaining',
  },
} satisfies ChartConfig;

export function SecurityScoreDisplay({ score }: SecurityScoreDisplayProps) {
  const data = [
    { name: 'score', value: score, fill: 'hsl(var(--primary))' },
    { name: 'remaining', value: 100 - score, fill: 'hsl(var(--muted))' },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[120px] w-[120px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltipContent
            hideLabel
            hideIndicator
            formatter={(value, name) => (
              <div className="flex flex-col items-center">
                {name === "score" && (
                   <>
                    <span className="text-2xl font-bold">{value}%</span>
                    <span className="text-xs text-muted-foreground">Security Score</span>
                   </>
                )}
              </div>
            )}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={90 + (score / 100) * 360}
            cy="50%"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
           {/* Background Pie for the remaining part */}
          <Pie
            data={[{ value: 100 }]} // Full circle
            dataKey="value"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={450} // Full circle
            cy="50%"
            fill="hsl(var(--muted))"
            strokeWidth={0}
            isAnimationActive={false} // No animation for background
          />
        </PieChart>
      </ResponsiveContainer>
       <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <div className="text-3xl font-bold text-primary">{score}%</div>
          <div className="text-xs text-muted-foreground">Security Score</div>
        </div>
    </ChartContainer>
  );
}

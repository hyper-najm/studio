
'use client';

import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface SecurityScoreDisplayProps {
  score: number;
}

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--primary))',
  },
  remaining: {
    label: 'Remaining',
    color: 'hsl(var(--muted))',
  },
} satisfies ChartConfig;

export function SecurityScoreDisplay({ score }: SecurityScoreDisplayProps) {
  const chartData = [
    { name: 'score', value: score, fill: 'var(--color-score)' },
    { name: 'remaining', value: 100 - score, fill: 'var(--color-remaining)' },
  ];

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[120px] w-[120px] relative" // Added relative for positioning context
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent 
                        hideLabel 
                        hideIndicator
                        formatter={(value, name, props) => {
                          if (props.payload?.name === 'score') {
                            return (
                              <div className="text-center">
                                <div className="font-bold text-lg">{`${props.payload.value}%`}</div>
                                <div className="text-xs text-muted-foreground">Security Score</div>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />}
          />
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="70%" // Makes it a donut
            outerRadius="100%"
            startAngle={90}
            endAngle={450} // Go full circle to allow background
            cy="50%"
            strokeWidth={0}
          >
            {/* Background for the whole circle */}
            <Cell key="remaining-bg" fill={chartConfig.remaining.color} /> 
            {/* Foreground for the score part */}
            <Cell key="score-fg" fill={chartConfig.score.color} />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {/* Centered Text Overlay */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" 
        aria-hidden="true"
      >
        <div className="text-3xl font-bold text-primary">{score}%</div>
        <div className="text-xs text-muted-foreground">Security Score</div>
      </div>
    </ChartContainer>
  );
}

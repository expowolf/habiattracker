import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const AXIS = { stroke: '#475569', fontSize: 11 }

export function TrendChart({
  data,
  color,
  domain,
  ticks,
  formatTick,
  valueLabel,
  formatValue,
}: {
  data: Array<{ label: string; value: number | null }>
  color: string
  domain: [number, number]
  ticks: number[]
  formatTick: (value: number) => string
  valueLabel: string
  formatValue: (value: number) => string
}) {
  const hasData = data.some((point) => point.value !== null)

  if (!hasData) {
    return (
      <p className="flex h-[200px] items-center justify-center text-sm text-muted">
        No data yet — log a few days to see the trend.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke="#1f2b3f" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS} interval="preserveStartEnd" />
        <YAxis
          domain={domain}
          ticks={ticks}
          tickFormatter={formatTick}
          tickLine={false}
          axisLine={false}
          tick={AXIS}
          width={44}
        />
        <Tooltip
          cursor={{ stroke: '#334155' }}
          contentStyle={{
            background: '#0f172a',
            border: '1px solid #1f2b3f',
            borderRadius: 8,
            fontSize: 12,
            color: '#e2e8f0',
          }}
          formatter={(value: number) => [formatValue(value), valueLabel]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
          connectNulls
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

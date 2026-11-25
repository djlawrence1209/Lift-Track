'use client'

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Insight, LIFT_COLOR, LIFT_LABEL } from '../lib/analytics'

const KIND_LABEL: Record<Insight['kind'], string> = {
  accessory: 'Accessory transfer',
  rpe: 'Effort vs plan',
  volume: 'Volume response',
  trend: 'Progression',
}

function StrengthBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{value}</span>
    </div>
  )
}

function MiniChart({ insight }: { insight: Insight }) {
  if (!insight.series || !insight.seriesKeys) return null
  const { a, b } = insight.seriesKeys
  return (
    <div className="mt-3 h-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={insight.series} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis domain={['dataMin - 4', 'dataMax + 4']} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
          />
          <Line type="linear" dataKey={a} stroke="#e879f9" strokeWidth={2} dot={{ r: 2 }} />
          <Line type="linear" dataKey={b} stroke={LIFT_COLOR[insight.lift]} strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
      <div className="-mt-1 flex gap-4 pl-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <i className="inline-block h-0.5 w-3 bg-[#e879f9]" />
          {a} (indexed, block 1 = 100)
        </span>
        <span className="flex items-center gap-1">
          <i className="inline-block h-0.5 w-3" style={{ background: LIFT_COLOR[insight.lift] }} />
          {b}
        </span>
      </div>
    </div>
  )
}

export function KpiInsights({ insights, usingSample }: { insights: Insight[]; usingSample: boolean }) {
  const top = insights.slice(0, 6)
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Patterns found in your training history that tend to move your lifts. Score is the strength of the signal (0-100).
        </p>
        {usingSample && (
          <Badge variant="outline" className="border-dashed text-amber-300">
            Includes example insights (no accessory data found in the sheet yet)
          </Badge>
        )}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {top.map((insight) => (
          <div key={insight.id} className="rounded-xl border bg-card/60 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: LIFT_COLOR[insight.lift] }} />
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {LIFT_LABEL[insight.lift]} · {KIND_LABEL[insight.kind]}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {insight.source === 'sample' && (
                  <Badge variant="outline" className="border-dashed px-1.5 py-0 text-[10px] text-amber-300">
                    example
                  </Badge>
                )}
                <StrengthBar value={insight.strength} color={LIFT_COLOR[insight.lift]} />
              </div>
            </div>
            <h4 className="font-semibold leading-snug">{insight.headline}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{insight.detail}</p>
            <MiniChart insight={insight} />
          </div>
        ))}
      </div>
    </div>
  )
}

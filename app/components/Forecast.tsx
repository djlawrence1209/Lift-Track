'use client'

import { Area, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { LiftForecast, LIFT_COLOR, LIFT_LABEL } from '../lib/analytics'

const CONF_STYLE: Record<LiftForecast['confidence'], string> = {
  High: 'text-emerald-300',
  Moderate: 'text-amber-300',
  Low: 'text-rose-300',
}

function ForecastCard({ f }: { f: LiftForecast }) {
  const color = LIFT_COLOR[f.lift]
  const lastActual = f.rows.findIndex((r) => r.actual !== undefined && r.predicted !== undefined)
  const divider = lastActual >= 0 ? f.rows[lastActual].label : undefined
  const gain = f.projected - f.current
  return (
    <div className="rounded-xl border bg-card/60 p-4">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {LIFT_LABEL[f.lift]} · est. 1RM
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums">{f.projected}</span>
            <span className="text-sm text-muted-foreground">lbs in 4 blocks</span>
          </div>
          <div className={`text-sm ${gain >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {gain >= 0 ? '+' : ''}
            {gain} lbs from current {f.current} ({f.gainPerBlock >= 0 ? '+' : ''}
            {f.gainPerBlock.toFixed(1)} / block)
          </div>
        </div>
        <Badge variant="outline" className={CONF_STYLE[f.confidence]}>
          {f.confidence} confidence
        </Badge>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={f.rows} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id={`band-${f.lift}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={['dataMin - 15', 'dataMax + 15']} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(value: any, name: string) => [Array.isArray(value) ? `${value[0]} - ${value[1]} lbs` : `${value} lbs`, name]}
            />
            {divider && <ReferenceLine x={divider} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />}
            <Area type="linear" dataKey="band" name="80% range" stroke="none" fill={`url(#band-${f.lift})`} />
            <Line type="linear" dataKey="predicted" name="Forecast" stroke={color} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
            <Line type="linear" dataKey="actual" name="Actual" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Trend fit on {f.points} blocks of estimated 1RM (Epley, RPE-adjusted), with gains tapering over time. R² = {f.r2.toFixed(2)}.
      </p>
    </div>
  )
}

export function Forecast({ forecasts, usingSample }: { forecasts: LiftForecast[]; usingSample: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Where your one rep max is heading if the current block-over-block progression continues.
        </p>
        {usingSample && (
          <Badge variant="outline" className="border-dashed text-amber-300">
            Showing sample data. Import your sheet to forecast your own lifts.
          </Badge>
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-3 md:grid-cols-2">
        {forecasts.map((f) => (
          <ForecastCard key={f.lift} f={f} />
        ))}
      </div>
    </div>
  )
}

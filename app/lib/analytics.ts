import type { SheetData } from './google-sheets'

export type LiftKey = 'squat' | 'bench' | 'deadlift'
export const LIFTS: LiftKey[] = ['bench', 'squat', 'deadlift']
export const LIFT_LABEL: Record<LiftKey, string> = { bench: 'Bench', squat: 'Squat', deadlift: 'Deadlift' }
export const LIFT_COLOR: Record<LiftKey, string> = { bench: '#22d3ee', squat: '#a78bfa', deadlift: '#fbbf24' }

export interface Entry {
  block: number // 1-based training block (a horizontal group of columns in the sheet)
  exercise: string
  sets: number
  reps: number
  weight: number
  prescribedRPE: number
  actualRPE: number
  lift: LiftKey | null // set for competition lifts
  e1rm: number
}

/** Epley estimated 1RM, adjusted for reps in reserve when an RPE was logged. */
export function estimate1RM(weight: number, reps: number, rpe?: number): number {
  if (!weight || !reps) return 0
  const reserve = rpe && rpe > 0 && rpe <= 10 ? 10 - rpe : 0
  return weight * (1 + (reps + reserve) / 30)
}

function liftOf(exercise: string): LiftKey | null {
  const e = exercise.toLowerCase()
  if (!e.includes('competition')) return null
  if (e.includes('squat')) return 'squat'
  if (e.includes('bench')) return 'bench'
  if (e.includes('deadlift')) return 'deadlift'
  return null
}

/** Which main lift an accessory exercise is most likely to support. */
export function mainLiftFor(exercise: string): LiftKey | null {
  const e = exercise.toLowerCase()
  if (/(bench|press|tricep|dip|fly|flye|push)/.test(e) && !/leg press/.test(e)) return 'bench'
  if (/(squat|leg press|lunge|split|hack|quad|leg ext)/.test(e)) return 'squat'
  if (/(deadlift|rdl|romanian|row|good morning|pull|back ext|hip thrust|rack)/.test(e)) return 'deadlift'
  return null
}

const num = (v: unknown) => {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''))
  return Number.isFinite(n) ? n : NaN
}

/**
 * Reads every training block out of the raw sheet rows. A block is detected as
 * "text cell followed by sets / reps / weight numbers", so it works whether blocks
 * are 6 columns wide or separated by a blank spacer column.
 */
export function extractEntries(rawData: SheetData[] | undefined): Entry[] {
  if (!rawData?.length) return []
  const found: Array<Omit<Entry, 'block'> & { col: number }> = []

  for (const row of rawData) {
    const cells = row.fullRow ?? [row.exercise, row.sets, row.reps, row.weight, row.prescribedRPE, row.actualRPE]
    for (let i = 0; i < cells.length; i++) {
      const name = String(cells[i] ?? '').trim()
      if (!name || !/[a-z]/i.test(name) || !isNaN(num(name))) continue
      const sets = num(cells[i + 1])
      const reps = num(cells[i + 2])
      const weight = num(cells[i + 3])
      if (!(sets > 0 && reps > 0 && weight > 0)) continue
      const prescribedRPE = num(cells[i + 4])
      const actualRPE = num(cells[i + 5])
      found.push({
        col: i,
        exercise: name,
        sets,
        reps,
        weight,
        prescribedRPE: isNaN(prescribedRPE) ? 0 : prescribedRPE,
        actualRPE: isNaN(actualRPE) ? 0 : actualRPE,
        lift: liftOf(name),
        e1rm: estimate1RM(weight, reps, isNaN(actualRPE) ? undefined : actualRPE),
      })
      i += 3
    }
  }

  const cols = Array.from(new Set(found.map((f) => f.col))).sort((a, b) => a - b)
  return found.map(({ col, ...rest }) => ({ ...rest, block: cols.indexOf(col) + 1 }))
}

export interface BlockPoint {
  block: number
  label: string
  squat?: number
  bench?: number
  deadlift?: number
}

/** Estimated 1RM of the first competition set per lift per block. */
export function e1rmByBlock(entries: Entry[]): BlockPoint[] {
  const blocks = Array.from(new Set(entries.filter((e) => e.lift).map((e) => e.block))).sort((a, b) => a - b)
  return blocks.map((block) => {
    const point: BlockPoint = { block, label: `Block ${block}` }
    for (const lift of LIFTS) {
      // First logged set of the lift in each block, so blocks stay comparable even when
      // one block has more sessions logged than another.
      const first = entries.find((e) => e.block === block && e.lift === lift)
      if (first) point[lift] = Math.round(first.e1rm)
    }
    return point
  })
}

/** Heaviest competition set per block, in the shape the existing "Max Lifts" chart expects. */
export function maxLiftsByBlock(entries: Entry[]) {
  const blocks = Array.from(new Set(entries.filter((e) => e.lift).map((e) => e.block))).sort((a, b) => a - b)
  return blocks.map((block) => {
    const point: Record<string, any> = { date: `Block ${block}` }
    for (const lift of LIFTS) {
      const w = entries.filter((e) => e.block === block && e.lift === lift).map((e) => e.weight)
      if (w.length) point[lift] = Math.max(...w)
    }
    return point as { date: string; [k: string]: any }
  })
}

/** Competition-lift sets and tonnage per block. */
export function volumeByBlock(entries: Entry[]) {
  const blocks = Array.from(new Set(entries.filter((e) => e.lift).map((e) => e.block))).sort((a, b) => a - b)
  return blocks.map((block) => {
    const rows = entries.filter((e) => e.block === block && e.lift)
    return {
      week: `Week ${block}`,
      volume: rows.reduce((s, e) => s + e.sets * e.reps, 0),
      tonnage: rows.reduce((s, e) => s + e.sets * e.reps * e.weight, 0),
    }
  })
}

// ---------- statistics ----------

export function linearFit(ys: number[]) {
  const n = ys.length
  const xs = ys.map((_, i) => i)
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0
  let sxx = 0
  let syy = 0
  for (let i = 0; i < n; i++) {
    sxy += (xs[i] - mx) * (ys[i] - my)
    sxx += (xs[i] - mx) ** 2
    syy += (ys[i] - my) ** 2
  }
  const slope = sxx ? sxy / sxx : 0
  const intercept = my - slope * mx
  const ssRes = ys.reduce((s, y, i) => s + (y - (intercept + slope * i)) ** 2, 0)
  const r2 = syy ? 1 - ssRes / syy : 1
  const sigma = n > 2 ? Math.sqrt(ssRes / (n - 2)) : Math.max(my * 0.02, 2.5)
  return { slope, intercept, r2, sigma, n }
}

export function pearson(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length)
  if (n < 3) return NaN
  const ma = a.slice(0, n).reduce((x, y) => x + y, 0) / n
  const mb = b.slice(0, n).reduce((x, y) => x + y, 0) / n
  let sab = 0
  let saa = 0
  let sbb = 0
  for (let i = 0; i < n; i++) {
    sab += (a[i] - ma) * (b[i] - mb)
    saa += (a[i] - ma) ** 2
    sbb += (b[i] - mb) ** 2
  }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : NaN
}

// ---------- forecast ----------

export interface ForecastRow {
  label: string
  actual?: number
  predicted?: number
  low?: number
  high?: number
  band?: [number, number]
}

export interface LiftForecast {
  lift: LiftKey
  rows: ForecastRow[]
  current: number
  projected: number
  gainPerBlock: number
  r2: number
  confidence: 'High' | 'Moderate' | 'Low'
  points: number
}

export function forecastLift(series: BlockPoint[], lift: LiftKey, horizon = 4): LiftForecast | null {
  const pts = series.filter((p) => typeof p[lift] === 'number') as Array<BlockPoint & Record<LiftKey, number>>
  if (pts.length < 2) return null
  const ys = pts.map((p) => p[lift])
  const fit = linearFit(ys)
  const n = ys.length

  const rows: ForecastRow[] = pts.map((p, i) => ({
    label: p.label,
    actual: p[lift],
    // the last real point anchors the forecast line so the chart connects
    ...(i === n - 1 ? { predicted: p[lift], band: [p[lift], p[lift]] as [number, number] } : {}),
  }))

  const lastBlock = pts[n - 1].block
  // Strength gains taper: cap the per-block gain at 3% of current and decay it 15% per block
  // so a short, steep stretch is not extrapolated forever.
  const anchor = fit.intercept + fit.slope * (n - 1)
  const slope = Math.max(-0.03 * anchor, Math.min(0.03 * anchor, fit.slope))
  let mean = ys[n - 1]
  for (let h = 1; h <= horizon; h++) {
    mean += slope * Math.pow(0.85, h - 1)
    const spread = 1.28 * fit.sigma * Math.sqrt(1 + 1 / n + h / 2) // ~80% interval, widens with distance
    rows.push({
      label: `Block ${lastBlock + h}`,
      predicted: Math.round(mean),
      band: [Math.round(mean - spread), Math.round(mean + spread)],
    })
  }

  const confidence = n >= 5 && fit.r2 > 0.8 ? 'High' : n >= 3 && fit.r2 > 0.5 ? 'Moderate' : 'Low'
  return {
    lift,
    rows,
    current: ys[n - 1],
    projected: rows[rows.length - 1].predicted ?? ys[n - 1],
    gainPerBlock: slope,
    r2: fit.r2,
    confidence,
    points: n,
  }
}

// ---------- key performance indicators ----------

export interface Insight {
  id: string
  lift: LiftKey
  kind: 'accessory' | 'rpe' | 'volume' | 'trend'
  headline: string
  detail: string
  strength: number // 0-100
  source: 'data' | 'sample'
  series?: Array<Record<string, number | string>>
  seriesKeys?: { a: string; b: string }
}

const pct = (a: number, b: number) => (a ? ((b - a) / a) * 100 : 0)
const deltas = (xs: number[]) => xs.slice(1).map((x, i) => x - xs[i])

export function buildInsights(entries: Entry[]): Insight[] {
  const out: Insight[] = []
  const series = e1rmByBlock(entries)

  // 1. Accessory -> main lift transfer
  const byAccessory = new Map<string, Entry[]>()
  entries
    .filter((e) => !e.lift && mainLiftFor(e.exercise))
    .forEach((e) => byAccessory.set(e.exercise, [...(byAccessory.get(e.exercise) ?? []), e]))

  byAccessory.forEach((rows, name) => {
    const lift = mainLiftFor(name)!
    const blocks = Array.from(new Set(rows.map((r) => r.block))).sort((a, b) => a - b)
    const acc = blocks.map((b) => Math.max(...rows.filter((r) => r.block === b).map((r) => r.e1rm)))
    const main = blocks.map((b) => series.find((s) => s.block === b)?.[lift])
    if (blocks.length < 3 || main.some((m) => typeof m !== 'number')) return
    const r = pearson(deltas(acc), deltas(main as number[]))
    const rAll = pearson(acc, main as number[])
    const best = Number.isNaN(r) ? rAll : Math.abs(r) > Math.abs(rAll) ? r : rAll
    if (Number.isNaN(best) || best < 0.4) return
    out.push({
      id: `acc-${name}`,
      lift,
      kind: 'accessory',
      headline: `${name} progress carries over to ${LIFT_LABEL[lift]}`,
      detail: `Block over block, your ${name.toLowerCase()} increases line up with your ${LIFT_LABEL[lift].toLowerCase()} increases (r = ${best.toFixed(2)}). Keep progressing it.`,
      strength: Math.round(Math.min(1, best) * 100),
      source: 'data',
      seriesKeys: { a: name, b: LIFT_LABEL[lift] },
      series: blocks.map((b, i) => ({
        label: `Block ${b}`,
        [name]: Math.round((acc[i] / acc[0]) * 100),
        [LIFT_LABEL[lift]]: Math.round(((main[i] as number) / (main[0] as number)) * 100),
      })),
    })
  })

  // 2. RPE vs prescribed: are you running hot or leaving room?
  for (const lift of LIFTS) {
    const rows = entries.filter((e) => e.lift === lift && e.prescribedRPE > 0 && e.actualRPE > 0)
    if (rows.length < 2) continue
    const gap = rows.reduce((s, e) => s + (e.actualRPE - e.prescribedRPE), 0) / rows.length
    if (Math.abs(gap) < 0.75) continue
    out.push({
      id: `rpe-${lift}`,
      lift,
      kind: 'rpe',
      headline:
        gap > 0
          ? `${LIFT_LABEL[lift]} is landing ${gap.toFixed(1)} RPE harder than prescribed`
          : `${LIFT_LABEL[lift]} is landing ${Math.abs(gap).toFixed(1)} RPE easier than prescribed`,
      detail:
        gap > 0
          ? `Loads are ahead of your current readiness. Trim ~${Math.round(gap * 2.5)}% or add recovery before pushing the next block.`
          : `There is room to add load. A ${Math.round(Math.abs(gap) * 2.5)}% jump would still match the prescribed effort.`,
      strength: Math.round(Math.min(1, Math.abs(gap) / 3) * 100),
      source: 'data',
    })
  }

  // 3. Competition trend per lift
  for (const lift of LIFTS) {
    const pts = series.map((s) => s[lift]).filter((v): v is number => typeof v === 'number')
    if (pts.length < 2) continue
    const change = pct(pts[0], pts[pts.length - 1])
    out.push({
      id: `trend-${lift}`,
      lift,
      kind: 'trend',
      headline: `${LIFT_LABEL[lift]} estimated 1RM ${change >= 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(1)}% across ${pts.length} blocks`,
      detail: `From ${pts[0]} to ${pts[pts.length - 1]} lbs. Average change of ${((pts[pts.length - 1] - pts[0]) / (pts.length - 1)).toFixed(1)} lbs per block.`,
      strength: Math.round(Math.min(1, Math.abs(change) / 30) * 100),
      source: 'data',
    })
  }

  // 4. Volume -> next-block gain
  const vol = volumeByBlock(entries)
  if (vol.length >= 4) {
    for (const lift of LIFTS) {
      const gains = deltas(series.map((s) => s[lift] ?? NaN))
      const r = pearson(deltas(vol.map((v) => v.tonnage)).slice(0, gains.length), gains)
      if (!Number.isNaN(r) && Math.abs(r) > 0.5) {
        out.push({
          id: `vol-${lift}`,
          lift,
          kind: 'volume',
          headline: r > 0 ? `More volume tends to precede ${LIFT_LABEL[lift]} gains` : `Higher volume blocks stall your ${LIFT_LABEL[lift]}`,
          detail: `Tonnage changes and ${LIFT_LABEL[lift].toLowerCase()} gains are correlated at r = ${r.toFixed(2)}.`,
          strength: Math.round(Math.abs(r) * 100),
          source: 'data',
        })
      }
    }
  }

  return out.sort((a, b) => b.strength - a.strength)
}

/** Illustrative inferences shown when the sheet has no accessory work to learn from. */
export function sampleInsights(): Insight[] {
  const mk = (a: string, b: string, A: number[], B: number[]) =>
    A.map((v, i) => ({ label: `Block ${i + 1}`, [a]: v, [b]: B[i] }))
  return [
    {
      id: 'sample-db-press',
      lift: 'bench',
      kind: 'accessory',
      headline: 'Dumbbell Press progress carries over to Bench',
      detail:
        'Block over block, an increase in your dumbbell press translates well to your barbell bench increase (r = 0.91). Keep progressing it.',
      strength: 91,
      source: 'sample',
      seriesKeys: { a: 'Dumbbell Press', b: 'Bench' },
      series: mk('Dumbbell Press', 'Bench', [100, 104, 111, 115], [100, 103, 108, 112]),
    },
    {
      id: 'sample-rdl',
      lift: 'deadlift',
      kind: 'accessory',
      headline: 'Romanian Deadlift volume predicts Deadlift jumps',
      detail: 'Blocks with higher RDL load were followed by your biggest deadlift gains (r = 0.84).',
      strength: 84,
      source: 'sample',
      seriesKeys: { a: 'Romanian Deadlift', b: 'Deadlift' },
      series: mk('Romanian Deadlift', 'Deadlift', [100, 102, 109, 113], [100, 101, 106, 111]),
    },
    {
      id: 'sample-front-squat',
      lift: 'squat',
      kind: 'accessory',
      headline: 'Front Squat gains lead Squat by about one block',
      detail: 'Your front squat tends to move first and your squat follows (r = 0.78).',
      strength: 78,
      source: 'sample',
      seriesKeys: { a: 'Front Squat', b: 'Squat' },
      series: mk('Front Squat', 'Squat', [100, 106, 108, 114], [100, 101, 107, 109]),
    },
  ]
}

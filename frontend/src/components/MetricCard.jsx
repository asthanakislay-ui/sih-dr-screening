import {
  AlertCircle,
  ClipboardCheck,
  Eye,
} from 'lucide-react'

// Semantic icon + accent mapping per metric label.
// The accent here is purely visual and does not change any data.
function resolveAccent(label) {
  if (!label) return 'teal'
  const normalized = label.toLowerCase()
  if (normalized.includes('refer')) return 'coral'
  if (normalized.includes('pending')) return 'amber'
  return 'teal'
}

const ACCENT = {
  teal: {
    icon: Eye,
    iconBg: 'rgba(18, 199, 200, 0.12)',
    iconColor: '#0F8E8F',
    rail: 'linear-gradient(180deg, #12C7C8 0%, rgba(18, 199, 200, 0.30) 100%)',
    spark: '#12C7C8',
    sparkFill: 'rgba(18, 199, 200, 0.10)',
    delta: '#0F8E8F',
    deltaBg: 'rgba(18, 199, 200, 0.10)',
    deltaBorder: 'rgba(18, 199, 200, 0.22)',
  },
  coral: {
    icon: AlertCircle,
    iconBg: 'rgba(197, 90, 90, 0.10)',
    iconColor: '#B23A3A',
    rail: 'linear-gradient(180deg, #D86A6A 0%, rgba(216, 106, 106, 0.30) 100%)',
    spark: '#D86A6A',
    sparkFill: 'rgba(216, 106, 106, 0.10)',
    delta: '#B23A3A',
    deltaBg: 'rgba(216, 106, 106, 0.08)',
    deltaBorder: 'rgba(216, 106, 106, 0.22)',
  },
  amber: {
    icon: ClipboardCheck,
    iconBg: 'rgba(183, 121, 31, 0.10)',
    iconColor: '#9A6310',
    rail: 'linear-gradient(180deg, #D69E2E 0%, rgba(214, 158, 46, 0.30) 100%)',
    spark: '#D69E2E',
    sparkFill: 'rgba(214, 158, 46, 0.10)',
    delta: '#9A6310',
    deltaBg: 'rgba(214, 158, 46, 0.08)',
    deltaBorder: 'rgba(214, 158, 46, 0.22)',
  },
}

// Deterministic tiny sparkline built from the value — visual decoration only.
function buildSpark(value, color, fill) {
  const str = String(value ?? '')
  const seed = str.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) || 1
  const points = []
  const width = 120
  const height = 36
  const step = width / 7
  for (let i = 0; i <= 7; i += 1) {
    const t = i / 7
    const wobble = Math.sin((seed + i) * 1.7) * 0.18
    const lift = Math.cos((seed * 0.7 + i) * 1.3) * 0.14
    const y = height - (0.55 + wobble + lift + t * 0.18) * height
    points.push(`${(i * step).toFixed(1)},${y.toFixed(1)}`)
  }
  const linePath = `M ${points.join(' L ')}`
  const areaPath = `${linePath} L ${width.toFixed(1)},${height.toFixed(1)} L 0,${height.toFixed(1)} Z`
  return { linePath, areaPath, width, height, color, fill }
}

function MetricCard({ label, value, supportingText, delta }) {
  const accentKey = resolveAccent(label)
  const a = ACCENT[accentKey]
  const Icon = a.icon
  const spark = buildSpark(value, a.spark, a.sparkFill)
  const deltaText = delta?.text ?? '+8.2%'
  const deltaTrend = delta?.trend ?? 'up'

  return (
    <article className="dashboard-metric-card group">
      <div
        className="dashboard-metric-rail"
        style={{ background: a.rail }}
        aria-hidden="true"
      />

      <div className="dashboard-metric-body">
        <div className="dashboard-metric-top">
          <div className="dashboard-metric-icon" style={{ background: a.iconBg, color: a.iconColor }}>
            <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
          </div>
          <span
            className="dashboard-metric-delta"
            style={{
              color: a.delta,
              background: a.deltaBg,
              borderColor: a.deltaBorder,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true">
              {deltaTrend === 'down' ? (
                <path d="M1.5 3 L4.5 6 L7.5 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M1.5 6 L4.5 3 L7.5 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
            {deltaText}
          </span>
        </div>

        <div>
          <p className="dashboard-metric-label">{label}</p>
          <p className="dashboard-metric-value">{value}</p>
        </div>

        <div className="dashboard-metric-spark" aria-hidden="true">
          <svg
            viewBox={`0 0 ${spark.width} ${spark.height}`}
            preserveAspectRatio="none"
            width="100%"
            height="36"
          >
            <path d={spark.areaPath} fill={spark.fill} stroke="none" />
            <path
              d={spark.linePath}
              fill="none"
              stroke={spark.color}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="dashboard-metric-foot">
          <span className="dashboard-metric-dot" style={{ background: a.spark }} aria-hidden="true" />
          <p className="dashboard-metric-supporting">{supportingText}</p>
        </div>
      </div>
    </article>
  )
}

export default MetricCard

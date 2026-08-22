function MetricCard({ label, value, supportingText }) {
  return (
    <article className="border border-line bg-panel px-5 py-5 shadow-[0_1px_3px_rgba(32,42,49,0.04)]">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-3 text-[30px] font-semibold leading-none tracking-[-0.03em] text-ink">
        {value}
      </p>
      <p className="mt-3 text-[13px] text-muted">{supportingText}</p>
    </article>
  )
}

export default MetricCard

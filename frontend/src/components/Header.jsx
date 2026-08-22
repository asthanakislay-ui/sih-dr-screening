import { CircleUserRound } from 'lucide-react'

function Header() {
  return (
    <header className="sticky top-0 z-10 flex min-h-[72px] items-center justify-between border-b border-line bg-panel px-8">
      <div className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
        
      </div>

      <div className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-muted">
        <CircleUserRound size={19} strokeWidth={1.7} aria-label="User profile" />
      </div>
    </header>
  )
}

export default Header

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

export default function AccordionSection({
  title,
  subtitle,
  defaultOpen = false,
  children,
  action,
  className = '',
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={open}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
            {open ? <Minus size={14} /> : <Plus size={14} />}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              {title}
            </span>
            {subtitle && <span className="block text-[10px] text-gray-400">{subtitle}</span>}
          </span>
        </button>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {open && <div className="mt-3">{children}</div>}
    </div>
  )
}

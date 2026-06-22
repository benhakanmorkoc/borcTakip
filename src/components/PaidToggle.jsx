import { Check } from 'lucide-react'

export default function PaidToggle({ label, checked, onChange, disabled }) {
  return (
    <label
      className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        disabled
          ? 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
          : checked
            ? 'cursor-pointer border-brand-200 bg-brand-50'
            : 'cursor-pointer border-gray-200 bg-white active:bg-gray-50'
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 bg-white'
        }`}
      >
        {checked && <Check size={14} strokeWidth={3} />}
      </span>
      <span className={checked ? 'font-medium text-brand-800' : 'text-gray-700'}>{label}</span>
    </label>
  )
}

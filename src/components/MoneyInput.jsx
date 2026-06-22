import { useEffect, useState } from 'react'
import { parseMoneyInput } from '../lib/format'

export default function MoneyInput({ label, value, onChange, required }) {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (value) {
      setDisplay(
        Number(value).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      )
    } else {
      setDisplay('')
    }
  }, [value])

  const handleBlur = () => {
    const num = parseMoneyInput(display)
    onChange(num)
    if (num) setDisplay(num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }))
  }

  return (
    <div>
      <label className="field-label">
        {label}
        {required && ' *'}
      </label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          className="field-input pr-10"
          placeholder="0"
          value={display}
          onChange={(e) => setDisplay(e.target.value)}
          onBlur={handleBlur}
          required={required}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          ₺
        </span>
      </div>
    </div>
  )
}

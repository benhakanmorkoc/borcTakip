import { X } from 'lucide-react'

export default function Modal({ open, title, onClose, children }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Kapat"
        onClick={onClose}
      />
      <div className="relative w-full max-w-phone sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 rounded-t-3xl sm:rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" onClick={onClose} className="btn-danger" aria-label="Kapat">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 pb-8">{children}</div>
      </div>
    </div>
  )
}

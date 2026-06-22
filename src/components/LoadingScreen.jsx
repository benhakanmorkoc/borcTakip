export default function LoadingScreen({ message = 'Yükleniyor...' }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-phone items-center justify-center bg-gray-100 shadow-xl">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-700" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

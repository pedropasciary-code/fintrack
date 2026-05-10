export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-gray-200 border-t-brand-400 shrink-0"
      style={{ width: size, height: size }}
    />
  )
}

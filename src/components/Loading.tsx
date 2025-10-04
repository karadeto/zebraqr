type Props = {
  message?: string
  className?: string
  size?: number // px
}

export default function Loading({ message = 'Loading…', className, size = 28 }: Props) {
  const style = { width: `${size}px`, height: `${size}px` }
  return (
    <div className={[
      'w-full flex flex-col items-center justify-center text-center py-10 text-slate-700',
      className,
    ].filter(Boolean).join(' ')}>
      <div className="inline-flex items-center gap-3">
        <span
          className="inline-block animate-spin rounded-full border-2 border-slate-300 border-t-slate-900"
          style={style}
          aria-hidden="true"
        />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  )
}


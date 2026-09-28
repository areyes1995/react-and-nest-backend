interface ToggleProps {
  checked: boolean
  onChange: (val: boolean) => void
}

export default function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f2a93b] ${
        checked ? 'bg-[#f2a93b]' : 'bg-[var(--text-muted)]'
      }`}
    >
      <span
        className={`inline-block w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

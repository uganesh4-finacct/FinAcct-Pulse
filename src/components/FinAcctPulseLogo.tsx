'use client'

import { Brain } from '@phosphor-icons/react'

type FinAcctPulseLogoProps = {
  /** When true, show only the icon (e.g. collapsed sidebar) */
  iconOnly?: boolean
  /** Size: 'sm' for top bar, 'md' for sidebar */
  size?: 'sm' | 'md'
  /** Use light text (for dark backgrounds like sidebar) */
  variant?: 'light' | 'dark'
}

export function FinAcctPulseLogo({
  iconOnly = false,
  size = 'sm',
  variant = 'dark',
}: FinAcctPulseLogoProps) {
  const iconSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9'
  const iconPx = size === 'sm' ? 18 : 22
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const labelColor =
    variant === 'light'
      ? 'text-white'
      : 'text-zinc-800 dark:text-zinc-200'
  const sublabelColor =
    variant === 'light'
      ? 'text-violet-300'
      : 'text-zinc-500 dark:text-zinc-400'

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div
        className={`${iconSize} flex-shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white`}
        aria-hidden
      >
        <Brain size={iconPx} color="currentColor" weight="duotone" />
      </div>
      {!iconOnly && (
        <div className="min-w-0 flex flex-col leading-tight">
          <span className={`font-semibold ${textSize} truncate ${labelColor}`}>
            FinAcct
          </span>
          <span className={`font-medium ${textSize} truncate ${sublabelColor}`}>
            Pulse
          </span>
        </div>
      )}
    </div>
  )
}

import React from 'react'

export function ElectricCard({
  variant = 'swirl',
  color = '#60a5fa',
  badge,
  title,
  description,
  children,
}) {
  // Мягкое, "солнечное" свечение вокруг карточки, подмешанное с цветом сложности
  const glowStyle =
    variant === 'hue'
      ? {
          background: `
            conic-gradient(from 180deg at 50% 50%, ${color}55, transparent, ${color}aa, transparent, ${color}55),
            radial-gradient(circle at 50% 0%, rgba(252, 211, 77, 0.55), transparent 65%)
          `,
        }
      : {
          background: `
            radial-gradient(circle at 50% 0%, rgba(252, 211, 77, 0.55), transparent 65%),
            radial-gradient(circle at 0% 0%, ${color}88, transparent 55%),
            radial-gradient(circle at 100% 0%, ${color}66, transparent 55%)
          `,
        }

  return (
    <div className="relative w-full max-w-xl">
      {/* Внешнее мягкое "солнечное" свечение */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-90 blur-2xl"
        style={glowStyle}
      />

      {/* Основная карточка */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-black/80 via-black to-black px-6 py-6 md:px-8 md:py-7 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          {badge && (
            <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
              {badge}
            </span>
          )}
          <span
            className="h-[1px] flex-1 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            aria-hidden="true"
          />
        </div>

        {title && (
          <h3 className="mb-2 text-xl md:text-2xl font-semibold text-white">
            {title}
          </h3>
        )}

        {description && (
          <p className="mb-4 text-sm md:text-base text-white/80">
            {description}
          </p>
        )}

        {children}
      </div>
    </div>
  )
}



import { ListTodo } from 'lucide-react'

import { formatClock } from '@/lib/format'
import { TONES } from '@/lib/statusVisuals'
import type { DashEvent } from '@/types/reading'

interface RecentEventsProps {
  events: DashEvent[]
}

/** Non-interactive feed of the latest real system events. */
export function RecentEvents({ events }: RecentEventsProps) {
  const visible = events.slice(0, 9)

  return (
    <section className="panel flex min-h-0 flex-1 flex-col" aria-label="Recent events">
      <header className="panel-header py-3">
        <h2 className="text-ink-800 flex items-center gap-2 text-[15px] font-bold">
          <ListTodo size={18} strokeWidth={2.2} className="text-brand-500" aria-hidden="true" />
          Recent Events
        </h2>
        <span className="text-ink-500 text-[12px] font-semibold">
          {events.length > 0 ? `Latest ${visible.length}` : 'No events'}
        </span>
      </header>

      <div className="relative min-h-0 flex-1">
        <ol className="absolute inset-0 overflow-hidden">
          {visible.length === 0 && (
            <li className="text-ink-500 flex h-full items-center justify-center px-4 py-6 text-center text-[13px]">
              No events yet — entries appear as readings and connection changes arrive.
            </li>
          )}
          {visible.map((event) => {
            const tone = TONES[event.level]
            return (
              <li
                key={event.id}
                className="flex items-start gap-3 border-b border-ink-100 px-4 py-2 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className={`mt-1.5 size-2.5 shrink-0 rounded-full ${tone.dot}`}
                />
                <div className="min-w-0">
                  <p className="tnum text-ink-500 text-[11.5px] font-bold">
                    {formatClock(event.t)}
                  </p>
                  <p className="text-ink-800 text-[13.5px] leading-snug font-medium">
                    {event.message}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
        {/* If the list is taller than the panel, soften the cut-off row rather
            than slicing text mid-line. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-white to-transparent"
        />
      </div>

      <p className="text-ink-400 border-t border-ink-100 px-4 py-2 text-[11px]">
        Events are generated only from received readings and connection changes.
      </p>
    </section>
  )
}
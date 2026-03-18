'use client'

import { SHORTCUTS } from '@/lib/shortcuts'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface KeyboardCheatsheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardCheatsheet({ open, onOpenChange }: KeyboardCheatsheetProps) {
  const grouped = {
    global: SHORTCUTS.filter((s) => s.category === 'global'),
    navigation: SHORTCUTS.filter((s) => s.category === 'navigation'),
    action: SHORTCUTS.filter((s) => s.category === 'action'),
  }

  const categoryLabels: Record<string, string> = {
    global: 'Global',
    navigation: 'Navigation',
    action: 'Actions',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-brass-gold">Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {Object.entries(grouped).map(([category, shortcuts]) =>
            shortcuts.length > 0 ? (
              <div key={category}>
                <h3 className="text-xs font-mono uppercase tracking-wider text-brass-muted mb-2">
                  {categoryLabels[category]}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((s) => (
                    <div
                      key={s.key}
                      className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-console-hover"
                    >
                      <span className="text-sm text-slate-300">{s.description}</span>
                      <kbd className="inline-flex items-center gap-0.5 rounded border border-console-border bg-console px-2 py-0.5 text-xs font-mono text-brass-muted">
                        {s.display}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
        <div className="border-t border-console-border pt-3 mt-2">
          <p className="text-xs text-slate-500 text-center">
            Press <kbd className="font-mono border border-console-border rounded px-1">Esc</kbd> to close
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
// postest

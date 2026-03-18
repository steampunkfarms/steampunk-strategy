// Keyboard shortcut registry for TARDIS (The Bridge)
// see docs/handoffs/_working/20260318-cross-site-keyboard-shortcuts-working-spec.md

export interface Shortcut {
  key: string
  label: string
  description: string
  category: 'global' | 'navigation' | 'action'
  display: string
}

export const SHORTCUTS: Shortcut[] = [
  // Universal
  { key: 'mod+k', label: 'Search', description: 'Open command palette', category: 'global', display: '⌘K' },
  { key: 'shift+/', label: 'Shortcuts', description: 'Show keyboard shortcuts', category: 'global', display: '⇧?' },
  { key: 'escape', label: 'Close', description: 'Close any open modal', category: 'global', display: 'Esc' },
  { key: '/', label: 'Focus search', description: 'Focus nearest search input', category: 'global', display: '/' },
  // Navigation
  { key: 'g e', label: 'Expenses', description: 'Go to Expenses ledger', category: 'navigation', display: 'G → E' },
  { key: 'g c', label: 'Compliance', description: 'Go to Compliance hub', category: 'navigation', display: 'G → C' },
  // Actions
  { key: 'mod+shift+u', label: 'Upload', description: 'Open document upload', category: 'action', display: '⌘⇧U' },
  { key: 'mod+shift+p', label: 'Print Minutes', description: 'Print current board minutes PDF', category: 'action', display: '⌘⇧P' },
  { key: 'mod+shift+i', label: 'Intelligence', description: 'Go to Intelligence dashboard', category: 'action', display: '⌘⇧I' },
]

export const G_NAV: Record<string, string> = {
  e: '/expenses',
  c: '/compliance',
}
// postest

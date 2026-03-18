'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'
import { KeyboardCheatsheet } from '@/components/ui/keyboard-cheatsheet'
import { G_NAV } from '@/lib/shortcuts'

// see docs/handoffs/_working/20260318-cross-site-keyboard-shortcuts-working-spec.md

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const gPressedRef = useRef(false)
  const gTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // --- Universal shortcuts ---

  // Cmd+K → command palette (simple navigation for now)
  useHotkeys('mod+k', (e) => {
    e.preventDefault()
    setCommandPaletteOpen((prev) => !prev)
  })

  // Shift+? → cheatsheet
  useHotkeys('shift+/', (e) => {
    e.preventDefault()
    setCheatsheetOpen((prev) => !prev)
  }, { enableOnFormTags: false })

  // / → focus nearest search input
  useHotkeys('/', (e) => {
    const searchInput = document.querySelector<HTMLInputElement>(
      '[data-search], input[type="search"], input[aria-label="Search"]'
    )
    if (searchInput) {
      e.preventDefault()
      searchInput.focus()
    }
  }, { enableOnFormTags: false })

  // Escape → close modals
  useHotkeys('escape', () => {
    if (cheatsheetOpen) setCheatsheetOpen(false)
    if (commandPaletteOpen) setCommandPaletteOpen(false)
  })

  // J/K → next/prev in list views
  useHotkeys('j', () => navigateListItem('next'), { enableOnFormTags: false })
  useHotkeys('k', () => navigateListItem('prev'), { enableOnFormTags: false })

  // --- TARDIS-specific shortcuts ---

  // Cmd+Shift+U → open document upload
  useHotkeys('mod+shift+u', (e) => {
    e.preventDefault()
    router.push('/documents')
    // The upload modal auto-opens on the documents page
  })

  // Cmd+Shift+P → print board minutes PDF
  useHotkeys('mod+shift+p', (e) => {
    e.preventDefault()
    // If already on a board-minutes detail page, trigger PDF
    const match = pathname.match(/\/board-minutes\/(\d+)/)
    if (match) {
      window.open(`/api/board-minutes/${match[1]}/pdf`, '_blank')
    } else {
      router.push('/board-minutes')
    }
  })

  // Cmd+Shift+I → intelligence dashboard
  useHotkeys('mod+shift+i', (e) => {
    e.preventDefault()
    router.push('/intelligence')
  })

  // --- G then X navigation ---
  useHotkeys('g', () => {
    gPressedRef.current = true
    clearTimeout(gTimeoutRef.current)
    gTimeoutRef.current = setTimeout(() => { gPressedRef.current = false }, 1000)
  }, { enableOnFormTags: false })

  const handleGNav = useCallback((target: string) => {
    if (gPressedRef.current) {
      gPressedRef.current = false
      clearTimeout(gTimeoutRef.current)
      router.push(target)
    }
  }, [router])

  useHotkeys('e', () => handleGNav(G_NAV.e), { enableOnFormTags: false })
  useHotkeys('c', () => handleGNav(G_NAV.c), { enableOnFormTags: false })

  return (
    <>
      {children}
      <KeyboardCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </>
  )
}

/** Minimal command palette — navigates to TARDIS sections */
function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const items = [
    { label: 'The Bridge', href: '/bridge' },
    { label: 'Expenses', href: '/expenses' },
    { label: 'Documents', href: '/documents' },
    { label: 'Vendors', href: '/vendors' },
    { label: 'Intelligence', href: '/intelligence' },
    { label: 'Analytical', href: '/intelligence/analytical' },
    { label: 'Strategic', href: '/intelligence/strategic' },
    { label: 'Compliance', href: '/compliance' },
    { label: 'Board Minutes', href: '/board-minutes' },
    { label: 'Tax Hub', href: '/tax-hub' },
    { label: "Captain's Log", href: '/captains-log' },
    { label: 'Cost Centers', href: '/cost-centers' },
    { label: 'Dev Costs', href: '/dev-costs' },
    { label: 'Gift Staging', href: '/gift-staging' },
    { label: 'Monitoring', href: '/monitoring' },
    { label: 'Product Map', href: '/product-map' },
    { label: 'Programs', href: '/programs' },
    { label: 'Retail Charity', href: '/retail-charity' },
    { label: 'Scan Import', href: '/scan-import' },
    { label: 'Transparency', href: '/transparency' },
    { label: 'Vet Staging', href: '/vet-staging' },
    { label: 'Credentials', href: '/credentials' },
  ]

  const filtered = query
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items

  const navigate = (href: string) => {
    onOpenChange(false)
    setQuery('')
    router.push(href)
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => { onOpenChange(false); setQuery('') }}
      />
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-full max-w-lg px-4" role="dialog" aria-label="Command palette">
        <div className="rounded-xl border border-console-border bg-tardis-dark shadow-2xl overflow-hidden">
          <div className="flex items-center border-b border-console-border px-4">
            <span className="text-brass-muted text-sm mr-2">⌘</span>
            <input
              ref={inputRef}
              autoFocus
              type="text"
              placeholder="Jump to..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { onOpenChange(false); setQuery('') }
                if (e.key === 'Enter' && filtered[0]) navigate(filtered[0].href)
              }}
              className="flex-1 bg-transparent px-3 py-3.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.map((item) => (
              <button
                key={item.href}
                onClick={() => navigate(item.href)}
                className="w-full text-left rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-console-hover hover:text-tardis-glow transition-colors"
              >
                {item.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No results</p>
            )}
          </div>
          <div className="border-t border-console-border px-4 py-2 flex items-center gap-3 text-[10px] text-slate-500">
            <span><kbd className="font-mono border border-console-border rounded px-1">↵</kbd> select</span>
            <span><kbd className="font-mono border border-console-border rounded px-1">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </>
  )
}

function navigateListItem(direction: 'next' | 'prev') {
  const focusable = Array.from(
    document.querySelectorAll<HTMLElement>(
      'table tbody tr, [data-list-item], [role="row"]'
    )
  )
  if (focusable.length === 0) return

  const active = document.activeElement as HTMLElement | null
  const currentIndex = active ? focusable.indexOf(active) : -1

  let nextIndex: number
  if (direction === 'next') {
    nextIndex = currentIndex < focusable.length - 1 ? currentIndex + 1 : 0
  } else {
    nextIndex = currentIndex > 0 ? currentIndex - 1 : focusable.length - 1
  }

  const target = focusable[nextIndex]
  if (target) {
    target.tabIndex = -1
    target.focus()
    target.scrollIntoView({ block: 'nearest' })
    focusable.forEach((el) => el.classList.remove('ring-2', 'ring-tardis-glow/50'))
    target.classList.add('ring-2', 'ring-tardis-glow/50')
  }
}
// postest

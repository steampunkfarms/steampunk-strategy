'use client'

// Omnipresent Chronicle Button — quick capture for caretaker field notes
// Copied from steampunk-postmaster/components/ChronicleButton.tsx
// Uses local /api/chronicle/proxy to forward to Postmaster with INTERNAL_SECRET
// see steampunk-strategy/docs/handoffs/_working/20260307-caretaker-chronicle-working-spec.md

import { useState, useRef } from 'react'

interface ChronicleButtonProps {
  defaultAuthor?: string
}

const QUICK_TAGS = [
  { id: 'feeding', emoji: '\u{1F33E}' },
  { id: 'medical', emoji: '\u{1F3E5}' },
  { id: 'weather', emoji: '\u{1F324}\uFE0F' },
  { id: 'milestone', emoji: '\u2B50' },
  { id: 'behavior', emoji: '\u{1F43E}' },
  { id: 'operations', emoji: '\u{1F527}' },
  { id: 'funny', emoji: '\u{1F602}' },
  { id: 'beautiful', emoji: '\u2728' },
]

const AUTHORS = [
  { id: 'fred', name: 'Fred' },
  { id: 'krystal', name: 'Krystal' },
  { id: 'tierra', name: 'Tierra' },
]

export default function ChronicleButton({ defaultAuthor = 'fred' }: ChronicleButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [body, setBody] = useState('')
  const [author, setAuthor] = useState(defaultAuthor)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      setResult('Microphone access required for voice recording')
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.onstop = async () => {
      mediaRecorderRef.current!.stream.getTracks().forEach(t => t.stop())
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setIsRecording(false)
      setIsSubmitting(true)
      try {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'chronicle.webm')
        formData.append('author', author)
        formData.append('tags', JSON.stringify(selectedTags))
        const res = await fetch('/api/chronicle/proxy/voice', { method: 'POST', body: formData })
        const data = await res.json()
        if (res.ok) {
          setBody(data.body)
          setResult('Voice chronicled')
          setTimeout(() => { setResult(null); setBody(''); setSelectedTags([]); setIsOpen(false) }, 2000)
        } else {
          setResult(`Error: ${data.error}`)
        }
      } catch {
        setResult('Failed to process voice recording')
      } finally {
        setIsSubmitting(false)
      }
    }
    mediaRecorderRef.current.stop()
  }

  const submitText = async () => {
    if (!body.trim()) return
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/chronicle/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, author, source: 'web', tags: selectedTags }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult('Chronicled')
        setTimeout(() => { setResult(null); setBody(''); setSelectedTags([]); setIsOpen(false) }, 2000)
      } else {
        setResult(`Error: ${data.error}`)
      }
    } catch {
      setResult('Failed to save chronicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-lg flex items-center justify-center transition-transform ${isOpen ? 'rotate-45' : ''}`}
        title="Quick Chronicle"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed top-16 right-4 z-50 w-80 bg-console rounded-lg shadow-xl border border-console-border p-4 space-y-3">
          <h3 className="font-semibold text-sm text-slate-100">Quick Chronicle</h3>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's happening at the barn..."
            className="w-full h-20 text-sm border border-console-border rounded-md p-2 resize-none bg-tardis-dark text-slate-200"
            disabled={isSubmitting}
          />
          <div className="flex flex-wrap gap-1">
            {QUICK_TAGS.map(tag => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`text-xs px-2 py-0.5 rounded-full border transition ${
                  selectedTags.includes(tag.id)
                    ? 'bg-brass-dark/30 border-brass text-brass-gold'
                    : 'bg-console-hover border-console-border text-slate-400 hover:bg-console-light'
                }`}
              >
                {tag.emoji} {tag.id}
              </button>
            ))}
          </div>
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full text-sm border border-console-border rounded-md p-1 bg-tardis-dark text-slate-200"
          >
            {AUTHORS.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSubmitting}
              className={`flex-1 text-sm py-1.5 rounded-md ${
                isRecording ? 'bg-gauge-red text-white animate-pulse' : 'bg-console-hover hover:bg-console-light text-slate-300'
              }`}
            >
              {isRecording ? 'Stop' : 'Record'}
            </button>
            <button
              onClick={submitText}
              disabled={isSubmitting || !body.trim()}
              className="flex-1 text-sm py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? '...' : 'Save'}
            </button>
          </div>
          {result && (
            <p className={`text-xs text-center ${result.startsWith('Error') || result.startsWith('Failed') || result.startsWith('Microphone') ? 'text-gauge-red' : 'text-gauge-green'}`}>
              {result}
            </p>
          )}
        </div>
      )}
    </>
  )
}

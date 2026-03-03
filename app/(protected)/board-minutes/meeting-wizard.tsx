'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BookOpen, Users, FileText, Sparkles, Eye, PenLine, FileCheck,
  Plus, Trash2, ChevronUp, ChevronDown, Loader2, Check, Download,
  Upload, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────

type WizardStep = 'metadata' | 'attendees' | 'notes' | 'polishing' | 'review' | 'attest' | 'generate';

const STEPS: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: 'metadata', label: 'Details', icon: BookOpen },
  { key: 'attendees', label: 'Attendees', icon: Users },
  { key: 'notes', label: 'Agenda & Notes', icon: FileText },
  { key: 'polishing', label: 'AI Polish', icon: Sparkles },
  { key: 'review', label: 'Review', icon: Eye },
  { key: 'attest', label: 'Sign', icon: PenLine },
  { key: 'generate', label: 'PDF', icon: FileCheck },
];

interface Attendee {
  name: string;
  role: string;
  isBoard: boolean;
  present: boolean;
  arrivedLate: boolean;
  leftEarly: boolean;
  note: string;
}

interface AgendaItemForm {
  title: string;
  description: string;
  category: string;
  hasMotion: boolean;
  motionText: string;
  motionBy: string;
  secondedBy: string;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  motionResult: string;
}

interface ActionItemForm {
  description: string;
  assignee: string;
  dueDate: string;
}

// Hardcoded board members — good enough for a 4-person family board
const DEFAULT_BOARD: Attendee[] = [
  { name: 'Erick Tronboll', role: 'President', isBoard: true, present: true, arrivedLate: false, leftEarly: false, note: '' },
  { name: 'Krystal Tronboll', role: 'Secretary', isBoard: true, present: true, arrivedLate: false, leftEarly: false, note: '' },
  { name: 'Fred Tronboll', role: 'Treasurer', isBoard: true, present: true, arrivedLate: false, leftEarly: false, note: '' },
  { name: 'Stazia Tronboll', role: 'Director', isBoard: true, present: true, arrivedLate: false, leftEarly: false, note: '' },
];

const CATEGORIES = ['financial', 'operations', 'personnel', 'legal', 'fundraising', 'other'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MeetingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume');

  const [step, setStep] = useState<WizardStep>('metadata');
  const [meetingId, setMeetingId] = useState<string | null>(resumeId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Metadata
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('18:00');
  const [endTime, setEndTime] = useState('');
  const [meetingType, setMeetingType] = useState('regular');
  const [location, setLocation] = useState('Steampunk Farms — Kitchen Table');
  const [calledBy, setCalledBy] = useState('');

  // Step 2: Attendees
  const [attendees, setAttendees] = useState<Attendee[]>([...DEFAULT_BOARD]);

  // Step 3: Agenda + Notes
  const [agendaItems, setAgendaItems] = useState<AgendaItemForm[]>([
    { title: '', description: '', category: '', hasMotion: false, motionText: '', motionBy: '', secondedBy: '', votesFor: 0, votesAgainst: 0, votesAbstain: 0, motionResult: '' },
  ]);
  const [actionItems, setActionItems] = useState<ActionItemForm[]>([]);
  const [rawNotes, setRawNotes] = useState('');

  // Step 4-5: Polish
  const [polishedMinutes, setPolishedMinutes] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [editing, setEditing] = useState(false);

  // Step 6: Attestation
  const [attestedBy, setAttestedBy] = useState('');
  const [attestedRole, setAttestedRole] = useState('Secretary');
  const [attestationConfirmed, setAttestationConfirmed] = useState(false);
  const [signatureBlobUrl, setSignatureBlobUrl] = useState<string | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  // Step 7: PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Load existing meeting if resuming
  useEffect(() => {
    if (resumeId) {
      fetch(`/api/board-minutes/${resumeId}`)
        .then(r => r.json())
        .then(({ meeting }) => {
          if (!meeting) return;
          const d = new Date(meeting.date);
          setDate(d.toISOString().split('T')[0]);
          setTime(d.toTimeString().slice(0, 5));
          if (meeting.endTime) setEndTime(new Date(meeting.endTime).toTimeString().slice(0, 5));
          setMeetingType(meeting.type);
          setLocation(meeting.location);
          setCalledBy(meeting.calledBy || '');
          if (meeting.attendees.length > 0) {
            setAttendees(meeting.attendees.map((a: Attendee) => ({ ...a, note: a.note || '' })));
          }
          if (meeting.agendaItems.length > 0) {
            setAgendaItems(meeting.agendaItems.map((a: AgendaItemForm) => ({
              ...a,
              description: a.description || '',
              category: a.category || '',
              motionText: a.motionText || '',
              motionBy: a.motionBy || '',
              secondedBy: a.secondedBy || '',
              motionResult: a.motionResult || '',
            })));
          }
          if (meeting.rawNotes) setRawNotes(meeting.rawNotes);
          if (meeting.polishedMinutes) {
            setPolishedMinutes(meeting.polishedMinutes);
            if (meeting.status === 'polished') setStep('review');
            else if (meeting.status === 'attested') setStep('generate');
          }
        });
    }
  }, [resumeId]);

  // Load existing signature
  useEffect(() => {
    fetch('/api/board-minutes/signature')
      .then(r => r.json())
      .then(data => {
        if (data.signatureBlobUrl) setSignatureBlobUrl(data.signatureBlobUrl);
      })
      .catch(() => {});
  }, []);

  const currentStepIndex = STEPS.findIndex(s => s.key === step);

  // ─── Step Handlers ─────────────────────────────────────────────────────────

  const saveMetadata = async () => {
    setSaving(true);
    setError(null);
    try {
      const dateTime = new Date(`${date}T${time}`).toISOString();
      const endDateTime = endTime ? new Date(`${date}T${endTime}`).toISOString() : null;

      if (meetingId) {
        await fetch(`/api/board-minutes/${meetingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateTime, endTime: endDateTime, type: meetingType, location, calledBy: calledBy || null }),
        });
      } else {
        const res = await fetch('/api/board-minutes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateTime, endTime: endDateTime, type: meetingType, location, calledBy: calledBy || null }),
        });
        const { meeting } = await res.json();
        setMeetingId(meeting.id);
      }
      setStep('attendees');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveAttendees = async () => {
    if (!meetingId) return;
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/board-minutes/${meetingId}/attendees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendees }),
      });
      setStep('notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const saveAgendaAndPolish = async () => {
    if (!meetingId) return;
    setSaving(true);
    setError(null);
    try {
      const validAgenda = agendaItems.filter(a => a.title.trim());
      const validActions = actionItems.filter(a => a.description.trim());

      await fetch(`/api/board-minutes/${meetingId}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agendaItems: validAgenda, actionItems: validActions, rawNotes }),
      });

      // Move to polish step
      setStep('polishing');
      setSaving(false);
      setPolishing(true);

      const res = await fetch(`/api/board-minutes/${meetingId}/polish`, { method: 'POST' });
      const { polishedMinutes: text } = await res.json();
      setPolishedMinutes(text);
      setPolishing(false);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to polish');
      setPolishing(false);
      setSaving(false);
    }
  };

  const saveEditedMinutes = async () => {
    if (!meetingId) return;
    setSaving(true);
    try {
      await fetch(`/api/board-minutes/${meetingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polishedMinutes }),
      });
      setEditing(false);
    } catch {
      // Non-critical — edits still in state
    } finally {
      setSaving(false);
    }
  };

  const submitAttestation = async () => {
    if (!meetingId) return;
    setSaving(true);
    setError(null);
    try {
      await fetch(`/api/board-minutes/${meetingId}/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attestedBy, attestedRole, attestationConfirmed, signatureBlobUrl }),
      });
      setStep('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attest');
    } finally {
      setSaving(false);
    }
  };

  const generatePdf = async () => {
    if (!meetingId) return;
    setGeneratingPdf(true);
    setError(null);
    try {
      const res = await fetch(`/api/board-minutes/${meetingId}/pdf`, { method: 'POST' });
      const { pdfUrl: url } = await res.json();
      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSignatureUpload = useCallback(async (file: File) => {
    setUploadingSignature(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/board-minutes/signature', { method: 'POST', body: fd });
      const { signatureBlobUrl: url } = await res.json();
      setSignatureBlobUrl(url);
    } catch {
      // Non-critical
    } finally {
      setUploadingSignature(false);
    }
  }, []);

  // ─── Attendee helpers ──────────────────────────────────────────────────────

  const updateAttendee = (idx: number, field: keyof Attendee, value: string | boolean) => {
    setAttendees(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const addGuest = () => {
    setAttendees(prev => [...prev, { name: '', role: 'Guest', isBoard: false, present: true, arrivedLate: false, leftEarly: false, note: '' }]);
  };

  const removeAttendee = (idx: number) => {
    setAttendees(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Agenda helpers ────────────────────────────────────────────────────────

  const updateAgendaItem = (idx: number, field: keyof AgendaItemForm, value: string | boolean | number) => {
    setAgendaItems(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const addAgendaItem = () => {
    setAgendaItems(prev => [...prev, { title: '', description: '', category: '', hasMotion: false, motionText: '', motionBy: '', secondedBy: '', votesFor: 0, votesAgainst: 0, votesAbstain: 0, motionResult: '' }]);
  };

  const removeAgendaItem = (idx: number) => {
    setAgendaItems(prev => prev.filter((_, i) => i !== idx));
  };

  const moveAgendaItem = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= agendaItems.length) return;
    setAgendaItems(prev => {
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  // ─── Action item helpers ───────────────────────────────────────────────────

  const addActionItem = () => {
    setActionItems(prev => [...prev, { description: '', assignee: '', dueDate: '' }]);
  };

  const updateActionItem = (idx: number, field: keyof ActionItemForm, value: string) => {
    setActionItems(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  const removeActionItem = (idx: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== idx));
  };

  // ─── Quorum calc ───────────────────────────────────────────────────────────

  const boardMembers = attendees.filter(a => a.isBoard);
  const boardPresent = boardMembers.filter(a => a.present);
  const quorumMet = boardPresent.length > boardMembers.length / 2;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/board-minutes" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-display font-bold text-slate-100">
          {resumeId ? 'Resume Meeting Documentation' : 'Document Board Meeting'}
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isPast = i < currentStepIndex;
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive ? 'bg-tardis/40 text-tardis-glow border border-tardis-glow/20' :
                isPast ? 'text-gauge-green' : 'text-slate-600'
              }`}>
                {isPast ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-1 ${isPast ? 'bg-gauge-green/30' : 'bg-console-border'}`} />}
            </div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-gauge-red/10 border border-gauge-red/30 rounded-lg p-3 text-sm text-gauge-red">
          {error}
        </div>
      )}

      {/* ─── STEP 1: METADATA ─────────────────────────────────────────── */}
      {step === 'metadata' && (
        <div className="console-card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Meeting Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-tardis-glow/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Start Time</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-tardis-glow/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">End Time (optional)</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-tardis-glow/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Meeting Type</label>
              <select value={meetingType} onChange={e => setMeetingType(e.target.value)}
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-tardis-glow/50">
                <option value="regular">Regular</option>
                <option value="special">Special</option>
                <option value="annual">Annual</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Location</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-tardis-glow/50" />
          </div>
          {(meetingType === 'special' || meetingType === 'emergency') && (
            <div>
              <label className="block text-xs text-slate-500 mb-1">Called By</label>
              <input type="text" value={calledBy} onChange={e => setCalledBy(e.target.value)} placeholder="Who called this meeting?"
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-tardis-glow/50" />
            </div>
          )}
          <div className="flex justify-end pt-2">
            <button onClick={saveMetadata} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Next: Attendees
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 2: ATTENDEES ────────────────────────────────────────── */}
      {step === 'attendees' && (
        <div className="console-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Attendees</h2>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${quorumMet ? 'bg-gauge-green/20 text-gauge-green' : 'bg-gauge-red/20 text-gauge-red'}`}>
              {boardPresent.length} of {boardMembers.length} directors — quorum {quorumMet ? 'met' : 'NOT met'}
            </div>
          </div>

          <div className="space-y-3">
            {attendees.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-console border border-console-border">
                <input
                  type="checkbox"
                  checked={a.present}
                  onChange={e => updateAttendee(i, 'present', e.target.checked)}
                  className="mt-1 accent-tardis-glow"
                />
                <div className="flex-1 min-w-0">
                  {a.isBoard ? (
                    <div>
                      <span className="text-sm text-slate-200">{a.name}</span>
                      <span className="ml-2 text-xs text-brass-gold">{a.role}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={a.name} onChange={e => updateAttendee(i, 'name', e.target.value)} placeholder="Guest name"
                        className="flex-1 bg-tardis-dark border border-console-border rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-600" />
                      <input type="text" value={a.role} onChange={e => updateAttendee(i, 'role', e.target.value)} placeholder="Role"
                        className="w-32 bg-tardis-dark border border-console-border rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-600" />
                    </div>
                  )}
                  {a.present && (
                    <div className="flex gap-4 mt-1">
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        <input type="checkbox" checked={a.arrivedLate} onChange={e => updateAttendee(i, 'arrivedLate', e.target.checked)} className="accent-gauge-amber" />
                        Arrived late
                      </label>
                      <label className="flex items-center gap-1 text-xs text-slate-500">
                        <input type="checkbox" checked={a.leftEarly} onChange={e => updateAttendee(i, 'leftEarly', e.target.checked)} className="accent-gauge-amber" />
                        Left early
                      </label>
                    </div>
                  )}
                </div>
                {!a.isBoard && (
                  <button onClick={() => removeAttendee(i)} className="text-slate-600 hover:text-gauge-red transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button onClick={addGuest} className="text-sm text-tardis-glow hover:text-tardis-light flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Guest
          </button>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep('metadata')} className="text-sm text-slate-500 hover:text-slate-300">Back</button>
            <button onClick={saveAttendees} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Next: Agenda & Notes
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3: AGENDA & NOTES ───────────────────────────────────── */}
      {step === 'notes' && (
        <div className="space-y-4">
          <div className="console-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Agenda Items</h2>
            {agendaItems.map((item, i) => (
              <div key={i} className="p-4 rounded-lg bg-console border border-console-border space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono">{i + 1}.</span>
                  <input type="text" value={item.title} onChange={e => updateAgendaItem(i, 'title', e.target.value)}
                    placeholder="Agenda item title"
                    className="flex-1 bg-tardis-dark border border-console-border rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600" />
                  <select value={item.category} onChange={e => updateAgendaItem(i, 'category', e.target.value)}
                    className="bg-tardis-dark border border-console-border rounded px-2 py-1.5 text-xs text-slate-400">
                    <option value="">Category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="flex gap-1">
                    <button onClick={() => moveAgendaItem(i, -1)} disabled={i === 0} className="text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveAgendaItem(i, 1)} disabled={i === agendaItems.length - 1} className="text-slate-600 hover:text-slate-300 disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeAgendaItem(i)} className="text-slate-600 hover:text-gauge-red">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea value={item.description} onChange={e => updateAgendaItem(i, 'description', e.target.value)}
                  placeholder="Discussion notes for this item..."
                  rows={2}
                  className="w-full bg-tardis-dark border border-console-border rounded px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 resize-none" />

                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input type="checkbox" checked={item.hasMotion} onChange={e => updateAgendaItem(i, 'hasMotion', e.target.checked)} className="accent-brass-gold" />
                  This item has a formal motion
                </label>

                {item.hasMotion && (
                  <div className="pl-4 border-l-2 border-brass-gold/30 space-y-2">
                    <input type="text" value={item.motionText} onChange={e => updateAgendaItem(i, 'motionText', e.target.value)}
                      placeholder="Motion text: &quot;Move to approve...&quot;"
                      className="w-full bg-tardis-dark border border-console-border rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={item.motionBy} onChange={e => updateAgendaItem(i, 'motionBy', e.target.value)}
                        className="bg-tardis-dark border border-console-border rounded px-2 py-1.5 text-sm text-slate-300">
                        <option value="">Moved by...</option>
                        {attendees.filter(a => a.present).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                      </select>
                      <select value={item.secondedBy} onChange={e => updateAgendaItem(i, 'secondedBy', e.target.value)}
                        className="bg-tardis-dark border border-console-border rounded px-2 py-1.5 text-sm text-slate-300">
                        <option value="">Seconded by...</option>
                        {attendees.filter(a => a.present).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-3 items-center">
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500">For:</label>
                        <input type="number" min={0} value={item.votesFor} onChange={e => updateAgendaItem(i, 'votesFor', parseInt(e.target.value) || 0)}
                          className="w-14 bg-tardis-dark border border-console-border rounded px-2 py-1 text-sm text-gauge-green text-center" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500">Against:</label>
                        <input type="number" min={0} value={item.votesAgainst} onChange={e => updateAgendaItem(i, 'votesAgainst', parseInt(e.target.value) || 0)}
                          className="w-14 bg-tardis-dark border border-console-border rounded px-2 py-1 text-sm text-gauge-red text-center" />
                      </div>
                      <div className="flex items-center gap-1">
                        <label className="text-xs text-slate-500">Abstain:</label>
                        <input type="number" min={0} value={item.votesAbstain} onChange={e => updateAgendaItem(i, 'votesAbstain', parseInt(e.target.value) || 0)}
                          className="w-14 bg-tardis-dark border border-console-border rounded px-2 py-1 text-sm text-slate-400 text-center" />
                      </div>
                      <select value={item.motionResult} onChange={e => updateAgendaItem(i, 'motionResult', e.target.value)}
                        className="bg-tardis-dark border border-console-border rounded px-2 py-1.5 text-sm text-slate-300">
                        <option value="">Result...</option>
                        <option value="passed">Passed</option>
                        <option value="failed">Failed</option>
                        <option value="tabled">Tabled</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={addAgendaItem} className="text-sm text-tardis-glow hover:text-tardis-light flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Agenda Item
            </button>
          </div>

          {/* Raw Notes */}
          <div className="console-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">Raw Discussion Notes</h2>
            <p className="text-xs text-slate-500">Paste your family meeting notes here. Claude will clean them up into formal minutes.</p>
            <textarea value={rawNotes} onChange={e => setRawNotes(e.target.value)}
              placeholder="Paste your notes from the meeting — informal is fine, Claude will formalize everything..."
              rows={8}
              className="w-full bg-console border border-console-border rounded-lg px-4 py-3 text-sm text-slate-200 placeholder:text-slate-600 resize-y" />
          </div>

          {/* Action Items */}
          <div className="console-card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-100">Action Items</h2>
            {actionItems.map((item, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input type="text" value={item.description} onChange={e => updateActionItem(i, 'description', e.target.value)}
                  placeholder="Action item..."
                  className="flex-1 bg-console border border-console-border rounded px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-600" />
                <select value={item.assignee} onChange={e => updateActionItem(i, 'assignee', e.target.value)}
                  className="bg-console border border-console-border rounded px-2 py-1.5 text-sm text-slate-300">
                  <option value="">Assignee</option>
                  {attendees.filter(a => a.present).map(a => <option key={a.name} value={a.name}>{a.name}</option>)}
                </select>
                <input type="date" value={item.dueDate} onChange={e => updateActionItem(i, 'dueDate', e.target.value)}
                  className="bg-console border border-console-border rounded px-2 py-1.5 text-sm text-slate-300" />
                <button onClick={() => removeActionItem(i)} className="text-slate-600 hover:text-gauge-red mt-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addActionItem} className="text-sm text-tardis-glow hover:text-tardis-light flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add Action Item
            </button>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('attendees')} className="text-sm text-slate-500 hover:text-slate-300">Back</button>
            <button onClick={saveAgendaAndPolish} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Save & Polish with AI
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 4: POLISHING ────────────────────────────────────────── */}
      {step === 'polishing' && (
        <div className="console-card p-12 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-brass-gold mx-auto" />
          <h2 className="text-lg font-semibold text-slate-100">Claude is formatting your minutes...</h2>
          <p className="text-sm text-slate-500">
            Applying CA Corp Code Section 6215 formatting, structuring motions, and polishing language.
          </p>
        </div>
      )}

      {/* ─── STEP 5: REVIEW ───────────────────────────────────────────── */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="console-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">Review Polished Minutes</h2>
              <div className="flex gap-2">
                <button onClick={() => setEditing(!editing)}
                  className="text-sm text-slate-400 hover:text-tardis-glow flex items-center gap-1">
                  <PenLine className="w-3.5 h-3.5" />
                  {editing ? 'Preview' : 'Edit'}
                </button>
                <button onClick={() => { setStep('polishing'); setPolishing(true); fetch(`/api/board-minutes/${meetingId}/polish`, { method: 'POST' }).then(r => r.json()).then(({ polishedMinutes: t }) => { setPolishedMinutes(t); setPolishing(false); setStep('review'); }); }}
                  className="text-sm text-slate-400 hover:text-brass-gold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Re-polish
                </button>
              </div>
            </div>

            {editing ? (
              <div className="space-y-3">
                <textarea value={polishedMinutes} onChange={e => setPolishedMinutes(e.target.value)}
                  rows={25}
                  className="w-full bg-console border border-console-border rounded-lg px-4 py-3 text-sm text-slate-200 font-mono resize-y" />
                <button onClick={saveEditedMinutes} disabled={saving} className="text-sm text-tardis-glow hover:text-tardis-light flex items-center gap-1">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Edits
                </button>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none bg-console rounded-lg p-6 border border-console-border whitespace-pre-wrap text-slate-300">
                {polishedMinutes}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep('notes')} className="text-sm text-slate-500 hover:text-slate-300">Back to Notes</button>
            <button onClick={() => { saveEditedMinutes(); setStep('attest'); }} className="btn-primary flex items-center gap-2">
              Next: Sign & Attest
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 6: ATTEST ───────────────────────────────────────────── */}
      {step === 'attest' && (
        <div className="console-card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-100">Sign & Attest</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Your Role</label>
              <select value={attestedRole} onChange={e => setAttestedRole(e.target.value)}
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200">
                <option value="Secretary">Secretary</option>
                <option value="President">President</option>
                <option value="Chair">Chair</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type Your Full Name</label>
              <input type="text" value={attestedBy} onChange={e => setAttestedBy(e.target.value)}
                placeholder="Erick Tronboll"
                className="w-full bg-console border border-console-border rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600" />
            </div>
          </div>

          {/* Signature */}
          <div>
            <label className="block text-xs text-slate-500 mb-2">Scanned Signature (optional)</label>
            {signatureBlobUrl ? (
              <div className="flex items-center gap-4">
                <img src={signatureBlobUrl} alt="Signature" className="h-16 border border-console-border rounded bg-white p-1" />
                <span className="text-xs text-gauge-green">Signature on file</span>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-console-border hover:border-tardis-glow/30 cursor-pointer transition-colors">
                {uploadingSignature ? <Loader2 className="w-4 h-4 animate-spin text-brass-gold" /> : <Upload className="w-4 h-4 text-slate-500" />}
                <span className="text-sm text-slate-400">Upload scanned signature (PNG, JPEG)</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSignatureUpload(f); }} />
              </label>
            )}
          </div>

          {/* Attestation Checkbox */}
          <label className="flex items-start gap-3 p-4 rounded-lg bg-console border border-console-border cursor-pointer">
            <input type="checkbox" checked={attestationConfirmed} onChange={e => setAttestationConfirmed(e.target.checked)}
              className="mt-0.5 accent-brass-gold" />
            <span className="text-sm text-slate-300">
              I, <strong className="text-slate-100">{attestedBy || '[your name]'}</strong>, in my capacity as {attestedRole} of the Board of Directors of Steampunk Farms Rescue Barn Inc., hereby certify that these minutes accurately reflect the proceedings of the above meeting.
            </span>
          </label>

          <div className="flex justify-between pt-2">
            <button onClick={() => setStep('review')} className="text-sm text-slate-500 hover:text-slate-300">Back</button>
            <button onClick={submitAttestation} disabled={saving || !attestedBy || !attestationConfirmed}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
              Attest & Sign
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 7: GENERATE PDF ─────────────────────────────────────── */}
      {step === 'generate' && (
        <div className="console-card p-8 text-center space-y-6">
          <h2 className="text-lg font-semibold text-slate-100">Generate Official PDF</h2>

          {pdfUrl ? (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gauge-green/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-gauge-green" />
                </div>
              </div>
              <p className="text-sm text-slate-300">
                Minutes finalized and archived. The PDF is stored permanently in the governance records.
              </p>
              <div className="flex justify-center gap-3">
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2">
                  <Download className="w-4 h-4" /> Download PDF
                </a>
                <Link href="/board-minutes" className="text-sm text-slate-400 hover:text-slate-200 flex items-center gap-1 px-4 py-2">
                  Back to Minutes
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-400">
                This will generate a letterhead PDF with the polished minutes, your attestation, and signature.
                The PDF is stored permanently in Vercel Blob.
              </p>
              <button onClick={generatePdf} disabled={generatingPdf}
                className="btn-primary flex items-center gap-2 mx-auto">
                {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                {generatingPdf ? 'Generating...' : 'Generate Letterhead PDF'}
              </button>
              <button onClick={() => setStep('attest')} className="text-sm text-slate-500 hover:text-slate-300">
                Back
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

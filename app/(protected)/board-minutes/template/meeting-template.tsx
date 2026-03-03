'use client';

import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BOARD_MEMBERS = [
  { name: 'Erick Tronboll', role: 'President' },
  { name: 'Krystal Tronboll', role: 'Secretary' },
  { name: 'Fred Tronboll', role: 'Treasurer' },
  { name: 'Stazia Tronboll', role: 'Director' },
];

export default function MeetingTemplate() {
  return (
    <div>
      {/* Screen-only controls */}
      <div className="print:hidden flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/board-minutes" className="text-slate-500 hover:text-tardis-glow transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-display font-bold text-slate-100">Meeting Template</h1>
            <p className="text-sm text-slate-400">Print this and bring it to the meeting. Fields map directly to the wizard.</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-primary flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Printable template */}
      <div className="print:p-0 print:text-black print:bg-white bg-white text-black rounded-lg p-8 max-w-[8.5in] mx-auto shadow-lg print:shadow-none print:rounded-none print:max-w-none">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { background: white !important; }
            .print-line { border-bottom: 1px solid #ccc; min-height: 1.5em; }
            .print-box { border: 1px solid #ccc; min-height: 3em; }
            .print-checkbox { width: 14px; height: 14px; border: 1.5px solid #333; display: inline-block; margin-right: 4px; vertical-align: middle; }
            @page { margin: 0.6in; size: letter; }
          }
          .print-line { border-bottom: 1px solid #ccc; min-height: 1.5em; }
          .print-box { border: 1px solid #ccc; min-height: 3em; }
          .print-checkbox { width: 14px; height: 14px; border: 1.5px solid #333; display: inline-block; margin-right: 4px; vertical-align: middle; }
        ` }} />

        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
          <h1 className="text-lg font-bold tracking-wide">STEAMPUNK FARMS RESCUE BARN INC.</h1>
          <p className="text-xs text-gray-500">Board Meeting Notes — Transfer to TARDIS at /board-minutes/new</p>
        </div>

        {/* ═══ SECTION 1: Meeting Details (Wizard Step 1) ═══ */}
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            1. Meeting Details
            <span className="font-normal text-gray-400 text-xs ml-2">→ Wizard Step 1</span>
          </h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-end gap-2">
              <span className="font-medium whitespace-nowrap">Date:</span>
              <div className="print-line flex-1" />
            </div>
            <div className="flex items-end gap-2">
              <span className="font-medium whitespace-nowrap">Start Time:</span>
              <div className="print-line flex-1" />
            </div>
            <div className="flex items-end gap-2">
              <span className="font-medium whitespace-nowrap">End Time:</span>
              <div className="print-line flex-1" />
            </div>
            <div className="flex items-end gap-2">
              <span className="font-medium whitespace-nowrap">Meeting Type:</span>
              <div className="flex items-center gap-3 text-xs">
                {['Regular', 'Special', 'Annual', 'Emergency'].map(t => (
                  <label key={t} className="flex items-center gap-1">
                    <span className="print-checkbox" /> {t}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <span className="font-medium whitespace-nowrap">Location:</span>
              <div className="print-line flex-1" />
              <span className="text-xs text-gray-400 whitespace-nowrap">(default: Kitchen Table)</span>
            </div>
            <div className="col-span-2 flex items-end gap-2">
              <span className="font-medium whitespace-nowrap">Called by (if special/emergency):</span>
              <div className="print-line flex-1" />
            </div>
          </div>
        </div>

        {/* ═══ SECTION 2: Attendees (Wizard Step 2) ═══ */}
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            2. Attendees
            <span className="font-normal text-gray-400 text-xs ml-2">→ Wizard Step 2</span>
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 font-medium">Name</th>
                <th className="text-left py-1 font-medium">Role</th>
                <th className="text-center py-1 font-medium w-16">Present</th>
                <th className="text-center py-1 font-medium w-12">Late</th>
                <th className="text-center py-1 font-medium w-16">Left Early</th>
                <th className="text-left py-1 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {BOARD_MEMBERS.map(m => (
                <tr key={m.name} className="border-b border-gray-200">
                  <td className="py-1.5">{m.name}</td>
                  <td className="py-1.5 text-gray-600">{m.role}</td>
                  <td className="py-1.5 text-center"><span className="print-checkbox" /></td>
                  <td className="py-1.5 text-center"><span className="print-checkbox" /></td>
                  <td className="py-1.5 text-center"><span className="print-checkbox" /></td>
                  <td className="py-1.5"><div className="print-line" /></td>
                </tr>
              ))}
              {/* Guest rows */}
              {[1, 2].map(i => (
                <tr key={`guest-${i}`} className="border-b border-gray-200">
                  <td className="py-1.5"><div className="print-line" /></td>
                  <td className="py-1.5 text-gray-400 text-xs">Guest</td>
                  <td className="py-1.5 text-center"><span className="print-checkbox" /></td>
                  <td className="py-1.5 text-center"><span className="print-checkbox" /></td>
                  <td className="py-1.5 text-center"><span className="print-checkbox" /></td>
                  <td className="py-1.5"><div className="print-line" /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 flex items-end gap-2 text-sm">
            <span className="font-medium">Quorum?</span>
            <label className="flex items-center gap-1 text-xs"><span className="print-checkbox" /> Yes</label>
            <label className="flex items-center gap-1 text-xs"><span className="print-checkbox" /> No</label>
            <span className="text-xs text-gray-400 ml-2">(3 of 4 board members needed)</span>
          </div>
        </div>

        {/* ═══ SECTION 3: Agenda Items (Wizard Step 3) ═══ */}
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            3. Agenda Items & Motions
            <span className="font-normal text-gray-400 text-xs ml-2">→ Wizard Step 3 (top section)</span>
          </h2>

          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="mb-4 pl-2 border-l-2 border-gray-200">
              <div className="flex items-end gap-2 text-sm mb-1">
                <span className="font-bold text-gray-700">{n}.</span>
                <span className="font-medium">Topic:</span>
                <div className="print-line flex-1" />
              </div>
              <div className="text-xs text-gray-500 ml-4 mb-1">Discussion notes:</div>
              <div className="print-box ml-4 mb-2 rounded-sm p-1" style={{ minHeight: '2.5em' }} />

              <div className="ml-4 text-xs border border-dashed border-gray-300 rounded p-2">
                <div className="flex items-center gap-2 mb-1">
                  <label className="flex items-center gap-1"><span className="print-checkbox" /> <span className="font-medium">Motion?</span></label>
                  <span className="text-gray-400">If yes, fill below:</span>
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span>Motion text:</span>
                  <div className="print-line flex-1" />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div className="flex items-end gap-1">
                    <span>Moved by:</span> <div className="print-line flex-1" />
                  </div>
                  <div className="flex items-end gap-1">
                    <span>Seconded by:</span> <div className="print-line flex-1" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span>Vote:</span>
                    <span>For: ___</span>
                    <span>Against: ___</span>
                    <span>Abstain: ___</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Result:</span>
                    <label className="flex items-center gap-1"><span className="print-checkbox" /> Passed</label>
                    <label className="flex items-center gap-1"><span className="print-checkbox" /> Failed</label>
                    <label className="flex items-center gap-1"><span className="print-checkbox" /> Tabled</label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Page break for print */}
        <div className="print:break-before-page" />

        {/* ═══ SECTION 4: Raw Notes (Wizard Step 3) ═══ */}
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            4. General Discussion Notes
            <span className="font-normal text-gray-400 text-xs ml-2">→ Wizard Step 3 (raw notes textarea)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-2">
            Write freely here. Claude AI will weave these into the formal minutes alongside the agenda items above.
          </p>
          <div className="print-box rounded-sm" style={{ minHeight: '14em' }} />
        </div>

        {/* ═══ SECTION 5: Action Items (Wizard Step 3) ═══ */}
        <div className="mb-5">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-3">
            5. Action Items
            <span className="font-normal text-gray-400 text-xs ml-2">→ Wizard Step 3 (bottom section)</span>
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-1 font-medium">#</th>
                <th className="text-left py-1 font-medium">Action / Task</th>
                <th className="text-left py-1 font-medium w-28">Assigned To</th>
                <th className="text-left py-1 font-medium w-24">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <tr key={n} className="border-b border-gray-200">
                  <td className="py-2 text-gray-400">{n}.</td>
                  <td className="py-2"><div className="print-line" /></td>
                  <td className="py-2"><div className="print-line" /></td>
                  <td className="py-2"><div className="print-line" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ═══ SECTION 6: Quick Reference ═══ */}
        <div className="border-t border-gray-300 pt-3 mt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
            Quick Reference — What the AI Needs From You
          </h2>
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <p className="font-medium text-gray-700 mb-1">Minimum for compliance (CA Corp Code 6215):</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Date, time, location</li>
                <li>Who was present (quorum check)</li>
                <li>Each motion: exact text, mover, seconder, vote count, result</li>
                <li>Secretary or Chair attestation</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">Tips for better AI output:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Use animal names as-is (Piggie Smalls, Captain Oats)</li>
                <li>Note dollar amounts when discussed</li>
                <li>Jot names of who said what for key points</li>
                <li>Raw notes can be messy — Claude cleans them up</li>
                <li>More detail = better minutes (but sparse is OK too)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-300 mt-6 pt-2 border-t border-gray-200">
          Steampunk Farms Rescue Barn Inc. — Board Meeting Notes Template — Print & bring to meeting, then enter at /board-minutes/new
        </div>
      </div>
    </div>
  );
}

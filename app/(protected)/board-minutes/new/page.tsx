'use client';

import { Suspense } from 'react';
import MeetingWizard from '../meeting-wizard';

export default function NewMeetingPage() {
  return (
    <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
      <MeetingWizard />
    </Suspense>
  );
}

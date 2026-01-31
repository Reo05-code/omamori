'use client';

import { Suspense } from 'react';
import { AUTH } from '@/constants/ui-messages/auth';
import { COMMON } from '@/constants/ui-messages/common';
import AcceptInvitationForm from './AcceptInvitationForm';

export default function AcceptInvitationPage() {
  return (
    <main className="font-display bg-gradient-to-br from-warm-bg to-warm-brown-100 text-warm-brown-800 antialiased min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold text-warm-brown-800">
            {AUTH.INVITATION_ACCEPT.HEADINGS.TITLE}
          </h1>
          <p className="mt-2 text-center text-sm text-warm-brown-700">
            {AUTH.INVITATION_ACCEPT.HEADINGS.DESCRIPTION}
          </p>
        </div>

        <div className="rounded-xl bg-warm-surface/80 backdrop-blur-sm p-8 shadow-soft ring-1 ring-warm-brown-200/50">
          <Suspense fallback={<div className="text-center">{COMMON.STATUS.LOADING}</div>}>
            <AcceptInvitationForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

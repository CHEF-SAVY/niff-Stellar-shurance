'use client'

import { useState } from 'react'
import { Info, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export function VoteEducationPanel() {
  const [open, setOpen] = useState(false)

  return (
    <aside
      className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
      aria-label="How claim voting works"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between font-semibold"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="vote-edu-body"
      >
        <span className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
          How claim voting works
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
      </button>

      <div
        id="vote-edu-body"
        className={cn('mt-3 space-y-2 leading-relaxed', !open && 'hidden')}
      >
        <p>
          <strong>Who can vote?</strong> Only wallets that held an active policy
          at the time the claim was filed are eligible. Eligibility is determined
          by the on-chain voter snapshot taken when the claim was submitted — it
          cannot be changed after filing.
        </p>
        <p>
          <strong>What does Approve mean?</strong> You are indicating that, based
          on the claim details and supporting evidence provided, the claim appears
          valid under the policy terms. An approved claim becomes eligible for
          payout processing.
        </p>
        <p>
          <strong>What does Reject mean?</strong> You are indicating that the
          claim does not appear to meet the policy conditions. A rejected claim
          results in no payout and the associated policy is deactivated.
        </p>
        <p>
          <strong>How is the outcome decided?</strong> A simple majority of
          eligible voters determines the result. If more than half of eligible
          voters approve, the claim is approved. If more than half reject, it is
          rejected. If the voting window closes without a majority, the plurality
          wins; ties resolve to rejected.
        </p>
        <p>
          <strong>Voting deadline.</strong> Votes are accepted for approximately
          7 days after the claim is filed (120,960 ledgers at ~5 s per ledger).
          After the deadline, no further votes can be cast.
        </p>
        <p>
          <strong>Your vote is final.</strong> Once submitted and confirmed
          on-chain, votes cannot be changed or retracted.
        </p>
        <p>
          <strong>No governance token.</strong> Voting power comes solely from
          holding an active policy — there is no separate token to buy or stake.
        </p>
        <p className="rounded border border-blue-300 bg-blue-100 px-3 py-2 text-xs">
          This interface is informational only. It does not constitute financial,
          legal, or insurance advice. Review the full policy terms before voting.
        </p>
      </div>
    </aside>
  )
}

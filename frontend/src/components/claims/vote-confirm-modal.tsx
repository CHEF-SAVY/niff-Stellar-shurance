'use client'

import { AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { VoteOption } from '@/lib/schemas/vote'


interface VoteConfirmModalProps {
  open: boolean
  vote: VoteOption | null
  claimId: string
  submitting: boolean
  onConfirm: () => void
  onCancel: () => void
}

const COPY: Record<VoteOption, { title: string; description: string; confirmLabel: string }> = {
  Approve: {
    title: 'Confirm approval vote',
    description:
      'You are about to cast an on-chain vote to approve this claim. If a majority of eligible policyholders approve, the claimant will receive the payout. Your vote is final and cannot be changed after submission.',
    confirmLabel: 'Sign & approve',
  },
  Reject: {
    title: 'Confirm rejection vote',
    description:
      'You are about to cast an on-chain vote to reject this claim. If a majority of eligible policyholders reject, no payout will be issued and the associated policy will be deactivated. Your vote is final and cannot be changed after submission.',
    confirmLabel: 'Sign & reject',
  },
}

export function VoteConfirmModal({
  open,
  vote,
  claimId,
  submitting,
  onConfirm,
  onCancel,
}: VoteConfirmModalProps) {
  if (!vote) return null
  const copy = COPY[vote]

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent
        aria-labelledby="vote-confirm-title"
        aria-describedby="vote-confirm-desc"
      >
        <DialogHeader>
          <DialogTitle id="vote-confirm-title">{copy.title}</DialogTitle>
          <DialogDescription id="vote-confirm-desc">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Claim ID: <span className="font-mono">{claimId}</span>
          <br />
          Your wallet will be prompted to sign the transaction. Network fees
          apply.
        </div>

        {/* Wallet in-app browser notice */}
        <div
          role="note"
          className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-900"
        >
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>
            If you&apos;re using a wallet&apos;s built-in browser, extension-based signing
            may not be available. Use the wallet&apos;s native signing prompt instead.
          </span>
        </div>

        {/* Footer: stacked on mobile (full-width), row on sm+ */}
        <DialogFooter>
          <Button
            className="w-full sm:w-auto"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            aria-label="Cancel vote"
          >
            Cancel
          </Button>
          <Button
            className="w-full sm:w-auto"
            variant={vote === 'Reject' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={submitting}
            aria-label={copy.confirmLabel}
            aria-busy={submitting}
          >
            {submitting ? 'Signing…' : copy.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

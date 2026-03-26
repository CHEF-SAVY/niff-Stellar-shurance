import { ClaimVotePanel } from '@/components/claims/claim-vote-panel'

interface ClaimPageProps {
  params: Promise<{ claimId: string }>
}

/**
 * /claims/[claimId]
 *
 * Wallet address and currentLedger are passed as props here.
 * In production, replace the stubs below with your wallet context
 * (e.g. Freighter / WalletConnect) and a Horizon ledger sequence fetch.
 */
export default async function ClaimPage({ params }: ClaimPageProps) {
  const { claimId } = await params

  // TODO: replace with wallet context hook (e.g. useFreighter / useWalletConnect)
  const walletAddress: string | null = null
  // TODO: replace with real ledger sequence from Horizon /fee_stats or polling
  const currentLedger = 0

  return (
    <main
      className="mx-auto max-w-2xl px-4 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]"
      style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))', paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))' }}
    >
      <h1 className="mb-6 text-xl font-bold">
        Claim vote - <span className="font-mono text-base">{claimId}</span>
      </h1>
      <ClaimVotePanel
        claimId={claimId}
        walletAddress={walletAddress}
        currentLedger={currentLedger}
      />
    </main>
  )
}

import { ContractTable } from '@/components/docs/contract-table'
import { loadMdx } from '@/lib/load-mdx'

export const metadata = { title: 'Contract Addresses — NiffyInsur Docs' }

export default async function ContractsPage() {
  const { content } = await loadMdx('contracts')
  return (
    <>
      {content}
      <ContractTable />
    </>
  )
}

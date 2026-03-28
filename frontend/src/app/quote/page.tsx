import { Shield, Calculator } from 'lucide-react'

import { QuoteForm } from '@/components/quote/quote-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuotePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Calculator className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Get Insurance Quote</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Calculate your premium for smart contract insurance coverage on the Stellar network.
        </p>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h3 className="font-semibold mb-2">1. Provide Details</h3>
                <p className="text-gray-600">
                  Enter your contract address, coverage amount, and risk factors.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Get Quote</h3>
                <p className="text-gray-600">
                  Our algorithm calculates your premium based on risk assessment.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Purchase Policy</h3>
                <p className="text-gray-600">
                  Accept the quote and pay the premium to activate coverage.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuoteForm />
    </div>
  )
}

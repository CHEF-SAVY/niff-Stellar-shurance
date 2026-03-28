'use client'

import { Lock, Shield, Eye, Code, Zap, Users } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function Security() {
  const securityFeatures = [
    {
      icon: Lock,
      title: 'Smart Contract Audited',
      description: 'All insurance contracts undergo rigorous third-party security audits.',
      color: 'green'
    },
    {
      icon: Shield,
      title: 'Risk Pool Management',
      description: 'Capital reserves are managed through transparent on-chain protocols.',
      color: 'blue'
    },
    {
      icon: Eye,
      title: 'Full Transparency',
      description: 'Every policy, claim, and payout is publicly verifiable on Stellar.',
      color: 'purple'
    },
    {
      icon: Code,
      title: 'Open Source',
      description: 'Our protocol code is open source for community review and contribution.',
      color: 'orange'
    },
    {
      icon: Zap,
      title: 'Fast Settlements',
      description: 'Stellar\'s fast network ensures quick claim processing and payouts.',
      color: 'yellow'
    },
    {
      icon: Users,
      title: 'Community Oversight',
      description: 'DAO governance ensures protocol evolves with stakeholder input.',
      color: 'indigo'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'blue':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'purple':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      case 'orange':
        return 'bg-orange-100 text-orange-600 border-orange-200'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600 border-yellow-200'
      case 'indigo':
        return 'bg-indigo-100 text-indigo-600 border-indigo-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Security & Trust
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Built on the foundation of blockchain security and decentralized governance to ensure your assets are protected.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {securityFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-sm">
              <CardHeader>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${getColorClasses(feature.color)}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg p-8 max-w-4xl mx-auto border">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Risk Disclosure</h3>
          <div className="space-y-4 text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">No Guaranteed Payouts</h4>
                <p className="text-sm">Claims are subject to DAO governance and may not be approved. Coverage is not guaranteed.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Smart Contract Risk</h4>
                <p className="text-sm">While audited, smart contracts carry inherent risks. Only invest what you can afford to lose.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Regulatory Uncertainty</h4>
                <p className="text-sm">DeFi insurance operates in evolving regulatory landscapes. Check local compliance requirements.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold">!</span>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Market Volatility</h4>
                <p className="text-sm">Premiums and payouts are denominated in crypto assets and subject to market volatility.</p>
              </div>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              Please read our <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> before purchasing any insurance policy.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

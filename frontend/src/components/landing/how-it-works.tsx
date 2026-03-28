'use client'

import { Shield, FileText, Vote, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function HowItWorks() {
  const steps = [
    {
      icon: FileText,
      title: '1. Get a Quote',
      description: 'Submit your smart contract details and risk factors to receive a personalized premium quote.',
      color: 'blue'
    },
    {
      icon: DollarSign,
      title: '2. Purchase Policy',
      description: 'Pay the premium using XLM or Stellar assets to activate your parametric insurance coverage.',
      color: 'green'
    },
    {
      icon: AlertCircle,
      title: '3. Trigger Event',
      description: 'If a covered event occurs (e.g., smart contract failure), the policy automatically triggers.',
      color: 'orange'
    },
    {
      icon: Vote,
      title: '4. Community Validation',
      description: 'DAO members vote on the claim validity using transparent on-chain governance.',
      color: 'purple'
    },
    {
      icon: CheckCircle,
      title: '5. Payout',
      description: 'Approved claims result in automatic payout to your designated wallet address.',
      color: 'green'
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600 border-blue-200'
      case 'green':
        return 'bg-green-100 text-green-600 border-green-200'
      case 'orange':
        return 'bg-orange-100 text-orange-600 border-orange-200'
      case 'purple':
        return 'bg-purple-100 text-purple-600 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <section id="how-it-works" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How NiffyInsur Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our parametric insurance model uses smart contracts and DAO governance to provide transparent, automated coverage for DeFi risks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <Card key={index} className="relative">
              <CardHeader>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${getColorClasses(step.color)}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  {step.description}
                </CardDescription>
              </CardContent>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                  <div className="w-8 h-0.5 bg-gray-300"></div>
                  <div className="absolute right-0 top-1/2 transform translate-x-2 -translate-y-1/2 w-0 h-0 border-l-8 border-l-gray-300 border-y-4 border-y-transparent"></div>
                </div>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Parametric Coverage</h4>
                <p className="text-gray-600 text-sm">Automatic payouts based on predefined triggers, no claims adjusters needed</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Vote className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">DAO Governance</h4>
                <p className="text-gray-600 text-sm">Community-driven decision making ensures fair claim validation</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Low Premiums</h4>
                <p className="text-gray-600 text-sm">Efficient risk pooling and automation reduces costs significantly</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-900">Transparent</h4>
                <p className="text-gray-600 text-sm">All policies and claims recorded on the Stellar blockchain</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

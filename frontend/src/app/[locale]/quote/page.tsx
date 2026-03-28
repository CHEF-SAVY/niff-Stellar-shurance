import { Calculator, Shield } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { QuoteForm } from '@/components/quote/quote-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function QuotePage() {
  const t = useTranslations('policy.quote')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <Calculator className="me-2 h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        </div>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">{t('subtitle')}</p>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('howItWorks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-3">
              <div>
                <h3 className="mb-2 font-semibold">{t('step1Title')}</h3>
                <p className="text-gray-600">{t('step1Desc')}</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">{t('step2Title')}</h3>
                <p className="text-gray-600">{t('step2Desc')}</p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold">{t('step3Title')}</h3>
                <p className="text-gray-600">{t('step3Desc')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <QuoteForm />
    </div>
  )
}

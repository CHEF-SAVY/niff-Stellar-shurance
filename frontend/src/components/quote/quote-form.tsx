'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QuoteFormSchema, QuoteFormData, QuoteResponse } from '@/lib/schemas/quote'
import { QuoteAPI, QuoteError, getQuoteErrorMessage } from '@/lib/api/quote'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumericInput } from '@/components/ui/numeric-input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface QuoteFormProps {
  onQuoteReceived?: (quote: QuoteResponse) => void
}

export function QuoteForm({ onQuoteReceived }: QuoteFormProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<QuoteResponse | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid, isDirty }
  } = useForm<QuoteFormData>({
    resolver: zodResolver(QuoteFormSchema) as any,
    mode: 'onChange',
    defaultValues: {
      coverageAmount: 1000,
      duration: 30,
      riskCategory: 'MEDIUM',
      contractType: 'DEFI_PROTOCOL',
      additionalCoverage: false,
    }
  })

  const watchedValues = watch()

  // Debounced quote calculation
  const debouncedCalculation = useCallback(
    debounce(async (data: Partial<QuoteFormData>) => {
      if (!isValid || !isDirty) return
      
      try {
        setIsCalculating(true)
        const quote = await QuoteAPI.getQuote(data as QuoteFormData)
        setCurrentQuote(quote)
      } catch (error) {
        if (error instanceof QuoteError) {
          // Don't show toast for validation errors during typing
          if (error.code !== 'VALIDATION_ERROR') {
            toast({
              title: 'Calculation Error',
              description: getQuoteErrorMessage(error),
              variant: 'destructive'
            })
          }
        }
        setCurrentQuote(null)
      } finally {
        setIsCalculating(false)
      }
    }, 800),
    [isValid, isDirty, toast]
  )

  // Watch for form changes and trigger debounced calculation
  useEffect(() => {
    if (isValid && isDirty) {
      debouncedCalculation(watchedValues)
    }
  }, [watchedValues, isValid, isDirty, debouncedCalculation])

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)
      const quote = await QuoteAPI.getQuote(data)
      setCurrentQuote(quote)
      onQuoteReceived?.(quote)
      
      toast({
        title: 'Quote Generated',
        description: `Your premium is ${quote.premium} XLM for ${quote.coverageAmount} XLM coverage`,
      })
    } catch (error) {
      if (error instanceof QuoteError) {
        toast({
          title: 'Quote Error',
          description: getQuoteErrorMessage(error),
          variant: 'destructive'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  }

  const getTimeUntilExpiry = (expiresAt: string) => {
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diff <= 0) return 'Expired'
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-w-0">
      <Card>
        <CardHeader>
          <CardTitle>Get Insurance Quote</CardTitle>
          <CardDescription>
            Fill in the details below to receive a personalized insurance quote for your smart contract.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="contractAddress">Contract Address</Label>
              <Input
                id="contractAddress"
                placeholder="G..."
                {...register('contractAddress')}
                className={errors.contractAddress ? 'border-destructive' : ''}
              />
              {errors.contractAddress && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.contractAddress.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverageAmount">Coverage Amount (XLM)</Label>
                <Controller
                  name="coverageAmount"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      id="coverageAmount"
                      decimals={2}
                      prefix="XLM "
                      error={errors.coverageAmount?.message}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Controller
                  name="duration"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      id="duration"
                      decimals={0}
                      suffix=" days"
                      error={errors.duration?.message}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="riskCategory">Risk Category</Label>
                <select
                  id="riskCategory"
                  {...register('riskCategory')}
                  className={`w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.riskCategory ? 'border-destructive' : ''
                  }`}
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MEDIUM">Medium Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
                {errors.riskCategory && (
                  <p className="text-sm text-destructive">{errors.riskCategory.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contractType">Contract Type</Label>
                <select
                  id="contractType"
                  {...register('contractType')}
                  className={`w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                    errors.contractType ? 'border-destructive' : ''
                  }`}
                >
                  <option value="DEFI_PROTOCOL">DeFi Protocol</option>
                  <option value="SMART_CONTRACT">Smart Contract</option>
                  <option value="LIQUIDITY_POOL">Liquidity Pool</option>
                  <option value="BRIDGE">Bridge</option>
                </select>
                {errors.contractType && (
                  <p className="text-sm text-destructive">{errors.contractType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Describe your contract and what it does..."
                {...register('description')}
                className={`w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.description ? 'border-destructive' : ''
                }`}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="additionalCoverage"
                {...register('additionalCoverage')}
                className="rounded border-gray-300 h-5 w-5"
              />
              <Label htmlFor="additionalCoverage" className="text-sm">
                Include additional coverage options
              </Label>
            </div>

            {/* Sticky CTA on mobile */}
            <div className="sticky-action-bar bg-background/95 backdrop-blur-sm border-t pt-3 -mx-6 px-6 sm:static sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:pt-0 sm:mx-0 sm:px-0">
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quote...
                  </>
                ) : (
                  'Get Quote'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quote Preview</CardTitle>
          <CardDescription>
            Your quote will appear here as you fill out the form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isCalculating ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
              <div className="pt-4">
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ) : currentQuote ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(currentQuote.premium)} XLM
                </div>
                <p className="text-sm text-muted-foreground">Premium</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Coverage Amount</p>
                  <p className="font-semibold">{formatCurrency(currentQuote.coverageAmount)} XLM</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Risk Score</p>
                  <p className="font-semibold">{currentQuote.riskScore}/100</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-muted-foreground">
                  Expires in {getTimeUntilExpiry(currentQuote.expiresAt)}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Terms & Conditions</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {currentQuote.terms.slice(0, 3).map((term, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      {term}
                    </li>
                  ))}
                </ul>
              </div>

              <Badge variant={currentQuote.riskScore < 50 ? 'success' : currentQuote.riskScore < 75 ? 'warning' : 'destructive'}>
                {currentQuote.riskScore < 50 ? 'Low Risk' : currentQuote.riskScore < 75 ? 'Medium Risk' : 'High Risk'}
              </Badge>

              <Button className="w-full" asChild>
                <a href={`/policy?quoteId=${currentQuote.quoteId}`}>
                  Purchase Policy
                </a>
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Fill in the form to see your quote preview</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Simple debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

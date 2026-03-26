'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PolicyInitiationSchema, PolicyInitiationData, Transaction, Policy } from '@/lib/schemas/policy'
import { PolicyAPI, PolicyError, getPolicyErrorMessage, getExplorerUrl } from '@/lib/api/policy'
import { QuoteAPI } from '@/lib/api/quote'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Stepper, StepContent, type Step } from '@/components/ui/stepper'
import { useToast } from '@/components/ui/use-toast'
import { 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  Copy, 
  ExternalLink,
  Wallet,
  FileText,
  Shield,
  Check
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface PolicyInitiationProps {
  quoteId?: string
}

export function PolicyInitiation({ quoteId: propQuoteId }: PolicyInitiationProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const quoteId = propQuoteId || searchParams.get('quoteId') || ''
  
  const [currentStep, setCurrentStep] = useState(0)
  const [quote, setQuote] = useState<any>(null)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [policy, setPolicy] = useState<Policy | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<PolicyInitiationData>({
    resolver: zodResolver(PolicyInitiationSchema) as any,
    defaultValues: {
      quoteId,
      walletAddress: '',
      acceptTerms: false,
    }
  })

  const acceptTerms = watch('acceptTerms')

  const steps: Step[] = [
    {
      id: 'quote',
      title: 'Verify Quote',
      description: 'Review your insurance quote details',
      status: quote ? 'completed' : currentStep === 0 ? 'active' : 'pending'
    },
    {
      id: 'wallet',
      title: 'Connect Wallet',
      description: 'Connect your Stellar wallet',
      status: walletConnected ? 'completed' : currentStep === 1 ? 'active' : quote ? 'pending' : 'pending'
    },
    {
      id: 'transaction',
      title: 'Sign Transaction',
      description: 'Sign the policy transaction',
      status: transaction ? 'completed' : currentStep === 2 ? 'active' : walletConnected ? 'pending' : 'pending'
    },
    {
      id: 'confirmation',
      title: 'Confirmation',
      description: 'Wait for blockchain confirmation',
      status: policy ? 'completed' : currentStep === 3 ? 'active' : transaction ? 'pending' : 'pending'
    }
  ]

  useEffect(() => {
    if (quoteId) {
      loadQuote()
    }
  }, [quoteId])

  const loadQuote = async () => {
    try {
      const quoteData = await QuoteAPI.getQuoteById(quoteId)
      setQuote(quoteData)
      setCurrentStep(1)
    } catch (error) {
      if (error instanceof PolicyError) {
        toast({
          title: 'Quote Error',
          description: getPolicyErrorMessage(error),
          variant: 'destructive'
        })
      }
    }
  }

  const connectWallet = async () => {
    try {
      // Mock wallet connection - in real app, integrate with Stellar wallet
      const mockAddress = 'GABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ123456'
      setWalletAddress(mockAddress)
      setWalletConnected(true)
      setValue('walletAddress', mockAddress)
      setCurrentStep(2)
      
      toast({
        title: 'Wallet Connected',
        description: 'Your Stellar wallet has been connected successfully',
      })
    } catch (error) {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const initiatePolicy = async (data: PolicyInitiationData) => {
    try {
      setIsSubmitting(true)
      const transactionData = await PolicyAPI.initiatePolicy(data)
      setTransaction(transactionData)
      setCurrentStep(3)
      
      // Simulate wallet signing
      setTimeout(() => {
        submitTransaction(transactionData)
      }, 2000)
    } catch (error) {
      if (error instanceof PolicyError) {
        toast({
          title: 'Policy Error',
          description: getPolicyErrorMessage(error),
          variant: 'destructive'
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const submitTransaction = async (transactionData: Transaction) => {
    try {
      setIsPolling(true)
      
      // Mock signature - in real app, get from wallet
      const mockSignature = 'mock-signature'
      
      const result = await PolicyAPI.submitTransaction(transactionData.transactionXdr, mockSignature)
      
      // Poll for policy confirmation
      const confirmedPolicy = await PolicyAPI.pollPolicyStatus(result.policyId)
      setPolicy(confirmedPolicy)
      
      toast({
        title: 'Policy Created!',
        description: `Your policy ${confirmedPolicy.policyId} is now active`,
      })
    } catch (error) {
      if (error instanceof PolicyError) {
        toast({
          title: 'Transaction Error',
          description: getPolicyErrorMessage(error),
          variant: 'destructive'
        })
      }
    } finally {
      setIsPolling(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied',
      description: 'Text copied to clipboard',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepContent
            title="Verify Quote"
            description="Please review your insurance quote details"
            isActive={true}
            isCompleted={false}
          >
            {quote ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Premium</Label>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(quote.premium)} XLM
                    </div>
                  </div>
                  <div>
                    <Label>Coverage Amount</Label>
                    <div className="text-2xl font-bold">
                      {formatCurrency(quote.coverageAmount)} XLM
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {quote.terms.map((term: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button onClick={() => setCurrentStep(1)} className="w-full">
                  Continue to Wallet Connection
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Skeleton className="h-8 w-3/4 mx-auto mb-4" />
                <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
                <Skeleton className="h-4 w-2/3 mx-auto" />
              </div>
            )}
          </StepContent>
        )

      case 1:
        return (
          <StepContent
            title="Connect Wallet"
            description="Connect your Stellar wallet to proceed"
            isActive={true}
            isCompleted={false}
          >
            <div className="space-y-4">
              <div className="text-center py-8">
                <Wallet className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-6">
                  Connect your Stellar wallet to create the insurance policy
                </p>
              </div>

              <Button onClick={connectWallet} disabled={walletConnected} className="w-full">
                {walletConnected ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Wallet Connected
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </>
                )}
              </Button>

              {walletConnected && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Connected Address:</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {walletAddress}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(walletAddress)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </StepContent>
        )

      case 2:
        return (
          <StepContent
            title="Sign Transaction"
            description="Review and sign the policy transaction"
            isActive={true}
            isCompleted={false}
          >
            <div className="space-y-4">
              <form onSubmit={handleSubmit(initiatePolicy)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">Wallet Address</Label>
                  <Input
                    id="walletAddress"
                    placeholder="G..."
                    {...register('walletAddress')}
                    className={errors.walletAddress ? 'border-destructive' : ''}
                    disabled={walletConnected}
                  />
                  {errors.walletAddress && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.walletAddress.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      {...register('acceptTerms')}
                      className="rounded border-gray-300 h-5 w-5"
                    />
                    <Label htmlFor="acceptTerms" className="text-sm">
                      I accept the terms and conditions and understand the risks
                    </Label>
                  </div>
                  {errors.acceptTerms && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.acceptTerms.message}
                    </p>
                  )}
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Transaction Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Premium:</span>
                      <span className="font-semibold">{quote ? formatCurrency(quote.premium) : '0'} XLM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Fee:</span>
                      <span className="font-semibold">0.01 XLM</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Total:</span>
                      <span className="font-semibold">{quote ? formatCurrency(quote.premium + 0.01) : '0.01'} XLM</span>
                    </div>
                  </div>
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
                        Initiating Policy...
                      </>
                    ) : (
                      'Initiate Policy'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </StepContent>
        )

      case 3:
        return (
          <StepContent
            title="Confirmation"
            description="Waiting for blockchain confirmation"
            isActive={true}
            isCompleted={false}
            hasError={!policy && !isPolling}
          >
            <div className="space-y-4">
              {isPolling ? (
                <div className="text-center py-8">
                  <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Confirming transaction on blockchain...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This usually takes 5-10 seconds
                  </p>
                </div>
              ) : policy ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                    <h3 className="text-xl font-semibold text-green-600 mb-2">
                      Policy Created Successfully!
                    </h3>
                    <p className="text-muted-foreground">
                      Your insurance policy is now active
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Policy ID:</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-background px-2 py-1 rounded">
                          {policy.policyId}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(policy.policyId)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant="success">Active</Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Coverage:</span>
                      <span className="font-semibold">{formatCurrency(policy.coverageAmount)} XLM</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Expires:</span>
                      <span className="text-sm">
                        {new Date(policy.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {policy.transactionHash && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" asChild>
                        <a
                          href={getExplorerUrl(policy.transactionHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View Transaction
                        </a>
                      </Button>
                      <Button className="flex-1" asChild>
                        <a href="/dashboard">
                          View Dashboard
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive font-semibold mb-2">
                    Transaction Failed
                  </p>
                  <p className="text-muted-foreground mb-4">
                    The transaction could not be confirmed. Please try again.
                  </p>
                  <Button onClick={() => setCurrentStep(2)} variant="outline">
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </StepContent>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-blue-600 mr-2" />
          <h1 className="text-3xl font-bold text-gray-900">Create Insurance Policy</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Follow the steps below to create your parametric insurance policy.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Stepper steps={steps} currentStep={currentStep} className="mb-8" />
        
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

'use client'

import { ArrowRight, Rocket, Star } from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'
import { RampSection } from '@/components/ramp/ramp-section'

import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Rocket className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Secure Your DeFi Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the growing community of DeFi users who trust NiffyInsur for transparent, community-driven insurance coverage.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4 bg-white text-blue-600 hover:bg-gray-100" asChild>
              <Link href="/quote">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/docs">
                View Documentation
              </Link>
            </Button>
            <Suspense>
              <RampSection />
            </Suspense>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">$10M+</div>
                <div className="text-blue-100">Total Coverage</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-blue-100">Active Policies</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-blue-100">Claim Satisfaction</div>
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center space-x-2">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-1 ml-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-blue-100 ml-2">Trusted by 1000+ DeFi users</span>
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navigation, Footer } from '@/components/ui/navigation'
import { Loader2 } from 'lucide-react'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [amountCents, setAmountCents] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    fetch(`/api/campaign/session?id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.amount_cents) setAmountCents(data.amount_cents)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [sessionId])

  const amount = amountCents ? amountCents / 100 : 0

  const getImpactMessage = (dollars: number) => {
    if (dollars >= 250) return "You're supporting a basecamp for a week."
    if (dollars >= 100) return "You're covering a month of service directory hosting."
    if (dollars >= 50) return "You're connecting a program to the evidence network."
    if (dollars >= 25) return "You're powering a week of ALMA intelligence."
    return 'Every dollar keeps the infrastructure running.'
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://justicehub.org.au/back-this')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    )
  }

  return (
    <section className="section-padding bg-black text-white min-h-[70vh] flex items-center">
      <div className="container-justice max-w-2xl mx-auto text-center">
        {amountCents ? (
          <>
            <p className="hero-stat">${amount}</p>
            <h1 className="headline-truth mt-6 mb-4">Thank you.</h1>
            <p className="text-gray-400 text-lg mb-8">
              {getImpactMessage(amount)}
            </p>
          </>
        ) : (
          <>
            <h1 className="headline-truth mb-4">Thank you.</h1>
            <p className="text-gray-400 text-lg mb-8">
              Your support keeps the infrastructure running.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleCopyLink}
            className="cta-secondary"
          >
            {copied ? 'Link copied!' : 'Share this'}
          </button>
          <Link href="/" className="cta-primary">
            Back to JusticeHub
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <Suspense
        fallback={
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin" size={32} />
          </div>
        }
      >
        <ThankYouContent />
      </Suspense>
      <Footer />
    </div>
  )
}

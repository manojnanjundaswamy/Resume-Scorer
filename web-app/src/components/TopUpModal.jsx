import { useEffect, useState } from 'react'
import { paymentApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

function formatRupees(amountPaise) {
  return `Rs. ${Math.round((amountPaise ?? 0) / 100)}`
}

function sortPlans(plans) {
  return [...plans].sort((a, b) => (a.amountPaise ?? 0) - (b.amountPaise ?? 0))
}

export default function TopUpModal({ open, onClose }) {
  const { user, refreshCredits } = useAuth()
  const [plans, setPlans] = useState([])
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    paymentApi.getPlans()
      .then((data) => setPlans(sortPlans(data)))
      .catch((err) => setError(err.message))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  const handleBuyPlan = async (plan) => {
    if (!window.Razorpay) {
      setError('Razorpay checkout did not load. Check your network and refresh the page.')
      return
    }

    setLoadingPlan(plan.planId)
    setError('')
    try {
      const orderData = await paymentApi.createOrder(plan.planId)
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ResumeScore AI',
        description: `Buy ${plan.credits} credits`,
        order_id: orderData.orderId,
        handler: (response) => handlePaymentSuccess(response),
        prefill: {
          email: user?.email,
          contact: '',
        },
        theme: {
          color: '#6c63ff',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handlePaymentSuccess = async (response) => {
    try {
      const result = await paymentApi.verify(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      )

      if (result.success) {
        await refreshCredits()
        setError('')
        onClose()
      }
    } catch (err) {
      setError('Payment verification failed: ' + err.message)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm px-3 py-4 sm:px-6 sm:py-8 overflow-y-auto"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="top-up-title"
    >
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black/40 overflow-hidden">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-800 bg-slate-900/95 px-5 py-4 sm:px-6 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-400">Credits</p>
            <h2 id="top-up-title" className="mt-1 text-2xl font-bold text-white">Top Up Credits</h2>
            <p className="mt-1 text-sm text-slate-400">Choose a pack and continue securely with Razorpay.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            aria-label="Close top up modal"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const isLoading = loadingPlan === plan.planId
              return (
                <div
                  key={plan.planId}
                  className="flex min-h-[220px] flex-col rounded-2xl border border-slate-700 bg-slate-800/80 p-4 transition hover:-translate-y-0.5 hover:border-brand-500/60 hover:bg-slate-800"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                    <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">{plan.description}</p>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-white">{formatRupees(plan.amountPaise)}</span>
                      {plan.planId?.startsWith('monthly') && <span className="text-sm text-slate-400">/month</span>}
                    </div>
                    <div className="mt-3 inline-flex rounded-full bg-brand-500/15 px-3 py-1 text-sm font-semibold text-brand-200">
                      {plan.credits} credits
                    </div>
                  </div>
                  <button
                    onClick={() => handleBuyPlan(plan)}
                    disabled={Boolean(loadingPlan)}
                    className="mt-5 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-wait disabled:opacity-60"
                  >
                    {isLoading ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-800/70 p-4 text-sm text-slate-300">
            <p className="font-semibold text-white">How it works</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <p>1 credit = 1 resume analysis</p>
              <p>Secure Razorpay checkout</p>
              <p>Credits never expire</p>
              <p>Monthly plans can be cancelled anytime</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

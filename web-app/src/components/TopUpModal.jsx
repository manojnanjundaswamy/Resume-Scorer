import { useEffect, useState } from 'react'
import { paymentApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function TopUpModal({ open, onClose }) {
  const { user, refreshCredits } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      paymentApi.getPlans().then(setPlans).catch(err => setError(err.message))
    }
  }, [open])

  const handleBuyPlan = async (plan) => {
    setLoading(true)
    setError('')
    try {
      const orderData = await paymentApi.createOrder(plan.planId)

      // Open Razorpay checkout
      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ResumeScore AI',
        description: `Buy ${plan.credits} credits`,
        order_id: orderData.orderId,
        handler: (response) => handlePaymentSuccess(response, plan),
        prefill: {
          email: user?.email,
          contact: '',
        },
        theme: {
          color: '#3b82f6',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (response, plan) => {
    try {
      const result = await paymentApi.verify(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      )

      if (result.success) {
        // Refresh user credits
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-800 max-w-2xl w-full p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Top Up Credits</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.planId}
              className="bg-slate-800 rounded-xl border border-slate-700 p-4 space-y-3 hover:border-brand-500/50 transition-colors"
            >
              <h3 className="font-semibold text-white">{plan.name}</h3>
              <p className="text-slate-400 text-sm">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">₹{(plan.amountPaise / 100).toFixed(0)}</span>
                {plan.amountPaise > 1000 && <span className="text-slate-400 text-sm">/month</span>}
              </div>
              <div className="text-brand-400 font-semibold text-lg">{plan.credits} credits</div>
              <button
                onClick={() => handleBuyPlan(plan)}
                disabled={loading}
                className="w-full mt-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {loading ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg p-4 text-slate-300 text-sm space-y-2">
          <p className="font-semibold text-white">How it works:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>1 credit = 1 resume analysis</li>
            <li>Pay securely via Razorpay (cards, UPI, wallets)</li>
            <li>Credits never expire</li>
            <li>Monthly plans auto-renew (cancel anytime)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

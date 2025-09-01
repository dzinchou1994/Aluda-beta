"use client"

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuyPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guests should not see the buy page; redirect them to signin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin')
    }
  }, [status, router])

  if (status !== 'authenticated') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-4 sm:px-6 py-8">
        <div className="text-gray-600 dark:text-gray-300">იტვირთება...</div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 px-4 sm:px-6 py-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 sm:px-10 pt-8 pb-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">პაკეტები</h1>
            <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">აირჩიეთ უფასო ან პრემიუმ გეგმები. ყველა ავტორიზებულ მომხმარებელს აქვს უფასო პაკეტი; პრემიუმი გაძლევთ უფრო მაღალ ლიმიტებს და პრიორიტეტულ სერვისს.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-6 pb-8">
            {/* Free Plan */}
            <div className="order-1 lg:order-1">
              <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 sm:p-8 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">უფასო</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">ხელმისაწვდომია ყველა ავტორიზებული მომხმარებლისთვის</p>
                </div>

                <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 max-w-md mx-auto">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">დღიური ლიმიტი: 7,500 ტოკენი</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">თვიური ლიმიტი: 60,000 ტოკენი</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">ქართული ენის სრულყოფილი მხარდაჭერა</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">სწრაფი და ზუსტი პასუხები</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">ჩატის ისტორიის შენახვა</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">ბუნებრივი საუბარი ქართულად</span>
                  </li>
                </ul>

                <div className="mt-6 sm:mt-8 max-w-md mx-auto w-full">
                  <Link href="/chat" className="w-full inline-flex justify-center items-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 sm:py-3.5 px-4 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    დაიწყო უფასოდ
                  </Link>
                </div>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="order-2 lg:order-2">
              <div className="rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 sm:p-8 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white">₾1</span>
                    <span className="text-gray-600 dark:text-gray-400">/ თვე</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">გამოწერის გაუქმება ნებისმიერ დროს</p>
                </div>

                <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 max-w-md mx-auto">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">დღიური ლიმიტი: 5,000 ტოკენი</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">თვიური ლიმიტი: 60,000 ტოკენი</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">პრიორიტეტული რიგი და უფრო სწრაფი პასუხები</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">სტაბილური მუშაობა პიკის საათებშიც</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">ახალი ფუნქციების წინასწარი წვდომა</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    <span className="text-gray-800 dark:text-gray-200">ელ-ფოსტით მხარდაჭერა</span>
                  </li>
                </ul>

                <div className="mt-6 sm:mt-8 max-w-md mx-auto w-full">
                  <button
                    onClick={async () => {
                      try {
                        setError(null)
                        setLoading(true)
                        const res = await fetch('/api/payments/bog/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ amount: 100, currency: 'GEL' }),
                        })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data?.error || 'Payment create failed')
                        const url = data?.redirectUrl
                        if (!url) throw new Error('Missing redirect URL')
                        window.location.href = url
                      } catch (e: any) {
                        setError(e?.message || 'ვერ მოხერხდა გადახდის ინიციაცია')
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="w-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-3 sm:py-3.5 px-4 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-60"
                  >
                    {loading ? 'იტვირთება…' : 'გააქტიურე პრემიუმი — ₾1/თვე'}
                  </button>
                  {error && (
                    <p className="mt-2 text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



"use client"

import Link from 'next/link'
import { Check } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BuyPage() {
  const { status } = useSession()
  const router = useRouter()

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
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 sm:px-10 pt-8 pb-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">პრემიუმ გამოწერა</h1>
            <p className="mt-3 text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">მაღალი ლიმიტები, პრიორიტეტული სერვისი და პროფესიონალური გამოცდილება — იგივე სტანდარტით, რასაც ელით საუკეთესო AI სერვისებისგან.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-4 sm:px-6 pb-8">
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 sm:p-8 border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white">₾20</span>
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
                  <button className="w-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 py-3 sm:py-3.5 px-4 rounded-lg font-medium hover:opacity-90 transition">
                    გააქტიურე პრემიუმი — ₾20/თვე
                  </button>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">გადახდის სისტემა ჩაირთვება დომენის მიბმის შემდეგ</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="rounded-2xl p-6 sm:p-8 h-full flex flex-col items-center text-center lg:items-start lg:text-left">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">რატომ პრემიუმ?</h2>
                <div className="mt-3 sm:mt-4 space-y-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl">
                  <p>პრემიუმ გამოწერით იღებთ ისეთივე ხარისხს, როგორსაც ელით საუკეთესო AI სერვისებისგან — უფრო სწრაფი, საიმედო და კომფორტული გამოცდილება.</p>
                  <p>შეუერთდით şimdi და მიიღეთ მეტი შესაძლებლობა ყოველდღიურ სამუშაოებში.</p>
                </div>

                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
                  <Link href="/chat" className="inline-flex justify-center items-center px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    უკან დაბრუნება
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



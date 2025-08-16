'use client';

import Link from 'next/link';
import { MessageSquare, Brain, Zap, Shield, Users, Globe } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AludaAI
              </h1>
            </div>
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              დაწყება
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ხელოვნური ინტელექტი
            </span>
            <br />
            <span className="text-gray-700">ქართულ ენაზე</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            AludaAI არის თანამედროვე AI ჩატბოტი, რომელიც განკუთვნილია ქართველი მომხმარებლებისთვის. 
            ჩვენი ტექნოლოგია საშუალებას გაძლევთ ბუნებრივად ისაუბროთ ქართულად და მიიღოთ 
            ზუსტი და სასარგებლო პასუხები.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              დაიწყეთ საუბარი
            </Link>
            <button className="inline-flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 text-lg">
              <Zap className="w-5 h-5 mr-2" />
              ფუნქციები
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
            რატომ AludaAI?
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">ქართული ენა</h4>
              <p className="text-gray-600 leading-relaxed">
                ჩვენი AI სრულად ფლობს ქართულ ენას და შეუძლია ბუნებრივად ისაუბროს 
                ქართველ მომხმარებლებთან.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">თანამედროვე AI</h4>
              <p className="text-gray-600 leading-relaxed">
                ვიყენებთ უახლეს AI ტექნოლოგიებს, რომელიც უზრუნველყოფს ზუსტ და 
                სასარგებლო პასუხებს.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">სწრაფი პასუხი</h4>
              <p className="text-gray-600 leading-relaxed">
                მყისიერი პასუხები და უწყვეტი საუბარი, რომელიც საშუალებას გაძლევთ 
                ეფექტურად მუშაობდეთ.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">უსაფრთხოება</h4>
              <p className="text-gray-600 leading-relaxed">
                თქვენი მონაცემები დაცულია და ჩვენ ვიყენებთ უმაღლესი უსაფრთხოების 
                სტანდარტებს.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">მარტივი გამოყენება</h4>
              <p className="text-gray-600 leading-relaxed">
                ინტუიციური ინტერფეისი, რომელიც საშუალებას გაძლევთ მარტივად 
                ისაუბროთ AI-თან.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <MessageSquare className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">ჩატის ისტორია</h4>
              <p className="text-gray-600 leading-relaxed">
                ყველა თქვენი საუბარი ინახება და შეგიძლიათ მათი ნახვა ნებისმიერ დროს.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-6">
            მზად ხართ დაიწყოთ?
          </h3>
          <p className="text-xl text-gray-600 mb-10">
            შეუერთდით ათასობით ქართველ მომხმარებელს, რომლებიც უკვე იყენებენ AludaAI-ს
          </p>
          <Link 
            href="/"
            className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-2xl hover:shadow-3xl text-xl"
          >
            <MessageSquare className="w-6 h-6 mr-3" />
            დაიწყეთ უფასოდ
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">AludaAI</span>
          </div>
          <p className="text-gray-400 mb-6">
            ხელოვნური ინტელექტი ქართველი მომხმარებლებისთვის
          </p>
          <div className="text-sm text-gray-500">
            © 2025 AludaAI. ყველა უფლება დაცულია.
          </div>
        </div>
      </footer>
    </div>
  );
}

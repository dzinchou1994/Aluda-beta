'use client';

import Link from 'next/link';
import { MessageSquare, Brain, Zap, Shield, Users, Globe, Building2, Clock, BarChart3, Smartphone, Mail, Phone, Calendar, ShoppingCart, Utensils, Truck, Stethoscope, MapPin } from 'lucide-react';


export default function BusinessPage() {
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
              href="/chat"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              დაწყება
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-purple-50/50"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full text-sm font-medium mb-8 shadow-lg backdrop-blur-sm border border-white/20">
            <Building2 className="w-4 h-4 mr-2" />
            ბიზნესისთვის
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent animate-gradient">
              Aluda ბიზნესისთვის
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto mb-12 leading-relaxed">
            ინტელექტუალური ჩათ-ასისტენტი, რომელიც კომპანიებს ეხმარება მომხმარებლებთან კომუნიკაციის გაუმჯობესებაში. 
            ჩვენი სისტემა აგენერირებს სწრაფ და ზუსტ პასუხებს, ამცირებს ლოდინის დროს და გეხმარებათ შეინარჩუნოთ საუკეთესო მომსახურების ხარისხი.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl text-lg transform hover:scale-105 hover:-translate-y-1"
            >
              <MessageSquare className="w-5 h-5 mr-3 group-hover:animate-bounce" />
              დაგვიკავშირდით
            </button>
            <Link href="#features" className="group inline-flex items-center px-10 py-5 border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 text-lg transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl">
              <Zap className="w-5 h-5 mr-3 group-hover:animate-pulse" />
              ფუნქციები
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                როგორ დაგეხმარებათ Aluda?
              </span>
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          
          {/* Main Features - 3 Cards */}
          <div className="grid lg:grid-cols-3 gap-8 mb-16">
            {/* Unified Platform */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 hover:border-blue-200/60 transform hover:-translate-y-3 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-6 group-hover:text-blue-600 transition-colors">ყველა არხი ერთ ადგილას</h4>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                მიიღეთ და უპასუხეთ ყველა შეტყობინებას - Facebook, Instagram, WhatsApp, საიტის ჩათი, ელფოსტა და სატელეფონო ზარები - ერთ სივრცეში.
              </p>
            </div>

            {/* AI Automation */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 hover:border-purple-200/60 transform hover:-translate-y-3 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-6 group-hover:text-purple-600 transition-colors">მყისიერი პასუხები მომხმარებელს</h4>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                Aluda ამუშავებს შემოსულ კითხვებს და მომხმარებელს აწვდის ზუსტ ინფორმაციას მაშინვე.
              </p>
            </div>

            {/* Personalization */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-3xl p-10 shadow-xl hover:shadow-2xl transition-all duration-500 border border-white/30 hover:border-green-200/60 transform hover:-translate-y-3 hover:scale-105">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-6 group-hover:text-green-600 transition-colors">გონივრული რეკომენდაციები</h4>
              <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                სისტემა მომხმარებლის ინტერესებზე დაყრდნობით სთავაზობს შესაბამის პროდუქტსა თუ მომსახურებას.
              </p>
            </div>
          </div>

          {/* Additional Features - Icon Strip */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/40">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">24/7 მხარდაჭერა</h5>
                  <p className="text-sm text-gray-600">მუდმივი ხელმისაწვდომობა</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">ანალიტიკა</h5>
                  <p className="text-sm text-gray-600">რეალური დროის მონაცემები</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900">უსაფრთხოება</h5>
                  <p className="text-sm text-gray-600">დაცული მონაცემები</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50/50 via-white to-blue-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                პროგრამასთან ინტეგრაცია
              </span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Aluda შეიძლება დაუკავშირდეს თქვენს პროგრამებსა და მონაცემთა ბაზებს, რათა რეალურ დროში აწარმოოს ოპერაციები
            </p>
          </div>

          {/* Smart Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hotel & Tourism */}
            <div className="group">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-blue-200/30 hover:border-blue-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">სასტუმროები და ტურიზმი</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  მომხმარებელს სთავაზობს თავისუფალ ნომრებს, აფიქსირებს ჯავშანს, აწვდის ინფორმაციას ფასებზე და დამატებით სერვისებზე.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">ჯავშანი</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">ფასები</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">სერვისები</span>
                </div>
              </div>
            </div>

            {/* Online Stores */}
            <div className="group">
              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-green-200/30 hover:border-green-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">ონლაინ მაღაზიები</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  უკავშირდება სტოკის სისტემას, ამოწმებს მარაგს, მომხმარებელს სთავაზობს კონკრეტულ პროდუქტს.
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">სტოკი</span>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">შეკვეთა</span>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                  Shopify • WooCommerce • Magento
                </div>
              </div>
            </div>

            {/* Restaurants */}
            <div className="group">
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-orange-200/30 hover:border-orange-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Utensils className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">რესტორნები და კაფეები</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  იღებს დაჯავშნის მოთხოვნას, ადასტურებს თავისუფალ მაგიდებს და სთავაზობს მენიუს რეკომენდაციებს.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">დაჯავშნა</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">მენიუ</span>
                </div>
              </div>
            </div>

            {/* Service Sector */}
            <div className="group">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-purple-200/30 hover:border-purple-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">მომსახურების სფერო</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  სილამაზის სალონები, ფიტნეს ცენტრები - ამოწმებს თავისუფალ დროს კალენდარში და აფიქსირებს შეხვედრას.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">კალენდარი</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">შეხვედრა</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">სალონი</span>
                </div>
              </div>
            </div>

            {/* Logistics */}
            <div className="group">
              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-red-200/30 hover:border-red-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">კურიერული და ლოჯისტიკა</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  აწვდის ინფორმაციას გზავნილის სტატუსზე, ადგენს მიტანის დროის ინტერვალს.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">სტატუსი</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">მიტანა</span>
                </div>
              </div>
            </div>

            {/* Medical */}
            <div className="group">
              <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-teal-200/30 hover:border-teal-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Stethoscope className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-teal-600 transition-colors">სამედიცინო დაწესებულებები</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  აჯავშნებს ვიზიტს, ამოწმებს ექიმის ხელმისაწვდომობას და აძლევს პაციენტს წინასწარ ინსტრუქციებს.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">ვიზიტი</span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">ექიმი</span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">ინსტრუქცია</span>
                </div>
              </div>
            </div>

            {/* E-commerce Platforms */}
            <div className="group">
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-emerald-200/30 hover:border-emerald-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">E-commerce პლატფორმები</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  მარტივი ინტეგრაცია პოპულარულ e-commerce პლატფორმებთან. ავტომატური სტოკის მართვა და შეკვეთების დამუშავება.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Shopify</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">WooCommerce</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">Magento</span>
                </div>
              </div>
            </div>

            {/* Custom Development */}
            <div className="group">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 border border-indigo-200/30 hover:border-indigo-300/50 h-full">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">Custom Development</h4>
                <p className="text-gray-600 leading-relaxed mb-4">
                  ინტეგრაცია ნებისმიერ custom საიტთან ან აპლიკაციასთან. API-ების მეშვეობით სრული ინტეგრაცია.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">API</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Custom</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Webhook</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Contact Section */}
      <section id="contact" className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-blue-50/20 to-purple-50/20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                დაგვიკავშირდით
              </span>
            </h3>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          {/* Contact Info Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Email */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 hover:border-blue-200/60 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">ელ-ფოსტა</h4>
              <p className="text-gray-600 mb-4">ჩვენთან დაკავშირებისთვის</p>
              <a 
                href="mailto:info@aluda.app" 
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors text-lg"
              >
                info@aluda.app
              </a>
            </div>

            {/* Phone */}
            <div className="group bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/30 hover:border-green-200/60 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <Phone className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">ტელეფონი</h4>
              <p className="text-gray-600 mb-4">პირდაპირი კონტაქტისთვის</p>
              <a 
                href="tel:+995597758758" 
                className="text-green-600 hover:text-green-700 font-semibold transition-colors text-lg"
              >
                +995 597 758 758
              </a>
            </div>
          </div>
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

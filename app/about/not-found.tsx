import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">გვერდი ვერ მოიძებნა</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          სამწუხაროდ, თქვენ მიერ მოძიებული გვერდი არ არსებობს ან გადატანილია.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          დაბრუნება მთავარ გვერდზე
        </Link>
      </div>
    </div>
  );
}

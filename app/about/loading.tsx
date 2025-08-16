export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <div className="w-10 h-10 bg-white rounded-full"></div>
          </div>
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        </div>
        <p className="text-gray-600 text-lg font-medium animate-pulse">იტვირთება...</p>
        <p className="text-gray-400 text-sm mt-2">ჩვენს შესახებ გვერდი</p>
      </div>
    </div>
  );
}





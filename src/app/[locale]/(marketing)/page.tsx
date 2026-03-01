export default function MarketingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Custonic - Contract Monitoring Platform
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Monitor contracts with confidence. Track, analyze, and manage your contracts in real-time.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Sign In
            </button>
            <button className="px-6 py-3 border border-slate-300 rounded-lg hover:bg-slate-50">
              Upload Contract
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

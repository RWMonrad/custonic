export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Monitor your contracts and track performance</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-slate-600">Total Contracts</h3>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-slate-600">Active Contracts</h3>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-slate-600">Risk Alerts</h3>
            <p className="text-2xl font-bold text-slate-900">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-sm font-medium text-slate-600">Total Value</h3>
            <p className="text-2xl font-bold text-slate-900">$0</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Contracts</h2>
          <div className="text-center py-8 text-slate-500">
            No contracts yet. Upload your first contract to get started.
          </div>
        </div>
      </div>
    </div>
  )
}

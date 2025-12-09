import { useEffect, useState } from 'react'
import TransactionChart from './components/TransactionChart'
import chartData from '../chartstats.json'

function App() {
  const [data, setData] = useState<{ day: string; tx_count: number }[]>([])
  const [useRandomData, setUseRandomData] = useState(false)

  const generateRandomData = (days: number) => {
    const randomData: { day: string; tx_count: number }[] = []
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - (days - i - 1))
      const dateStr = date.toISOString().split('T')[0]
      const baseValue = Math.random() * 200
      const spike = Math.random() > 0.9 ? Math.random() * 8000 : 0
      const txCount = Math.round(baseValue + spike)
      randomData.push({
        day: dateStr,
        tx_count: txCount
      })
    }
    return randomData
  }

  useEffect(() => {
    if (useRandomData) {
      setData(generateRandomData(100))
    } else {
      setData(chartData.transaction_count)
    }
  }, [useRandomData])

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black shadow-sm border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Ascii Art Chart</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setUseRandomData(!useRandomData)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${useRandomData
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
              >
                {useRandomData ? 'Random' : 'Real'}
              </button>
              {useRandomData && (
                <button
                  onClick={() => setData(generateRandomData(100))}
                  className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
                >
                  Regenerate
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
          <div className="bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
          <div className="bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
          <div className="bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
          <div className="bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="col-span-2 lg:col-span-1 bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800">
            <TransactionChart data={data} />
          </div>

          <div className="col-span-2 lg:col-span-1 rounded-xl shadow-lg p-6 border border-zinc-800 text-zinc-100 h-full">
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
          <div className="col-span-4 lg:col-span-1 bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
          <div className="col-span-4 lg:col-span-3 bg-zinc-950 rounded-xl shadow-lg p-6 border border-zinc-800 h-48"></div>
        </div>
      </main>
    </div>
  )
}

export default App

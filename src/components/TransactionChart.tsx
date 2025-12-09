import React, { useEffect, useState } from 'react'
import asciichart from 'asciichart'

interface TransactionData {
  day: string
  tx_count: number
}

interface Props {
  data: TransactionData[]
}

function TransactionChart({ data }: Props) {
  const [chart, setChart] = useState<string>('')
  const [useLogScale, setUseLogScale] = useState(true)
  const [copied, setCopied] = useState(false)
  const [chartHeight, setChartHeight] = useState(25)
  const [fontSize, setFontSize] = useState(8)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null)
  const [resizeTrigger, setResizeTrigger] = useState(0)
  const [calculatedYAxisWidth, setCalculatedYAxisWidth] = useState(7)
  const [stats, setStats] = useState({
    min: 0,
    max: 0,
    avg: 0,
    total: 0
  })
  const preRef = React.useRef<HTMLPreElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(chart)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLPreElement>) => {
    if (!preRef.current) return

    const rect = preRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const charWidth = fontSize * 0.6
    const lines = chart.split('\n')
    let graphLine = ''

    for (const line of lines) {
      if (line.includes('┼')) {
        graphLine = line
        break
      }
    }

    if (!graphLine) return

    const yAxisPos = graphLine.indexOf('┼')
    if (yAxisPos === -1) return

    const graphStartX = (yAxisPos + 1) * charWidth + (fontSize * 1.5)
    const relativeX = x - graphStartX
    const index = Math.floor(relativeX / charWidth)

    if (index >= 0 && index < data.length) {
      setHoveredIndex(index)
    } else {
      setHoveredIndex(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
  }

  const handleClick = () => {
    if (hoveredIndex !== null) {
      if (pinnedIndex === hoveredIndex) {
        setPinnedIndex(null)
      } else {
        setPinnedIndex(hoveredIndex)
      }
    } else {
      setPinnedIndex(null)
    }
  }

  useEffect(() => {
    let resizeTimeout: number
    const handleWindowResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        setResizeTrigger(prev => prev + 1)
      }, 150)
    }

    window.addEventListener('resize', handleWindowResize)

    const initialTimeout = setTimeout(() => {
      setResizeTrigger(prev => prev + 1)
    }, 100)

    return () => {
      clearTimeout(resizeTimeout)
      clearTimeout(initialTimeout)
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  useEffect(() => {
    const containerWidth = containerRef.current?.clientWidth || 0
    const preWidth = preRef.current?.scrollWidth || 0

    if (containerWidth > 0 && data.length > 0) {
      if (preWidth > 0) {
        if (preWidth > containerWidth * 1.02) {
          const ratio = containerWidth / preWidth
          const newFontSize = Math.round(fontSize * ratio * 0.96 * 10) / 10
          if (newFontSize >= 6) {
            setFontSize(newFontSize)
          }
          return
        }

        if (preWidth < containerWidth * 0.9 && fontSize < 24) {
          const ratio = (containerWidth * 0.96) / preWidth
          const newFontSize = Math.round(Math.min(fontSize * ratio, 24) * 10) / 10
          setFontSize(newFontSize)
          return
        }
      }

      if (preWidth === 0) {
        const charWidthRatio = 0.6
        const estimatedCharsNeeded = calculatedYAxisWidth + 4 + data.length
        const estimatedFontSize = Math.round((containerWidth * 1.0) / (estimatedCharsNeeded * charWidthRatio) * 10) / 10
        const clampedFontSize = Math.max(6, Math.min(24, estimatedFontSize))

        if (Math.abs(clampedFontSize - fontSize) > 0.5) {
          setFontSize(clampedFontSize)
        }
      }
    }
  }, [resizeTrigger, data.length, calculatedYAxisWidth, chart])

  useEffect(() => {
    if (data.length === 0) return

    const values = data.map(d => d.tx_count)

    const min = Math.min(...values)
    const max = Math.max(...values)
    const total = values.reduce((sum, val) => sum + val, 0)
    const avg = Math.round(total / values.length)

    setStats({ min, max, avg, total })

    let chartValues = values
    let config: any = { height: chartHeight }

    const maxValueLength = max.toString().length
    const yAxisWidth = Math.max(7, maxValueLength + 2)

    if (calculatedYAxisWidth !== yAxisWidth) {
      setCalculatedYAxisWidth(yAxisWidth)
    }

    if (useLogScale) {
      chartValues = values.map(v => Math.log10(v + 1))
      config.min = 0
      config.format = (y: number) => {
        const realValue = Math.max(0, Math.round(Math.pow(10, y) - 1))
        return realValue.toString().padStart(yAxisWidth)
      }
    } else {
      config.format = (y: number) => {
        return Math.round(y).toString().padStart(yAxisWidth)
      }
    }

    let chartString = asciichart.plot(chartValues, config)

    const displayIndex = pinnedIndex !== null ? pinnedIndex : hoveredIndex
    const lines = chartString.split('\n')

    if (displayIndex !== null && displayIndex >= 0 && displayIndex < data.length) {
      let yAxisIndex = -1
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('┼')) {
          yAxisIndex = lines[i].indexOf('┼')
          break
        }
      }

      if (yAxisIndex !== -1) {
        const markerPosition = yAxisIndex + 1 + displayIndex

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          if (markerPosition < line.length) {
            const char = line[markerPosition]
            if (char !== ' ' && char !== '┼' && char !== '┤' && !char.match(/[0-9.]/)) {
              const lineArr = line.split('')
              lineArr[markerPosition] = '●'
              lines[i] = lineArr.join('')
              break
            }
          }
        }
      }
    }

    chartString = lines.join('\n')

    let yAxisPosition = 0
    let maxLineLength = 0

    for (const line of lines) {
      if (line.length > maxLineLength) {
        maxLineLength = line.length
      }
      if (line.includes('┼') && yAxisPosition === 0) {
        yAxisPosition = line.indexOf('┼')
      }
    }

    let tooltipLine = ''
    if (displayIndex !== null && displayIndex >= 0 && displayIndex < data.length) {
      const tooltipText = `${data[displayIndex].day} | ${data[displayIndex].tx_count.toLocaleString()} tx${pinnedIndex !== null ? ' *' : ''}`
      const graphAreaLength = maxLineLength - yAxisPosition
      const yAxisPadding = ' '.repeat(yAxisPosition)
      const innerPadding = ' '.repeat(Math.max(0, graphAreaLength - tooltipText.length))
      tooltipLine = yAxisPadding + innerPadding + tooltipText
    } else {
      tooltipLine = ' '.repeat(maxLineLength)
    }

    chartString = tooltipLine + '\n' + chartString

    setChart(chartString)
  }, [data, useLogScale, chartHeight, hoveredIndex, pinnedIndex, fontSize])

  if (data.length === 0) {
    return <div>Loading...</div>
  }

  return (
    <div className="chart-container overflow-hidden" ref={containerRef}>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setUseLogScale(!useLogScale)}
          className={`px-4 py-2 font-mono text-sm cursor-pointer text-white border-none rounded transition-colors ${useLogScale ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
        >
          {useLogScale ? 'log10' : 'linear'}
        </button>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 font-mono text-sm cursor-pointer text-white border-none rounded transition-colors ${copied ? 'bg-emerald-600' : 'bg-zinc-700 hover:bg-zinc-600'
            }`}
        >
          {copied ? '✓ copied' : 'copy'}
        </button>
      </div>

      <div className="mt-4 mb-4 flex gap-8 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-mono text-zinc-400">
            height: {chartHeight}
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={chartHeight}
            onChange={(e) => setChartHeight(Number(e.target.value))}
            className="w-[150px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-mono text-zinc-400">
            height: {fontSize}px (auto)
          </label>
          <input
            type="range"
            min="8"
            max="20"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-[150px] opacity-50"
            disabled
          />
        </div>

        <div className="text-[0.85em] text-zinc-500 font-mono">
          width: {containerRef.current?.clientWidth || 0}px
        </div>
      </div>

      <pre
        ref={preRef}
        className="cursor-crosshair w-fit inline-block"
        style={{ fontSize: `${fontSize}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {chart}
      </pre>
    </div>
  )
}

export default TransactionChart

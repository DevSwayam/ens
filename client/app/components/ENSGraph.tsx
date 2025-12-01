'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'

const Graph = dynamic(() => import('react-graph-vis'), {
  ssr: false,
  loading: () => <div className="graph-loading">Loading graph...</div>,
})

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_ETH_RPC_URL),
})

interface AvatarCache {
  [key: string]: string | null
}

const SAMPLE_PAIRS = [
  ['vitalik.eth', 'nick.eth'],
  ['vitalik.eth', 'brantly.eth'],
  ['nick.eth', 'gregskril.eth'],
  ['brantly.eth', 'rainbowwallet.eth'],
  ['vitalik.eth', 'austingriffith.eth'],
  ['nick.eth', 'matoken.eth'],
]

// White color scheme
const PRIMARY_COLOR = '#ffffff'
const primaryColorWithOpacity = (opacity: number) => `rgba(255, 255, 255, ${opacity})`

// Simple hash function for deterministic values
const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

export default function ENSGraph() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [pairInput, setPairInput] = useState('')
  const [pairs, setPairs] = useState<string[][]>(SAMPLE_PAIRS)
  const [network, setNetwork] = useState<any>(null)
  const [showControls, setShowControls] = useState(false)
  const [avatarCache, setAvatarCache] = useState<AvatarCache>({})
  const [loadingAvatars, setLoadingAvatars] = useState(false)
  const [graphKey, setGraphKey] = useState(0)

  // Fetch ENS avatar
  const fetchAvatar = useCallback(async (ensName: string): Promise<string | null> => {
    try {
      const normalizedName = normalize(ensName)
      const avatar = await client.getEnsAvatar({ name: normalizedName })
      return avatar
    } catch {
      return null
    }
  }, [])

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.min(rect.width || 800, 1200),
          height: Math.max(550, Math.min(700, window.innerHeight * 0.65)),
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Fetch avatars for all ENS names
  useEffect(() => {
    const fetchAllAvatars = async () => {
      const allNames = new Set<string>()
      pairs.forEach(([source, target]) => {
        allNames.add(source)
        allNames.add(target)
      })

      const namesToFetch = Array.from(allNames).filter(name => !(name in avatarCache))

      if (namesToFetch.length === 0) return

      setLoadingAvatars(true)

      const avatarResults = await Promise.all(
        namesToFetch.map(async (name) => {
          const avatar = await fetchAvatar(name)
          return { name, avatar }
        })
      )

      setAvatarCache(prev => {
        const newCache = { ...prev }
        avatarResults.forEach(({ name, avatar }) => {
          newCache[name] = avatar
        })
        return newCache
      })
      setLoadingAvatars(false)

      // Force graph re-render after avatars load
      setGraphKey(k => k + 1)
    }

    fetchAllAvatars()
  }, [pairs, fetchAvatar])

  // Build graph data from pairs
  const graphData = useMemo(() => {
    const nodeMap = new Map<string, any>()
    const edgeSet = new Set<string>()
    const edges: any[] = []

    // Process pairs to build nodes and edges
    pairs.forEach(([source, target]) => {
      // Add nodes
      if (!nodeMap.has(source)) {
        const nodeHash = hashString(source)
        const nodeOpacity = 0.5 + (nodeHash % 30) / 100
        const avatar = avatarCache[source]

        nodeMap.set(source, {
          id: source,
          label: source,
          title: source,
          shape: avatar ? 'circularImage' : 'dot',
          image: avatar || undefined,
          size: 28 + (nodeHash % 6),
          color: {
            background: primaryColorWithOpacity(nodeOpacity),
            border: primaryColorWithOpacity(0.8),
            highlight: {
              background: PRIMARY_COLOR,
              border: PRIMARY_COLOR,
            },
          },
        })
      }

      if (!nodeMap.has(target)) {
        const nodeHash = hashString(target)
        const nodeOpacity = 0.5 + (nodeHash % 30) / 100
        const avatar = avatarCache[target]

        nodeMap.set(target, {
          id: target,
          label: target,
          title: target,
          shape: avatar ? 'circularImage' : 'dot',
          image: avatar || undefined,
          size: 28 + (nodeHash % 6),
          color: {
            background: primaryColorWithOpacity(nodeOpacity),
            border: primaryColorWithOpacity(0.8),
            highlight: {
              background: PRIMARY_COLOR,
              border: PRIMARY_COLOR,
            },
          },
        })
      }

      // Add edge (use sorted key to prevent duplicates)
      const edgeKey = [source, target].sort().join('|')
      if (!edgeSet.has(edgeKey)) {
        edgeSet.add(edgeKey)
        const edgeHash = hashString(edgeKey)
        const edgeOpacity = 0.15 + (edgeHash % 20) / 100

        edges.push({
          from: source,
          to: target,
          color: {
            color: primaryColorWithOpacity(edgeOpacity),
            highlight: primaryColorWithOpacity(0.6),
            hover: primaryColorWithOpacity(0.5),
          },
          width: 1.2,
          smooth: {
            type: 'curvedCW',
            roundness: 0.2,
          },
        })
      }
    })

    return {
      nodes: Array.from(nodeMap.values()),
      edges,
    }
  }, [pairs, avatarCache])

  const options = useMemo(() => ({
    nodes: {
      borderWidth: 2,
      borderWidthSelected: 3,
      shadow: {
        enabled: true,
        color: 'rgba(255,255,255,0.15)',
        size: 12,
        x: 0,
        y: 0,
      },
      font: {
        size: 13,
        color: '#ffffff',
        face: 'Inter, system-ui, sans-serif',
        strokeWidth: 4,
        strokeColor: 'rgba(0,0,0,0.95)',
      },
      shapeProperties: {
        useBorderWithImage: true,
        interpolation: false,
      },
    },
    edges: {
      width: 1.2,
      arrows: {
        to: { enabled: false },
      },
      smooth: {
        type: 'curvedCW',
        roundness: 0.2,
      },
      selectionWidth: 2,
    },
    physics: {
      enabled: true,
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.25,
        springLength: 200,
        springConstant: 0.03,
        damping: 0.15,
      },
      stabilization: {
        enabled: true,
        iterations: 600,
        updateInterval: 30,
        fit: true,
      },
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      zoomView: true,
      zoomSpeed: 0.5,
      dragView: true,
      hideEdgesOnDrag: false,
      navigationButtons: false,
      keyboard: { enabled: false },
      minZoom: 0.2,
      maxZoom: 3,
    },
    layout: {
      improvedLayout: true,
      randomSeed: 42,
    },
    autoResize: false,
    height: `${dimensions.height}px`,
    width: '100%',
  }), [dimensions.height])

  const handleNodeClick = useCallback((event: { nodes: string[] }) => {
    const { nodes } = event
    if (nodes.length > 0) {
      const nodeId = nodes[0]
      const ensName = nodeId.replace('.eth', '')
      router.push(`/?ens=${ensName}`)
    }
  }, [router])

  const events = useMemo(() => ({
    click: handleNodeClick,
  }), [handleNodeClick])

  const handleAddPair = useCallback(() => {
    const parts = pairInput.split(',').map((s) => s.trim().toLowerCase())
    if (parts.length === 2 && parts[0] && parts[1]) {
      const ens1 = parts[0].endsWith('.eth') ? parts[0] : `${parts[0]}.eth`
      const ens2 = parts[1].endsWith('.eth') ? parts[1] : `${parts[1]}.eth`

      // Check if this exact pair already exists
      const pairExists = pairs.some(([a, b]) =>
        (a === ens1 && b === ens2) || (a === ens2 && b === ens1)
      )

      if (!pairExists) {
        setPairs((prev) => [...prev, [ens1, ens2]])
        setGraphKey(k => k + 1)
      }
      setPairInput('')
    }
  }, [pairInput, pairs])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddPair()
      }
    },
    [handleAddPair]
  )

  const handleRemovePair = useCallback((index: number) => {
    setPairs((prev) => prev.filter((_, i) => i !== index))
    setGraphKey(k => k + 1)
  }, [])

  const handleClearAll = useCallback(() => {
    setPairs([])
    setAvatarCache({})
    setGraphKey(k => k + 1)
  }, [])

  const handleLoadSample = useCallback(() => {
    setPairs(SAMPLE_PAIRS)
    setGraphKey(k => k + 1)
  }, [])

  // Smoother zoom animations
  const handleFitAll = useCallback(() => {
    if (network) {
      network.fit({
        animation: {
          duration: 1200,
          easingFunction: 'easeInOutCubic'
        }
      })
    }
  }, [network])

  const handleZoomIn = useCallback(() => {
    if (network) {
      const currentScale = network.getScale()
      network.moveTo({
        scale: currentScale * 1.4,
        animation: {
          duration: 800,
          easingFunction: 'easeInOutCubic'
        }
      })
    }
  }, [network])

  const handleZoomOut = useCallback(() => {
    if (network) {
      const currentScale = network.getScale()
      network.moveTo({
        scale: currentScale * 0.7,
        animation: {
          duration: 800,
          easingFunction: 'easeInOutCubic'
        }
      })
    }
  }, [network])

  return (
    <div className="ens-graph">
      {/* Graph Visualizer */}
      <div className="graph-container" ref={containerRef}>
        {graphData.nodes.length > 0 ? (
          <>
            <Graph
              key={graphKey}
              graph={graphData}
              options={options}
              events={events}
              getNetwork={(n: any) => setNetwork(n)}
              style={{
                width: '100%',
                height: '100%',
              }}
            />

            {/* Loading Indicator */}
            {loadingAvatars && (
              <div className="loading-overlay">
                <span>Loading avatars...</span>
              </div>
            )}

            {/* Graph Controls */}
            <div className="graph-controls-overlay">
              <button
                onClick={() => setShowControls(!showControls)}
                className="control-toggle"
              >
                {showControls ? '✕' : '⚙'}
              </button>

              {showControls && (
                <div className="control-panel">
                  <button onClick={handleZoomIn} className="control-btn">
                    + Zoom In
                  </button>
                  <button onClick={handleZoomOut} className="control-btn">
                    − Zoom Out
                  </button>
                  <button onClick={handleFitAll} className="control-btn">
                    ⊡ Fit All
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="graph-empty">
            <p>Add ENS pairs to visualize the network</p>
            <button onClick={handleLoadSample} className="search-button">
              Load Sample Data
            </button>
          </div>
        )}
      </div>

      <p className="graph-hint">Click on any node to view the ENS profile</p>

      {/* Controls */}
      <div className="graph-controls">
        <div className="pair-input-section">
          <div className="search-input-wrapper">
            <input
              type="text"
              value={pairInput}
              onChange={(e) => setPairInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="vitalik, swayam"
              className="search-input"
            />
          </div>
          <button onClick={handleAddPair} className="search-button">
            Add Connection
          </button>
        </div>

        <div className="graph-actions">
          <button onClick={handleLoadSample} className="action-button secondary">
            Load Sample
          </button>
          <button onClick={handleClearAll} className="action-button muted">
            Clear All
          </button>
        </div>

        {pairs.length > 0 && (
          <div className="pairs-list">
            <h4>Connections ({pairs.length})</h4>
            <div className="pairs-grid">
              {pairs.map((pair, i) => (
                <div key={`${pair[0]}-${pair[1]}-${i}`} className="pair-tag">
                  <span>
                    {pair[0].replace('.eth', '')} ↔ {pair[1].replace('.eth', '')}
                  </span>
                  <button
                    onClick={() => handleRemovePair(i)}
                    className="remove-pair"
                    aria-label="Remove pair"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.vis-network) {
          width: 100% !important;
          overflow: visible !important;
        }

        :global(.vis-network > canvas) {
          width: 100% !important;
        }

        :global(.vis-tooltip) {
          background-color: rgba(0, 0, 0, 0.9) !important;
          color: white !important;
          border-radius: 8px !important;
          padding: 8px 14px !important;
          font-size: 13px !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
        }

        .graph-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: rgba(255, 255, 255, 0.6);
        }

        .loading-overlay {
          position: absolute;
          top: 1rem;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.8);
          animation: pulse 1.5s infinite;
          z-index: 10;
        }

        .graph-controls-overlay {
          position: absolute;
          bottom: 1rem;
          right: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;
          z-index: 10;
        }

        .control-toggle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 1.25rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .control-toggle:hover {
          transform: scale(1.08);
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .control-panel {
          background: rgba(10, 10, 10, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .control-btn {
          padding: 0.6rem 1rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.25s ease;
          text-align: left;
        }

        .control-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateX(-2px);
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

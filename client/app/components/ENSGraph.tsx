'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { createPublicClient, http } from 'viem'
import { mainnet } from 'viem/chains'
import { normalize } from 'viem/ens'
import { useFriends } from '@/hooks/useFriends'

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

// Default avatar as base64 data URI
const DEFAULT_AVATAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAADy0lEQVR4AeycPY7UQBCFzZyAiLsRIBFDTsYhEOIEBByGEIlDEHGDRR04sbDa41fd9dMfUms0Y1fVq/c+nMzuPj5/+vminN+/3r8oR5ldoVbxrtWqHjw2/i3tAAAsHf+2AQAALO7A4uvzBACAxR1YfH2eAIsCsK8NALsTi74CwKLB72sDwO7Eoq8AsGjw+9oAsDux6CsALBr8vjYA7E4s+goAiwV/XPfx9t23TTnHhs++V2a32mfnWd/fNChH1aPMbrU8AdQEktcDQPIAVfkAoDqYvB4AkgeoygcA1cHk9QCQPEBVPgCoDiapP5MJAGfOLPI5ACwS9NmaAHDmzCKfA8AiQZ+tCQBnzizyOQAsEvTZmgBw5swinwNA8aB76z1+fP+4Kac3oHddmd1q23fanqdpUE7Pn951ZXar5QnQc7j4dQAoHnBvPQDoOVT8OgAUD7i3HgD0HCp+HQCKB9xbDwB6DiW9flU2AFx1quh9AFA02KtrAcBVp4reBwBFg726FgBcdarofQBQNNirawHAVaeK3gcAxYJ9dh33vw/wrODj/e07bc9z1DP7vfqzEDwBZicWbB4ABAtkthwAmO14sHkAECyQ2XIAYLbjweYBQLBAZssBgNmOD5p3ty0A3HWuSB0AFAny7hoAcNe5InUAUCTIu2sAwF3nitQBQJEg764BAHedK1IHAMmDVOU/3rx+tSlHFaB+n529XvVPya7V8gRQE0heDwDJA1TlA4DqYPJ6AEgeoCofAFQHk9cDQPIAVfkAoDroVG81FgCsnEzaBwCSBmclGwCsnEzaBwCSBmclGwCsnEzaBwCSBmclGwCsnEzaBwCSBWct9/Hn78umnPadsnI8f7c/wmzFu1arZNdqeQJY/5dK1g8AkgVmLRcArB1N1g8AkgVmLRcArB1N1g8AkgVmLRcArB0d1G9UWwAY5WySvgCQJKhRMgFglLNJ+gJAkqBGyQSAUc4m6QsASYIaJRMARjmbpC8ABA9qtDwZgC9fP2zKGb1g9P6Kd61W3U8GQBVAva8DAODrv/t0AHCPwFcAAPj67z4dANwj8BUAAL7+u08HAPcI/i9g1qcAMMvpoHMAIGgws2QBwCyng84BgKDBzJIFALOcDjoHAIIGM0sWAMxyOugcAAgWzGw5MgDef69/tmHHedn3lwE4GsL7XA4AQK68zNUCgLmluRoCQK68zNUCgLmluRoCQK68zNUCgLml9xp6VQGAl/NB5gJAkCC8ZACAl/NB5gJAkCC8ZACAl/NB5gJAkCC8ZACAl/NB5gKAcxDe4/8BAAD///YpzMYAAAAGSURBVAMAq2hb3cvhRQQAAAAASUVORK5CYII='

// Format time since (e.g., "2 days", "3 months")
const formatTimeSince = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds)
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? 's' : ''}`
    }
  }
  return 'just now'
}

export default function ENSGraph() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [pairInput, setPairInput] = useState('')
  const [network, setNetwork] = useState<any>(null)
  const [showControls, setShowControls] = useState(false)
  const [avatarCache, setAvatarCache] = useState<AvatarCache>({})
  const [loadingAvatars, setLoadingAvatars] = useState(false)
  const [graphKey, setGraphKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use the friends API hook
  const { graphData: serverGraphData, loading: apiLoading, error: apiError, isDbError, addRelationshipsBatch, addNodesBatch, deleteRelationship, refetch } = useFriends()

  // Convert server graph data to pairs format for display
  const pairs = useMemo(() => {
    if (!serverGraphData) return []
    return serverGraphData.edges.map(edge => [edge.from, edge.to])
  }, [serverGraphData])

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

  // Fetch avatars for all ENS names from server data
  useEffect(() => {
    const fetchAllAvatars = async () => {
      if (!serverGraphData) return

      const allNames = new Set<string>()
      serverGraphData.nodes.forEach(node => {
        if (node.id) allNames.add(node.id)
      })

      const namesToFetch = Array.from(allNames).filter(name => name && !(name in avatarCache))

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
  }, [serverGraphData, fetchAvatar])

  // Build graph data for vis-network from server data
  const graphData = useMemo(() => {
    if (!serverGraphData) return { nodes: [], edges: [] }

    const nodes = serverGraphData.nodes.map(node => {
      const nodeHash = hashString(node.id)
      const nodeOpacity = 0.5 + (nodeHash % 30) / 100
      const avatar = avatarCache[node.id]

      return {
        id: node.id,
        label: node.id,
        title: node.id,
        shape: 'circularImage',
        image: avatar || DEFAULT_AVATAR,
        size: 28 + (nodeHash % 6),
        color: {
          background: primaryColorWithOpacity(nodeOpacity),
          border: primaryColorWithOpacity(0.8),
          highlight: {
            background: PRIMARY_COLOR,
            border: PRIMARY_COLOR,
          },
        },
      }
    })

    const edges = serverGraphData.edges.map(edge => {
      const edgeKey = [edge.from, edge.to].sort().join('|')
      const edgeHash = hashString(edgeKey)
      const edgeOpacity = 0.15 + (edgeHash % 20) / 100
      const friendsSince = edge.created_at ? formatTimeSince(edge.created_at) : null

      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        title: friendsSince ? `Friends for ${friendsSince}` : undefined,
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
      }
    })

    return { nodes, edges }
  }, [serverGraphData, avatarCache])

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
        gravitationalConstant: -800,
        centralGravity: 0.1,
        springLength: 150,
        springConstant: 0.008,
        damping: 0.92,
        avoidOverlap: 0.3,
      },
      maxVelocity: 8,
      minVelocity: 0.1,
      timestep: 0.3,
      stabilization: {
        enabled: true,
        iterations: 1000,
        updateInterval: 20,
        fit: true,
      },
    },
    interaction: {
      hover: true,
      hoverConnectedEdges: false,
      tooltipDelay: 200,
      zoomView: true,
      zoomSpeed: 0.3,
      dragView: true,
      dragNodes: true,
      hideEdgesOnDrag: false,
      hideEdgesOnZoom: false,
      navigationButtons: false,
      keyboard: { enabled: false },
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

  // Add relationships or standalone nodes via API (single batch request)
  const handleAddPair = useCallback(async () => {
    if (isSubmitting) return

    const parts = pairInput
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0)
      .map((s) => (s.endsWith('.eth') ? s : `${s}.eth`))

    if (parts.length === 0) {
      setPairInput('')
      return
    }

    setIsSubmitting(true)

    try {
      if (parts.length === 1) {
        // Single name: add as standalone node
        await addNodesBatch(parts)
      } else {
        // Multiple names: create pairwise relationships
        const relationships: { user_id: string; friend_id: string }[] = []
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            relationships.push({ user_id: parts[i], friend_id: parts[j] })
          }
        }
        await addRelationshipsBatch(relationships)
      }
      setGraphKey(k => k + 1)
    } catch (err) {
      console.error('Failed to add:', err)
    } finally {
      setIsSubmitting(false)
      setPairInput('')
    }
  }, [pairInput, isSubmitting, addRelationshipsBatch, addNodesBatch])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleAddPair()
      }
    },
    [handleAddPair]
  )

  // Delete relationship via API
  const handleRemovePair = useCallback(async (index: number) => {
    if (!serverGraphData || isSubmitting) return

    const edge = serverGraphData.edges[index]
    if (!edge) return

    setIsSubmitting(true)

    try {
      await deleteRelationship({
        user_id: edge.from,
        friend_id: edge.to,
      })
      setGraphKey(k => k + 1)
    } catch (err) {
      console.error('Failed to delete relationship:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [serverGraphData, isSubmitting, deleteRelationship])

  // Clear all not supported in API - would need backend endpoint
  const handleClearAll = useCallback(async () => {
    if (!serverGraphData || isSubmitting) return

    setIsSubmitting(true)

    try {
      // Delete all relationships one by one
      for (const edge of serverGraphData.edges) {
        try {
          await deleteRelationship({
            user_id: edge.from,
            friend_id: edge.to,
          })
        } catch (err) {
          console.log('Error deleting:', edge)
        }
      }
      setAvatarCache({})
      setGraphKey(k => k + 1)
    } catch (err) {
      console.error('Failed to clear all:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [serverGraphData, isSubmitting, deleteRelationship])

  // Load sample data to database (single batch request)
  const handleLoadSample = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const relationships = SAMPLE_PAIRS.map(([from, to]) => ({
        user_id: from,
        friend_id: to,
      }))
      await addRelationshipsBatch(relationships)
      setGraphKey(k => k + 1)
    } catch (err) {
      console.error('Failed to load sample data:', err)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, addRelationshipsBatch])

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
      {/* API Error Display */}
      {apiError && (
        <div className={`api-error ${isDbError ? 'db-error' : ''}`}>
          {isDbError ? (
            <div className="db-error-content">
              <span>Database not set up yet.</span>
              <p>Run the migration in Supabase SQL Editor:</p>
              <code>server/supabase/migrations/001_create_friend_relationships.sql</code>
            </div>
          ) : (
            <span>Server error: {apiError}</span>
          )}
          <button onClick={refetch} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Graph Visualizer */}
      <div className="graph-container" ref={containerRef}>
        {apiLoading ? (
          <div className="graph-loading">Loading from server...</div>
        ) : graphData.nodes.length > 0 ? (
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
            {(loadingAvatars || isSubmitting) && (
              <div className="loading-overlay">
                <span>{isSubmitting ? 'Saving...' : 'Loading avatars...'}</span>
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
            <button onClick={handleLoadSample} disabled={isSubmitting} className="search-button">
              {isSubmitting ? 'Loading...' : 'Load Sample Data'}
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
              placeholder="vitalik, nick, brantly..."
              className="search-input"
              disabled={isSubmitting}
            />
          </div>
          <button onClick={handleAddPair} disabled={isSubmitting} className="search-button">
            {isSubmitting ? '...' : 'Add'}
          </button>
        </div>

        <div className="graph-actions">
          <button onClick={handleLoadSample} disabled={isSubmitting} className="action-button secondary">
            Load Sample
          </button>
          <button onClick={handleClearAll} disabled={isSubmitting} className="action-button muted">
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
                    {`${pair[0].replace('.eth', '')} ↔ ${pair[1].replace('.eth', '')}`}
                  </span>
                  <button
                    onClick={() => handleRemovePair(i)}
                    disabled={isSubmitting}
                    className="remove-pair"
                    aria-label="Remove"
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

        .api-error {
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          font-size: 0.875rem;
          color: #fca5a5;
        }

        .retry-btn {
          background: rgba(239, 68, 68, 0.3);
          border: 1px solid rgba(239, 68, 68, 0.5);
          border-radius: 6px;
          padding: 0.4rem 0.75rem;
          color: white;
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .retry-btn:hover {
          background: rgba(239, 68, 68, 0.5);
        }

        .db-error {
          background: rgba(251, 191, 36, 0.15);
          border-color: rgba(251, 191, 36, 0.5);
          color: #fcd34d;
          flex-direction: column;
          align-items: flex-start;
        }

        .db-error-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .db-error-content span {
          font-weight: 500;
        }

        .db-error-content p {
          font-size: 0.75rem;
          margin: 0;
          opacity: 0.8;
        }

        .db-error-content code {
          font-size: 0.7rem;
          background: rgba(0, 0, 0, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-family: monospace;
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

        /* Mobile responsive styles */
        @media (max-width: 640px) {
          .graph-controls-overlay {
            bottom: 0.5rem;
            right: 0.5rem;
          }

          .control-toggle {
            width: 40px;
            height: 40px;
            font-size: 1.1rem;
          }

          .control-panel {
            padding: 0.5rem;
            border-radius: 10px;
          }

          .control-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
            min-height: 36px;
          }

          .loading-overlay {
            font-size: 0.7rem;
            padding: 0.4rem 0.75rem;
          }

          .api-error {
            flex-direction: column;
            gap: 0.5rem;
            text-align: center;
          }
        }

        /* Touch device optimizations */
        @media (pointer: coarse) {
          .control-toggle {
            width: 48px;
            height: 48px;
          }

          .control-btn {
            min-height: 44px;
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}

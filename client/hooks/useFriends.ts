import { useState, useEffect, useCallback } from 'react'
import { friendsApi, GraphData, AddRelationshipInput, DeleteRelationshipInput, BatchAddResult } from '@/lib/api/friends'

// Empty graph data for fallback
const EMPTY_GRAPH: GraphData = { nodes: [], edges: [] }

export function useFriends() {
  const [graphData, setGraphData] = useState<GraphData>(EMPTY_GRAPH)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDbError, setIsDbError] = useState(false)

  // Fetch graph data
  const fetchGraph = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setIsDbError(false)
      const data = await friendsApi.getGraph()
      setGraphData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch graph'

      // Check if it's a database/table not found error
      if (errorMessage.includes('table') || errorMessage.includes('schema') || errorMessage.includes('PGRST')) {
        setIsDbError(true)
        setError('Database table not found. Please run the migration first.')
      } else {
        setError(errorMessage)
      }

      // Return empty graph on error so UI still works
      setGraphData(EMPTY_GRAPH)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load graph on mount
  useEffect(() => {
    fetchGraph()
  }, [fetchGraph])

  // Add relationship
  const addRelationship = useCallback(async (input: AddRelationshipInput) => {
    try {
      setError(null)
      await friendsApi.addRelationship(input)
      // Refresh graph after adding
      await fetchGraph()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add relationship'
      setError(errorMessage)
      throw err
    }
  }, [fetchGraph])

  // Delete relationship
  const deleteRelationship = useCallback(async (input: DeleteRelationshipInput) => {
    try {
      setError(null)
      await friendsApi.deleteRelationship(input)
      // Refresh graph after deleting
      await fetchGraph()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete relationship'
      setError(errorMessage)
      throw err
    }
  }, [fetchGraph])

  // Add multiple relationships in batch
  const addRelationshipsBatch = useCallback(async (relationships: AddRelationshipInput[]): Promise<BatchAddResult> => {
    try {
      setError(null)
      const result = await friendsApi.addRelationshipsBatch(relationships)
      // Refresh graph after adding
      await fetchGraph()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add relationships'
      setError(errorMessage)
      throw err
    }
  }, [fetchGraph])

  // Add standalone nodes (ENS names without relationships)
  const addNodesBatch = useCallback(async (ensNames: string[]): Promise<{ created: number }> => {
    try {
      setError(null)
      const result = await friendsApi.addNodesBatch(ensNames)
      // Refresh graph after adding
      await fetchGraph()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add nodes'
      setError(errorMessage)
      throw err
    }
  }, [fetchGraph])

  return {
    graphData,
    loading,
    error,
    isDbError,
    addRelationship,
    addRelationshipsBatch,
    addNodesBatch,
    deleteRelationship,
    refetch: fetchGraph,
  }
}

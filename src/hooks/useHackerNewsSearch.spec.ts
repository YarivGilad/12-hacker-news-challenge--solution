import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useHackerNewsSearch } from './useHackerNewsSearch'

// Mock fetch globally
globalThis.fetch = vi.fn()

describe('useHackerNewsSearch Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks() 
  })
  describe('1. Initial State Tests', () => {
    test('should initialize with empty data, loading false, and no error', () => {
      // Mock fetch to prevent actual API calls
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

      const { result } = renderHook(() => useHackerNewsSearch(''))

      const [searchResult] = result.current

      expect(searchResult.data).toEqual([])
      expect(searchResult.isLoading).toBe(false)
      expect(searchResult.hasError).toBe(false)
    })

    test('should not make API call on initial mount with empty search term', () => {
      // Mock fetch to track if it's called
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

      renderHook(() => useHackerNewsSearch(''))

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('2. Search Functionality Tests', () => {
    test('should make API call when search term is provided', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

      renderHook(() => useHackerNewsSearch('react'))

      // Wait for the effect to run
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    test('should construct correct API URL with search term', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

      const searchTerm = 'javascript'
      
      await act(async () => {
        renderHook(() => useHackerNewsSearch(searchTerm))
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`https://hn.algolia.com/api/v1/search?query=${searchTerm}`)
      })
    })

    test('should trigger new search when setSearchTerm is called', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue(new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }))

      let hookResult: any
      
      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('initial'))
      })

      // Wait for initial call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      // Call setSearchTerm to trigger new search
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('new-search')
      })

      // Should trigger another API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(mockFetch).toHaveBeenLastCalledWith('https://hn.algolia.com/api/v1/search?query=new-search')
      })
    })
    test('should update URL state when search term changes', async () => {
      const mockFetch = vi.mocked(fetch)
      // Create a fresh mock response for each call
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [] })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(
          ({ term }) => useHackerNewsSearch(term),
          { initialProps: { term: 'first' } }
        )
      })

      // Wait for initial call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://hn.algolia.com/api/v1/search?query=first')
      })

      // Change the search term prop
      await act(async () => {
        hookResult.rerender({ term: 'second' })
      })

      // Should make new call with updated term
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('https://hn.algolia.com/api/v1/search?query=second')
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('3. Loading State Tests', () => {
    test('should set loading to true when starting API request', async () => {
      const mockFetch = vi.mocked(fetch)
      let resolvePromise: (value: any) => void
      
      // Create a promise that we can control when it resolves
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockFetch.mockReturnValue(controlledPromise as any)

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // At this point, the API call should be in progress and loading should be true
      const [searchResult] = hookResult.result.current
      expect(searchResult.isLoading).toBe(true)

      // Now resolve the promise to complete the request
      act(() => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ hits: [] })
        })
      })

      // Wait for loading to become false after completion
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.isLoading).toBe(false)
      })
    })

    test('should set loading to false when API request completes successfully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [{ objectID: '1', title: 'Test', url: 'test.com', relevancy_score: 0.8 }] })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // After successful completion, loading should be false and data should be populated
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.hasError).toBe(false)
        expect(searchResult.data).toHaveLength(1)
      })
    })

    test('should set loading to false when API request fails', async () => {
      const mockFetch = vi.mocked(fetch)
      // Mock fetch to reject
      mockFetch.mockRejectedValue(new Error('Network error'))

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // Wait for the error to be handled
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.hasError).toBe(true)
      })
    })

    test('should reset error state when starting new search', async () => {
      const mockFetch = vi.mocked(fetch)
      
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      // Second call succeeds
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [{ objectID: '1', title: 'Test', url: 'test.com', relevancy_score: 0.8 }] })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // Wait for error state
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
      })

      // Make a new successful call
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('javascript')
      })

      // Should reset error and show success
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(false)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toHaveLength(1)
      })
    })
  }) 

  describe('4. Successful Response Tests', () => {
    test('should update data with API response hits on successful request', async () => {
      const mockHits = [
        { objectID: '1', title: 'Test Article 1', url: 'https://example1.com', relevancy_score: 0.8 },
        { objectID: '2', title: 'Test Article 2', url: 'https://example2.com', relevancy_score: 0.6 }
      ]

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.data).toEqual(mockHits)
        expect(searchResult.data).toHaveLength(2)
      })
    })

    test('should set hasError to false on successful API response', async () => {
      const mockHits = [
        { objectID: '1', title: 'Test Article', url: 'https://example.com', relevancy_score: 0.8 }
      ]

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(false)
        expect(searchResult.isLoading).toBe(false)
      })
    })

    test('should filter out items without url property', async () => {
      const mockHits = [
        { objectID: '1', title: 'With URL', url: 'https://example1.com', relevancy_score: 0.8 },
        { objectID: '2', title: 'Without URL', relevancy_score: 0.6 }, // Missing url
        { objectID: '3', title: 'With URL 2', url: 'https://example3.com', relevancy_score: 0.7 }
      ]

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        // Should filter out the item without url
        expect(searchResult.data).toHaveLength(2)
        expect(searchResult.data.every((item: any) => item.url)).toBe(true)
        expect(searchResult.data.find((item: any) => item.objectID === '2')).toBeUndefined()
      })
    })

    test('should filter out items without relevancy_score property', async () => {
      const mockHits = [
        { objectID: '1', title: 'With Score', url: 'https://example1.com', relevancy_score: 0.8 },
        { objectID: '2', title: 'Without Score', url: 'https://example2.com' }, // Missing relevancy_score
        { objectID: '3', title: 'With Score 2', url: 'https://example3.com', relevancy_score: 0.7 }
      ]

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        // Should filter out the item without relevancy_score
        expect(searchResult.data).toHaveLength(2)
        expect(searchResult.data.every((item: any) => typeof item.relevancy_score === 'number')).toBe(true)
        expect(searchResult.data.find((item: any) => item.objectID === '2')).toBeUndefined()
      })
    })

    test('should sort results by relevancy_score in descending order', async () => {
      const mockHits = [
        { objectID: '1', title: 'Low Score', url: 'https://example1.com', relevancy_score: 0.3 },
        { objectID: '2', title: 'High Score', url: 'https://example2.com', relevancy_score: 0.9 },
        { objectID: '3', title: 'Medium Score', url: 'https://example3.com', relevancy_score: 0.6 }
      ]

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        // Should be sorted by relevancy_score in descending order
        expect(searchResult.data).toHaveLength(3)
        expect(searchResult.data[0].relevancy_score).toBe(0.9) // Highest first
        expect(searchResult.data[1].relevancy_score).toBe(0.6) // Medium second
        expect(searchResult.data[2].relevancy_score).toBe(0.3) // Lowest last
        expect(searchResult.data[0].objectID).toBe('2')
        expect(searchResult.data[1].objectID).toBe('3')
        expect(searchResult.data[2].objectID).toBe('1')
      })
    })

    test('should transform API response to expected data structure', async () => {
      const mockHits = [
        { 
          objectID: '123', 
          title: 'Sample Article', 
          url: 'https://example.com',
          relevancy_score: 0.8,
          author: 'john_doe', // Extra field that should be filtered out
          points: 150, // Extra field that should be filtered out
          num_comments: 25 // Extra field that should be filtered out
        }
      ]

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.data).toHaveLength(1)
        
        const item = searchResult.data[0]
        // Should contain only the expected properties
        expect(item).toHaveProperty('objectID', '123')
        expect(item).toHaveProperty('title', 'Sample Article')
        expect(item).toHaveProperty('url', 'https://example.com')
        expect(item).toHaveProperty('relevancy_score', 0.8)
        
        // Should not contain extra properties
        expect(item).not.toHaveProperty('author')
        expect(item).not.toHaveProperty('points')
        expect(item).not.toHaveProperty('num_comments')
        
        // Verify the exact structure
        expect(Object.keys(item)).toEqual(['objectID', 'title', 'url', 'relevancy_score'])
      })
    })
  })

  describe('5. Error Handling Tests', () => {
    test('should set hasError to true when network request fails', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Network error'))

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })

    test('should set hasError to true when API returns non-ok response', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })

    test('should set hasError to true when JSON parsing fails', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON'))
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })

    test('should handle 404 error response', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })

    test('should handle timeout error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Request timeout'))

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('javascript'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })

    test('should reset error state when starting a new successful search after error', async () => {
      const mockFetch = vi.mocked(fetch)
      
      // First call fails
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      
      // Second call succeeds
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ 
            hits: [{ objectID: '1', title: 'Test', url: 'https://test.com', relevancy_score: 0.8 }] 
          })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // Wait for error state
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
      })

      // Make a new search that succeeds
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('javascript')
      })

      // Should reset error state and show success
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(false)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toHaveLength(1)
      })
    })

    test('should maintain error state when search term is empty after error', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error('Network error'))

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // Wait for error state
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
      })

      // Set search term to empty (which shouldn't trigger new search)
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('')
      })

      // Error state should persist since no new API call was made
      const [searchResult] = hookResult.result.current
      expect(searchResult.hasError).toBe(true)
      expect(searchResult.isLoading).toBe(false)
      expect(searchResult.data).toEqual([])
    })

    test('should handle malformed API response gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ /* missing hits property */ })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })
  })

  describe('6. Edge Cases and Advanced Scenarios Tests', () => {
    test('should handle empty search results gracefully', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [] })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('nonexistent'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.data).toEqual([])
        expect(searchResult.hasError).toBe(false)
        expect(searchResult.isLoading).toBe(false)
      })
    })

    test('should handle search term with special characters', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [] })
        } as any)
      )

      const specialSearchTerm = 'react+vue&angular@#$%'
      
      await act(async () => {
        renderHook(() => useHackerNewsSearch(specialSearchTerm))
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(`https://hn.algolia.com/api/v1/search?query=${specialSearchTerm}`)
      })
    })

    test('should handle rapid consecutive search term changes', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [] })
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('initial'))
      })

      // Rapidly change search terms in separate acts to avoid batching
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('first')
      })

      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('second')
      })

      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('third')
      })

      await waitFor(() => {
        // Should make calls for initial, first, second, and third
        expect(mockFetch).toHaveBeenCalledTimes(4)
        expect(mockFetch).toHaveBeenLastCalledWith('https://hn.algolia.com/api/v1/search?query=third')
      })
    })

    test('should handle undefined or null search terms', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ hits: [] })
        } as any)
      )

      // Test with undefined
      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch(undefined as any))
      })

      // Should not make API call with undefined
      expect(mockFetch).not.toHaveBeenCalled()

      // Test with null
      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch(null as any))
      })

      // Should not make API call with null
      expect(mockFetch).not.toHaveBeenCalled()

      // Test setting to undefined via setter
      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm(undefined as any)
      })

      // Should not make additional API call
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('should handle API response with missing hits property', async () => {
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(() => 
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}) // Missing hits property
        } as any)
      )

      let hookResult: any

      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.hasError).toBe(true)
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.data).toEqual([])
      })
    })
  })

  describe('7. Integration Tests', () => {
    test('should complete full search cycle from loading to data update', async () => {
      const mockHits = [
        { objectID: '1', title: 'React Tutorial', url: 'https://reactjs.org', relevancy_score: 0.9 },
        { objectID: '2', title: 'Vue Guide', url: 'https://vuejs.org', relevancy_score: 0.7 }
      ]

      const mockFetch = vi.mocked(fetch)
      let resolvePromise: (value: any) => void
      
      // Create a controlled promise to test the loading state
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockFetch.mockReturnValue(controlledPromise as any)

      let hookResult: any

      // Start the search
      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      // Initial state should show loading
      expect(hookResult.result.current[0].isLoading).toBe(true)
      expect(hookResult.result.current[0].hasError).toBe(false)
      expect(hookResult.result.current[0].data).toEqual([])

      // Resolve the API call
      act(() => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        })
      })

      // Wait for completion and verify final state
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.isLoading).toBe(false)
        expect(searchResult.hasError).toBe(false)
        expect(searchResult.data).toHaveLength(2)
        expect(searchResult.data[0].title).toBe('React Tutorial')
        expect(searchResult.data[0].relevancy_score).toBe(0.9)
      })

      // Verify API was called with correct URL
      expect(mockFetch).toHaveBeenCalledWith('https://hn.algolia.com/api/v1/search?query=react')
    })

    test('should handle multiple searches in sequence correctly', async () => {
      const mockFetch = vi.mocked(fetch)
      
      // Mock responses for different search terms
      const reactHits = [
        { objectID: '1', title: 'React Docs', url: 'https://reactjs.org', relevancy_score: 0.8 }
      ]
      const vueHits = [
        { objectID: '2', title: 'Vue Docs', url: 'https://vuejs.org', relevancy_score: 0.9 }
      ]
      const angularHits = [
        { objectID: '3', title: 'Angular Docs', url: 'https://angular.io', relevancy_score: 0.7 }
      ]

      // Set up sequential responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hits: reactHits })
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hits: vueHits })
        } as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ hits: angularHits })
        } as any)

      let hookResult: any

      // First search
      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('react'))
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.data).toHaveLength(1)
        expect(searchResult.data[0].title).toBe('React Docs')
      })

      // Second search
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('vue')
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.data).toHaveLength(1)
        expect(searchResult.data[0].title).toBe('Vue Docs')
        expect(searchResult.data[0].relevancy_score).toBe(0.9)
      })

      // Third search
      await act(async () => {
        const [, setSearchTerm] = hookResult.result.current
        setSearchTerm('angular')
      })

      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.data).toHaveLength(1)
        expect(searchResult.data[0].title).toBe('Angular Docs')
        expect(searchResult.data[0].relevancy_score).toBe(0.7)
      })

      // Verify all API calls were made
      expect(mockFetch).toHaveBeenCalledTimes(3)
      expect(mockFetch).toHaveBeenNthCalledWith(1, 'https://hn.algolia.com/api/v1/search?query=react')
      expect(mockFetch).toHaveBeenNthCalledWith(2, 'https://hn.algolia.com/api/v1/search?query=vue')
      expect(mockFetch).toHaveBeenNthCalledWith(3, 'https://hn.algolia.com/api/v1/search?query=angular')
    })

    test('should maintain correct state transitions throughout search lifecycle', async () => {
      const mockFetch = vi.mocked(fetch)
      const mockHits = [
        { objectID: '1', title: 'Test Article', url: 'https://test.com', relevancy_score: 0.8 }
      ]

      let resolvePromise: (value: any) => void
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      
      mockFetch.mockReturnValue(controlledPromise as any)

      let hookResult: any
      const stateHistory: Array<{ isLoading: boolean; hasError: boolean; dataLength: number }> = []

      // Helper to capture state
      const captureState = () => {
        const [searchResult] = hookResult.result.current
        stateHistory.push({
          isLoading: searchResult.isLoading,
          hasError: searchResult.hasError,
          dataLength: searchResult.data.length
        })
      }

      // Start search
      await act(async () => {
        hookResult = renderHook(() => useHackerNewsSearch('test'))
      })

      // Capture loading state
      captureState()

      // Resolve the promise
      act(() => {
        resolvePromise({
          ok: true,
          json: () => Promise.resolve({ hits: mockHits })
        })
      })

      // Wait for completion and capture final state
      await waitFor(() => {
        const [searchResult] = hookResult.result.current
        expect(searchResult.isLoading).toBe(false)
      })
      captureState()

      // Verify state transitions
      expect(stateHistory).toHaveLength(2)
      
      // Loading state
      expect(stateHistory[0]).toEqual({
        isLoading: true,
        hasError: false,
        dataLength: 0
      })
      
      // Success state
      expect(stateHistory[1]).toEqual({
        isLoading: false,
        hasError: false,
        dataLength: 1
      })
    })
  })
})
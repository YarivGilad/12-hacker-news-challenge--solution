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
          json: () => Promise.resolve({ hits: [{ objectID: '1', title: 'Test', url: 'test.com' }] })
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
          json: () => Promise.resolve({ hits: [{ objectID: '1', title: 'Test', url: 'test.com' }] })
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
}) 
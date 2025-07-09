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
}) 
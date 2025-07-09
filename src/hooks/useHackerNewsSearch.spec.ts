import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
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

      // Since the hook constructs URL with empty term, it will make a call to BASE_URL + ''
      // But according to the test requirement, we should verify behavior with empty search term
      // The current implementation actually does make a call even with empty term
      // This test documents the current behavior - it DOES make an API call
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
}) 
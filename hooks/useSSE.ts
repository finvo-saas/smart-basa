'use client'

import { useEffect, useRef } from 'react'
import { getApiBaseUrl } from '@/lib/api/client'
import { getAccessToken } from '@/utils/auth-tokens'

type SseHandlers = {
  onEvent?: (event: string, data: unknown) => void
  onError?: (err: Event) => void
}

/**
 * Subscribe to an SSE endpoint. Uses fetch+ReadableStream when auth is required
 * (EventSource cannot set Authorization headers).
 */
export function useSSE(
  path: string | null,
  handlers: SseHandlers,
  enabled: boolean = true,
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    if (!enabled || !path) return
    const base = getApiBaseUrl().replace(/\/$/, '')
    const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? '' : '/'}${path}`
    const controller = new AbortController()

    async function run() {
      while (!controller.signal.aborted) {
        try {
          const token = getAccessToken()
          const res = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            signal: controller.signal,
            credentials: 'include',
          })
          if (res.status === 401 || res.status === 403 || !res.body) return
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ''
          let eventName = 'message'
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const parts = buffer.split('\n')
            buffer = parts.pop() || ''
            for (const line of parts) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim()
              } else if (line.startsWith('data:')) {
                const raw = line.slice(5).trim()
                try {
                  const data = JSON.parse(raw)
                  handlersRef.current.onEvent?.(eventName, data)
                } catch {
                  // ignore
                }
                eventName = 'message'
              }
            }
          }
        } catch (err) {
          if ((err as Error).name === 'AbortError') return
          handlersRef.current.onError?.(err as Event)
        }
        await new Promise(resolve => window.setTimeout(resolve, 2000))
      }
    }

    void run()
    return () => controller.abort()
  }, [path, enabled])
}

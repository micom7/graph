import type { DeviceType, GraphPayload } from '../types/graph'

const BASE = '/api'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  // ── Graph ──────────────────────────────────────────────────────────────────
  getGraph: (): Promise<GraphPayload> =>
    fetch(`${BASE}/graph`).then(json<GraphPayload>),

  saveGraph: (payload: GraphPayload): Promise<GraphPayload> =>
    fetch(`${BASE}/graph`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(json<GraphPayload>),

  // ── Device types ───────────────────────────────────────────────────────────
  getDeviceTypes: (): Promise<DeviceType[]> =>
    fetch(`${BASE}/device-types`).then(json<DeviceType[]>),
}

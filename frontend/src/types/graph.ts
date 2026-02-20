// ── Domain types (match backend Pydantic models) ──────────────────────────────

export interface DeviceType {
  id: number
  name: string
  label: string | null
  color: string | null
  icon: string | null
}

export interface PortData {
  id: number           // negative = new (not yet in DB)
  direction: 'in' | 'out'
  name: string
  port_order: number
}

export interface DeviceData {
  id: number           // negative = new (not yet in DB)
  type_id: number | null
  type: string | null  // device_types.name, e.g. 'zasuvka'
  name: string
  description: string | null
  pos_x: number
  pos_y: number
  ports: PortData[]
}

export interface ConnectionData {
  id: number
  source_port: number
  target_port: number
}

export interface GraphPayload {
  devices: DeviceData[]
  connections: ConnectionData[]
}

// ── React Flow node data ───────────────────────────────────────────────────────

export interface DeviceNodeData extends DeviceData {
  deviceTypes: DeviceType[]
}

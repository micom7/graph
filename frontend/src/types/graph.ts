// ── Domain types ──────────────────────────────────────────────────────────────

export interface DeviceType {
  name: string    // unique technical key (used as identifier in JSON)
  label: string   // display label shown in UI
  color: string
  icon: string    // emoji
}

export interface PortData {
  direction: 'in' | 'out'
  name: string        // unique within device, used as identifier
  port_order: number
}

export interface DeviceData {
  name: string        // unique identifier (replaces numeric id)
  type: string | null // DeviceType.name
  description: string | null
  pos_x: number
  pos_y: number
  ports: PortData[]
}

export interface ConnectionData {
  source_device: string  // device name
  source_port: string    // port name
  target_device: string
  target_port: string
}

export interface GraphPayload {
  deviceTypes: DeviceType[]
  devices: DeviceData[]
  connections: ConnectionData[]
}

// ── React Flow node data ───────────────────────────────────────────────────────

export interface DeviceNodeData extends DeviceData {
  [key: string]: unknown
  deviceTypes: DeviceType[]
}

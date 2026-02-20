import { create } from 'zustand'
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Connection,
} from '@xyflow/react'
import type { DeviceNodeData, DeviceType, PortData, GraphPayload, ConnectionData } from '../types/graph'

const LS_KEY = 'graph_autosave'
let _nextTmpId = -1
const tmpId = () => _nextTmpId--

const EDGE_DEFAULTS = {
  style: { stroke: '#64b5f6', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#64b5f6' },
}

const DEVICE_TYPES: DeviceType[] = [
  { id: 1, name: 'zasuvka',     label: 'Засувка',      color: '#4A90D9', icon: 'zasuvka' },
  { id: 2, name: 'noria',       label: 'Норія',        color: '#E67E22', icon: 'noria' },
  { id: 3, name: 'transporter', label: 'Транспортер',  color: '#27AE60', icon: 'transporter' },
  { id: 4, name: 'redler',      label: 'Редлер',       color: '#8E44AD', icon: 'redler' },
  { id: 5, name: 'bunker',      label: 'Бункер',       color: '#C0392B', icon: 'bunker' },
  { id: 6, name: 'sylos',       label: 'Силос',        color: '#16A085', icon: 'sylos' },
]

// Convert GraphPayload ↔ React Flow nodes/edges ─────────────────────────────

function payloadToFlow(payload: GraphPayload) {
  const nodes: Node<DeviceNodeData>[] = payload.devices.map((d) => ({
    id: String(d.id),
    type: 'device',
    position: { x: d.pos_x, y: d.pos_y },
    data: { ...d, deviceTypes: DEVICE_TYPES },
  }))

  const edges: Edge[] = payload.connections.map((c) => {
    const srcDevice = payload.devices.find((d) =>
      d.ports.some((p) => p.id === c.source_port),
    )
    const tgtDevice = payload.devices.find((d) =>
      d.ports.some((p) => p.id === c.target_port),
    )
    return {
      id: String(c.id),
      source: String(srcDevice?.id ?? ''),
      sourceHandle: `port-${c.source_port}`,
      target: String(tgtDevice?.id ?? ''),
      targetHandle: `port-${c.target_port}`,
      ...EDGE_DEFAULTS,
    }
  })

  return { nodes, edges }
}

function flowToPayload(
  nodes: Node<DeviceNodeData>[],
  edges: Edge[],
): GraphPayload {
  const devices = nodes.map((n) => ({
    id: Number(n.id),
    type_id: n.data.type_id,
    type: n.data.type,
    name: n.data.name,
    description: n.data.description,
    pos_x: n.position.x,
    pos_y: n.position.y,
    ports: n.data.ports,
  }))

  const connections: ConnectionData[] = edges.map((e) => {
    const srcPortId = e.sourceHandle ? Number(e.sourceHandle.replace('port-', '')) : 0
    const tgtPortId = e.targetHandle ? Number(e.targetHandle.replace('port-', '')) : 0
    return {
      id: Number(e.id),
      source_port: srcPortId,
      target_port: tgtPortId,
    }
  })

  return { devices, connections }
}

// ── Store ────────────────────────────────────────────────────────────────────

interface GraphState {
  nodes: Node<DeviceNodeData>[]
  edges: Edge[]
  deviceTypes: DeviceType[]
  selectedNodeId: string | null
  status: string

  // React Flow callbacks
  onNodesChange: OnNodesChange<Node<DeviceNodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  // Actions
  saveToFile: () => void
  loadFromFile: (file: File) => void
  addDevice: (typeId: number) => void
  updateNodeData: (nodeId: string, data: Partial<DeviceNodeData>) => void
  deleteNode: (nodeId: string) => void
  addPort: (nodeId: string, direction: 'in' | 'out') => void
  updatePort: (nodeId: string, portId: number, name: string) => void
  deletePort: (nodeId: string, portId: number) => void
  selectNode: (nodeId: string | null) => void
  autoSave: () => void
  loadFromLocalStorage: () => void
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  deviceTypes: DEVICE_TYPES,
  selectedNodeId: null,
  status: '',

  // ── React Flow event handlers ──────────────────────────────────────────────

  onNodesChange: (changes) => {
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as Node<DeviceNodeData>[] }))
    get().autoSave()
  },

  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
    get().autoSave()
  },

  onConnect: (connection: Connection) => {
    if (connection.source === connection.target) return

    const { edges } = get()
    const duplicate = edges.some(
      (e) =>
        e.sourceHandle === connection.sourceHandle &&
        e.targetHandle === connection.targetHandle,
    )
    if (duplicate) return

    const newEdge: Edge = {
      id: String(tmpId()),
      source: connection.source,
      sourceHandle: connection.sourceHandle ?? null,
      target: connection.target,
      targetHandle: connection.targetHandle ?? null,
      ...EDGE_DEFAULTS,
    }
    set((s) => ({ edges: addEdge(newEdge, s.edges) }))
    get().autoSave()
  },

  // ── File operations ────────────────────────────────────────────────────────

  saveToFile: () => {
    const { nodes, edges } = get()
    const payload = flowToPayload(nodes, edges)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'graph.json'
    a.click()
    URL.revokeObjectURL(url)
    set({ status: 'Файл збережено' })
  },

  loadFromFile: (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const payload = JSON.parse(e.target?.result as string) as GraphPayload
        const { nodes, edges } = payloadToFlow(payload)
        set({ nodes, edges, status: `Завантажено: ${file.name}` })
        get().autoSave()
      } catch {
        set({ status: 'Помилка читання файлу' })
      }
    }
    reader.readAsText(file)
  },

  // ── Node / port mutations ──────────────────────────────────────────────────

  addDevice: (typeId: number) => {
    const { nodes } = get()
    const dt = DEVICE_TYPES.find((t) => t.id === typeId)
    const id = String(tmpId())
    const newNode: Node<DeviceNodeData> = {
      id,
      type: 'device',
      position: { x: 100 + nodes.length * 20, y: 100 + nodes.length * 20 },
      data: {
        id: Number(id),
        type_id: typeId,
        type: dt?.name ?? null,
        name: dt?.label ?? dt?.name ?? 'Новий пристрій',
        description: null,
        pos_x: 100,
        pos_y: 100,
        ports: [],
        deviceTypes: DEVICE_TYPES,
      },
    }
    set((s) => ({ nodes: [...s.nodes, newNode] }))
    get().autoSave()
  },

  updateNodeData: (nodeId, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n,
      ),
    }))
    get().autoSave()
  },

  deleteNode: (nodeId: string) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
    }))
    get().autoSave()
  },

  addPort: (nodeId, direction) => {
    const portId = tmpId()
    const port: PortData = {
      id: portId,
      direction,
      name: direction === 'in' ? 'Новий вхід' : 'Новий вихід',
      port_order: 0,
    }
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, ports: [...n.data.ports, port] } }
          : n,
      ),
    }))
    get().autoSave()
  },

  updatePort: (nodeId, portId, name) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ports: n.data.ports.map((p) =>
                  p.id === portId ? { ...p, name } : p,
                ),
              },
            }
          : n,
      ),
    }))
    get().autoSave()
  },

  deletePort: (nodeId, portId) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              data: {
                ...n.data,
                ports: n.data.ports.filter((p) => p.id !== portId),
              },
            }
          : n,
      ),
      edges: s.edges.filter(
        (e) =>
          e.sourceHandle !== `port-${portId}` &&
          e.targetHandle !== `port-${portId}`,
      ),
    }))
    get().autoSave()
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // ── LocalStorage ───────────────────────────────────────────────────────────

  autoSave: () => {
    const { nodes, edges } = get()
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ nodes, edges }))
    } catch {
      // ignore quota errors
    }
  },

  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        nodes: Node<DeviceNodeData>[]
        edges: Edge[]
      }
      const nodes = parsed.nodes.map((n) => ({
        ...n,
        data: { ...n.data, deviceTypes: DEVICE_TYPES },
      }))
      const edges = parsed.edges.map((e) => ({ ...e, ...EDGE_DEFAULTS }))
      set({ nodes, edges, status: 'Відновлено з локального сховища' })
    } catch {
      // ignore parse errors
    }
  },
}))

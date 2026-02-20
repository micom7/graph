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
import type { DeviceNodeData, DeviceType, PortData, InternalConnection, GraphPayload } from '../types/graph'

const LS_KEY = 'graph_v2'

const EDGE_DEFAULTS = {
  style: { stroke: '#64b5f6', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#64b5f6' },
}

// ── Edge ID helper ────────────────────────────────────────────────────────────

function makeEdgeId(src: string, srcPort: string, tgt: string, tgtPort: string) {
  return `${src}::${srcPort}-->${tgt}::${tgtPort}`
}

// ── Payload ↔ React Flow conversion ──────────────────────────────────────────

function payloadToFlow(payload: GraphPayload) {
  const nodes: Node<DeviceNodeData>[] = payload.devices.map((d) => ({
    id: d.name,
    type: 'device',
    position: { x: d.pos_x, y: d.pos_y },
    data: { ...d, id: d.id ?? null, internal_connections: d.internal_connections ?? [], deviceTypes: payload.deviceTypes },
  }))

  const edges: Edge[] = payload.connections.map((c) => ({
    id: makeEdgeId(c.source_device, c.source_port, c.target_device, c.target_port),
    source: c.source_device,
    sourceHandle: `port-${c.source_port}`,
    target: c.target_device,
    targetHandle: `port-${c.target_port}`,
    ...EDGE_DEFAULTS,
  }))

  return { nodes, edges }
}

function flowToPayload(
  nodes: Node<DeviceNodeData>[],
  edges: Edge[],
  deviceTypes: DeviceType[],
): GraphPayload {
  const devices = nodes.map((n) => ({
    name: n.id,
    id: n.data.id ?? null,
    type: n.data.type,
    description: n.data.description,
    pos_x: Math.round(n.position.x),
    pos_y: Math.round(n.position.y),
    ports: n.data.ports,
    internal_connections: n.data.internal_connections ?? [],
  }))

  const connections = edges.map((e) => ({
    source_device: e.source,
    source_port: (e.sourceHandle ?? '').replace('port-', ''),
    target_device: e.target,
    target_port: (e.targetHandle ?? '').replace('port-', ''),
  }))

  return { deviceTypes, devices, connections }
}

// ── Store interface ───────────────────────────────────────────────────────────

interface GraphState {
  nodes: Node<DeviceNodeData>[]
  edges: Edge[]
  deviceTypes: DeviceType[]
  selectedNodeId: string | null
  status: string

  onNodesChange: OnNodesChange<Node<DeviceNodeData>>
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect

  // File operations
  newProject: () => void
  saveToFile: () => void
  loadFromFile: (file: File) => void
  autoSave: () => void
  loadFromLocalStorage: () => void

  // Device type management
  addDeviceType: (type: DeviceType) => string | null   // returns error or null
  updateDeviceType: (name: string, updates: { label?: string; color?: string; icon?: string }) => void
  deleteDeviceType: (name: string) => void

  // Device management
  addDevice: (typeName: string) => void
  renameDevice: (oldName: string, newName: string) => string | null  // returns error or null
  updateNodeData: (nodeId: string, data: Partial<Omit<DeviceNodeData, 'name'>>) => void
  deleteNode: (nodeId: string) => void

  // Port management
  addPort: (nodeId: string, direction: 'in' | 'out') => void
  renamePort: (nodeId: string, oldPortName: string, newPortName: string) => string | null
  deletePort: (nodeId: string, portName: string) => void

  // Internal connections (within a single device)
  addInternalConnection: (nodeId: string, inPort: string, outPort: string) => string | null
  deleteInternalConnection: (nodeId: string, inPort: string, outPort: string) => void

  selectNode: (nodeId: string | null) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  deviceTypes: [],
  selectedNodeId: null,
  status: '',

  // ── React Flow event handlers ──────────────────────────────────────────────

  onNodesChange: (changes) => {
    // No autoSave here — fires 60x/sec during drag and blocks the main thread
    set((s) => ({ nodes: applyNodeChanges(changes, s.nodes) as Node<DeviceNodeData>[] }))
  },

  onEdgesChange: (changes) => {
    set((s) => ({ edges: applyEdgeChanges(changes, s.edges) }))
    get().autoSave()
  },

  onConnect: (connection: Connection) => {
    if (!connection.source || !connection.target) return
    if (connection.source === connection.target) return

    const { edges } = get()
    const duplicate = edges.some(
      (e) =>
        e.source === connection.source &&
        e.sourceHandle === connection.sourceHandle &&
        e.target === connection.target &&
        e.targetHandle === connection.targetHandle,
    )
    if (duplicate) return

    const srcPort = (connection.sourceHandle ?? '').replace('port-', '')
    const tgtPort = (connection.targetHandle ?? '').replace('port-', '')
    const newEdge: Edge = {
      id: makeEdgeId(connection.source, srcPort, connection.target, tgtPort),
      source: connection.source,
      sourceHandle: connection.sourceHandle ?? null,
      target: connection.target,
      targetHandle: connection.targetHandle ?? null,
      ...EDGE_DEFAULTS,
    }
    set((s) => ({ edges: addEdge(newEdge, s.edges) }))
    setTimeout(() => get().autoSave(), 0)
  },

  // ── File operations ────────────────────────────────────────────────────────

  newProject: () => {
    set({ nodes: [], edges: [], deviceTypes: [], selectedNodeId: null, status: 'Новий проект' })
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
  },

  saveToFile: () => {
    const { nodes, edges, deviceTypes } = get()
    const payload = flowToPayload(nodes, edges, deviceTypes)
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
        set({
          nodes,
          edges,
          deviceTypes: payload.deviceTypes ?? [],
          status: `Завантажено: ${file.name}`,
        })
        get().autoSave()
      } catch {
        set({ status: 'Помилка читання файлу' })
      }
    }
    reader.readAsText(file)
  },

  autoSave: () => {
    const { nodes, edges, deviceTypes } = get()
    try {
      const payload = flowToPayload(nodes, edges, deviceTypes)
      localStorage.setItem(LS_KEY, JSON.stringify(payload))
    } catch {
      // ignore quota errors
    }
  },

  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (!raw) return
      const payload = JSON.parse(raw) as GraphPayload
      const { nodes, edges } = payloadToFlow(payload)
      set({
        nodes,
        edges,
        deviceTypes: payload.deviceTypes ?? [],
        status: 'Відновлено з локального сховища',
      })
    } catch {
      // ignore parse errors
    }
  },

  // ── Device type management ─────────────────────────────────────────────────

  addDeviceType: (type: DeviceType) => {
    const { deviceTypes } = get()
    const name = type.name.trim()
    if (!name) return 'Системна назва не може бути порожньою'
    if (deviceTypes.some((t) => t.name === name)) {
      return `Категорія "${name}" вже існує`
    }
    const newType = { ...type, name }
    set((s) => {
      const newTypes = [...s.deviceTypes, newType]
      return {
        deviceTypes: newTypes,
        nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, deviceTypes: newTypes } })),
      }
    })
    get().autoSave()
    return null
  },

  updateDeviceType: (name, updates) => {
    set((s) => {
      const newTypes = s.deviceTypes.map((t) => (t.name === name ? { ...t, ...updates } : t))
      return {
        deviceTypes: newTypes,
        nodes: s.nodes.map((n) => ({ ...n, data: { ...n.data, deviceTypes: newTypes } })),
      }
    })
    get().autoSave()
  },

  deleteDeviceType: (name) => {
    set((s) => {
      const newTypes = s.deviceTypes.filter((t) => t.name !== name)
      return {
        deviceTypes: newTypes,
        nodes: s.nodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            type: n.data.type === name ? null : n.data.type,
            deviceTypes: newTypes,
          },
        })),
      }
    })
    get().autoSave()
  },

  // ── Device management ──────────────────────────────────────────────────────

  addDevice: (typeName: string) => {
    const { nodes, deviceTypes } = get()
    const dt = deviceTypes.find((t) => t.name === typeName)
    const baseName = dt?.label ?? typeName ?? 'Пристрій'

    // Generate unique device name
    let name = baseName
    let counter = 1
    while (nodes.some((n) => n.id === name)) {
      name = `${baseName} ${++counter}`
    }

    const newNode: Node<DeviceNodeData> = {
      id: name,
      type: 'device',
      position: { x: 120 + nodes.length * 30, y: 120 + nodes.length * 30 },
      data: {
        name,
        id: null,
        type: typeName,
        description: null,
        pos_x: 120,
        pos_y: 120,
        ports: [],
        internal_connections: [],
        deviceTypes,
      },
    }
    set((s) => ({ nodes: [...s.nodes, newNode] }))
    get().autoSave()
  },

  renameDevice: (oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return 'Назва не може бути порожньою'
    if (trimmed === oldName) return null

    const { nodes } = get()
    if (nodes.some((n) => n.id === trimmed)) {
      return `Пристрій з назвою "${trimmed}" вже існує`
    }

    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === oldName
          ? { ...n, id: trimmed, data: { ...n.data, name: trimmed } }
          : n,
      ),
      edges: s.edges.map((e) => {
        const src = e.source === oldName ? trimmed : e.source
        const tgt = e.target === oldName ? trimmed : e.target
        const srcPort = (e.sourceHandle ?? '').replace('port-', '')
        const tgtPort = (e.targetHandle ?? '').replace('port-', '')
        return { ...e, source: src, target: tgt, id: makeEdgeId(src, srcPort, tgt, tgtPort) }
      }),
      selectedNodeId: s.selectedNodeId === oldName ? trimmed : s.selectedNodeId,
    }))
    get().autoSave()
    return null
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

  // ── Port management ────────────────────────────────────────────────────────

  addPort: (nodeId: string, direction: 'in' | 'out') => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId) return n
        const baseName = direction === 'in' ? 'Вхід' : 'Вихід'
        let portName = baseName
        let counter = 1
        while (n.data.ports.some((p) => p.name === portName)) {
          portName = `${baseName} ${++counter}`
        }
        const port: PortData = { direction, name: portName, port_order: n.data.ports.length }
        return { ...n, data: { ...n.data, ports: [...n.data.ports, port] } }
      }),
    }))
    get().autoSave()
  },

  renamePort: (nodeId: string, oldPortName: string, newPortName: string) => {
    const trimmed = newPortName.trim()
    if (!trimmed) return 'Назва не може бути порожньою'
    if (trimmed === oldPortName) return null

    const { nodes } = get()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return null
    if (node.data.ports.some((p) => p.name === trimmed)) {
      return `Порт з назвою "${trimmed}" вже існує`
    }

    const oldHandle = `port-${oldPortName}`
    const newHandle = `port-${trimmed}`

    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id !== nodeId
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                ports: n.data.ports.map((p) =>
                  p.name === oldPortName ? { ...p, name: trimmed } : p,
                ),
                internal_connections: n.data.internal_connections.map((ic) => ({
                  in_port: ic.in_port === oldPortName ? trimmed : ic.in_port,
                  out_port: ic.out_port === oldPortName ? trimmed : ic.out_port,
                })),
              },
            },
      ),
      edges: s.edges.map((e) => {
        let updated = { ...e }
        if (e.source === nodeId && e.sourceHandle === oldHandle) {
          updated = { ...updated, sourceHandle: newHandle }
        }
        if (e.target === nodeId && e.targetHandle === oldHandle) {
          updated = { ...updated, targetHandle: newHandle }
        }
        const src = updated.source
        const tgt = updated.target
        const srcPort = (updated.sourceHandle ?? '').replace('port-', '')
        const tgtPort = (updated.targetHandle ?? '').replace('port-', '')
        return { ...updated, id: makeEdgeId(src, srcPort, tgt, tgtPort) }
      }),
    }))
    get().autoSave()
    return null
  },

  deletePort: (nodeId: string, portName: string) => {
    const handle = `port-${portName}`
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id !== nodeId
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                ports: n.data.ports.filter((p) => p.name !== portName),
                internal_connections: n.data.internal_connections.filter(
                  (ic) => ic.in_port !== portName && ic.out_port !== portName,
                ),
              },
            },
      ),
      edges: s.edges.filter(
        (e) =>
          !(e.source === nodeId && e.sourceHandle === handle) &&
          !(e.target === nodeId && e.targetHandle === handle),
      ),
    }))
    get().autoSave()
  },

  // ── Internal connections ───────────────────────────────────────────────────

  addInternalConnection: (nodeId, inPort, outPort) => {
    const node = get().nodes.find((n) => n.id === nodeId)
    if (!node) return null
    const ics = node.data.internal_connections ?? []
    if (ics.some((ic: InternalConnection) => ic.in_port === inPort && ic.out_port === outPort)) {
      return "Такий зв'язок вже існує"
    }
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id !== nodeId
          ? n
          : { ...n, data: { ...n.data, internal_connections: [...ics, { in_port: inPort, out_port: outPort }] } },
      ),
    }))
    get().autoSave()
    return null
  },

  deleteInternalConnection: (nodeId, inPort, outPort) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id !== nodeId
          ? n
          : {
              ...n,
              data: {
                ...n.data,
                internal_connections: (n.data.internal_connections ?? []).filter(
                  (ic: InternalConnection) => !(ic.in_port === inPort && ic.out_port === outPort),
                ),
              },
            },
      ),
    }))
    get().autoSave()
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
}))

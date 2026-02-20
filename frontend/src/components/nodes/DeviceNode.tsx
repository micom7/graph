import { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { DeviceNodeData } from '../../types/graph'
import { useGraphStore } from '../../store/graphStore'

// Icon map by device type name
const ICONS: Record<string, string> = {
  zasuvka: '🔀',
  noria: '⬆️',
  transporter: '➡️',
  redler: '↔️',
  bunker: '📦',
  sylos: '🏛️',
}

function DeviceNode({ id, data, selected }: NodeProps<DeviceNodeData>) {
  const selectNode = useGraphStore((s) => s.selectNode)

  const handleDoubleClick = useCallback(() => {
    selectNode(id)
  }, [id, selectNode])

  const dt = data.deviceTypes?.find((t) => t.id === data.type_id)
  const color = dt?.color ?? '#4A90D9'
  const icon = dt?.name ? (ICONS[dt.name] ?? '⚙️') : '⚙️'
  const label = dt?.label ?? dt?.name ?? 'Пристрій'

  const inPorts = data.ports.filter((p) => p.direction === 'in')
  const outPorts = data.ports.filter((p) => p.direction === 'out')

  return (
    <div
      onDoubleClick={handleDoubleClick}
      style={{
        border: `2px solid ${selected ? '#f0c' : color}`,
        borderRadius: 8,
        background: '#1a1a2e',
        color: '#eee',
        minWidth: 220,
        fontFamily: 'sans-serif',
        fontSize: 13,
        boxShadow: selected ? `0 0 0 2px ${color}55` : '0 2px 8px #0008',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: color,
          padding: '6px 10px',
          borderRadius: '6px 6px 0 0',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#fff',
        }}
      >
        <span>{icon}</span>
        <span>{label}</span>
      </div>

      {/* Device name */}
      <div
        style={{
          padding: '4px 10px 2px',
          fontWeight: 600,
          borderBottom: '1px solid #333',
          fontSize: 12,
          color: '#ccc',
        }}
      >
        {data.name}
      </div>

      {/* Ports layout */}
      <div style={{ display: 'flex', minHeight: 36 }}>
        {/* Input ports (left) */}
        <div style={{ flex: 1 }}>
          {inPorts.map((port) => (
            <div
              key={port.id}
              style={{
                position: 'relative',
                padding: '5px 10px 5px 16px',
                color: '#7ec8e3',
                fontSize: 11,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 120,
              }}
              title={port.name}
            >
              <Handle
                type="target"
                position={Position.Left}
                id={`port-${port.id}`}
                style={{
                  background: '#7ec8e3',
                  width: 10,
                  height: 10,
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              {port.name}
            </div>
          ))}
        </div>

        {/* Output ports (right) */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          {outPorts.map((port) => (
            <div
              key={port.id}
              style={{
                position: 'relative',
                padding: '5px 16px 5px 10px',
                color: '#90ee90',
                fontSize: 11,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 120,
                marginLeft: 'auto',
              }}
              title={port.name}
            >
              <Handle
                type="source"
                position={Position.Right}
                id={`port-${port.id}`}
                style={{
                  background: '#90ee90',
                  width: 10,
                  height: 10,
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              {port.name}
            </div>
          ))}
        </div>
      </div>

      {!inPorts.length && !outPorts.length && (
        <div style={{ padding: '6px 10px', color: '#666', fontSize: 11, fontStyle: 'italic' }}>
          Немає портів (подвійний клік для редагування)
        </div>
      )}
    </div>
  )
}

export default memo(DeviceNode)

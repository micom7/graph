import { useState } from 'react'
import { useGraphStore } from '../../store/graphStore'

export default function NodeEditor() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const nodes = useGraphStore((s) => s.nodes)
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  const addPort = useGraphStore((s) => s.addPort)
  const updatePort = useGraphStore((s) => s.updatePort)
  const deletePort = useGraphStore((s) => s.deletePort)
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const selectNode = useGraphStore((s) => s.selectNode)

  const [editingPortId, setEditingPortId] = useState<number | null>(null)
  const [portNameDraft, setPortNameDraft] = useState('')

  if (!selectedNodeId) return null

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const { data } = node
  const inPorts = data.ports.filter((p) => p.direction === 'in')
  const outPorts = data.ports.filter((p) => p.direction === 'out')

  const startEditPort = (portId: number, name: string) => {
    setEditingPortId(portId)
    setPortNameDraft(name)
  }

  const commitPortName = (portId: number) => {
    if (portNameDraft.trim()) {
      updatePort(selectedNodeId, portId, portNameDraft.trim())
    }
    setEditingPortId(null)
  }

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <span style={{ fontWeight: 700 }}>Редактор вузла</span>
        <button onClick={() => selectNode(null)} style={styles.closeBtn}>✕</button>
      </div>

      {/* Device name */}
      <label style={styles.label}>Назва пристрою</label>
      <input
        style={styles.input}
        value={data.name}
        onChange={(e) => updateNodeData(selectedNodeId, { name: e.target.value })}
      />

      {/* Description */}
      <label style={styles.label}>Опис</label>
      <textarea
        style={{ ...styles.input, resize: 'vertical', minHeight: 48 }}
        value={data.description ?? ''}
        onChange={(e) => updateNodeData(selectedNodeId, { description: e.target.value || null })}
      />

      {/* Ports section */}
      <div style={styles.portsTitle}>Порти</div>

      {/* Input ports */}
      <div style={styles.portGroupLabel}>Входи (input)</div>
      {inPorts.map((p) => (
        <div key={p.id} style={styles.portRow}>
          {editingPortId === p.id ? (
            <input
              autoFocus
              style={{ ...styles.input, flex: 1, margin: 0 }}
              value={portNameDraft}
              onChange={(e) => setPortNameDraft(e.target.value)}
              onBlur={() => commitPortName(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPortName(p.id)
                if (e.key === 'Escape') setEditingPortId(null)
              }}
            />
          ) : (
            <span
              style={styles.portName}
              onDoubleClick={() => startEditPort(p.id, p.name)}
              title="Подвійний клік для перейменування"
            >
              {p.name}
            </span>
          )}
          <button
            style={styles.iconBtn}
            onClick={() => startEditPort(p.id, p.name)}
            title="Перейменувати"
          >
            ✏️
          </button>
          <button
            style={{ ...styles.iconBtn, color: '#f66' }}
            onClick={() => deletePort(selectedNodeId, p.id)}
            title="Видалити порт"
          >
            🗑
          </button>
        </div>
      ))}
      <button style={styles.addPortBtn} onClick={() => addPort(selectedNodeId, 'in')}>
        + Додати вхід
      </button>

      {/* Output ports */}
      <div style={{ ...styles.portGroupLabel, color: '#90ee90', marginTop: 8 }}>Виходи (output)</div>
      {outPorts.map((p) => (
        <div key={p.id} style={styles.portRow}>
          {editingPortId === p.id ? (
            <input
              autoFocus
              style={{ ...styles.input, flex: 1, margin: 0 }}
              value={portNameDraft}
              onChange={(e) => setPortNameDraft(e.target.value)}
              onBlur={() => commitPortName(p.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitPortName(p.id)
                if (e.key === 'Escape') setEditingPortId(null)
              }}
            />
          ) : (
            <span
              style={{ ...styles.portName, color: '#90ee90' }}
              onDoubleClick={() => startEditPort(p.id, p.name)}
              title="Подвійний клік для перейменування"
            >
              {p.name}
            </span>
          )}
          <button
            style={styles.iconBtn}
            onClick={() => startEditPort(p.id, p.name)}
            title="Перейменувати"
          >
            ✏️
          </button>
          <button
            style={{ ...styles.iconBtn, color: '#f66' }}
            onClick={() => deletePort(selectedNodeId, p.id)}
            title="Видалити порт"
          >
            🗑
          </button>
        </div>
      ))}
      <button style={{ ...styles.addPortBtn, color: '#90ee90', borderColor: '#90ee90' }} onClick={() => addPort(selectedNodeId, 'out')}>
        + Додати вихід
      </button>

      {/* Delete node */}
      <button
        style={{ ...styles.addPortBtn, color: '#f66', borderColor: '#f66', marginTop: 12 }}
        onClick={() => deleteNode(selectedNodeId)}
      >
        🗑 Видалити вузол
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    background: '#16213e',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 14px',
    width: 280,
    color: '#eee',
    fontFamily: 'sans-serif',
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 'calc(100vh - 160px)',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 16,
    padding: 0,
  },
  label: {
    fontSize: 11,
    color: '#aaa',
    marginTop: 4,
  },
  input: {
    background: '#0f3460',
    border: '1px solid #444',
    borderRadius: 4,
    color: '#eee',
    padding: '5px 8px',
    fontSize: 13,
    width: '100%',
    boxSizing: 'border-box',
  },
  portsTitle: {
    fontWeight: 700,
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 2,
  },
  portGroupLabel: {
    fontSize: 11,
    color: '#7ec8e3',
    marginTop: 4,
  },
  portRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  portName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#7ec8e3',
    cursor: 'pointer',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '2px 4px',
    fontSize: 14,
  },
  addPortBtn: {
    background: 'transparent',
    border: '1px dashed #7ec8e3',
    borderRadius: 4,
    color: '#7ec8e3',
    cursor: 'pointer',
    padding: '4px 8px',
    fontSize: 12,
    textAlign: 'left',
  },
}

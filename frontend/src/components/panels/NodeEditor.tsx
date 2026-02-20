import { useState, useEffect } from 'react'
import { useGraphStore } from '../../store/graphStore'

export default function NodeEditor() {
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const nodes = useGraphStore((s) => s.nodes)
  const renameDevice = useGraphStore((s) => s.renameDevice)
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  const addPort = useGraphStore((s) => s.addPort)
  const renamePort = useGraphStore((s) => s.renamePort)
  const deletePort = useGraphStore((s) => s.deletePort)
  const deleteNode = useGraphStore((s) => s.deleteNode)
  const selectNode = useGraphStore((s) => s.selectNode)

  const [nameDraft, setNameDraft] = useState('')
  const [nameError, setNameError] = useState<string | null>(null)

  // portName of the port being edited, null if none
  const [editingPortName, setEditingPortName] = useState<string | null>(null)
  const [portNameDraft, setPortNameDraft] = useState('')
  const [portNameError, setPortNameError] = useState<string | null>(null)

  // Reset name draft when switching nodes
  useEffect(() => {
    if (selectedNodeId) {
      const node = useGraphStore.getState().nodes.find((n) => n.id === selectedNodeId)
      setNameDraft(node?.data.name ?? selectedNodeId)
    }
    setNameError(null)
    setEditingPortName(null)
    setPortNameError(null)
  }, [selectedNodeId])

  if (!selectedNodeId) return null

  const node = nodes.find((n) => n.id === selectedNodeId)
  if (!node) return null

  const { data } = node
  const inPorts = data.ports.filter((p) => p.direction === 'in')
  const outPorts = data.ports.filter((p) => p.direction === 'out')

  const commitDeviceName = () => {
    const err = renameDevice(selectedNodeId, nameDraft)
    if (err) setNameError(err)
    else setNameError(null)
  }

  const startEditPort = (portName: string) => {
    setEditingPortName(portName)
    setPortNameDraft(portName)
    setPortNameError(null)
  }

  const commitPortName = () => {
    if (!editingPortName) return
    const trimmed = portNameDraft.trim()
    if (!trimmed) {
      setPortNameError('Назва не може бути порожньою')
      return
    }
    const err = renamePort(selectedNodeId, editingPortName, trimmed)
    if (err) {
      setPortNameError(err)
    } else {
      setEditingPortName(null)
      setPortNameError(null)
    }
  }

  const renderPort = (portName: string, color: string) => (
    <div key={portName} style={styles.portRow}>
      {editingPortName === portName ? (
        <>
          <input
            autoFocus
            style={{ ...styles.input, flex: 1, margin: 0 }}
            value={portNameDraft}
            onChange={(e) => { setPortNameDraft(e.target.value); setPortNameError(null) }}
            onBlur={commitPortName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitPortName()
              if (e.key === 'Escape') { setEditingPortName(null); setPortNameError(null) }
            }}
          />
          {portNameError && <span style={styles.portError}>{portNameError}</span>}
        </>
      ) : (
        <span
          style={{ ...styles.portName, color }}
          onDoubleClick={() => startEditPort(portName)}
          title="Подвійний клік для перейменування"
        >
          {portName}
        </span>
      )}
      <button
        style={styles.iconBtn}
        onClick={() => startEditPort(portName)}
        title="Перейменувати"
      >
        ✏️
      </button>
      <button
        style={{ ...styles.iconBtn, color: '#f66' }}
        onClick={() => deletePort(selectedNodeId, portName)}
        title="Видалити порт"
      >
        🗑
      </button>
    </div>
  )

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
        style={{ ...styles.input, borderColor: nameError ? '#f66' : '#444' }}
        value={nameDraft}
        onChange={(e) => { setNameDraft(e.target.value); setNameError(null) }}
        onBlur={commitDeviceName}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitDeviceName()
          if (e.key === 'Escape') {
            setNameDraft(data.name)
            setNameError(null)
          }
        }}
      />
      {nameError && <div style={styles.fieldError}>{nameError}</div>}

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
      {inPorts.map((p) => renderPort(p.name, '#7ec8e3'))}
      <button style={styles.addPortBtn} onClick={() => addPort(selectedNodeId, 'in')}>
        + Додати вхід
      </button>

      {/* Output ports */}
      <div style={{ ...styles.portGroupLabel, color: '#90ee90', marginTop: 8 }}>Виходи (output)</div>
      {outPorts.map((p) => renderPort(p.name, '#90ee90'))}
      <button
        style={{ ...styles.addPortBtn, color: '#90ee90', borderColor: '#90ee90' }}
        onClick={() => addPort(selectedNodeId, 'out')}
      >
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
  fieldError: {
    color: '#f66',
    fontSize: 11,
    marginTop: -2,
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
    flexWrap: 'wrap',
  },
  portName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
  portError: {
    color: '#f66',
    fontSize: 10,
    width: '100%',
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

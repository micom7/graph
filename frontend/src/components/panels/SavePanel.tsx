import { useRef } from 'react'
import { useGraphStore } from '../../store/graphStore'

export default function SavePanel() {
  const saveToFile = useGraphStore((s) => s.saveToFile)
  const loadFromFile = useGraphStore((s) => s.loadFromFile)
  const status = useGraphStore((s) => s.status)
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div style={styles.panel}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) loadFromFile(file)
          e.target.value = ''
        }}
      />
      <button
        style={{ ...styles.btn, background: '#0f3460' }}
        onClick={() => fileInputRef.current?.click()}
      >
        📂 Відкрити файл
      </button>
      <button style={{ ...styles.btn, background: '#0a6640' }} onClick={saveToFile}>
        💾 Зберегти файл
      </button>
      {status && <div style={styles.status}>{status}</div>}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    bottom: 10,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    background: '#16213e',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '8px 14px',
    fontFamily: 'sans-serif',
  },
  btn: {
    color: '#eee',
    border: 'none',
    borderRadius: 6,
    padding: '7px 14px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  status: {
    color: '#aaa',
    fontSize: 12,
    marginLeft: 8,
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

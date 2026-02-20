import { useGraphStore } from '../../store/graphStore'

export default function SavePanel() {
  const loadFromDB = useGraphStore((s) => s.loadFromDB)
  const saveToDB = useGraphStore((s) => s.saveToDB)
  const exportJSON = useGraphStore((s) => s.exportJSON)
  const status = useGraphStore((s) => s.status)

  return (
    <div style={styles.panel}>
      <button style={{ ...styles.btn, background: '#0a6640' }} onClick={saveToDB}>
        💾 Зберегти в БД
      </button>
      <button style={{ ...styles.btn, background: '#0f3460' }} onClick={loadFromDB}>
        ☁️ Завантажити з БД
      </button>
      <button style={{ ...styles.btn, background: '#3a3a5c' }} onClick={exportJSON}>
        📄 Експорт JSON
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
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}

import { useGraphStore } from '../../store/graphStore'

export default function Toolbar() {
  const deviceTypes = useGraphStore((s) => s.deviceTypes)
  const addDevice = useGraphStore((s) => s.addDevice)

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Пристрої</div>
      {deviceTypes.length === 0 && (
        <div style={styles.hint}>Завантажте граф з БД, щоб побачити типи пристроїв</div>
      )}
      {deviceTypes.map((dt) => (
        <button
          key={dt.id}
          style={{ ...styles.btn, borderColor: dt.color ?? '#555' }}
          onClick={() => addDevice(dt.id)}
          title={`Додати: ${dt.label ?? dt.name}`}
        >
          <span style={{ marginRight: 6 }}>+</span>
          {dt.label ?? dt.name}
        </button>
      ))}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    background: '#16213e',
    border: '1px solid #333',
    borderRadius: 8,
    padding: '10px 12px',
    minWidth: 160,
    color: '#eee',
    fontFamily: 'sans-serif',
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  title: {
    fontWeight: 700,
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  btn: {
    background: '#0f3460',
    color: '#eee',
    border: '1px solid #555',
    borderRadius: 5,
    padding: '5px 10px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 13,
    transition: 'background 0.15s',
  },
  hint: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
}

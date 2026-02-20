import { useState } from 'react'
import { useGraphStore } from '../../store/graphStore'
import type { DeviceType } from '../../types/graph'

const ICON_OPTIONS = ['⚙️', '🔀', '⬆️', '➡️', '↔️', '📦', '🏛️', '🔧', '⚡', '🌀', '🔩', '🏗️', '🎛️', '🪣']
const COLOR_OPTIONS = ['#4A90D9', '#E67E22', '#27AE60', '#8E44AD', '#C0392B', '#16A085', '#F39C12', '#2980B9', '#7F8C8D', '#D35400']

const emptyForm = (): Omit<DeviceType, 'name'> & { name: string } => ({
  name: '',
  label: '',
  color: COLOR_OPTIONS[0],
  icon: ICON_OPTIONS[0],
})

export default function Toolbar() {
  const deviceTypes = useGraphStore((s) => s.deviceTypes)
  const addDevice = useGraphStore((s) => s.addDevice)
  const addDeviceType = useGraphStore((s) => s.addDeviceType)
  const updateDeviceType = useGraphStore((s) => s.updateDeviceType)
  const deleteDeviceType = useGraphStore((s) => s.deleteDeviceType)

  const [showNewForm, setShowNewForm] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState<string | null>(null)

  // Per-type inline edit state
  const [editingType, setEditingType] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editColor, setEditColor] = useState(COLOR_OPTIONS[0])
  const [editIcon, setEditIcon] = useState(ICON_OPTIONS[0])

  const startEditType = (dt: DeviceType) => {
    setEditingType(dt.name)
    setEditLabel(dt.label)
    setEditColor(dt.color)
    setEditIcon(dt.icon)
  }

  const commitEditType = () => {
    if (!editingType) return
    if (editLabel.trim()) {
      updateDeviceType(editingType, { label: editLabel.trim(), color: editColor, icon: editIcon })
    }
    setEditingType(null)
  }

  const handleAddType = () => {
    const err = addDeviceType({ ...form, name: form.name.trim(), label: form.label.trim() })
    if (err) {
      setFormError(err)
      return
    }
    setShowNewForm(false)
    setForm(emptyForm())
    setFormError(null)
  }

  return (
    <div style={styles.panel}>
      <div style={styles.title}>Пристрої</div>

      {deviceTypes.length === 0 && !showNewForm && (
        <div style={styles.hint}>Додайте категорію, щоб створювати пристрої</div>
      )}

      {deviceTypes.map((dt) =>
        editingType === dt.name ? (
          /* ── Inline edit form for existing type ── */
          <div key={dt.name} style={styles.editForm}>
            <div style={styles.editRow}>
              <span style={{ color: '#aaa', fontSize: 11 }}>{dt.name}</span>
              <span style={{ marginLeft: 'auto', fontSize: 13 }}>{editIcon}</span>
            </div>
            <input
              style={styles.formInput}
              placeholder="Назва відображення"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              autoFocus
            />
            <div style={styles.swatchRow}>
              {COLOR_OPTIONS.map((c) => (
                <div
                  key={c}
                  style={{ ...styles.swatch, background: c, outline: editColor === c ? '2px solid #fff' : 'none' }}
                  onClick={() => setEditColor(c)}
                />
              ))}
            </div>
            <div style={styles.iconRow}>
              {ICON_OPTIONS.map((ic) => (
                <span
                  key={ic}
                  style={{ ...styles.iconOpt, background: editIcon === ic ? '#2a3f6f' : 'transparent' }}
                  onClick={() => setEditIcon(ic)}
                >
                  {ic}
                </span>
              ))}
            </div>
            <div style={styles.formBtns}>
              <button style={styles.confirmBtn} onClick={commitEditType}>Зберегти</button>
              <button style={styles.cancelBtn} onClick={() => setEditingType(null)}>Скасувати</button>
            </div>
          </div>
        ) : (
          /* ── Normal device type row ── */
          <div key={dt.name} style={styles.typeRow}>
            <button
              style={{ ...styles.btn, borderColor: dt.color }}
              onClick={() => addDevice(dt.name)}
              title={`Додати пристрій типу "${dt.label}"`}
            >
              <span style={{ marginRight: 5 }}>{dt.icon}</span>
              {dt.label}
            </button>
            <button
              style={styles.iconBtn}
              onClick={() => startEditType(dt)}
              title="Редагувати категорію"
            >
              ✎
            </button>
            <button
              style={{ ...styles.iconBtn, color: '#f66' }}
              onClick={() => deleteDeviceType(dt.name)}
              title="Видалити категорію"
            >
              ✕
            </button>
          </div>
        ),
      )}

      {/* ── New category form ── */}
      {showNewForm ? (
        <div style={styles.editForm}>
          <div style={styles.formTitle}>Нова категорія</div>
          <input
            style={styles.formInput}
            placeholder="Системна назва (латиниця)"
            value={form.name}
            autoFocus
            onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormError(null) }}
          />
          <input
            style={styles.formInput}
            placeholder="Назва для відображення"
            value={form.label}
            onChange={(e) => { setForm((f) => ({ ...f, label: e.target.value })); setFormError(null) }}
          />
          <div style={styles.swatchRow}>
            {COLOR_OPTIONS.map((c) => (
              <div
                key={c}
                style={{ ...styles.swatch, background: c, outline: form.color === c ? '2px solid #fff' : 'none' }}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
              />
            ))}
          </div>
          <div style={styles.iconRow}>
            {ICON_OPTIONS.map((ic) => (
              <span
                key={ic}
                style={{ ...styles.iconOpt, background: form.icon === ic ? '#2a3f6f' : 'transparent' }}
                onClick={() => setForm((f) => ({ ...f, icon: ic }))}
              >
                {ic}
              </span>
            ))}
          </div>
          {formError && <div style={styles.error}>{formError}</div>}
          <div style={styles.formBtns}>
            <button style={styles.confirmBtn} onClick={handleAddType}>Додати</button>
            <button style={styles.cancelBtn} onClick={() => { setShowNewForm(false); setFormError(null) }}>
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button style={styles.addTypeBtn} onClick={() => setShowNewForm(true)}>
          + Нова категорія
        </button>
      )}
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
    minWidth: 190,
    maxWidth: 230,
    color: '#eee',
    fontFamily: 'sans-serif',
    fontSize: 13,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    maxHeight: 'calc(100vh - 80px)',
    overflowY: 'auto',
  },
  title: {
    fontWeight: 700,
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  hint: {
    color: '#666',
    fontSize: 11,
    fontStyle: 'italic',
  },
  typeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  btn: {
    flex: 1,
    background: '#0f3460',
    color: '#eee',
    border: '1px solid #555',
    borderRadius: 5,
    padding: '5px 8px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 14,
    padding: '2px 4px',
    flexShrink: 0,
  },
  addTypeBtn: {
    background: 'transparent',
    border: '1px dashed #555',
    borderRadius: 5,
    color: '#888',
    cursor: 'pointer',
    padding: '5px 8px',
    fontSize: 12,
    textAlign: 'left',
    marginTop: 2,
  },
  editForm: {
    background: '#0d1b3e',
    border: '1px solid #2a4a7f',
    borderRadius: 6,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  formTitle: {
    fontWeight: 700,
    fontSize: 11,
    color: '#7ec8e3',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  editRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  formInput: {
    background: '#0f3460',
    border: '1px solid #444',
    borderRadius: 4,
    color: '#eee',
    padding: '4px 7px',
    fontSize: 12,
    width: '100%',
    boxSizing: 'border-box',
  },
  swatchRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 3,
    cursor: 'pointer',
    flexShrink: 0,
  },
  iconRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 2,
  },
  iconOpt: {
    fontSize: 15,
    padding: '2px 3px',
    borderRadius: 3,
    cursor: 'pointer',
  },
  formBtns: {
    display: 'flex',
    gap: 6,
    marginTop: 2,
  },
  confirmBtn: {
    flex: 1,
    background: '#0a6640',
    color: '#eee',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 12,
  },
  cancelBtn: {
    flex: 1,
    background: '#333',
    color: '#aaa',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 12,
  },
  error: {
    color: '#f66',
    fontSize: 11,
  },
}

import { useState } from 'react'
import { useStore, Category } from '../store'
import Modal from '../components/Modal'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16', '#f97316', '#14b8a6']
const ICONS = ['💼', '🏠', '💪', '🎨', '⭐', '🎯', '📚', '🍎', '🌿', '🐾', '🎮', '🧹', '✈️', '🎵', '💻', '🛒']

export default function SettingsView() {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState({ name: '', color: COLORS[0], icon: ICONS[0] })

  const openAdd = () => {
    setEditing(null)
    setForm({ name: '', color: COLORS[0], icon: ICONS[0] })
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, color: cat.color, icon: cat.icon })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) return
    if (editing) {
      updateCategory(editing.id, { name: form.name.trim(), color: form.color, icon: form.icon })
    } else {
      addCategory({ name: form.name.trim(), color: form.color, icon: form.icon })
    }
    setShowModal(false)
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Settings</h2>

      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Categories</h3>
          <button
            onClick={openAdd}
            className="text-indigo-400 hover:text-indigo-300 text-sm bg-transparent border-0 cursor-pointer"
          >
            + Add
          </button>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
              <span className="text-xl">{cat.icon}</span>
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-white text-sm flex-1">{cat.name}</span>
              <button
                onClick={() => openEdit(cat)}
                className="text-gray-500 hover:text-white text-xs bg-transparent border-0 cursor-pointer mr-2"
              >
                Edit
              </button>
              <button
                onClick={() => deleteCategory(cat.id)}
                className="text-gray-700 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-sm text-gray-400">
        <h3 className="text-white font-medium mb-2">About TodoItAll</h3>
        <p>Your personal task, habit, and routine tracker. All data is stored locally on your device.</p>
        <p className="mt-2 text-xs text-gray-600">Add to home screen on iPhone: tap Share → "Add to Home Screen" in Safari.</p>
      </section>

      {showModal && (
        <Modal title={editing ? 'Edit Category' : 'New Category'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setForm({ ...form, icon: ic })}
                    className={`text-xl w-9 h-9 rounded-lg border-0 cursor-pointer transition-all ${
                      form.icon === ic ? 'bg-indigo-600 scale-110' : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <input
              placeholder="Category name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
            />
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-800 rounded-xl px-4 py-3">
              <span className="text-2xl">{form.icon}</span>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: form.color }} />
              <span className="text-white">{form.name || 'Preview'}</span>
            </div>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              {editing ? 'Save Changes' : 'Add Category'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

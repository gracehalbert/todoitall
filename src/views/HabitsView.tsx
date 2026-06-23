import { useState } from 'react'
import { useStore, Habit, Frequency } from '../store'
import Modal from '../components/Modal'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function today() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  title: '', description: '', categoryId: '', frequency: 'daily' as Frequency,
  targetDays: [] as number[], color: COLORS[0], dollars: '1',
}

export default function HabitsView() {
  const { habits, categories, addHabit, updateHabit, completeHabit, uncompleteHabit, deleteHabit, reorderHabits } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (habit: Habit) => {
    setEditingId(habit.id)
    setForm({
      title: habit.title,
      description: habit.description ?? '',
      categoryId: habit.categoryId,
      frequency: habit.frequency,
      targetDays: habit.targetDays ?? [],
      color: habit.color,
      dollars: habit.points.toFixed(2),
    })
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.categoryId) return
    const dollars = parseFloat(form.dollars)
    if (isNaN(dollars) || dollars < 0) return
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      frequency: form.frequency,
      targetDays: form.frequency === 'weekly' ? form.targetDays : undefined,
      color: form.color,
      points: Math.round(dollars * 100) / 100,
    }
    if (editingId) {
      updateHabit(editingId, data)
    } else {
      addHabit(data)
    }
    setShowModal(false)
  }

  const t = today()

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Habits</h2>
        <button
          onClick={openAdd}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      {habits.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-4xl mb-2">🔄</div>
          <p className="text-gray-600">No habits yet. Add one to start building streaks!</p>
        </div>
      )}

      <div className="space-y-3">
        {habits.map((habit, index) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            today={t}
            index={index}
            total={habits.length}
            onComplete={completeHabit}
            onUncomplete={uncompleteHabit}
            onDelete={deleteHabit}
            onEdit={openEdit}
            onReorder={reorderHabits}
          />
        ))}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit Habit' : 'New Habit'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <input
              placeholder="Habit name"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
            />
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (pick days)</option>
            </select>
            {form.frequency === 'weekly' && (
              <div className="flex gap-1 flex-wrap">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    onClick={() => setForm({
                      ...form,
                      targetDays: form.targetDays.includes(i)
                        ? form.targetDays.filter((x) => x !== i)
                        : [...form.targetDays, i],
                    })}
                    className={`text-xs px-2 py-1 rounded border-0 cursor-pointer transition-colors ${
                      form.targetDays.includes(i) ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-all ${form.color === c ? 'border-gray-800 scale-110 ring-2 ring-offset-1 ring-gray-400' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.dollars}
                onChange={(e) => setForm({ ...form, dollars: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.categoryId}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              {editingId ? 'Save Changes' : 'Add Habit'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function HabitCard({
  habit, today, index, total, onComplete, onUncomplete, onDelete, onEdit, onReorder,
}: {
  habit: Habit; today: string; index: number; total: number
  onComplete: (id: string, date: string) => void
  onUncomplete: (id: string, date: string) => void
  onDelete: (id: string) => void
  onEdit: (habit: Habit) => void
  onReorder: (from: number, to: number) => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === habit.categoryId)
  const completedToday = habit.completedDates.includes(today)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10)
    return { date: d, done: habit.completedDates.includes(d) }
  })

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-0.5 mt-1">
            <button
              onClick={() => onReorder(index, index - 1)}
              disabled={index === 0}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
              title="Move up"
            >▲</button>
            <button
              onClick={() => onReorder(index, index + 1)}
              disabled={index === total - 1}
              className="text-gray-300 hover:text-gray-600 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
              title="Move down"
            >▼</button>
          </div>
          <div className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: habit.color }} />
          <div>
            <div className="font-medium text-gray-900 text-sm">{habit.title}</div>
            {habit.description && <div className="text-xs text-gray-400 mt-0.5">{habit.description}</div>}
            <div className="flex items-center gap-2 mt-1">
              {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
              <span className="text-xs text-orange-400">🔥 {habit.streak} streak</span>
              {habit.longestStreak > 0 && <span className="text-xs text-gray-500">best: {habit.longestStreak}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => completedToday ? onUncomplete(habit.id, today) : onComplete(habit.id, today)}
            className={`text-sm px-3 py-1.5 rounded-lg border-0 cursor-pointer font-medium transition-colors ${
              completedToday ? 'bg-green-500/20 text-green-400' : 'text-white'
            }`}
            style={!completedToday ? { backgroundColor: habit.color } : {}}
          >
            {completedToday ? '✓ Done' : 'Do it'}
          </button>
          <button
            onClick={() => onEdit(habit)}
            className="text-gray-400 hover:text-violet-500 bg-transparent border-0 cursor-pointer text-sm px-1"
            title="Edit"
          >✎</button>
          <button onClick={() => onDelete(habit.id)} className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg">×</button>
        </div>
      </div>

      <div className="flex gap-1">
        {last7.map(({ date, done }) => (
          <div
            key={date}
            title={date}
            className="flex-1 h-2 rounded-sm"
            style={{ backgroundColor: done ? habit.color : '#e9d5ff' }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-0.5">
        <span className="text-xs text-gray-400">7 days ago</span>
        <span className="text-xs text-gray-400">today</span>
      </div>
    </div>
  )
}

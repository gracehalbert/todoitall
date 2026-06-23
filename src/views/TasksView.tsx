import { useState } from 'react'
import { useStore, Task, Priority } from '../store'
import Modal from '../components/Modal'

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'text-red-400',
  medium: 'text-yellow-400',
  low: 'text-green-400',
}

type Filter = 'all' | 'active' | 'completed'

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

const EMPTY_FORM = {
  title: '', description: '', categoryId: '', priority: 'medium' as Priority,
  dueDate: '', dollars: '1', timeEstimate: '',
}

export default function TasksView() {
  const { tasks, categories, addTask, updateTask, completeTask, uncompleteTask, deleteTask, reorderTasks } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filter, setFilter] = useState<Filter>('active')
  const [form, setForm] = useState(EMPTY_FORM)

  const filtered = tasks.filter((t) => {
    if (filterCat !== 'all' && t.categoryId !== filterCat) return false
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  // Only auto-sort when not in 'all' filter (which shows user-defined order)
  const displayed = filter === 'all'
    ? filtered
    : [...filtered].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1
        const pOrd = { high: 0, medium: 1, low: 2 }
        return pOrd[a.priority] - pOrd[b.priority]
      })

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (task: Task) => {
    setEditingId(task.id)
    setForm({
      title: task.title,
      description: task.description ?? '',
      categoryId: task.categoryId,
      priority: task.priority,
      dueDate: task.dueDate ?? '',
      dollars: task.points.toFixed(2),
      timeEstimate: task.timeEstimate ? String(task.timeEstimate) : '',
    })
    setShowModal(true)
  }

  const handleSave = () => {
    const dollars = parseFloat(form.dollars)
    if (!form.title.trim() || !form.categoryId || isNaN(dollars) || dollars < 0) return
    const mins = parseInt(form.timeEstimate)
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      timeEstimate: !isNaN(mins) && mins > 0 ? mins : undefined,
      points: Math.round(dollars * 100) / 100,
    }
    if (editingId) {
      updateTask(editingId, data)
    } else {
      addTask(data)
    }
    setShowModal(false)
  }

  // For reordering, we need to map displayed indices back to global indices
  const handleReorder = (displayedFrom: number, displayedTo: number) => {
    const fromId = displayed[displayedFrom]?.id
    const toId = displayed[displayedTo]?.id
    if (!fromId || !toId) return
    const globalFrom = tasks.findIndex((t) => t.id === fromId)
    const globalTo = tasks.findIndex((t) => t.id === toId)
    if (globalFrom === -1 || globalTo === -1) return
    reorderTasks(globalFrom, globalTo)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Tasks</h2>
        <button
          onClick={openAdd}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {(['all', 'active', 'completed'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1 rounded-full border-0 cursor-pointer whitespace-nowrap transition-colors capitalize ${
              filter === f ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCat('all')}
          className={`text-xs px-3 py-1 rounded-full border-0 cursor-pointer whitespace-nowrap transition-colors ${
            filterCat === 'all' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-800'
          }`}
        >
          All categories
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCat(cat.id)}
            className={`text-xs px-3 py-1 rounded-full border-0 cursor-pointer whitespace-nowrap transition-colors ${
              filterCat === cat.id ? 'text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            style={filterCat === cat.id ? { backgroundColor: cat.color } : {}}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {displayed.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-gray-600">No tasks here</p>
        </div>
      )}

      <div className="space-y-2">
        {displayed.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            index={index}
            total={displayed.length}
            showReorder={filter === 'all' && filterCat === 'all'}
            onComplete={completeTask}
            onUncomplete={uncompleteTask}
            onDelete={deleteTask}
            onEdit={openEdit}
            onReorder={handleReorder}
          />
        ))}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit Task' : 'New Task'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <input
              placeholder="Task title"
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
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Time (min)"
                  value={form.timeEstimate}
                  onChange={(e) => setForm({ ...form, timeEstimate: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-400"
            />
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.categoryId}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              {editingId ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function TaskCard({
  task, index, total, showReorder, onComplete, onUncomplete, onDelete, onEdit, onReorder,
}: {
  task: Task; index: number; total: number; showReorder: boolean
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (task: Task) => void
  onReorder: (from: number, to: number) => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === task.categoryId)

  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border bg-white shadow-sm ${task.completed ? 'opacity-50' : ''}`}>
      {showReorder && (
        <div className="flex flex-col gap-0.5 mt-1 flex-shrink-0">
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
      )}
      <button
        onClick={() => task.completed ? onUncomplete(task.id) : onComplete(task.id)}
        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 cursor-pointer transition-colors ${
          task.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300 bg-transparent hover:border-violet-400'
        }`}
        style={{ minWidth: '1.25rem' }}
      >
        {task.completed && <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </span>
          <span className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>●</span>
        </div>
        {task.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {cat && (
            <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ backgroundColor: cat.color + '33', color: cat.color }}>
              {cat.icon} {cat.name}
            </span>
          )}
          {task.timeEstimate && (
            <span className="text-xs text-gray-500">⏱ {formatTime(task.timeEstimate)}</span>
          )}
          {task.dueDate && (
            <span className="text-xs text-gray-400">Due {task.dueDate}</span>
          )}
          <span className="text-xs text-green-400">+${task.points.toFixed(2)}</span>
        </div>
      </div>
      <button
        onClick={() => onEdit(task)}
        className="text-gray-400 hover:text-violet-500 bg-transparent border-0 cursor-pointer text-sm mt-0.5"
        title="Edit"
      >✎</button>
      <button
        onClick={() => onDelete(task.id)}
        className="text-gray-700 hover:text-red-400 text-lg leading-none bg-transparent border-0 cursor-pointer"
      >
        ×
      </button>
    </div>
  )
}

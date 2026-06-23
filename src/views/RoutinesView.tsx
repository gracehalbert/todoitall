import { useState } from 'react'
import { useStore, Routine, Frequency } from '../store'
import Modal from '../components/Modal'
import { v4 as uuid } from 'uuid'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

function today() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  title: '', description: '', categoryId: '', frequency: 'daily' as Frequency,
  targetDays: [] as number[],
  steps: [] as { id: string; title: string; completed: boolean }[], dollars: '5',
}

export default function RoutinesView() {
  const { routines, categories, addRoutine, updateRoutine, completeRoutine, resetRoutine, toggleRoutineStep, deleteRoutine, reorderRoutines } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [stepInput, setStepInput] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  const openAdd = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setStepInput('')
    setShowModal(true)
  }

  const openEdit = (routine: Routine) => {
    setEditingId(routine.id)
    setForm({
      title: routine.title,
      description: routine.description ?? '',
      categoryId: routine.categoryId,
      frequency: routine.frequency,
      targetDays: routine.targetDays ?? [],
      steps: routine.steps.map((s) => ({ ...s })),
      dollars: routine.points.toFixed(2),
    })
    setStepInput('')
    setShowModal(true)
  }

  const addStep = () => {
    if (!stepInput.trim()) return
    setForm({ ...form, steps: [...form.steps, { id: uuid(), title: stepInput.trim(), completed: false }] })
    setStepInput('')
  }

  const removeStep = (id: string) => setForm({ ...form, steps: form.steps.filter((s) => s.id !== id) })

  const handleSave = () => {
    if (!form.title.trim() || !form.categoryId || form.steps.length === 0) return
    const dollars = parseFloat(form.dollars)
    if (isNaN(dollars) || dollars < 0) return
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      frequency: form.frequency,
      targetDays: form.frequency !== 'daily' ? form.targetDays : undefined,
      steps: form.steps,
      points: Math.round(dollars * 100) / 100,
    }
    if (editingId) {
      updateRoutine(editingId, data)
    } else {
      addRoutine(data)
    }
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Routines</h2>
        <button
          onClick={openAdd}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      {routines.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-600">No routines yet. Create sequences of steps to run through.</p>
        </div>
      )}

      <div className="space-y-3">
        {routines.map((r, index) => (
          <RoutineCard
            key={r.id}
            routine={r}
            index={index}
            total={routines.length}
            onComplete={completeRoutine}
            onReset={resetRoutine}
            onToggleStep={toggleRoutineStep}
            onDelete={deleteRoutine}
            onEdit={openEdit}
            onReorder={reorderRoutines}
            onReorderStep={(routineId, from, to) => {
              const routine = routines.find((r) => r.id === routineId)
              if (!routine) return
              const steps = [...routine.steps]
              const [item] = steps.splice(from, 1)
              steps.splice(to, 0, item)
              updateRoutine(routineId, { steps })
            }}
          />
        ))}
      </div>

      {showModal && (
        <Modal title={editingId ? 'Edit Routine' : 'New Routine'} onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <input
              placeholder="Routine name (e.g. Morning routine)"
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
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency, targetDays: [] })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 text-sm focus:outline-none focus:border-violet-400"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            {form.frequency === 'weekly' && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Target days <span className="text-gray-600">(auto-appears on these days)</span></label>
                <div className="flex gap-1 flex-wrap">
                  {WEEK_DAYS.map((d, i) => (
                    <button
                      key={d}
                      type="button"
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
              </div>
            )}

            {form.frequency === 'monthly' && (
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Target days of month <span className="text-gray-600">(auto-appears on these dates)</span></label>
                <div className="flex gap-1 flex-wrap">
                  {MONTH_DAYS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm({
                        ...form,
                        targetDays: form.targetDays.includes(d)
                          ? form.targetDays.filter((x) => x !== d)
                          : [...form.targetDays, d],
                      })}
                      className={`text-xs w-7 h-7 rounded border-0 cursor-pointer transition-colors ${
                        form.targetDays.includes(d) ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Steps</label>
              <div className="space-y-1 mb-2">
                {form.steps.map((step, i) => (
                  <div key={step.id} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => {
                          const steps = [...form.steps]
                          const [item] = steps.splice(i, 1)
                          steps.splice(i - 1, 0, item)
                          setForm({ ...form, steps })
                        }}
                        disabled={i === 0}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                      >▲</button>
                      <button
                        onClick={() => {
                          const steps = [...form.steps]
                          const [item] = steps.splice(i, 1)
                          steps.splice(i + 1, 0, item)
                          setForm({ ...form, steps })
                        }}
                        disabled={i === form.steps.length - 1}
                        className="text-gray-300 hover:text-gray-600 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                      >▼</button>
                    </div>
                    <span className="text-xs text-gray-700 flex-1">{step.title}</span>
                    <button onClick={() => removeStep(step.id)} className="text-gray-400 hover:text-red-400 bg-transparent border-0 cursor-pointer">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Add a step..."
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addStep() }}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
                />
                <button
                  onClick={addStep}
                  className="bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm px-3 rounded-lg border-0 cursor-pointer"
                >
                  Add
                </button>
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
              disabled={!form.title.trim() || !form.categoryId || form.steps.length === 0}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              {editingId ? 'Save Changes' : 'Add Routine'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function RoutineCard({
  routine, index, total, onComplete, onReset, onToggleStep, onDelete, onEdit, onReorder, onReorderStep,
}: {
  routine: Routine; index: number; total: number
  onComplete: (id: string, date: string) => void
  onReset: (id: string) => void
  onToggleStep: (routineId: string, stepId: string) => void
  onDelete: (id: string) => void
  onEdit: (routine: Routine) => void
  onReorder: (from: number, to: number) => void
  onReorderStep: (routineId: string, from: number, to: number) => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === routine.categoryId)
  const completedCount = routine.steps.filter((s) => s.completed).length
  const allDone = completedCount === routine.steps.length
  const progress = routine.steps.length > 0 ? (completedCount / routine.steps.length) * 100 : 0
  const completedToday = routine.completedDates.includes(today())

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <div className="flex flex-col gap-0.5 mt-0.5">
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
            <div>
              <div className="font-medium text-gray-900 text-sm">{routine.title}</div>
              {routine.description && <div className="text-xs text-gray-400 mt-0.5">{routine.description}</div>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
                <span className="text-xs text-gray-500 capitalize">
                  {routine.frequency === 'weekly' && routine.targetDays && routine.targetDays.length > 0
                    ? routine.targetDays.map((d) => WEEK_DAYS[d]).join(', ')
                    : routine.frequency === 'monthly' && routine.targetDays && routine.targetDays.length > 0
                    ? routine.targetDays.sort((a, b) => a - b).map((d) => `${d}`).join(', ')
                    : routine.frequency}
                </span>
                <span className="text-xs text-green-400">+${routine.points.toFixed(2)}</span>
                <span className="text-xs text-gray-500">{completedCount}/{routine.steps.length}</span>
                {routine.lastCompletedDate && (
                  <span className="text-xs text-gray-400">
                    Last done {new Date(routine.lastCompletedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(routine)}
              className="text-gray-400 hover:text-violet-500 bg-transparent border-0 cursor-pointer text-sm"
              title="Edit"
            >✎</button>
            <button onClick={() => onDelete(routine.id)} className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg">×</button>
          </div>
        </div>

        <div className="h-1.5 bg-violet-100 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-1.5">
          {routine.steps.map((step, stepIndex) => (
            <div key={step.id} className="flex items-center gap-1">
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => onReorderStep(routine.id, stepIndex, stepIndex - 1)}
                  disabled={stepIndex === 0}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                  title="Move up"
                >▲</button>
                <button
                  onClick={() => onReorderStep(routine.id, stepIndex, stepIndex + 1)}
                  disabled={stepIndex === routine.steps.length - 1}
                  className="text-gray-300 hover:text-gray-600 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                  title="Move down"
                >▼</button>
              </div>
              <button
                onClick={() => !completedToday && onToggleStep(routine.id, step.id)}
                className={`flex-1 flex items-center gap-2.5 text-left bg-transparent border-0 cursor-pointer p-1.5 rounded-lg hover:bg-violet-50 transition-colors ${completedToday ? 'cursor-default' : ''}`}
              >
                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${step.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
                  {step.completed && <span className="text-white text-xs">✓</span>}
                </div>
                <span className={`text-sm ${step.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{step.title}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {!completedToday && (
        <div className="px-4 pb-4 flex gap-2">
          {allDone ? (
            <button
              onClick={() => onComplete(routine.id, today())}
              className="flex-1 bg-green-500 hover:bg-green-400 text-white text-sm font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              Complete Routine ✓
            </button>
          ) : (
            <div className="flex-1 text-center text-xs text-gray-400 py-2">
              Complete all steps to finish
            </div>
          )}
          {completedCount > 0 && (
            <button
              onClick={() => onReset(routine.id)}
              className="text-gray-400 hover:text-gray-600 text-xs bg-transparent border-0 cursor-pointer px-2"
            >
              Reset
            </button>
          )}
        </div>
      )}
      {completedToday && (
        <div className="px-4 pb-4">
          <div className="text-center text-green-600 text-sm bg-green-50 rounded-lg py-2">
            ✓ Completed today
          </div>
        </div>
      )}
    </div>
  )
}

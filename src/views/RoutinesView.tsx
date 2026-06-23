import { useState } from 'react'
import { useStore, Routine, Frequency } from '../store'
import Modal from '../components/Modal'
import { v4 as uuid } from 'uuid'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function RoutinesView() {
  const { routines, categories, addRoutine, completeRoutine, resetRoutine, toggleRoutineStep, deleteRoutine } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [stepInput, setStepInput] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', frequency: 'daily' as Frequency, steps: [] as { id: string; title: string; completed: boolean }[], dollars: '5',
  })

  const addStep = () => {
    if (!stepInput.trim()) return
    setForm({ ...form, steps: [...form.steps, { id: uuid(), title: stepInput.trim(), completed: false }] })
    setStepInput('')
  }

  const removeStep = (id: string) => setForm({ ...form, steps: form.steps.filter((s) => s.id !== id) })

  const handleAdd = () => {
    if (!form.title.trim() || !form.categoryId || form.steps.length === 0) return
    const dollars = parseFloat(form.dollars)
    if (isNaN(dollars) || dollars < 0) return
    addRoutine({
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId,
      frequency: form.frequency,
      steps: form.steps,
      points: Math.round(dollars * 100) / 100,
    })
    setForm({ title: '', description: '', categoryId: '', frequency: 'daily', steps: [], dollars: '5' })
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Routines</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      {routines.length === 0 && (
        <div className="text-center text-gray-600 py-16">
          <div className="text-4xl mb-2">📋</div>
          <p>No routines yet. Create sequences of steps to run through.</p>
        </div>
      )}

      <div className="space-y-3">
        {routines.map((r) => (
          <RoutineCard key={r.id} routine={r} onComplete={completeRoutine} onReset={resetRoutine} onToggleStep={toggleRoutineStep} onDelete={deleteRoutine} />
        ))}
      </div>

      {showModal && (
        <Modal title="New Routine" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <input
              placeholder="Routine name (e.g. Morning routine)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
            />
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value as Frequency })}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Steps</label>
              <div className="space-y-1 mb-2">
                {form.steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-gray-300 flex-1">{step.title}</span>
                    <button onClick={() => removeStep(step.id)} className="text-gray-600 hover:text-red-400 bg-transparent border-0 cursor-pointer">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  placeholder="Add a step..."
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addStep() }}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={addStep}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 rounded-lg border-0 cursor-pointer"
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-7 pr-3 py-2 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!form.title.trim() || !form.categoryId || form.steps.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              Add Routine
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function RoutineCard({
  routine, onComplete, onReset, onToggleStep, onDelete,
}: {
  routine: Routine
  onComplete: (id: string, date: string) => void
  onReset: (id: string) => void
  onToggleStep: (routineId: string, stepId: string) => void
  onDelete: (id: string) => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === routine.categoryId)
  const completedCount = routine.steps.filter((s) => s.completed).length
  const allDone = completedCount === routine.steps.length
  const progress = routine.steps.length > 0 ? (completedCount / routine.steps.length) * 100 : 0
  const completedToday = routine.completedDates.includes(today())

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-medium text-white text-sm">{routine.title}</div>
            {routine.description && <div className="text-xs text-gray-500 mt-0.5">{routine.description}</div>}
            <div className="flex items-center gap-2 mt-1">
              {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
              <span className="text-xs text-gray-500 capitalize">{routine.frequency}</span>
              <span className="text-xs text-green-400">+${routine.points.toFixed(2)}</span>
              <span className="text-xs text-gray-500">{completedCount}/{routine.steps.length}</span>
            </div>
          </div>
          <button onClick={() => onDelete(routine.id)} className="text-gray-700 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg">×</button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {routine.steps.map((step) => (
            <button
              key={step.id}
              onClick={() => !completedToday && onToggleStep(routine.id, step.id)}
              className={`w-full flex items-center gap-2.5 text-left bg-transparent border-0 cursor-pointer p-1.5 rounded-lg hover:bg-gray-800 transition-colors ${completedToday ? 'cursor-default' : ''}`}
            >
              <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${step.completed ? 'bg-indigo-500 border-indigo-500' : 'border-gray-600'}`}>
                {step.completed && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`text-sm ${step.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {!completedToday && (
        <div className="px-4 pb-4 flex gap-2">
          {allDone ? (
            <button
              onClick={() => onComplete(routine.id, today())}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              Complete Routine ✓
            </button>
          ) : (
            <div className="flex-1 text-center text-xs text-gray-600 py-2">
              Complete all steps to finish
            </div>
          )}
          {completedCount > 0 && (
            <button
              onClick={() => onReset(routine.id)}
              className="text-gray-600 hover:text-gray-400 text-xs bg-transparent border-0 cursor-pointer px-2"
            >
              Reset
            </button>
          )}
        </div>
      )}
      {completedToday && (
        <div className="px-4 pb-4">
          <div className="text-center text-green-400 text-sm bg-green-500/10 rounded-lg py-2">
            ✓ Completed today
          </div>
        </div>
      )}
    </div>
  )
}

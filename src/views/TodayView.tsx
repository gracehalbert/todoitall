import { useState, useEffect } from 'react'
import { useStore, Habit, Routine, Task } from '../store'
import Modal from '../components/Modal'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

type TodayItem =
  | { kind: 'habit'; data: Habit; key: string; isAuto: boolean }
  | { kind: 'routine'; data: Routine; key: string; isAuto: boolean }
  | { kind: 'task'; data: Task; key: string; isAuto: boolean }

export default function TodayView() {
  const {
    habits, routines, tasks, categories,
    completeHabit, uncompleteHabit,
    toggleRoutineStep, completeRoutine, resetRoutine,
    completeTask, uncompleteTask,
    updateRoutine,
    todayAssignments, addToToday, removeFromToday,
    todayOrder, setTodayOrder,
  } = useStore()

  const [showPicker, setShowPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<'tasks' | 'habits' | 'routines'>('tasks')

  const t = todayStr()
  const dow = new Date().getDay()
  const dom = new Date().getDate()
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  const isAutoHabit = (h: Habit) =>
    h.frequency === 'daily' || (h.frequency === 'weekly' && (h.targetDays ?? []).includes(dow))

  const isAutoRoutine = (r: Routine) => {
    if (r.frequency === 'daily') return true
    if (r.frequency === 'weekly' && r.targetDays && r.targetDays.includes(dow)) return true
    if (r.frequency === 'monthly' && r.targetDays && r.targetDays.includes(dom)) return true
    return false
  }

  const isAutoTask = (tk: Task) => !tk.completed && (tk.dueDate === t || tk.dueDate === tomorrow)

  const isCompleted = (item: TodayItem): boolean => {
    if (item.kind === 'habit') return item.data.completedDates.includes(t)
    if (item.kind === 'routine') return item.data.completedDates.includes(t)
    return item.data.completed
  }

  const manualIds = new Set(todayAssignments)

  const allItems: TodayItem[] = [
    ...habits
      .filter((h) => isAutoHabit(h) || manualIds.has(`habit:${h.id}`))
      .map((h) => ({ kind: 'habit' as const, data: h, key: `habit:${h.id}`, isAuto: isAutoHabit(h) })),
    ...routines
      .filter((r) => isAutoRoutine(r) || manualIds.has(`routine:${r.id}`))
      .map((r) => ({ kind: 'routine' as const, data: r, key: `routine:${r.id}`, isAuto: isAutoRoutine(r) })),
    ...tasks
      .filter((tk) => isAutoTask(tk) || manualIds.has(`task:${tk.id}`))
      .map((tk) => ({ kind: 'task' as const, data: tk, key: `task:${tk.id}`, isAuto: isAutoTask(tk) })),
  ]

  const keyToItem = new Map(allItems.map((i) => [i.key, i]))
  const ordered = [
    ...todayOrder.flatMap((k) => (keyToItem.has(k) ? [keyToItem.get(k)!] : [])),
    ...allItems.filter((i) => !todayOrder.includes(i.key)),
  ]

  // Persist when new auto items appear
  const allKeysStr = allItems.map((i) => i.key).join(',')
  useEffect(() => {
    const currentKeys = ordered.map((i) => i.key)
    if (currentKeys.join(',') !== todayOrder.join(',')) {
      setTodayOrder(currentKeys)
    }
  }, [allKeysStr])

  const incomplete = ordered.filter((i) => !isCompleted(i))
  const complete = ordered.filter((i) => isCompleted(i))
  const displayed = [...incomplete, ...complete]

  const done = complete.length
  const total = displayed.length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const handleReorder = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx || toIdx < 0 || toIdx >= incomplete.length) return
    const newIncomplete = [...incomplete]
    const [item] = newIncomplete.splice(fromIdx, 1)
    newIncomplete.splice(toIdx, 0, item)
    setTodayOrder([...newIncomplete, ...complete].map((i) => i.key))
  }

  const pickerHabits = habits.filter((h) => !isAutoHabit(h))
  const pickerRoutines = routines.filter((r) => !isAutoRoutine(r))
  const pickerTasks = tasks.filter((tk) => !tk.completed && !isAutoTask(tk))

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold">Today</h2>
        <p className="text-xs text-gray-500 mt-0.5">{formatDate(t)}</p>
        {total > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500">{done}/{total} complete</span>
              <span className="text-xs font-medium text-violet-600">{pct}%</span>
            </div>
            <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : 'linear-gradient(to right, #7c3aed, #d946ef)' }}
              />
            </div>
          </div>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-2">☀️</div>
          <p className="mb-1 text-gray-600">Nothing planned yet.</p>
          <p className="text-xs">Daily habits & routines appear automatically.<br />Use the button below to pull in other items.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {displayed.map((item) => {
            const completed = isCompleted(item)
            const incompleteIdx = incomplete.indexOf(item)

            const reorderEl = completed ? (
              <div className="w-3 flex-shrink-0" />
            ) : (
              <div className="flex flex-col gap-0.5 flex-shrink-0 self-center">
                <button
                  onClick={() => handleReorder(incompleteIdx, incompleteIdx - 1)}
                  disabled={incompleteIdx === 0}
                  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                >▲</button>
                <button
                  onClick={() => handleReorder(incompleteIdx, incompleteIdx + 1)}
                  disabled={incompleteIdx === incomplete.length - 1}
                  className="text-gray-300 hover:text-gray-500 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                >▼</button>
              </div>
            )

            return (
              <div key={item.key} className={`flex gap-2 ${item.kind === 'routine' ? 'items-start' : 'items-center'}`}>
                {item.kind === 'routine' ? <div className="mt-3">{reorderEl}</div> : reorderEl}
                <div className="flex-1">
                  {item.kind === 'habit' && (
                    <TodayHabitRow
                      habit={item.data}
                      today={t}
                      isManual={!item.isAuto}
                      onComplete={completeHabit}
                      onUncomplete={uncompleteHabit}
                      onRemove={() => removeFromToday('habit', item.data.id)}
                    />
                  )}
                  {item.kind === 'routine' && (
                    <TodayRoutineRow
                      routine={item.data}
                      today={t}
                      isManual={!item.isAuto}
                      onToggleStep={toggleRoutineStep}
                      onComplete={completeRoutine}
                      onReset={resetRoutine}
                      onRemove={() => removeFromToday('routine', item.data.id)}
                      onReorderStep={(routineId, from, to) => {
                        const r = routines.find((x) => x.id === routineId)
                        if (!r) return
                        const steps = [...r.steps]
                        const [s] = steps.splice(from, 1)
                        steps.splice(to, 0, s)
                        updateRoutine(routineId, { steps })
                      }}
                    />
                  )}
                  {item.kind === 'task' && (
                    <TodayTaskRow
                      task={item.data}
                      today={t}
                      tomorrow={tomorrow}
                      isManual={!item.isAuto}
                      onComplete={completeTask}
                      onUncomplete={uncompleteTask}
                      onRemove={() => removeFromToday('task', item.data.id)}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => setShowPicker(true)}
        className="w-full py-2.5 rounded-xl border border-dashed border-violet-300 text-violet-400 hover:text-violet-600 hover:border-violet-500 text-sm transition-colors bg-transparent cursor-pointer"
      >
        + Pull in more items
      </button>

      {showPicker && (
        <Modal title="Add to Today" onClose={() => setShowPicker(false)}>
          <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
            {(['tasks', 'habits', 'routines'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setPickerTab(tab)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors border-0 cursor-pointer capitalize ${
                  pickerTab === tab ? 'bg-white text-violet-700 shadow-sm' : 'bg-transparent text-gray-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {pickerTab === 'tasks' && (
              pickerTasks.length === 0
                ? <p className="text-center text-gray-400 text-sm py-6">No other incomplete tasks</p>
                : pickerTasks.map((task) => {
                    const added = manualIds.has(`task:${task.id}`)
                    const cat = categories.find((c) => c.id === task.categoryId)
                    return (
                      <PickerRow
                        key={task.id}
                        label={task.title}
                        sublabel={cat ? `${cat.icon} ${cat.name}` : undefined}
                        added={added}
                        onToggle={() => added ? removeFromToday('task', task.id) : addToToday('task', task.id)}
                      />
                    )
                  })
            )}
            {pickerTab === 'habits' && (
              pickerHabits.length === 0
                ? <p className="text-center text-gray-400 text-sm py-6">No other habits</p>
                : pickerHabits.map((habit) => {
                    const added = manualIds.has(`habit:${habit.id}`)
                    return (
                      <PickerRow
                        key={habit.id}
                        label={habit.title}
                        sublabel={habit.frequency}
                        color={habit.color}
                        added={added}
                        onToggle={() => added ? removeFromToday('habit', habit.id) : addToToday('habit', habit.id)}
                      />
                    )
                  })
            )}
            {pickerTab === 'routines' && (
              pickerRoutines.length === 0
                ? <p className="text-center text-gray-400 text-sm py-6">No other routines</p>
                : pickerRoutines.map((routine) => {
                    const added = manualIds.has(`routine:${routine.id}`)
                    const cat = categories.find((c) => c.id === routine.categoryId)
                    return (
                      <PickerRow
                        key={routine.id}
                        label={routine.title}
                        sublabel={`${cat ? cat.icon + ' ' + cat.name + ' · ' : ''}${routine.frequency} · ${routine.steps.length} steps`}
                        added={added}
                        onToggle={() => added ? removeFromToday('routine', routine.id) : addToToday('routine', routine.id)}
                      />
                    )
                  })
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function TodayHabitRow({ habit, today, isManual, onComplete, onUncomplete, onRemove }: {
  habit: Habit; today: string; isManual: boolean
  onComplete: (id: string, date: string) => void
  onUncomplete: (id: string, date: string) => void
  onRemove: () => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === habit.categoryId)
  const done = habit.completedDates.includes(today)

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm ${done ? 'opacity-50' : ''}`}>
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: habit.color }} />
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-900'}`}>{habit.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
          <span className="text-xs text-orange-400">🔥 {habit.streak}</span>
        </div>
      </div>
      <button
        onClick={() => done ? onUncomplete(habit.id, today) : onComplete(habit.id, today)}
        className={`text-sm px-3 py-1.5 rounded-lg border-0 cursor-pointer font-medium transition-colors flex-shrink-0 ${
          done ? 'bg-green-500/20 text-green-400' : 'text-white'
        }`}
        style={!done ? { backgroundColor: habit.color } : {}}
      >
        {done ? '✓' : 'Do it'}
      </button>
      {isManual && (
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg leading-none">×</button>
      )}
    </div>
  )
}

function TodayRoutineRow({ routine, today, isManual, onToggleStep, onComplete, onReset, onRemove, onReorderStep }: {
  routine: Routine; today: string; isManual: boolean
  onToggleStep: (routineId: string, stepId: string) => void
  onComplete: (id: string, date: string) => void
  onReset: (id: string) => void
  onRemove: () => void
  onReorderStep: (routineId: string, from: number, to: number) => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === routine.categoryId)
  const completedToday = routine.completedDates.includes(today)
  const completedCount = routine.steps.filter((s) => s.completed).length
  const allDone = completedCount === routine.steps.length
  const progress = routine.steps.length > 0 ? (completedCount / routine.steps.length) * 100 : 0
  const [expanded, setExpanded] = useState(!completedToday)

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden ${completedToday ? 'opacity-50' : ''}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-3 text-left bg-transparent border-0 cursor-pointer"
      >
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${completedToday ? 'line-through text-gray-400' : 'text-gray-900'}`}>{routine.title}</div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
            <span className="text-xs text-gray-400">{completedCount}/{routine.steps.length} steps</span>
            {completedToday && <span className="text-xs text-green-500">✓ done</span>}
          </div>
        </div>
        <span className="text-gray-400 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
        {isManual && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg leading-none flex-shrink-0"
          >×</button>
        )}
      </button>
      <div className="h-1 bg-violet-100">
        <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-2">
          <div className="space-y-1.5 mb-2">
            {routine.steps.map((step, stepIndex) => (
              <div key={step.id} className="flex items-center gap-1">
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => onReorderStep(routine.id, stepIndex, stepIndex - 1)}
                    disabled={stepIndex === 0}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                  >▲</button>
                  <button
                    onClick={() => onReorderStep(routine.id, stepIndex, stepIndex + 1)}
                    disabled={stepIndex === routine.steps.length - 1}
                    className="text-gray-300 hover:text-gray-500 disabled:opacity-20 bg-transparent border-0 cursor-pointer leading-none text-xs p-0"
                  >▼</button>
                </div>
                <button
                  onClick={() => !completedToday && onToggleStep(routine.id, step.id)}
                  className={`flex-1 flex items-center gap-2.5 text-left bg-transparent border-0 p-1.5 rounded-lg hover:bg-violet-50 transition-colors ${completedToday ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${step.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
                    {step.completed && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-sm ${step.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{step.title}</span>
                </button>
              </div>
            ))}
          </div>
          {!completedToday && allDone && (
            <button
              onClick={() => onComplete(routine.id, today)}
              className="w-full bg-green-500 hover:bg-green-400 text-white text-sm font-medium py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
            >
              Complete Routine ✓
            </button>
          )}
          {!completedToday && completedCount > 0 && !allDone && (
            <button onClick={() => onReset(routine.id)} className="text-gray-400 hover:text-gray-600 text-xs bg-transparent border-0 cursor-pointer">
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TodayTaskRow({ task, today, tomorrow, isManual, onComplete, onUncomplete, onRemove }: {
  task: Task; today: string; tomorrow: string; isManual: boolean
  onComplete: (id: string) => void
  onUncomplete: (id: string) => void
  onRemove: () => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === task.categoryId)
  const PRIORITY_DOT: Record<string, string> = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm ${task.completed ? 'opacity-50' : ''}`}>
      <button
        onClick={() => task.completed ? onUncomplete(task.id) : onComplete(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 cursor-pointer transition-colors ${
          task.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300 bg-transparent hover:border-violet-400'
        }`}
        style={{ minWidth: '1.25rem' }}
      >
        {task.completed && <span className="text-white text-xs flex items-center justify-center w-full h-full">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>{task.title}</span>
          <span className={`text-xs ${PRIORITY_DOT[task.priority]}`}>●</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
          {task.dueDate === today && <span className="text-xs text-rose-500">Due today</span>}
          {task.dueDate === tomorrow && <span className="text-xs text-gray-400">Due tomorrow</span>}
          <span className="text-xs text-green-400">+${task.points.toFixed(2)}</span>
        </div>
      </div>
      {isManual && (
        <button onClick={onRemove} className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg leading-none">×</button>
      )}
    </div>
  )
}

function PickerRow({ label, sublabel, color, added, onToggle }: {
  label: string; sublabel?: string; color?: string; added: boolean; onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left cursor-pointer transition-colors bg-transparent ${
        added ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {color && <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-900 font-medium">{label}</div>
        {sublabel && <div className="text-xs text-gray-500 mt-0.5 capitalize">{sublabel}</div>}
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
        added ? 'bg-violet-500 border-violet-500' : 'border-gray-300'
      }`}>
        {added && <span className="text-white text-xs">✓</span>}
      </div>
    </button>
  )
}

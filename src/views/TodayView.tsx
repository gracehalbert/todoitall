import { useState, useEffect } from 'react'
import { useStore, Habit, Routine, Task } from '../store'
import { localDateStr } from '../lib/date'
import Modal from '../components/Modal'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function todayStr() {
  return localDateStr()
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
    dailyBonusClaimed, claimDailyBonus,
  } = useStore()

  const [showPicker, setShowPicker] = useState(false)
  const [pickerTab, setPickerTab] = useState<'tasks' | 'habits' | 'routines'>('tasks')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const t = todayStr()
  const dow = new Date().getDay()
  const dom = new Date().getDate()
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = localDateStr(tomorrowDate)

  const isAutoHabit = (h: Habit) =>
    h.frequency === 'daily' || (h.frequency === 'weekly' && (h.targetDays ?? []).includes(dow))

  const isAutoRoutine = (r: Routine) => {
    if (r.frequency === 'daily') return true
    if (r.frequency === 'weekly' && r.targetDays && r.targetDays.includes(dow)) return true
    if (r.frequency === 'monthly' && r.targetDays && r.targetDays.includes(dom)) return true
    return false
  }

  const isAutoTask = (tk: Task) => !tk.completed && !!tk.dueDate && tk.dueDate <= tomorrow

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = incomplete.findIndex((i) => i.key === active.id)
    const toIndex = incomplete.findIndex((i) => i.key === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    const newIncomplete = [...incomplete]
    const [item] = newIncomplete.splice(fromIndex, 1)
    newIncomplete.splice(toIndex, 0, item)
    setTodayOrder([...newIncomplete, ...complete].map((i) => i.key))
  }

  const handleStepDragEnd = (routineId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const r = routines.find((x) => x.id === routineId)
    if (!r) return
    const fromIndex = r.steps.findIndex((s) => s.id === active.id)
    const toIndex = r.steps.findIndex((s) => s.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    const steps = [...r.steps]
    const [step] = steps.splice(fromIndex, 1)
    steps.splice(toIndex, 0, step)
    updateRoutine(routineId, { steps })
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
            {pct === 100 && (
              <div className={`mt-3 rounded-xl p-3 flex items-center gap-3 ${dailyBonusClaimed ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <span className="text-2xl">{dailyBonusClaimed ? '🏆' : '🎉'}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">
                    {dailyBonusClaimed ? 'Day complete!' : 'Everything done!'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dailyBonusClaimed ? 'Bonus claimed · +$5.00' : 'Claim your daily completion bonus'}
                  </div>
                </div>
                {!dailyBonusClaimed && (
                  <button
                    onClick={() => claimDailyBonus(5)}
                    className="bg-amber-400 hover:bg-amber-300 text-white text-xs font-bold px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors flex-shrink-0"
                  >
                    +$5.00
                  </button>
                )}
              </div>
            )}
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
        <div className="mb-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={incomplete.map((i) => i.key)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {incomplete.map((item) => (
                  <SortableTodayItem
                    key={item.key}
                    item={item}
                    today={t}
                    tomorrow={tomorrow}
                    onStepDragEnd={(event) => handleStepDragEnd((item.data as Routine).id, event)}
                    completeHabit={completeHabit}
                    uncompleteHabit={uncompleteHabit}
                    toggleRoutineStep={toggleRoutineStep}
                    completeRoutine={completeRoutine}
                    resetRoutine={resetRoutine}
                    completeTask={completeTask}
                    uncompleteTask={uncompleteTask}
                    removeFromToday={removeFromToday}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {complete.length > 0 && (
            <div className="space-y-2 mt-2">
              {complete.map((item) => (
                <TodayItemRow
                  key={item.key}
                  item={item}
                  today={t}
                  tomorrow={tomorrow}
                  draggable={false}
                  onStepDragEnd={() => {}}
                  completeHabit={completeHabit}
                  uncompleteHabit={uncompleteHabit}
                  toggleRoutineStep={toggleRoutineStep}
                  completeRoutine={completeRoutine}
                  resetRoutine={resetRoutine}
                  completeTask={completeTask}
                  uncompleteTask={uncompleteTask}
                  removeFromToday={removeFromToday}
                />
              ))}
            </div>
          )}
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

type RowProps = {
  item: TodayItem
  today: string
  tomorrow: string
  draggable: boolean
  onStepDragEnd: (event: DragEndEvent) => void
  completeHabit: (id: string, date: string) => void
  uncompleteHabit: (id: string, date: string) => void
  toggleRoutineStep: (routineId: string, stepId: string) => void
  completeRoutine: (id: string, date: string) => void
  resetRoutine: (id: string) => void
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
  removeFromToday: (type: 'task' | 'habit' | 'routine', id: string) => void
}

function SortableTodayItem(props: Omit<RowProps, 'draggable'>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.key })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style}>
      <TodayItemRow {...props} draggable dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  )
}

function TodayItemRow(props: RowProps & { dragHandleProps?: Record<string, unknown> }) {
  const { item, today, tomorrow, draggable, dragHandleProps, onStepDragEnd,
    completeHabit, uncompleteHabit, toggleRoutineStep, completeRoutine, resetRoutine,
    completeTask, uncompleteTask, removeFromToday } = props

  const dragHandle = draggable ? (
    <button
      {...dragHandleProps}
      className="flex-shrink-0 text-gray-300 hover:text-gray-500 bg-transparent border-0 cursor-grab active:cursor-grabbing touch-none self-center"
      style={{ fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
    >
      ⠿
    </button>
  ) : <div className="w-4 flex-shrink-0" />

  if (item.kind === 'habit') {
    return (
      <div className="flex items-center gap-2">
        {dragHandle}
        <div className="flex-1">
          <TodayHabitRow
            habit={item.data}
            today={today}
            isManual={!item.isAuto}
            onComplete={completeHabit}
            onUncomplete={uncompleteHabit}
            onRemove={() => removeFromToday('habit', item.data.id)}
          />
        </div>
      </div>
    )
  }

  if (item.kind === 'routine') {
    return (
      <div className="flex items-start gap-2">
        <div className="mt-3">{dragHandle}</div>
        <div className="flex-1">
          <TodayRoutineRow
            routine={item.data}
            today={today}
            isManual={!item.isAuto}
            onToggleStep={toggleRoutineStep}
            onComplete={completeRoutine}
            onReset={resetRoutine}
            onRemove={() => removeFromToday('routine', item.data.id)}
            onStepDragEnd={onStepDragEnd}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {dragHandle}
      <div className="flex-1">
        <TodayTaskRow
          task={item.data}
          today={today}
          tomorrow={tomorrow}
          isManual={!item.isAuto}
          onComplete={completeTask}
          onUncomplete={uncompleteTask}
          onRemove={() => removeFromToday('task', item.data.id)}
        />
      </div>
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
          <span className="text-xs text-green-400">+${habit.points.toFixed(2)}</span>
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

function SortableRoutineStep({ step, completedToday, onToggle }: {
  step: { id: string; title: string; completed: boolean }
  completedToday: boolean
  onToggle: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-1">
      <button
        {...attributes} {...listeners}
        className="flex-shrink-0 text-gray-300 hover:text-gray-500 bg-transparent border-0 cursor-grab active:cursor-grabbing touch-none"
        style={{ fontSize: '1rem', lineHeight: 1, padding: '0 2px' }}
      >
        ⠿
      </button>
      <button
        onClick={() => !completedToday && onToggle()}
        className={`flex-1 flex items-center gap-2.5 text-left bg-transparent border-0 p-1.5 rounded-lg hover:bg-violet-50 transition-colors ${completedToday ? 'cursor-default' : 'cursor-pointer'}`}
      >
        <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${step.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
          {step.completed && <span className="text-white text-xs">✓</span>}
        </div>
        <span className={`text-sm ${step.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{step.title}</span>
      </button>
    </div>
  )
}

function TodayRoutineRow({ routine, today, isManual, onToggleStep, onComplete, onReset, onRemove, onStepDragEnd }: {
  routine: Routine; today: string; isManual: boolean
  onToggleStep: (routineId: string, stepId: string) => void
  onComplete: (id: string, date: string) => void
  onReset: (id: string) => void
  onRemove: () => void
  onStepDragEnd: (event: DragEndEvent) => void
}) {
  const { categories } = useStore()
  const cat = categories.find((c) => c.id === routine.categoryId)
  const completedToday = routine.completedDates.includes(today)
  const completedCount = routine.steps.filter((s) => s.completed).length
  const allDone = completedCount === routine.steps.length
  const progress = routine.steps.length > 0 ? (completedCount / routine.steps.length) * 100 : 0
  const [expanded, setExpanded] = useState(!completedToday)

  const stepSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
          <DndContext sensors={stepSensors} collisionDetection={closestCenter} onDragEnd={onStepDragEnd}>
            <SortableContext items={routine.steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 mb-2">
                {routine.steps.map((step) => (
                  <SortableRoutineStep
                    key={step.id}
                    step={step}
                    completedToday={completedToday}
                    onToggle={() => onToggleStep(routine.id, step.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
          {task.dueDate && task.dueDate < today && <span className="text-xs text-red-600 font-medium">Overdue</span>}
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

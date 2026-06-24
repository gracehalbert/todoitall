import { useStore } from '../store'
import { localDateStr } from '../lib/date'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getWeekDates(): Date[] {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dow + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function WeekView() {
  const { tasks, habits, routines, categories } = useStore()
  const weekDates = getWeekDates()
  const todayStr = localDateStr()
  const currentMonth = new Date().getMonth() + 1 // 1-12

  const monthlyRoutines = routines.filter(
    (r) =>
      (r.frequency === 'quarterly' || r.frequency === 'semi-annual' || r.frequency === 'annual') &&
      r.targetDays &&
      r.targetDays.includes(currentMonth)
  )

  const FREQ_LABEL: Record<string, string> = {
    quarterly: 'Quarterly',
    'semi-annual': 'Semi-Annual',
    annual: 'Annual',
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">This Week</h2>
      <p className="text-xs text-gray-500 mb-4">
        {MONTH_LABELS[weekDates[0].getMonth()]} {weekDates[0].getDate()} – {MONTH_LABELS[weekDates[6].getMonth()]} {weekDates[6].getDate()}
      </p>

      {monthlyRoutines.length > 0 && (
        <div className="mb-4 rounded-xl border border-violet-200 bg-white overflow-hidden shadow-sm">
          <div className="bg-violet-50 px-4 py-2.5 flex items-center justify-between border-b border-violet-100">
            <span className="text-sm font-semibold text-violet-700">This Month</span>
            <span className="text-xs text-violet-400">{MONTH_LABELS[currentMonth - 1]}</span>
          </div>
          <div className="divide-y divide-gray-50">
            {monthlyRoutines.map((r) => {
              const cat = categories.find((c) => c.id === r.categoryId)
              const completedThisMonth = r.completedDates.some((d) => {
                const [y, m] = d.split('-').map(Number)
                return y === new Date().getFullYear() && m === currentMonth
              })
              const completedCount = r.steps.filter((s) => s.completed).length
              const progress = r.steps.length > 0 ? (completedCount / r.steps.length) * 100 : 0
              return (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      completedThisMonth ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {completedThisMonth && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${completedThisMonth ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {r.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {cat && <span className="text-xs" style={{ color: cat.color }}>{cat.icon} {cat.name}</span>}
                        <span className="text-xs text-gray-400">{FREQ_LABEL[r.frequency]}</span>
                        <span className="text-xs text-green-400">+${r.points.toFixed(2)}</span>
                      </div>
                    </div>
                    {!completedThisMonth && (
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-gray-400">{completedCount}/{r.steps.length} steps</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {weekDates.map((date) => {
          const dateStr = localDateStr(date)
          const dow = date.getDay()
          const dom = date.getDate()
          const isToday = dateStr === todayStr
          const isPast = dateStr < todayStr

          const dayTasks = tasks.filter((t) => !t.completed && t.dueDate === dateStr)
          const completedTasks = tasks.filter((t) => t.completed && t.dueDate === dateStr)

          const autoHabits = habits.filter((h) =>
            h.frequency === 'daily' ||
            (h.frequency === 'weekly' && (h.targetDays ?? []).includes(dow))
          )
          const autoRoutines = routines.filter((r) =>
            r.frequency === 'daily' ||
            (r.frequency === 'weekly' && r.targetDays && r.targetDays.includes(dow)) ||
            (r.frequency === 'monthly' && r.targetDays && r.targetDays.includes(dom))
          )

          const habitsDoneToday = autoHabits.filter((h) => h.completedDates.includes(dateStr))
          const routinesDoneToday = autoRoutines.filter((r) => r.completedDates.includes(dateStr))

          const totalItems = dayTasks.length + completedTasks.length + autoHabits.length + autoRoutines.length
          const doneItems = completedTasks.length + habitsDoneToday.length + routinesDoneToday.length

          return (
            <div
              key={dateStr}
              className={`rounded-xl border overflow-hidden ${
                isToday
                  ? 'border-violet-400 shadow-md'
                  : isPast
                  ? 'border-gray-100 opacity-70'
                  : 'border-gray-100 shadow-sm'
              }`}
            >
              {/* Day header */}
              <div className={`flex items-center justify-between px-4 py-2.5 ${
                isToday ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500' : 'bg-white'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${isToday ? 'text-white' : 'text-gray-700'}`}>
                    {DAY_LABELS[dow]}
                  </span>
                  <span className={`text-xs ${isToday ? 'text-white/80' : 'text-gray-400'}`}>
                    {MONTH_LABELS[date.getMonth()]} {dom}
                  </span>
                  {isToday && <span className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full">Today</span>}
                </div>
                {totalItems > 0 && (
                  <span className={`text-xs font-medium ${isToday ? 'text-white/90' : doneItems === totalItems ? 'text-green-500' : 'text-gray-400'}`}>
                    {doneItems}/{totalItems}
                  </span>
                )}
              </div>

              {/* Progress bar */}
              {totalItems > 0 && (
                <div className="h-0.5 bg-gray-100">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.round((doneItems / totalItems) * 100)}%`,
                      background: doneItems === totalItems ? '#10b981' : 'linear-gradient(to right, #7c3aed, #d946ef)',
                    }}
                  />
                </div>
              )}

              <div className="bg-white px-4 py-2 space-y-1.5">
                {totalItems === 0 && (
                  <p className="text-xs text-gray-300 py-1">Nothing scheduled</p>
                )}

                {/* Due tasks */}
                {[...dayTasks, ...completedTasks].map((task) => {
                  const cat = categories.find((c) => c.id === task.categoryId)
                  const PRIORITY_COLOR: Record<string, string> = { high: 'text-red-400', medium: 'text-yellow-400', low: 'text-green-400' }
                  return (
                    <div key={task.id} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                        task.completed ? 'bg-violet-500 border-violet-500' : 'border-gray-300'
                      }`}>
                        {task.completed && <span className="text-white text-xs leading-none">✓</span>}
                      </div>
                      <span className={`text-xs flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>{task.title}</span>
                      <span className={`text-xs ${PRIORITY_COLOR[task.priority]}`}>●</span>
                      {cat && <span className="text-xs text-gray-400">{cat.icon}</span>}
                    </div>
                  )
                })}

                {/* Auto habits summary */}
                {autoHabits.length > 0 && (
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex -space-x-1">
                      {autoHabits.slice(0, 5).map((h) => (
                        <div
                          key={h.id}
                          className="w-3 h-3 rounded-full border border-white"
                          style={{ backgroundColor: h.color }}
                        />
                      ))}
                      {autoHabits.length > 5 && (
                        <div className="w-3 h-3 rounded-full bg-gray-200 border border-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {habitsDoneToday.length}/{autoHabits.length} habits
                    </span>
                  </div>
                )}

                {/* Auto routines summary */}
                {autoRoutines.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs">📋</span>
                    <span className="text-xs text-gray-400">
                      {routinesDoneToday.length}/{autoRoutines.length} routines
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

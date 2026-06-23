import { useStore } from '../store'

function getWeekDates() {
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

function getLastNDates(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (n - 1 - i))
    return d.toISOString().slice(0, 10)
  })
}

function getMonthDates() {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const last = today.toISOString().slice(0, 10)
  const dates = []
  const cur = new Date(first)
  while (cur.toISOString().slice(0, 10) <= last) {
    dates.push(cur.toISOString().slice(0, 10))
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export default function StatsView() {
  const { tasks, habits, routines, categories } = useStore()

  const weekDates = getWeekDates()
  const monthDates = getMonthDates()
  const last30 = getLastNDates(30)

  // ── Weekly counts ──────────────────────────────────────────────────────────
  const tasksThisWeek = tasks.filter((t) => t.completedAt && weekDates.includes(t.completedAt.slice(0, 10))).length
  const habitsThisWeek = habits.reduce(
    (sum, h) => sum + h.completedDates.filter((d) => weekDates.includes(d)).length, 0
  )
  const routinesThisWeek = routines.reduce(
    (sum, r) => sum + r.completedDates.filter((d) => weekDates.includes(d)).length, 0
  )

  // ── Monthly counts ─────────────────────────────────────────────────────────
  const tasksThisMonth = tasks.filter((t) => t.completedAt && monthDates.includes(t.completedAt.slice(0, 10))).length
  const habitsThisMonth = habits.reduce(
    (sum, h) => sum + h.completedDates.filter((d) => monthDates.includes(d)).length, 0
  )
  const routinesThisMonth = routines.reduce(
    (sum, r) => sum + r.completedDates.filter((d) => monthDates.includes(d)).length, 0
  )

  // ── 30-day heatmap ─────────────────────────────────────────────────────────
  const activityByDate: Record<string, number> = {}
  for (const date of last30) activityByDate[date] = 0
  tasks.forEach((t) => {
    if (t.completedAt) {
      const d = t.completedAt.slice(0, 10)
      if (d in activityByDate) activityByDate[d]++
    }
  })
  habits.forEach((h) => {
    h.completedDates.forEach((d) => { if (d in activityByDate) activityByDate[d]++ })
  })
  routines.forEach((r) => {
    r.completedDates.forEach((d) => { if (d in activityByDate) activityByDate[d]++ })
  })
  const maxActivity = Math.max(...Object.values(activityByDate), 1)

  // ── Category breakdown ─────────────────────────────────────────────────────
  const completedTasks = tasks.filter((t) => t.completed)
  const catCounts: Record<string, number> = {}
  const catPoints: Record<string, number> = {}
  completedTasks.forEach((t) => {
    catCounts[t.categoryId] = (catCounts[t.categoryId] ?? 0) + 1
    catPoints[t.categoryId] = (catPoints[t.categoryId] ?? 0) + t.points
  })
  const sortedCats = categories
    .filter((c) => catCounts[c.id])
    .sort((a, b) => (catCounts[b.id] ?? 0) - (catCounts[a.id] ?? 0))
  const maxCatCount = Math.max(...sortedCats.map((c) => catCounts[c.id] ?? 0), 1)

  // ── Habit streaks ──────────────────────────────────────────────────────────
  const sortedHabits = [...habits].filter((h) => h.longestStreak > 0 || h.streak > 0).sort((a, b) => b.streak - a.streak)

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Stats</h2>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">This Week</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Tasks" value={tasksThisWeek} color="text-violet-600" bg="bg-violet-50" />
          <StatCard label="Habits" value={habitsThisWeek} color="text-fuchsia-600" bg="bg-fuchsia-50" />
          <StatCard label="Routines" value={routinesThisWeek} color="text-sky-600" bg="bg-sky-50" />
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">This Month</p>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Tasks" value={tasksThisMonth} color="text-violet-600" bg="bg-violet-50" />
          <StatCard label="Habits" value={habitsThisMonth} color="text-fuchsia-600" bg="bg-fuchsia-50" />
          <StatCard label="Routines" value={routinesThisMonth} color="text-sky-600" bg="bg-sky-50" />
        </div>
      </section>

      {/* ── 30-Day Heatmap ─────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Last 30 Days</p>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-1 flex-wrap">
            {last30.map((date) => {
              const count = activityByDate[date] ?? 0
              const intensity = count === 0 ? 0 : Math.ceil((count / maxActivity) * 4)
              return (
                <div
                  key={date}
                  title={`${date}: ${count} completion${count !== 1 ? 's' : ''}`}
                  className={`w-6 h-6 rounded-sm ${heatColor(intensity)}`}
                />
              )
            })}
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`w-4 h-4 rounded-sm ${heatColor(i)}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </section>

      {/* ── Habit Streaks ──────────────────────────────────────────────────── */}
      {sortedHabits.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Habit Streaks</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {sortedHabits.map((h, i) => (
              <div
                key={h.id}
                className={`flex items-center gap-3 px-4 py-3 ${i < sortedHabits.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                <span className="flex-1 text-sm text-gray-700 truncate">{h.title}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">best <span className="font-semibold text-gray-600">{h.longestStreak}</span></span>
                  <span className={`font-bold ${h.streak > 0 ? 'text-fuchsia-600' : 'text-gray-300'}`}>
                    {h.streak > 0 ? `🔥 ${h.streak}` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Breakdown ─────────────────────────────────────────────── */}
      {sortedCats.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Completed Tasks by Category</p>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {sortedCats.map((cat, i) => (
              <div
                key={cat.id}
                className={`px-4 py-3 ${i < sortedCats.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700 flex items-center gap-1.5">
                    <span>{cat.icon}</span> {cat.name}
                  </span>
                  <span className="text-xs text-gray-400">{catCounts[cat.id]} tasks</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${((catCounts[cat.id] ?? 0) / maxCatCount) * 100}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {completedTasks.length === 0 && habits.every((h) => h.completedDates.length === 0) && routines.every((r) => r.completedDates.length === 0) && (
        <div className="text-center text-gray-400 text-sm py-10">
          Complete some tasks, habits, or routines to see your stats.
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-3 text-center`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function heatColor(intensity: number) {
  switch (intensity) {
    case 0: return 'bg-gray-100'
    case 1: return 'bg-violet-200'
    case 2: return 'bg-violet-400'
    case 3: return 'bg-fuchsia-500'
    case 4: return 'bg-fuchsia-600'
    default: return 'bg-gray-100'
  }
}

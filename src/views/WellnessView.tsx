import { useState } from 'react'
import { useStore } from '../store'

const MOODS = [
  { value: 5, emoji: '😄', label: 'Great' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 1, emoji: '😢', label: 'Sad' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function WellnessView() {
  const { badHabits, badHabitLog, moodLog, addBadHabit, deleteBadHabit, toggleBadHabit, setMood } = useStore()
  const [newHabitName, setNewHabitName] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const todayStr = today()

  const todayMood = moodLog[todayStr]

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })

  function handleAddHabit() {
    const name = newHabitName.trim()
    if (!name) return
    addBadHabit(name)
    setNewHabitName('')
    setShowAdd(false)
  }

  return (
    <div className="space-y-6">
      {/* Mood */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">How are you feeling today?</h2>
        <div className="flex gap-2 justify-between">
          {MOODS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMood(todayStr, todayMood === m.value ? 0 : m.value)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                todayMood === m.value
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-100 bg-white hover:border-violet-200'
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs text-gray-500">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Mood history */}
      {Object.keys(moodLog).length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Mood — last 2 weeks</h2>
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-end gap-1 h-16">
              {last14.map((date) => {
                const val = moodLog[date] ?? 0
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm transition-all"
                      style={{
                        height: val ? `${(val / 5) * 48}px` : '4px',
                        backgroundColor: val ? `hsl(${((val - 1) / 4) * 120}, 70%, 55%)` : '#e5e7eb',
                      }}
                    />
                  </div>
                )
              })}
            </div>
            <div className="flex mt-1">
              {last14.map((date, i) => (
                <div key={date} className="flex-1 text-center">
                  {(i === 0 || i === 6 || i === 13) && (
                    <span className="text-[9px] text-gray-400">{formatDate(date)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bad habits */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Bad Habits</h2>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="text-sm text-violet-600 font-medium hover:text-violet-700 bg-transparent border-0 cursor-pointer"
          >
            + Add
          </button>
        </div>

        {showAdd && (
          <div className="flex gap-2 mb-3">
            <input
              autoFocus
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              placeholder="e.g. Smoked, Skipped workout…"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400"
            />
            <button
              onClick={handleAddHabit}
              className="bg-violet-600 text-white text-sm px-3 py-2 rounded-lg hover:bg-violet-700 border-0 cursor-pointer"
            >
              Save
            </button>
          </div>
        )}

        {badHabits.length === 0 && !showAdd ? (
          <p className="text-sm text-gray-400 text-center py-6">
            Track habits you want to avoid — tap + Add to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {badHabits.map((habit) => {
              const logKey = `${habit.id}_${todayStr}`
              const didIt = badHabitLog[logKey] ?? false
              return (
                <div
                  key={habit.id}
                  className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleBadHabit(habit.id, todayStr)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                        didIt
                          ? 'border-red-400 bg-red-50 text-red-500'
                          : 'border-green-400 bg-green-50 text-green-500'
                      }`}
                    >
                      {didIt ? '✗' : '✓'}
                    </button>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{habit.name}</p>
                      <p className="text-xs text-gray-400">
                        {didIt ? 'Happened today' : 'Free today'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBadHabit(habit.id)}
                    className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Bad habit history */}
      {badHabits.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Bad Habit History — last 2 weeks</h2>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="grid text-xs text-gray-400 px-4 py-2 border-b border-gray-50" style={{ gridTemplateColumns: '1fr repeat(14, 1fr)' }}>
              <span></span>
              {last14.map((date, i) => (
                <span key={date} className="text-center">
                  {i % 7 === 0 ? formatDate(date) : ''}
                </span>
              ))}
            </div>
            {badHabits.map((habit) => (
              <div
                key={habit.id}
                className="grid items-center px-4 py-2 border-b border-gray-50 last:border-0"
                style={{ gridTemplateColumns: '1fr repeat(14, 1fr)' }}
              >
                <span className="text-xs text-gray-600 truncate pr-2">{habit.name}</span>
                {last14.map((date) => {
                  const key = `${habit.id}_${date}`
                  const didIt = badHabitLog[key] ?? false
                  return (
                    <div key={date} className="flex justify-center">
                      <div
                        className={`w-4 h-4 rounded-sm ${didIt ? 'bg-red-300' : 'bg-green-100'}`}
                        title={`${habit.name} — ${date}: ${didIt ? 'happened' : 'free'}`}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

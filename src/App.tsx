import { useState, useEffect } from 'react'
import TodayView from './views/TodayView'
import TasksView from './views/TasksView'
import HabitsView from './views/HabitsView'
import RoutinesView from './views/RoutinesView'
import RewardsView from './views/RewardsView'
import SettingsView from './views/SettingsView'
import StatsView from './views/StatsView'
import WellnessView from './views/WellnessView'
import { useStore } from './store'

type Tab = 'today' | 'tasks' | 'habits' | 'routines' | 'rewards' | 'stats' | 'wellness' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'habits', label: 'Habits', icon: '🔄' },
  { id: 'routines', label: 'Routines', icon: '📋' },
  { id: 'rewards', label: 'Rewards', icon: '🏆' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'wellness', label: 'Wellness', icon: '🌿' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const { totalPoints, loaded, loadFromDB } = useStore()

  useEffect(() => { loadFromDB() }, [])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-violet-50 text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-sky-50 text-gray-900">
      <header className="bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-md" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 pb-3">
          <h1 className="text-lg font-bold text-white">TodoItAll</h1>
          <div className="flex items-center gap-1 bg-white/20 border border-white/30 rounded-full px-3 py-1">
            <span className="text-white text-sm font-bold">$</span>
            <span className="text-white font-bold text-sm">{totalPoints.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-4">
        {tab === 'today' && <TodayView />}
        {tab === 'tasks' && <TasksView />}
        {tab === 'habits' && <HabitsView />}
        {tab === 'routines' && <RoutinesView />}
        {tab === 'rewards' && <RewardsView />}
        {tab === 'stats' && <StatsView />}
        {tab === 'wellness' && <WellnessView />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <nav className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors border-0 bg-transparent cursor-pointer ${
                tab === t.id ? 'text-violet-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-base leading-none">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

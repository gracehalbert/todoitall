import { useState, useEffect } from 'react'
import TasksView from './views/TasksView'
import HabitsView from './views/HabitsView'
import RoutinesView from './views/RoutinesView'
import RewardsView from './views/RewardsView'
import SettingsView from './views/SettingsView'
import { useStore } from './store'

type Tab = 'tasks' | 'habits' | 'routines' | 'rewards' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'habits', label: 'Habits', icon: '🔄' },
  { id: 'routines', label: 'Routines', icon: '📋' },
  { id: 'rewards', label: 'Rewards', icon: '🏆' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('tasks')
  const { totalPoints, loaded, loadFromDB } = useStore()

  useEffect(() => { loadFromDB() }, [])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-gray-400">
        Loading…
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">TodoItAll</h1>
          <div className="flex items-center gap-1 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
            <span className="text-green-400 text-sm font-bold">$</span>
            <span className="text-green-300 font-bold text-sm">{totalPoints.toFixed(2)}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-4">
        {tab === 'tasks' && <TasksView />}
        {tab === 'habits' && <HabitsView />}
        {tab === 'routines' && <RoutinesView />}
        {tab === 'rewards' && <RewardsView />}
        {tab === 'settings' && <SettingsView />}
      </main>

      <nav className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors border-0 bg-transparent cursor-pointer ${
                tab === t.id ? 'text-indigo-400' : 'text-gray-500 hover:text-gray-300'
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

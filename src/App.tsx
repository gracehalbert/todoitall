import { useState, useEffect } from 'react'
import TodayView from './views/TodayView'
import WeekView from './views/WeekView'
import TasksView from './views/TasksView'
import HabitsView from './views/HabitsView'
import RoutinesView from './views/RoutinesView'
import RewardsView from './views/RewardsView'
import SettingsView from './views/SettingsView'
import StatsView from './views/StatsView'
import WellnessView from './views/WellnessView'
import { useStore } from './store'

type MainTab = 'today' | 'week' | 'wellness' | 'config'
type ConfigTab = 'tasks' | 'habits' | 'routines' | 'rewards' | 'stats' | 'settings'

const MAIN_TABS: { id: MainTab; label: string; icon: string }[] = [
  { id: 'today', label: 'Today', icon: '☀️' },
  { id: 'week', label: 'Week', icon: '📅' },
  { id: 'wellness', label: 'Wellness', icon: '🌿' },
  { id: 'config', label: 'Config', icon: '⚙️' },
]

const CONFIG_TABS: { id: ConfigTab; label: string; icon: string }[] = [
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'habits', label: 'Habits', icon: '🔄' },
  { id: 'routines', label: 'Routines', icon: '📋' },
  { id: 'rewards', label: 'Rewards', icon: '🏆' },
  { id: 'stats', label: 'Stats', icon: '📊' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>('today')
  const [configTab, setConfigTab] = useState<ConfigTab>('tasks')
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

      {mainTab === 'config' && (
        <div className="bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 flex gap-1 py-2 overflow-x-auto" style={{ paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' }}>
            {CONFIG_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setConfigTab(t.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-0 cursor-pointer transition-colors whitespace-nowrap ${
                  configTab === t.id
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 py-4">
        {mainTab === 'today' && <TodayView />}
        {mainTab === 'week' && <WeekView />}
        {mainTab === 'wellness' && <WellnessView />}
        {mainTab === 'config' && configTab === 'tasks' && <TasksView />}
        {mainTab === 'config' && configTab === 'habits' && <HabitsView />}
        {mainTab === 'config' && configTab === 'routines' && <RoutinesView />}
        {mainTab === 'config' && configTab === 'rewards' && <RewardsView />}
        {mainTab === 'config' && configTab === 'stats' && <StatsView />}
        {mainTab === 'config' && configTab === 'settings' && <SettingsView />}
      </main>

      <nav className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg" style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="max-w-2xl mx-auto flex">
          {MAIN_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setMainTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors border-0 bg-transparent cursor-pointer ${
                mainTab === t.id ? 'text-violet-600 font-semibold' : 'text-gray-400 hover:text-gray-600'
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

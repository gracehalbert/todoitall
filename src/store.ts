import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import { supabase } from './lib/supabase'

export type Priority = 'low' | 'medium' | 'high'
export type Frequency = 'daily' | 'weekly' | 'monthly'

export interface Category {
  id: string
  name: string
  color: string
  icon: string
}

export interface Task {
  id: string
  title: string
  description?: string
  categoryId: string
  priority: Priority
  dueDate?: string
  timeEstimate?: number
  completed: boolean
  completedAt?: string
  createdAt: string
  points: number
}

export interface Habit {
  id: string
  title: string
  description?: string
  categoryId: string
  frequency: Frequency
  targetDays?: number[]
  streak: number
  longestStreak: number
  completedDates: string[]
  createdAt: string
  points: number
  color: string
}

export interface RoutineStep {
  id: string
  title: string
  completed: boolean
}

export interface Routine {
  id: string
  title: string
  description?: string
  categoryId: string
  steps: RoutineStep[]
  frequency: Frequency
  targetDays?: number[]
  lastCompletedDate?: string
  completedDates: string[]
  createdAt: string
  points: number
}

export interface CustomReward {
  id: string
  title: string
  description?: string
  cost: number
  emoji: string
  redeemedCount: number
}

export interface AppState {
  categories: Category[]
  tasks: Task[]
  habits: Habit[]
  routines: Routine[]
  customRewards: CustomReward[]
  totalPoints: number
  loaded: boolean
  todayAssignments: string[] // format: 'task:id' | 'habit:id' | 'routine:id'
  todayOrder: string[]

  loadFromDB: () => Promise<void>
  addToToday: (type: 'task' | 'habit' | 'routine', id: string) => void
  removeFromToday: (type: 'task' | 'habit' | 'routine', id: string) => void
  setTodayOrder: (order: string[]) => void

  addCategory: (cat: Omit<Category, 'id'>) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  completeTask: (id: string) => void
  uncompleteTask: (id: string) => void
  deleteTask: (id: string) => void
  reorderTasks: (fromIndex: number, toIndex: number) => void

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'streak' | 'longestStreak' | 'completedDates'>) => void
  updateHabit: (id: string, updates: Partial<Habit>) => void
  completeHabit: (id: string, date: string) => void
  uncompleteHabit: (id: string, date: string) => void
  deleteHabit: (id: string) => void
  reorderHabits: (fromIndex: number, toIndex: number) => void

  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'completedDates'>) => void
  updateRoutine: (id: string, updates: Partial<Routine>) => void
  toggleRoutineStep: (routineId: string, stepId: string) => void
  completeRoutine: (id: string, date: string) => void
  resetRoutine: (id: string) => void
  deleteRoutine: (id: string) => void
  reorderRoutines: (fromIndex: number, toIndex: number) => void

  addCustomReward: (reward: Omit<CustomReward, 'id' | 'redeemedCount'>) => void
  updateCustomReward: (id: string, updates: Partial<CustomReward>) => void
  deleteCustomReward: (id: string) => void
  redeemReward: (id: string) => void
}

function rowToCategory(r: Record<string, unknown>): Category {
  return { id: r.id as string, name: r.name as string, color: r.color as string, icon: r.icon as string }
}

function rowToTask(r: Record<string, unknown>): Task {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | undefined,
    categoryId: r.category_id as string,
    priority: r.priority as Priority,
    dueDate: r.due_date as string | undefined,
    timeEstimate: r.time_estimate as number | undefined,
    completed: r.completed as boolean,
    completedAt: r.completed_at as string | undefined,
    createdAt: r.created_at as string,
    points: r.points as number,
  }
}

function rowToHabit(r: Record<string, unknown>): Habit {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | undefined,
    categoryId: r.category_id as string,
    frequency: r.frequency as Frequency,
    targetDays: r.target_days as number[] | undefined,
    streak: r.streak as number,
    longestStreak: r.longest_streak as number,
    completedDates: (r.completed_dates as string[]) ?? [],
    createdAt: r.created_at as string,
    points: r.points as number,
    color: r.color as string,
  }
}

function rowToRoutine(r: Record<string, unknown>): Routine {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | undefined,
    categoryId: r.category_id as string,
    steps: r.steps as RoutineStep[],
    frequency: r.frequency as Frequency,
    targetDays: r.target_days as number[] | undefined,
    lastCompletedDate: r.last_completed_date as string | undefined,
    completedDates: (r.completed_dates as string[]) ?? [],
    createdAt: r.created_at as string,
    points: r.points as number,
  }
}

function rowToReward(r: Record<string, unknown>): CustomReward {
  return {
    id: r.id as string,
    title: r.title as string,
    description: r.description as string | undefined,
    cost: r.cost as number,
    emoji: r.emoji as string,
    redeemedCount: r.redeemed_count as number,
  }
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: uuid(), name: 'Work', color: '#6366f1', icon: '💼' },
  { id: uuid(), name: 'Home', color: '#10b981', icon: '🏠' },
  { id: uuid(), name: 'Health', color: '#f59e0b', icon: '💪' },
  { id: uuid(), name: 'Crafts', color: '#ec4899', icon: '🎨' },
  { id: uuid(), name: 'Personal', color: '#8b5cf6', icon: '⭐' },
]

export const useStore = create<AppState>()((set, get) => ({
  categories: [],
  tasks: [],
  habits: [],
  routines: [],
  customRewards: [],
  totalPoints: 0,
  loaded: false,
  todayAssignments: [],
  todayOrder: [],

  loadFromDB: async () => {
    const todayKey = `today_assignments_${new Date().toISOString().slice(0, 10)}`
    const [cats, tasks, habits, routines, rewards, config, ordersResult, todayResult, todayOrderResult] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('habits').select('*'),
      supabase.from('routines').select('*'),
      supabase.from('custom_rewards').select('*'),
      supabase.from('app_config').select('*').eq('key', 'total_points').maybeSingle(),
      supabase.from('app_config').select('*').in('key', ['tasks_order', 'habits_order', 'routines_order']),
      supabase.from('app_config').select('*').eq('key', todayKey).maybeSingle(),
      supabase.from('app_config').select('*').eq('key', `today_order_${new Date().toISOString().slice(0, 10)}`).maybeSingle(),
    ])

    let categories = (cats.data ?? []).map(rowToCategory)

    if (categories.length === 0) {
      await supabase.from('categories').insert(
        DEFAULT_CATEGORIES.map((c) => ({ id: c.id, name: c.name, color: c.color, icon: c.icon }))
      )
      categories = DEFAULT_CATEGORIES
    }

    const orders: Record<string, string[]> = {}
    for (const row of ordersResult.data ?? []) {
      orders[row.key as string] = row.value as string[]
    }

    function applyOrder<T extends { id: string }>(items: T[], orderKey: string): T[] {
      const order: string[] = orders[orderKey] ?? []
      if (order.length === 0) return items
      const map = new Map(items.map((i) => [i.id, i]))
      const ordered = order.flatMap((id) => (map.has(id) ? [map.get(id)!] : []))
      const rest = items.filter((i) => !order.includes(i.id))
      return [...ordered, ...rest]
    }

    set({
      categories,
      tasks: applyOrder((tasks.data ?? []).map(rowToTask), 'tasks_order'),
      habits: applyOrder((habits.data ?? []).map(rowToHabit), 'habits_order'),
      routines: applyOrder((routines.data ?? []).map(rowToRoutine), 'routines_order'),
      customRewards: (rewards.data ?? []).map(rowToReward),
      totalPoints: config.data ? (config.data.value as number) : 0,
      todayAssignments: todayResult.data ? (todayResult.data.value as string[]) : [],
      todayOrder: todayOrderResult.data ? (todayOrderResult.data.value as string[]) : [],
      loaded: true,
    })
  },

  // ── Today ─────────────────────────────────────────────────────────────────────

  addToToday: (type, id) => {
    const key = `${type}:${id}`
    set((s) => {
      if (s.todayAssignments.includes(key)) return s
      const updated = [...s.todayAssignments, key]
      const todayKey = `today_assignments_${new Date().toISOString().slice(0, 10)}`
      supabase.from('app_config').upsert({ key: todayKey, value: updated })
      return { todayAssignments: updated }
    })
  },

  removeFromToday: (type, id) => {
    const key = `${type}:${id}`
    set((s) => {
      const updatedAssignments = s.todayAssignments.filter((k) => k !== key)
      const updatedOrder = s.todayOrder.filter((k) => k !== key)
      const dateStr = new Date().toISOString().slice(0, 10)
      supabase.from('app_config').upsert({ key: `today_assignments_${dateStr}`, value: updatedAssignments })
      supabase.from('app_config').upsert({ key: `today_order_${dateStr}`, value: updatedOrder })
      return { todayAssignments: updatedAssignments, todayOrder: updatedOrder }
    })
  },

  setTodayOrder: (order) => {
    set({ todayOrder: order })
    const dateStr = new Date().toISOString().slice(0, 10)
    supabase.from('app_config').upsert({ key: `today_order_${dateStr}`, value: order })
  },

  // ── Categories ───────────────────────────────────────────────────────────────

  addCategory: (cat) => {
    const newCat = { ...cat, id: uuid() }
    set((s) => ({ categories: [...s.categories, newCat] }))
    supabase.from('categories').insert({ id: newCat.id, name: newCat.name, color: newCat.color, icon: newCat.icon })
  },

  updateCategory: (id, updates) => {
    set((s) => ({ categories: s.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)) }))
    supabase.from('categories').update(updates).eq('id', id)
  },

  deleteCategory: (id) => {
    set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
    supabase.from('categories').delete().eq('id', id)
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────────

  addTask: (task) => {
    const newTask: Task = { ...task, id: uuid(), createdAt: new Date().toISOString(), completed: false }
    set((s) => ({ tasks: [...s.tasks, newTask] }))
    supabase.from('tasks').insert({
      id: newTask.id, title: newTask.title, description: newTask.description,
      category_id: newTask.categoryId, priority: newTask.priority, due_date: newTask.dueDate,
      time_estimate: newTask.timeEstimate, completed: false,
      created_at: newTask.createdAt, points: newTask.points,
    })
  },

  updateTask: (id, updates) => {
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }))
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.timeEstimate !== undefined) dbUpdates.time_estimate = updates.timeEstimate
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt
    if (updates.points !== undefined) dbUpdates.points = updates.points
    supabase.from('tasks').update(dbUpdates).eq('id', id)
  },

  completeTask: (id) => {
    const task = get().tasks.find((t) => t.id === id)
    if (!task || task.completed) return
    const completedAt = new Date().toISOString()
    const newPoints = get().totalPoints + task.points
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: true, completedAt } : t)),
      totalPoints: newPoints,
    }))
    supabase.from('tasks').update({ completed: true, completed_at: completedAt }).eq('id', id)
    supabase.from('app_config').upsert({ key: 'total_points', value: newPoints })
  },

  uncompleteTask: (id) => {
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: false, completedAt: undefined } : t)),
    }))
    supabase.from('tasks').update({ completed: false, completed_at: null }).eq('id', id)
  },

  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    supabase.from('tasks').delete().eq('id', id)
  },

  reorderTasks: (fromIndex, toIndex) => {
    set((s) => {
      const tasks = [...s.tasks]
      const [item] = tasks.splice(fromIndex, 1)
      tasks.splice(toIndex, 0, item)
      supabase.from('app_config').upsert({ key: 'tasks_order', value: tasks.map((t) => t.id) })
      return { tasks }
    })
  },

  // ── Habits ────────────────────────────────────────────────────────────────────

  addHabit: (habit) => {
    const newHabit: Habit = {
      ...habit, id: uuid(), createdAt: new Date().toISOString(),
      streak: 0, longestStreak: 0, completedDates: [],
    }
    set((s) => ({ habits: [...s.habits, newHabit] }))
    supabase.from('habits').insert({
      id: newHabit.id, title: newHabit.title, description: newHabit.description,
      category_id: newHabit.categoryId, frequency: newHabit.frequency,
      target_days: newHabit.targetDays, streak: 0, longest_streak: 0,
      completed_dates: [], created_at: newHabit.createdAt,
      points: newHabit.points, color: newHabit.color,
    })
  },

  updateHabit: (id, updates) => {
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)) }))
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
    if (updates.targetDays !== undefined) dbUpdates.target_days = updates.targetDays
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.points !== undefined) dbUpdates.points = updates.points
    supabase.from('habits').update(dbUpdates).eq('id', id)
  },

  completeHabit: (id, date) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit || habit.completedDates.includes(date)) return
    const dates = [...habit.completedDates, date].sort()
    const streak = calcStreak(dates, habit.frequency)
    const longestStreak = Math.max(habit.longestStreak, streak)
    const newPoints = get().totalPoints + habit.points
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, completedDates: dates, streak, longestStreak } : h)),
      totalPoints: newPoints,
    }))
    supabase.from('habits').update({ completed_dates: dates, streak, longest_streak: longestStreak }).eq('id', id)
    supabase.from('app_config').upsert({ key: 'total_points', value: newPoints })
  },

  uncompleteHabit: (id, date) => {
    const habit = get().habits.find((h) => h.id === id)
    if (!habit) return
    const dates = habit.completedDates.filter((d) => d !== date)
    const streak = calcStreak(dates, habit.frequency)
    set((s) => ({
      habits: s.habits.map((h) => (h.id === id ? { ...h, completedDates: dates, streak } : h)),
    }))
    supabase.from('habits').update({ completed_dates: dates, streak }).eq('id', id)
  },

  deleteHabit: (id) => {
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
    supabase.from('habits').delete().eq('id', id)
  },

  reorderHabits: (fromIndex, toIndex) => {
    set((s) => {
      const habits = [...s.habits]
      const [item] = habits.splice(fromIndex, 1)
      habits.splice(toIndex, 0, item)
      supabase.from('app_config').upsert({ key: 'habits_order', value: habits.map((h) => h.id) })
      return { habits }
    })
  },

  // ── Routines ──────────────────────────────────────────────────────────────────

  addRoutine: (routine) => {
    const newRoutine: Routine = { ...routine, id: uuid(), createdAt: new Date().toISOString(), completedDates: [] }
    set((s) => ({ routines: [...s.routines, newRoutine] }))
    supabase.from('routines').insert({
      id: newRoutine.id, title: newRoutine.title, description: newRoutine.description,
      category_id: newRoutine.categoryId, steps: newRoutine.steps,
      frequency: newRoutine.frequency, target_days: newRoutine.targetDays ?? null,
      completed_dates: [], created_at: newRoutine.createdAt, points: newRoutine.points,
    })
  },

  updateRoutine: (id, updates) => {
    set((s) => ({ routines: s.routines.map((r) => (r.id === id ? { ...r, ...updates } : r)) }))
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.steps !== undefined) dbUpdates.steps = updates.steps
    if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency
    if (updates.targetDays !== undefined) dbUpdates.target_days = updates.targetDays.length > 0 ? updates.targetDays : null
    if (updates.points !== undefined) dbUpdates.points = updates.points
    supabase.from('routines').update(dbUpdates).eq('id', id)
  },

  toggleRoutineStep: (routineId, stepId) => {
    set((s) => ({
      routines: s.routines.map((r) =>
        r.id === routineId
          ? { ...r, steps: r.steps.map((st) => (st.id === stepId ? { ...st, completed: !st.completed } : st)) }
          : r
      ),
    }))
    const routine = get().routines.find((r) => r.id === routineId)
    if (routine) supabase.from('routines').update({ steps: routine.steps }).eq('id', routineId)
  },

  completeRoutine: (id, date) => {
    const routine = get().routines.find((r) => r.id === id)
    if (!routine) return
    const newPoints = get().totalPoints + routine.points
    const resetSteps = routine.steps.map((st) => ({ ...st, completed: false }))
    const completedDates = [...routine.completedDates, date]
    set((s) => ({
      routines: s.routines.map((r) =>
        r.id === id ? { ...r, completedDates, lastCompletedDate: date, steps: resetSteps } : r
      ),
      totalPoints: newPoints,
    }))
    supabase.from('routines').update({ completed_dates: completedDates, last_completed_date: date, steps: resetSteps }).eq('id', id)
    supabase.from('app_config').upsert({ key: 'total_points', value: newPoints })
  },

  resetRoutine: (id) => {
    const routine = get().routines.find((r) => r.id === id)
    if (!routine) return
    const resetSteps = routine.steps.map((st) => ({ ...st, completed: false }))
    set((s) => ({
      routines: s.routines.map((r) => (r.id === id ? { ...r, steps: resetSteps } : r)),
    }))
    supabase.from('routines').update({ steps: resetSteps }).eq('id', id)
  },

  deleteRoutine: (id) => {
    set((s) => ({ routines: s.routines.filter((r) => r.id !== id) }))
    supabase.from('routines').delete().eq('id', id)
  },

  reorderRoutines: (fromIndex, toIndex) => {
    set((s) => {
      const routines = [...s.routines]
      const [item] = routines.splice(fromIndex, 1)
      routines.splice(toIndex, 0, item)
      supabase.from('app_config').upsert({ key: 'routines_order', value: routines.map((r) => r.id) })
      return { routines }
    })
  },

  // ── Rewards ───────────────────────────────────────────────────────────────────

  addCustomReward: (reward) => {
    const newReward: CustomReward = { ...reward, id: uuid(), redeemedCount: 0 }
    set((s) => ({ customRewards: [...s.customRewards, newReward] }))
    supabase.from('custom_rewards').insert({
      id: newReward.id, title: newReward.title, description: newReward.description,
      cost: newReward.cost, emoji: newReward.emoji, redeemed_count: 0,
    })
  },

  updateCustomReward: (id, updates) => {
    set((s) => ({ customRewards: s.customRewards.map((r) => (r.id === id ? { ...r, ...updates } : r)) }))
    const dbUpdates: Record<string, unknown> = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost
    if (updates.emoji !== undefined) dbUpdates.emoji = updates.emoji
    supabase.from('custom_rewards').update(dbUpdates).eq('id', id)
  },

  deleteCustomReward: (id) => {
    set((s) => ({ customRewards: s.customRewards.filter((r) => r.id !== id) }))
    supabase.from('custom_rewards').delete().eq('id', id)
  },

  redeemReward: (id) => {
    const reward = get().customRewards.find((r) => r.id === id)
    if (!reward || get().totalPoints < reward.cost) return
    const newPoints = get().totalPoints - reward.cost
    const newCount = reward.redeemedCount + 1
    set((s) => ({
      totalPoints: newPoints,
      customRewards: s.customRewards.map((r) => (r.id === id ? { ...r, redeemedCount: newCount } : r)),
    }))
    supabase.from('custom_rewards').update({ redeemed_count: newCount }).eq('id', id)
    supabase.from('app_config').upsert({ key: 'total_points', value: newPoints })
  },
}))

function calcStreak(dates: string[], frequency: Frequency): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  if (frequency === 'daily') {
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0
    let streak = 1
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diff = (prev.getTime() - curr.getTime()) / 86400000
      if (diff === 1) streak++
      else break
    }
    return streak
  }
  return dates.length
}

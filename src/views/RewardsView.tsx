import { useState } from 'react'
import { useStore } from '../store'
import Modal from '../components/Modal'

const EMOJIS = ['🎁', '🍕', '🎮', '📚', '🎬', '☕', '🍦', '🛁', '🎵', '🌿', '✈️', '🛍️', '🍰', '🧘', '🎨']

export default function RewardsView() {
  const { totalPoints, habits, customRewards, addCustomReward, deleteCustomReward, redeemReward } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', dollars: '10', emoji: '🎁' })

  const topStreaks = [...habits]
    .filter((h) => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 3)

  const handleAdd = () => {
    const dollars = parseFloat(form.dollars)
    if (!form.title.trim() || isNaN(dollars) || dollars < 0) return
    addCustomReward({ title: form.title.trim(), description: form.description.trim() || undefined, cost: Math.round(dollars * 100) / 100, emoji: form.emoji })
    setForm({ title: '', description: '', dollars: '10', emoji: '🎁' })
    setShowModal(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Rewards</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Balance */}
      <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-4 mb-4 shadow-md">
        <div className="text-3xl font-bold text-white">${totalPoints.toFixed(2)}</div>
        <div className="text-xs text-white/80 mt-0.5">available to spend</div>
      </div>

      {/* Streaks */}
      {topStreaks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Current Streaks</h3>
          <div className="space-y-2">
            {topStreaks.map((h) => (
              <div key={h.id} className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-xl px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: h.color }} />
                <span className="text-sm text-gray-900 flex-1">{h.title}</span>
                <span className="text-orange-400 font-semibold text-sm">🔥 {h.streak}</span>
                {h.longestStreak > h.streak && (
                  <span className="text-xs text-gray-500">best {h.longestStreak}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rewards list */}
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Your Rewards</h3>
      {customRewards.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <div className="text-4xl mb-2">🎁</div>
          <p className="text-gray-600">Add rewards to spend your earnings on!</p>
        </div>
      )}
      <div className="space-y-2">
        {customRewards.map((reward) => {
          const canAfford = totalPoints >= reward.cost
          return (
            <div key={reward.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">{reward.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm">{reward.title}</div>
                {reward.description && <div className="text-xs text-gray-500 mt-0.5">{reward.description}</div>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-emerald-600 font-semibold">${reward.cost.toFixed(2)}</span>
                  {reward.redeemedCount > 0 && (
                    <span className="text-xs text-gray-400">redeemed {reward.redeemedCount}×</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => redeemReward(reward.id)}
                  disabled={!canAfford}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border-0 cursor-pointer transition-colors ${
                    canAfford
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Redeem
                </button>
                <button
                  onClick={() => deleteCustomReward(reward.id)}
                  className="text-gray-300 hover:text-red-400 bg-transparent border-0 cursor-pointer text-lg"
                >
                  ×
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {showModal && (
        <Modal title="New Reward" onClose={() => setShowModal(false)}>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Pick an emoji</label>
              <div className="flex gap-2 flex-wrap">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setForm({ ...form, emoji: e })}
                    className={`text-xl w-9 h-9 rounded-lg border-0 cursor-pointer transition-all ${
                      form.emoji === e ? 'bg-violet-100 ring-2 ring-violet-500 scale-110' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <input
              placeholder="Reward name (e.g. Buy a book)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.dollars}
                onChange={(e) => setForm({ ...form, dollars: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-violet-400"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!form.title.trim()}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-medium py-2 rounded-lg border-0 cursor-pointer transition-colors"
            >
              Add Reward
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

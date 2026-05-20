import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export interface Category {
  id: number
  name: string
  amount: number
  color: string
  type: 'income' | 'expense'
}

export interface BudgetPlan {
  id: string
  name: string
  currency: string
  categories: Category[]
  createdAt: string
}

const STORAGE_KEY = 'budgetflow-plans'

const PALETTE = [
  '#4ade80', '#60a5fa', '#f87171', '#fbbf24', '#a78bfa',
  '#fb923c', '#34d399', '#38bdf8', '#e879f9', '#2dd4bf',
  '#818cf8', '#f472b6',
]

export function getNextColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

function loadFromStorage(): BudgetPlan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export const useBudgetStore = defineStore('budget', () => {
  const plans = ref<BudgetPlan[]>(loadFromStorage())

  watch(plans, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  function createPlan(name: string, currency: string): string {
    const plan: BudgetPlan = {
      id: Date.now().toString(),
      name,
      currency,
      categories: [],
      createdAt: new Date().toISOString(),
    }
    plans.value.push(plan)
    return plan.id
  }

  function deletePlan(id: string): void {
    plans.value = plans.value.filter((p) => p.id !== id)
  }

  function getPlan(id: string): BudgetPlan | undefined {
    return plans.value.find((p) => p.id === id)
  }

  function addCategory(planId: string, cat: Omit<Category, 'id'>): void {
    const plan = getPlan(planId)
    if (plan) {
      plan.categories.push({ ...cat, id: Date.now() })
    }
  }

  function removeCategory(planId: string, catId: number): void {
    const plan = getPlan(planId)
    if (plan) {
      plan.categories = plan.categories.filter((c) => c.id !== catId)
    }
  }

  return { plans, createPlan, deletePlan, getPlan, addCategory, removeCategory }
})

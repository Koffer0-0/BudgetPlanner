<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetStore, type BudgetPlan } from '@/stores/budget'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const store = useBudgetStore()
const { t } = useI18n()

const showModal = ref(false)
const newPlan = ref({ name: '', currency: '₸' })

const plans = computed(() => store.plans)

function fmt(n: number) {
  return new Intl.NumberFormat(t('intlLocale') as string).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(t('intlLocale') as string, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function totalIncome(plan: BudgetPlan) {
  return plan.categories.filter((c) => c.type === 'income').reduce((s, c) => s + c.amount, 0)
}

function totalExpense(plan: BudgetPlan) {
  return plan.categories.filter((c) => c.type === 'expense').reduce((s, c) => s + c.amount, 0)
}

function balance(plan: BudgetPlan) {
  return totalIncome(plan) - totalExpense(plan)
}

function spentPercent(plan: BudgetPlan) {
  const income = totalIncome(plan)
  const expense = totalExpense(plan)
  if (income === 0) return expense > 0 ? 100 : 0
  return Math.min(100, Math.round((expense / income) * 100))
}

function handleCreate() {
  if (!newPlan.value.name.trim()) return
  const id = store.createPlan(newPlan.value.name.trim(), newPlan.value.currency)
  newPlan.value = { name: '', currency: '₸' }
  showModal.value = false
  router.push(`/plan/${id}`)
}

function deletePlan(id: string, e: MouseEvent) {
  e.stopPropagation()
  if (confirm(t('deletePlan'))) {
    store.deletePlan(id)
  }
}

</script>

<template>
  <div class="flex-1 flex flex-col bg-slate-50">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900">BudgetFlow</h1>
          <p class="text-sm text-slate-400">{{ t('tagline') }}</p>
        </div>
        <button
          @click="showModal = true"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {{ t('newPlan') }}
        </button>
      </div>
    </header>

    <!-- Main -->
    <main class="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
      <!-- Empty state -->
      <div v-if="plans.length === 0" class="text-center py-24">
        <div class="w-20 h-20 mx-auto mb-5 bg-green-100 rounded-2xl flex items-center justify-center">
          <svg class="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.86 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-slate-700">{{ t('noPlans') }}</h2>
        <p class="text-slate-400 mt-2 text-sm">{{ t('noPlansDesc') }}</p>
        <button
          @click="showModal = true"
          class="mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          {{ t('createFirst') }}
        </button>
      </div>

      <!-- Plans grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="plan in plans"
          :key="plan.id"
          @click="router.push(`/plan/${plan.id}`)"
          class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all cursor-pointer group relative"
        >
          <!-- Delete button -->
          <button
            @click="deletePlan(plan.id, $event)"
            class="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <h3 class="font-semibold text-slate-900 text-lg pr-6">{{ plan.name }}</h3>
          <p class="text-xs text-slate-400 mt-0.5 mb-4">{{ formatDate(plan.createdAt) }}</p>

          <div class="space-y-3">
            <div class="flex justify-between text-sm font-medium">
              <span class="text-green-600">↑ {{ fmt(totalIncome(plan)) }} {{ plan.currency }}</span>
              <span class="text-red-500">↓ {{ fmt(totalExpense(plan)) }} {{ plan.currency }}</span>
            </div>

            <div>
              <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="spentPercent(plan) >= 100 ? 'bg-red-400' : 'bg-green-500'"
                  :style="{ width: `${spentPercent(plan)}%` }"
                />
              </div>
              <p class="text-xs text-slate-400 mt-1.5">{{ spentPercent(plan) }}% {{ t('budgetSpent') }}</p>
            </div>

            <div class="flex items-center justify-between pt-2 border-t border-slate-50">
              <span
                class="text-sm font-semibold"
                :class="balance(plan) >= 0 ? 'text-green-600' : 'text-red-500'"
              >
                {{ balance(plan) >= 0 ? '+' : '' }}{{ fmt(balance(plan)) }} {{ plan.currency }}
              </span>
              <span class="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
                {{ t('categoriesCount')(plan.categories.length) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Create new card -->
        <button
          @click="showModal = true"
          class="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-green-400 hover:text-green-600 transition-colors min-h-[180px]"
        >
          <div class="w-10 h-10 rounded-xl border-2 border-current flex items-center justify-center">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>
          <span class="text-sm font-medium">{{ t('newPlan') }}</span>
        </button>
      </div>
    </main>

    <!-- Create modal -->
    <Transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
        @click.self="showModal = false"
      >
        <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
          <h2 class="text-lg font-semibold text-slate-900 mb-5">{{ t('newBudgetPlan') }}</h2>

          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-slate-600 block mb-1.5">{{ t('name') }}</label>
              <input
                v-model="newPlan.name"
                :placeholder="t('namePlaceholder')"
                class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                @keyup.enter="handleCreate"
              />
            </div>

            <div>
              <label class="text-sm font-medium text-slate-600 block mb-1.5">{{ t('currency') }}</label>
              <select
                v-model="newPlan.currency"
                class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
              >
                <option value="₸">Тенге (₸)</option>
                <option value="₽">Рубль (₽)</option>
                <option value="$">Dollar ($)</option>
                <option value="€">Euro (€)</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 mt-5">
            <button
              @click="showModal = false"
              class="flex-1 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button
              @click="handleCreate"
              :disabled="!newPlan.name.trim()"
              class="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              {{ t('create') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

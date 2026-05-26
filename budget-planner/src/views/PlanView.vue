<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBudgetStore, getNextColor } from '@/stores/budget'
import { useI18n } from '@/composables/useI18n'
import { PieChart, DoughnutChart, BarChart } from 'vue-chart-3'
import { Chart, registerables } from 'chart.js'
import PieIcon from '@/components/icons/PieIcon.vue'
import DonutIcon from '@/components/icons/DonutIcon.vue'
import BarIcon from '@/components/icons/BarIcon.vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

Chart.register(...registerables)

const route = useRoute()
const router = useRouter()
const store = useBudgetStore()
const { t } = useI18n()

const planId = route.params.id as string
const plan = computed(() => store.getPlan(planId))

type FilterType = 'all' | 'income' | 'expense'
const filter = ref<FilterType>('all')
const selectedChart = ref<'pie' | 'doughnut' | 'bar'>('pie')
const pdfSection = ref<HTMLElement | null>(null)
const isGeneratingPdf = ref(false)

const newCat = ref({ name: '', amount: '' as number | '', type: 'expense' as 'income' | 'expense' })

const chartTypes = [
  { value: 'pie' as const, icon: PieIcon },
  { value: 'doughnut' as const, icon: DonutIcon },
  { value: 'bar' as const, icon: BarIcon },
]

const filteredCategories = computed(() => {
  if (!plan.value) return []
  if (filter.value === 'all') return plan.value.categories
  return plan.value.categories.filter((c) => c.type === filter.value)
})

const totalIncome = computed(() =>
  plan.value?.categories.filter((c) => c.type === 'income').reduce((s, c) => s + c.amount, 0) ?? 0,
)

const totalExpense = computed(() =>
  plan.value?.categories.filter((c) => c.type === 'expense').reduce((s, c) => s + c.amount, 0) ?? 0,
)

const balance = computed(() => totalIncome.value - totalExpense.value)

const pdfDate = computed(() =>
  new Date().toLocaleDateString(t('intlLocale') as string, { day: 'numeric', month: 'long', year: 'numeric' }),
)

const chartData = computed(() => {
  const cats = plan.value?.categories ?? []
  return {
    labels: cats.map((c) => c.name),
    datasets: [
      {
        data: cats.map((c) => c.amount),
        backgroundColor: cats.map((c) => c.color),
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  plugins: {
    legend: { display: false },
  },
}))

function fmt(n: number) {
  return new Intl.NumberFormat(t('intlLocale') as string).format(n)
}

function addCategory() {
  const amount = Number(newCat.value.amount)
  if (!newCat.value.name.trim() || !amount || amount <= 0) return
  store.addCategory(planId, {
    name: newCat.value.name.trim(),
    amount,
    color: getNextColor(),
    type: newCat.value.type,
  })
  newCat.value.name = ''
  newCat.value.amount = ''
}

function removeCategory(catId: number) {
  store.removeCategory(planId, catId)
}

// Общая часть: OKLab компоненты → rgb/rgba строка
function oklabComponentsToRgb(L: number, a: number, b: number, alpha: number): string {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const ll = l_ ** 3
  const mm = m_ ** 3
  const ss = s_ ** 3
  const toSrgb = (x: number) => {
    x = Math.max(0, Math.min(1, x))
    return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
  }
  const r = Math.round(toSrgb(4.0767416621 * ll - 3.3077115913 * mm + 0.2309699292 * ss) * 255)
  const g = Math.round(toSrgb(-1.2684380046 * ll + 2.6097574011 * mm - 0.3413193965 * ss) * 255)
  const bv = Math.round(toSrgb(-0.004196086 * ll - 0.7034186147 * mm + 1.707614701 * ss) * 255)
  return alpha < 1 ? `rgba(${r},${g},${bv},${alpha})` : `rgb(${r},${g},${bv})`
}

function parseAlpha(s: string | undefined): number {
  if (!s) return 1
  return s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s)
}

function oklchToRgb(oklchStr: string): string {
  const m = oklchStr.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+(-?[\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)/,
  )
  if (!m) return '#000'
  let L = parseFloat(m[1])
  if (m[1].endsWith('%')) L /= 100
  let C = parseFloat(m[2])
  if (m[2].endsWith('%')) C = (C / 100) * 0.4
  const H = (parseFloat(m[3]) * Math.PI) / 180
  const alpha = parseAlpha(m[4])
  return oklabComponentsToRgb(L, C * Math.cos(H), C * Math.sin(H), alpha)
}

function oklabToRgb(oklabStr: string): string {
  const m = oklabStr.match(
    /oklab\(\s*([\d.]+%?)\s+(-?[\d.]+%?)\s+(-?[\d.]+%?)\s*(?:\/\s*([\d.]+%?))?\s*\)/,
  )
  if (!m) return '#000'
  let L = parseFloat(m[1])
  if (m[1].endsWith('%')) L /= 100
  let a = parseFloat(m[2])
  if (m[2].endsWith('%')) a = (a / 100) * 0.4
  let b = parseFloat(m[3])
  if (m[3].endsWith('%')) b = (b / 100) * 0.4
  return oklabComponentsToRgb(L, a, b, parseAlpha(m[4]))
}

// Patches oklch() in the ORIGINAL document's stylesheets before html2canvas
// reads them (it reads the live document, not only the clone). Returns a
// cleanup function that restores everything.
async function applyOklchPatch(): Promise<() => void> {
  const replaceModernColors = (css: string) =>
    css
      .replace(/oklch\([^)]+\)/g, oklchToRgb)
      .replace(/oklab\([^)]+\)/g, oklabToRgb)
  const hasModernColor = (css: string) => css.includes('oklch') || css.includes('oklab')
  const cleanups: (() => void)[] = []

  document.querySelectorAll<HTMLStyleElement>('style').forEach((el) => {
    if (!el.textContent || !hasModernColor(el.textContent)) return
    const orig = el.textContent
    el.textContent = replaceModernColors(orig)
    cleanups.push(() => { el.textContent = orig })
  })

  const links = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
  await Promise.all(
    links.map(async (link) => {
      try {
        const res = await fetch(link.href)
        const css = await res.text()
        if (!hasModernColor(css)) return
        const style = document.createElement('style')
        style.textContent = replaceModernColors(css)
        link.parentNode?.insertBefore(style, link)
        link.disabled = true
        cleanups.push(() => { link.disabled = false; style.remove() })
      } catch {
        // skip cross-origin sheets
      }
    }),
  )

  return () => cleanups.forEach((fn) => fn())
}

async function generatePdf() {
  if (!pdfSection.value || isGeneratingPdf.value) return
  isGeneratingPdf.value = true
  await nextTick()

  const restoreStyles = await applyOklchPatch()
  try {
    const canvas = await html2canvas(pdfSection.value, {
      scale: 2,
      backgroundColor: '#f8fafc',
      useCORS: true,
      logging: false,
      onclone: (clonedDoc: Document) => {
        const patch = (css: string) =>
          css.replace(/oklch\([^)]+\)/g, oklchToRgb).replace(/oklab\([^)]+\)/g, oklabToRgb)
        clonedDoc.querySelectorAll<HTMLStyleElement>('style').forEach((el) => {
          if (el.textContent) el.textContent = patch(el.textContent)
        })
        clonedDoc.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
          const s = el.getAttribute('style') ?? ''
          if (s.includes('oklch') || s.includes('oklab')) el.setAttribute('style', patch(s))
        })
        // Remove delete buttons — they are opacity-0 in the UI but still take layout space,
        // which can push amount text outside the card in the narrower PDF column.
        clonedDoc.querySelectorAll<HTMLElement>('.opacity-0').forEach((el) => {
          el.style.display = 'none'
        })
      },
    })

    // Fit image into A4 page (usable area: 190 × 277 mm)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const PAGE_W = 190
    const PAGE_H = 277
    const ratio = canvas.height / canvas.width
    let imgW = PAGE_W
    let imgH = imgW * ratio
    if (imgH > PAGE_H) {
      imgH = PAGE_H
      imgW = imgH / ratio
    }
    const xOff = 10 + (PAGE_W - imgW) / 2

    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', xOff, 10, imgW, imgH)
    pdf.save(`${plan.value?.name ?? 'budget'}-report.pdf`)
  } catch (err) {
    console.error('PDF error:', err)
  } finally {
    restoreStyles()
    isGeneratingPdf.value = false
  }
}
</script>

<template>
  <div v-if="!plan" class="flex-1 flex items-center justify-center">
    <div class="text-center">
      <p class="text-slate-500 mb-4">{{ t('planNotFound') }}</p>
      <button @click="router.push('/')" class="text-green-600 hover:underline text-sm">{{ t('back') }}</button>
    </div>
  </div>

  <div v-else class="flex-1 flex flex-col bg-slate-50">
    <!-- Header -->
    <header class="bg-white border-b border-slate-200">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            @click="router.push('/')"
            class="text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 class="text-xl font-bold text-slate-900">{{ plan.name }}</h1>
            <p class="text-xs text-slate-400">{{ plan.currency }} · {{ t('categoriesCount')(plan.categories.length) }}</p>
          </div>
        </div>
        <button
          @click="generatePdf"
          :disabled="isGeneratingPdf"
          class="border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 10v6m0 0l-3-3m3 3l3-3" />
            <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4" />
            <path d="M3 9V5a2 2 0 012-2h14a2 2 0 012 2v4" />
          </svg>
          {{ isGeneratingPdf ? t('generating') : t('downloadPdf') }}
        </button>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-6">
      <div ref="pdfSection">

      <!-- PDF header: v-if so it is absent from the DOM entirely in normal use -->
      <div v-if="isGeneratingPdf" class="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100 mb-4">
        <h1 class="text-xl font-bold text-slate-900">{{ plan?.name }}</h1>
        <p class="text-sm text-slate-400 mt-1">{{ pdfDate }}</p>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p class="text-xs text-slate-500 uppercase tracking-wider font-medium">{{ t('income') }}</p>
          <p class="text-2xl font-bold text-green-600 mt-1.5 tabular-nums">{{ fmt(totalIncome) }}</p>
          <p class="text-sm text-slate-400 mt-0.5">{{ plan.currency }}</p>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p class="text-xs text-slate-500 uppercase tracking-wider font-medium">{{ t('expenses') }}</p>
          <p class="text-2xl font-bold text-red-500 mt-1.5 tabular-nums">{{ fmt(totalExpense) }}</p>
          <p class="text-sm text-slate-400 mt-0.5">{{ plan.currency }}</p>
        </div>
        <div
          class="rounded-2xl p-4 shadow-sm border transition-colors"
          :class="
            balance >= 0
              ? 'bg-green-50 border-green-100'
              : 'bg-red-50 border-red-100'
          "
        >
          <p class="text-xs uppercase tracking-wider font-medium" :class="balance >= 0 ? 'text-green-700' : 'text-red-600'">
            {{ t('balance') }}
          </p>
          <p
            class="text-2xl font-bold mt-1.5 tabular-nums"
            :class="balance >= 0 ? 'text-green-700' : 'text-red-600'"
          >
            {{ balance >= 0 ? '+' : '' }}{{ fmt(balance) }}
          </p>
          <p class="text-sm mt-0.5" :class="balance >= 0 ? 'text-green-600' : 'text-red-500'">
            {{ plan.currency }}
          </p>
        </div>
      </div>

      <!-- Categories + chart grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Categories panel -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-slate-900">{{ t('categories') }}</h2>
            <div class="flex bg-slate-100 rounded-xl p-1 text-xs gap-0.5">
              <button
                v-for="f in (['all', 'income', 'expense'] as FilterType[])"
                :key="f"
                @click="filter = f"
                :class="filter === f ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'"
                class="px-3 py-1.5 rounded-lg transition-all"
              >
                {{ f === 'all' ? t('all') : f === 'income' ? t('income') : t('expenses') }}
              </button>
            </div>
          </div>

          <!-- List -->
          <ul class="space-y-1.5 min-h-[140px]">
            <li
              v-for="cat in filteredCategories"
              :key="cat.id"
              class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 group"
            >
              <div class="flex items-center gap-3 min-w-0">
                <div
                  class="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: cat.color }"
                />
                <span class="text-sm text-slate-700 truncate">{{ cat.name }}</span>
                <span
                  class="text-xs px-1.5 py-0.5 rounded-md flex-shrink-0"
                  :class="cat.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'"
                >
                  {{ cat.type === 'income' ? t('incomeLabel') : t('expenseLabel') }}
                </span>
              </div>
              <div class="flex items-center gap-2 flex-shrink-0 ml-2">
                <span
                  class="text-sm font-medium tabular-nums"
                  :class="cat.type === 'income' ? 'text-green-600' : 'text-red-500'"
                >
                  {{ cat.type === 'income' ? '+' : '−' }}{{ fmt(cat.amount) }} {{ plan.currency }}
                </span>
                <button
                  @click="removeCategory(cat.id)"
                  class="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
            <li
              v-if="filteredCategories.length === 0"
              class="flex items-center justify-center h-20 text-slate-400 text-sm"
            >
              {{ t('noCategories') }}
            </li>
          </ul>

          <!-- Add form -->
          <div class="mt-4 pt-4 border-t border-slate-100">
            <div class="flex gap-2 mb-3">
              <button
                @click="newCat.type = 'income'"
                :class="
                  newCat.type === 'income'
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                "
                class="flex-1 py-2 rounded-xl border text-sm font-medium transition-all"
              >
                {{ t('addIncome') }}
              </button>
              <button
                @click="newCat.type = 'expense'"
                :class="
                  newCat.type === 'expense'
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                "
                class="flex-1 py-2 rounded-xl border text-sm font-medium transition-all"
              >
                {{ t('addExpense') }}
              </button>
            </div>
            <div class="flex gap-2">
              <input
                v-model="newCat.name"
                :placeholder="t('catNamePlaceholder')"
                class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent min-w-0"
                @keyup.enter="addCategory"
              />
              <input
                v-model="newCat.amount"
                type="number"
                min="0"
                :placeholder="t('amountPlaceholder')"
                class="w-24 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                @keyup.enter="addCategory"
              />
              <button
                @click="addCategory"
                class="bg-green-600 hover:bg-green-700 text-white px-4 rounded-xl font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Chart panel -->
        <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <h2 class="font-semibold text-slate-900">{{ t('visualization') }}</h2>
            <div class="flex gap-1.5">
              <button
                v-for="type in chartTypes"
                :key="type.value"
                @click="selectedChart = type.value"
                :class="
                  selectedChart === type.value
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                "
                class="p-2 rounded-xl transition-colors"
              >
                <component :is="type.icon" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <div v-if="plan.categories.length > 0">
            <PieChart
              v-if="selectedChart === 'pie'"
              :chartData="chartData"
              :options="chartOptions"
            />
            <DoughnutChart
              v-if="selectedChart === 'doughnut'"
              :chartData="chartData"
              :options="chartOptions"
            />
            <BarChart
              v-if="selectedChart === 'bar'"
              :chartData="chartData"
              :options="chartOptions"
            />

            <!-- Legend -->
            <div class="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
              <div
                v-for="cat in plan.categories"
                :key="cat.id"
                class="flex items-center gap-2 text-xs text-slate-600 min-w-0"
              >
                <div class="w-2 h-2 rounded-full flex-shrink-0" :style="{ backgroundColor: cat.color }" />
                <span class="truncate">{{ cat.name }}</span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center h-52 text-slate-300 gap-3"
          >
            <svg class="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a10 10 0 0110 10" />
            </svg>
            <p class="text-sm text-slate-400">{{ t('addCatsForChart') }}</p>
          </div>
        </div>
      </div>

      </div><!-- end pdfSection wrapper -->
    </main>
  </div>
</template>

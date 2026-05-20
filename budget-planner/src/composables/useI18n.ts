import { ref } from 'vue'

export type Locale = 'en' | 'ru' | 'kk'

const LOCALES: Record<string, Locale> = { ru: 'ru', be: 'ru', uk: 'ru', kk: 'kk', kz: 'kk' }

function detect(): Locale {
  const lang = (navigator.language || 'en').slice(0, 2).toLowerCase()
  return LOCALES[lang] ?? 'en'
}

// Module-level singleton — all components share one locale
const locale = ref<Locale>(detect())

const tr = {
  en: {
    tagline: 'Smart budget management',
    newPlan: 'New plan',
    noPlans: 'No budget plans',
    noPlansDesc: 'Create your first plan and start managing finances',
    createFirst: 'Create first plan',
    categoriesCount: (n: number) => `${n} ${n === 1 ? 'category' : 'categories'}`,
    budgetSpent: 'of budget spent',
    deletePlan: 'Delete this plan?',
    newBudgetPlan: 'New budget plan',
    name: 'Name',
    currency: 'Currency',
    cancel: 'Cancel',
    create: 'Create',
    namePlaceholder: 'e.g. May 2025',
    income: 'Income',
    expenses: 'Expenses',
    balance: 'Balance',
    categories: 'Categories',
    all: 'All',
    noCategories: 'No categories',
    incomeLabel: 'income',
    expenseLabel: 'expense',
    addIncome: '↑ Income',
    addExpense: '↓ Expense',
    catNamePlaceholder: 'Category name',
    amountPlaceholder: 'Amount',
    visualization: 'Visualization',
    addCatsForChart: 'Add categories to see a chart',
    downloadPdf: 'Download PDF',
    generating: 'Generating...',
    back: '← Back',
    planNotFound: 'Plan not found',
    rights: 'All rights reserved',
    support: 'Support the project',
    coffee: 'Buy me a coffee',
    intlLocale: 'en-US',
  },
  ru: {
    tagline: 'Умное управление бюджетом',
    newPlan: 'Новый план',
    noPlans: 'Нет бюджетных планов',
    noPlansDesc: 'Создайте первый план и начните управлять финансами',
    createFirst: 'Создать первый план',
    categoriesCount: (n: number) => `${n} ${n === 1 ? 'категория' : n < 5 ? 'категории' : 'категорий'}`,
    budgetSpent: 'бюджета израсходовано',
    deletePlan: 'Удалить этот план?',
    newBudgetPlan: 'Новый план бюджета',
    name: 'Название',
    currency: 'Валюта',
    cancel: 'Отмена',
    create: 'Создать',
    namePlaceholder: 'Например: Май 2025',
    income: 'Доходы',
    expenses: 'Расходы',
    balance: 'Баланс',
    categories: 'Категории',
    all: 'Все',
    noCategories: 'Нет категорий',
    incomeLabel: 'доход',
    expenseLabel: 'расход',
    addIncome: '↑ Доход',
    addExpense: '↓ Расход',
    catNamePlaceholder: 'Название',
    amountPlaceholder: 'Сумма',
    visualization: 'Визуализация',
    addCatsForChart: 'Добавьте категории для графика',
    downloadPdf: 'Скачать PDF',
    generating: 'Генерация...',
    back: '← Назад',
    planNotFound: 'План не найден',
    rights: 'Все права защищены',
    support: 'Поддержать проект',
    coffee: 'Угостить кофе',
    intlLocale: 'ru-RU',
  },
  kk: {
    tagline: 'Ақылды бюджет басқару',
    newPlan: 'Жаңа жоспар',
    noPlans: 'Бюджет жоспарлары жоқ',
    noPlansDesc: 'Бірінші жоспарды жасаңыз және қаржыны басқара бастаңыз',
    createFirst: 'Бірінші жоспарды жасау',
    categoriesCount: (n: number) => `${n} санат`,
    budgetSpent: 'бюджет жұмсалды',
    deletePlan: 'Осы жоспарды жою керек пе?',
    newBudgetPlan: 'Жаңа бюджет жоспары',
    name: 'Атауы',
    currency: 'Валюта',
    cancel: 'Болдырмау',
    create: 'Жасау',
    namePlaceholder: 'Мысалы: Мамыр 2025',
    income: 'Кіріс',
    expenses: 'Шығыс',
    balance: 'Баланс',
    categories: 'Санаттар',
    all: 'Барлығы',
    noCategories: 'Санаттар жоқ',
    incomeLabel: 'кіріс',
    expenseLabel: 'шығыс',
    addIncome: '↑ Кіріс',
    addExpense: '↓ Шығыс',
    catNamePlaceholder: 'Атауы',
    amountPlaceholder: 'Сомасы',
    visualization: 'Визуализация',
    addCatsForChart: 'График үшін санаттар қосыңыз',
    downloadPdf: 'PDF жүктеу',
    generating: 'Жасалуда...',
    back: '← Артқа',
    planNotFound: 'Жоспар табылмады',
    rights: 'Барлық құқықтар қорғалған',
    support: 'Жобаны қолдау',
    coffee: 'Кофе сатып ал',
    intlLocale: 'kk-KZ',
  },
}

export type T = typeof tr.en

export function useI18n() {
  // t() reads locale.value → templates re-render on locale change automatically
  const t = <K extends keyof T>(key: K): T[K] => tr[locale.value][key] as T[K]

  return {
    locale,
    t,
    setLocale: (l: Locale) => {
      locale.value = l
    },
  }
}

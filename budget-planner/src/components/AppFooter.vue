<script setup lang="ts">
import { useI18n, type Locale } from '@/composables/useI18n'

// ─── Replace with your Ko-fi username ───────────────────────────────────────
const KOFI_USERNAME = 'YOUR_KOFI_USERNAME'
// ────────────────────────────────────────────────────────────────────────────

const { locale, t, setLocale } = useI18n()
const year = new Date().getFullYear()

const langs: { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'kk', label: 'KZ' },
]
</script>

<template>
  <footer class="border-t border-slate-100 bg-white">
    <div class="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">

      <!-- Left: copyright -->
      <p class="text-xs text-slate-400 select-none">
        © {{ year }} <span class="text-slate-500 font-medium">temirdev</span>
        &nbsp;·&nbsp;
        {{ t('rights') }}
      </p>

      <!-- Center: Ko-fi -->
      <a
        :href="`https://ko-fi.com/${KOFI_USERNAME}`"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-500 transition-colors group"
      >
        <svg class="w-3.5 h-3.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 2.424 2.586 2.672 2.586 2.672s8.267-.023 11.966-.049c2.438-.426 2.683-2.566 2.658-3.734 4.352.24 7.422-2.831 6.649-6.916zm-11.062 3.511c-1.246 1.453-4.011 3.976-4.011 3.976s-.121.119-.31.023c-.076-.057-.108-.09-.108-.09-.443-.441-3.368-3.049-4.034-3.954-.709-.965-1.041-2.7-.091-3.71.951-1.01 3.005-1.086 4.363.407 0 0 1.565-1.782 3.468-.963 1.904.82 1.832 3.011.723 4.311zm6.173.478c-.928.116-1.682.028-1.682.028V7.284h1.77s1.971.551 1.971 2.638c0 1.913-.985 2.667-2.059 3.015z"/>
        </svg>
        {{ t('coffee') }}
      </a>

      <!-- Right: language switcher -->
      <div class="flex items-center gap-1 text-xs">
        <template v-for="(lang, i) in langs" :key="lang.code">
          <button
            @click="setLocale(lang.code)"
            :class="locale === lang.code
              ? 'text-slate-700 font-medium'
              : 'text-slate-400 hover:text-slate-600'"
            class="transition-colors px-0.5"
          >
            {{ lang.label }}
          </button>
          <span v-if="i < langs.length - 1" class="text-slate-200">·</span>
        </template>
      </div>

    </div>
  </footer>
</template>

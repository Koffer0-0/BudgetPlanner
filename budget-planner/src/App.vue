<script setup lang="ts">
import { ref, computed } from "vue";
import {PieChart} from "vue-chart-3";
import { Chart, registerables } from "chart.js";

// Регистрируем модули Chart.js
Chart.register(...registerables);

const totalBudget = ref(500000); // Общий бюджет
const category = ref({ name: "", amount: 0 });

const categories = ref([
  { id: 1, name: "Коммуналка", amount: 30200 },
  { id: 2, name: "Кредит", amount: 50000 },
  { id: 3, name: "Продукты", amount: 50000 },
  { id: 4, name: "Откладывание", amount: 70000 },
  { id: 5, name: "Свободные деньги", amount: 50000 },
]);

const options = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      display: false, // Отключаем отображение легенды
    },
  },
}));
const budgetData = computed(() => ({
  labels: categories.value.map((c) => c.name),
  datasets: [
    {
      data: categories.value.map((c) => c.amount),
      backgroundColor: categories.value.map((c) => c.color),
    },
  ],
}));

function addCategory() {
  if (category.value.name && category.value.amount) {
    categories.value.push({
      id: Date.now(), // Генерируем уникальный id
      name: category.value.name,
      amount: Number(category.value.amount),
      color: getRandomColor(),
    });
    category.value.name = "";
    category.value.amount = 0;
  }
}

function removeCategory(id: number) {
  categories.value = categories.value.filter((category) => category.id !== id);
}
</script>

<template>
  <section class="bg-white min-h-screen p-8">
    <div class="max-w-6xl mx-auto text-center">
      <h1 class="text-6xl font-extrabold text-green-900">Monthly Budget Planner</h1>
      <p class="text-gray-600 mt-2">Управляй своим бюджетом легко!</p>

      <!-- Ввод общего бюджета -->
      <div class="mt-6 bg-gray-100 p-4 rounded-lg">
        <label class="block text-lg font-semibold text-gray-700">Общий бюджет:</label>
        <input
          v-model="totalBudget"
          type="number"
          class="mt-2 p-2 w-75 border rounded-md"
        />
      </div>

      <!-- Ввод новой категории -->
      <div class="mt-6 bg-gray-100 p-4 rounded-lg">
        <div class="flex gap-2 items-center justify-center">
          <input
            v-model="category.amount"
            type="number"
            class="p-2 border rounded-md w-36 text-center"
            min="0"
            placeholder="0"
          />
          <input
            v-model="category.name"
            class="p-2 border rounded-md w-1/3 min-w-[120px]"
            placeholder="Название"
          />
          <button
            @click="addCategory"
            class="bg-green-500 text-white px-2 py-2 rounded-md text-2xl"
          >
            <IconPlus/>
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
        <!-- Список категорий -->
        <div class="mt-6 bg-gray-100 p-4 rounded-lg" v-if="categories.length > 0">
          <h2 class="text-xl font-bold mb-2">Категории расходов</h2>
          <ul class="space-y-2">
            <li
              v-for="category in categories"
              :key="category.name"
              class="flex justify-between items-center px-4 py-3 rounded text-black shadow-md"
            >
              <span class="text-lg font-semibold">{{ category.name }}</span>
              <div class="flex gap-2">
                <span class="text-lg">{{ category.amount }}₸</span>
                <button @click="removeCategory(category.id)" class="text-white text-sm">
                  ✖
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- Диаграмма -->
        <div class="mt-8">
          <PieChart :chartData="budgetData" :options="options"/>
        </div>
      </div>
    </div>
  </section>
</template>

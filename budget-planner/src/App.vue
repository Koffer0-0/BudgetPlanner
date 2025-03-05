<script setup lang="ts">
import {ref, computed} from "vue";
import {
  BarChart,
  DoughnutChart,
  PieChart,
} from "vue-chart-3";
import {Chart, registerables} from "chart.js";
import IconPlus from "@/components/icons/IconPlus.vue";
import BarIcon from "@/components/icons/BarIcon.vue";
import DonutIcon from "./components/icons/DonutIcon.vue";
import PieIcon from "@/components/icons/PieIcon.vue";
import CloseIcon from "@/components/icons/CloseIcon.vue";
// Регистрируем модули Chart.js
Chart.register(...registerables);

const totalBudget = ref(500000); // Общий бюджет
const chartTypes = [
  { value: "pie", icon: PieIcon },
  { value: "doughnut", icon: DonutIcon },
  { value: "bar", icon: BarIcon },
];
const category = ref({name: "", amount: 0});
const currency = ref("₸")
const categories = ref([
  {id: 1, name: "Коммуналка", amount: 30200, color: "#FF6384"},
  {id: 2, name: "Кредит", amount: 50000, color: "#36A2EB"},
  {id: 3, name: "Продукты", amount: 50000, color: "#FFCE56"},
  {id: 4, name: "Откладывание", amount: 70000, color: "#4BC0C0"},
  {id: 5, name: "Свободные деньги", amount: 50000, color: "#9966FF"},
]);
const selectedChart = ref("pie"); // По умолчанию Pie Chart

const options = computed(() => ({
  responsive: true,
  plugins: {
    legend: {
      display: false, // Отключаем отображение легенды
    },
  },
}));

// Вычисляем остаток бюджета
const remainingBudget = computed(() => {
  return totalBudget.value - categories.value.reduce((sum, cat) => sum + cat.amount, 0);
});

// Данные для графика
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

const getRandomColor = () => {
  return `hsla(${~~(360 * Math.random())}, 80%,  65%, 0.8)`
};
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
        <p class="text-gray-700 font-bold mt-2">Остаток: {{ remainingBudget }} {{ currency }}</p>
        <p v-if="remainingBudget < 0" class="text-red-600 font-bold">Вы вышли за бюджет!</p>
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
            @keyup.enter="addCategory"
          />
          <input
            v-model="category.name"
            class="p-2 border rounded-md w-1/3 min-w-[120px]"
            placeholder="Название"
            @keyup.enter="addCategory"
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
              :style="{ backgroundColor: category.color }"
            >
              <span class="text-lg font-semibold">{{ category.name }}</span>
              <div class="flex gap-2">
                <span class="text-lg">{{ category.amount }} {{ currency }}</span>
                <button @click="removeCategory(category.id)" class="text-sm">
                  <CloseIcon/>
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div class="mt-6">
          <div class="flex space-x-3 mb-4 justify-end">
            <button
              v-for="type in chartTypes"
              :key="type.value"
              @click="selectedChart = type.value"
              :class="['px-4 py-2 rounded', selectedChart === type.value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600']"
            >
              <component :is="type.icon" class="h-8 w-8"/>
            </button>
          </div>
          <!-- Диаграмма -->
          <div class="mt-8">
            <PieChart v-if="selectedChart === 'pie'" :chartData="budgetData" :options="options"/>
            <DoughnutChart v-if="selectedChart === 'doughnut'" :chartData="budgetData"
                           :options="options"/>
            <BarChart v-if="selectedChart === 'bar'" :chartData="budgetData" :options="options"/>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

// Конфигурация
const POKEMONS_PER_PAGE = 12;
let currentPage = 1;
let totalPages = 1;
let allPokemons = [];

// DOM элементы
const elements = {
  listWrapper: document.querySelector(".list-wrapper"),
  firstButton: document.getElementById("firstButton"),
  prevButton: document.getElementById("prevButton"),
  nextButton: document.getElementById("nextButton"),
  lastButton: document.getElementById("lastButton"),
  pageInput: document.getElementById("pageInput"),
  pageInfo: document.getElementById("pageInfo"),
  goButton: document.querySelector(".pagination__button--go"),
  loader: document.createElement("div"),
};

// Инициализация лоадера
// Инициализация лоадера
elements.loader.innerHTML = `
  <div class="loader-container">
    <div class="o-pokeball u-tada"></div>
    <p>Pokémons are coming...</p>
  </div>
`;

document.body.appendChild(elements.loader);


// Инициализация приложения
document.addEventListener("DOMContentLoaded", initApp);

async function initApp() {
  setupEventListeners();
  await fetchTotalPokemonCount();
  await loadPokemons();
}

// Получение общего количества покемонов с ID < 10000
async function fetchTotalPokemonCount() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=20000");
    const data = await response.json();
    
    // Фильтруем только покемонов с ID < 10000
    const filteredPokemons = data.results.filter(pokemon => getPokemonIDFromURL(pokemon.url) < 100000);
    totalPages = Math.ceil(filteredPokemons.length / POKEMONS_PER_PAGE);
    
    allPokemons = filteredPokemons; // Сохраняем всех покемонов с id < 10000
  } catch (error) {
    console.error("Error fetching total Pokémon count:", error);
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  elements.firstButton.addEventListener("click", () => loadPage(1));
  elements.prevButton.addEventListener("click", () => loadPage(currentPage - 1));
  elements.nextButton.addEventListener("click", () => loadPage(currentPage + 1));
  elements.lastButton.addEventListener("click", () => loadPage(totalPages));
  elements.goButton.addEventListener("click", handleGoButtonClick);
  elements.pageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleGoButtonClick();
  });
}

// Загрузка покемонов с ID > 10000
async function loadPokemons() {
    try {
      elements.listWrapper.innerHTML = "";
      // Показываем лоадер
      elements.loader.style.display = "flex";
  
      const start = (currentPage - 1) * POKEMONS_PER_PAGE;
      const end = start + POKEMONS_PER_PAGE;
      const pokemonsToLoad = allPokemons.slice(start, end);
  
      const pokemonDataList = await Promise.all(
        pokemonsToLoad.map(pokemon => fetchPokemonData(getPokemonIDFromURL(pokemon.url)))
      );
  
      displayPokemons(pokemonsToLoad, pokemonDataList);
      updatePaginationUI();
    } catch (error) {
      console.error("Error loading pokemons:", error);
    } finally {
      // Скрываем лоадер после загрузки данных
      elements.loader.style.display = "none";
    }
  }
  
// Отображение покемонов
function displayPokemons(pokemons, pokemonDataList) {
  elements.listWrapper.innerHTML = "";

  const fragment = document.createDocumentFragment();
  pokemons.forEach((pokemon, index) => {
    if (pokemonDataList[index]) {
      const pokemonID = getPokemonIDFromURL(pokemon.url);
      const card = createPokemonCard(pokemon, pokemonID, pokemonDataList[index]);
      fragment.appendChild(card);
    }
  });

  elements.listWrapper.appendChild(fragment);
}

// Создание карточки покемона
function createPokemonCard(pokemon, pokemonID, pokemonData) {
    if (!pokemonData) return document.createElement("div");
  
    const card = document.createElement("div");
    card.className = "card";
  
    const types = pokemonData.types.map(type => type.type.name);
    const typesHTML = types.map(type => `
      <div class="card__type ${type}">
        <img src="img/types/${type}.svg" title="${type}" alt="${type}"/>
        <div>${type}</div>
      </div>
    `).join("");
  
    card.innerHTML = `
      <div class="card__id">#${String(pokemonID).padStart(4, '0')}</div>
      <div class="card__img">
        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonID}.png"
             alt="${pokemon.name}"
             loading="lazy"
             onload="this.classList.add('loaded')">
      </div>
      <div class="card__name">${capitalizeFirstLetter(pokemon.name)}</div>
      <div class="card__types">${typesHTML}</div>
    `;
  
    return card;
  }

// Загрузка данных покемона
async function fetchPokemonData(id) {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch Pokemon data for ID ${id}:`, error);
    return null;
  }
}

// Получение ID покемона из URL
function getPokemonIDFromURL(url) {
  const segments = url.split("/").filter(Boolean);
  return parseInt(segments[segments.length - 1], 10);
}

// Пагинация
async function loadPage(page) {
  page = Math.max(1, Math.min(page, totalPages));
  if (page === currentPage) return;

  currentPage = page;
  await loadPokemons();
}

function handleGoButtonClick() {
  const page = parseInt(elements.pageInput.value, 10);
  if (!isNaN(page) && page >= 1 && page <= totalPages) {
    loadPage(page);
  } else {
    elements.pageInput.value = currentPage;
  }
}

function updatePaginationUI() {
  elements.pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  elements.pageInput.value = currentPage;

  elements.firstButton.disabled = currentPage === 1;
  elements.prevButton.disabled = currentPage === 1;
  elements.nextButton.disabled = currentPage === totalPages;
  elements.lastButton.disabled = currentPage === totalPages;
}

// Вспомогательные функции
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Get the elements once and cache them for reuse
const searchInput = document.getElementById("search__input");
const clearButton = document.getElementById("search__clear");

let filteredPokemons = []; // Переменная для хранения отфильтрованных покемонов

// Обработчик поиска
searchInput.addEventListener("input", handleSearch);

function handleSearch() {
  const searchTerm = searchInput.value.toLowerCase().trim();

  if (!searchTerm) {
    // Если строка поиска пустая, возвращаем стандартное отображение
    resetSearch();
  } else {
    filterAndDisplayPokemons(searchTerm);
  }
}

// Функция для сброса поиска и отображения всех покемонов
function resetSearch() {
  filteredPokemons = []; // Очищаем список отфильтрованных покемонов
  totalPages = Math.ceil(allPokemons.length / POKEMONS_PER_PAGE);
  currentPage = 1;
  loadPokemons();
  clearButton.style.display = 'none'; // Скрываем крестик
}

// Функция для фильтрации покемонов по поисковому запросу
function filterAndDisplayPokemons(searchTerm) {
  filteredPokemons = allPokemons.filter(pokemon => {
    const pokemonID = getPokemonIDFromURL(pokemon.url).toString();
    const pokemonName = pokemon.name.toLowerCase();
    return pokemonID.includes(searchTerm) || pokemonName.includes(searchTerm);
  });

  if (filteredPokemons.length === 0) {
    displayNoResultsMessage();
  } else {
    totalPages = Math.ceil(filteredPokemons.length / POKEMONS_PER_PAGE);
    currentPage = 1; // Начинаем с первой страницы отфильтрованных покемонов
    displayFilteredPokemons();
  }
}

// Функция для отображения сообщения "No Pokémon found"
function displayNoResultsMessage() {
  elements.listWrapper.innerHTML = `
    <div class="no-results">No Pokémon found</div>
  `;
}

// Отображение отфильтрованных покемонов
async function displayFilteredPokemons() {
  elements.listWrapper.innerHTML = "";
  elements.loader.style.display = "flex";

  try {
    const start = (currentPage - 1) * POKEMONS_PER_PAGE;
    const end = start + POKEMONS_PER_PAGE;
    const pokemonsToLoad = filteredPokemons.slice(start, end);

    const pokemonDataList = await Promise.all(
      pokemonsToLoad.map(pokemon => fetchPokemonData(getPokemonIDFromURL(pokemon.url)))
    );

    displayPokemons(pokemonsToLoad, pokemonDataList);
    updatePaginationUI();
  } catch (error) {
    console.error("Error displaying filtered pokemons:", error);
  } finally {
    elements.loader.style.display = "none";
  }
}

// Функция для сброса поиска (если поисковая строка пуста)
function clearSearch() {
  searchInput.value = '';
  clearButton.style.display = 'none';
  resetSearch();
}

searchInput.addEventListener('input', () => {
  clearButton.style.display = searchInput.value ? 'block' : 'none';
});

// Пагинация для отфильтрованных покемонов
async function loadPage(page) {
  page = Math.max(1, Math.min(page, totalPages));
  if (page === currentPage) return;

  currentPage = page;
  if (filteredPokemons.length > 0) {
    await displayFilteredPokemons();
  } else {
    await loadPokemons();
  }
}



const sortSelect = document.getElementById('sortSelect');

let currentSort = 'id-asc'; // Сортировка по ID по умолчанию

// При изменении выбора сортировки
sortSelect.addEventListener('change', () => {
    currentSort = sortSelect.value;
    sortPokemons();
});

// Функция сортировки покемонов
function sortPokemons() {
    if (currentSort === 'id-asc') {
        allPokemons.sort((a, b) => getPokemonIDFromURL(a.url) - getPokemonIDFromURL(b.url));
    } else if (currentSort === 'id-desc') {
        allPokemons.sort((a, b) => getPokemonIDFromURL(b.url) - getPokemonIDFromURL(a.url));
    } else if (currentSort === 'name-asc') {
        allPokemons.sort((a, b) => a.name.localeCompare(b.name));
    } else if (currentSort === 'name-desc') {
        allPokemons.sort((a, b) => b.name.localeCompare(a.name));
    }

    loadPokemons(); // Перерисовываем список покемонов
}
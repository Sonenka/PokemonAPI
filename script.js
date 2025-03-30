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
    const filteredPokemons = data.results.filter(pokemon => getPokemonIDFromURL(pokemon.url) < 10000);
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
      const pokemonsToLoad = allPokemons.slice(start, end); // Берем только нужные
  
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

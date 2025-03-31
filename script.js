// Конфигурация
const POKEMONS_PER_PAGE = 12;
let currentPage = 1;
let totalPages = 1;
let allPokemons = [];
let filteredPokemons = [];
let currentSort = 'id-asc';
let currentFilterType = "";

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
  loader: document.querySelector(".loader-container"),
  filterSelect: document.getElementById("filterSelect"),
  sortSelect: document.getElementById("sortSelect"),
  searchInput: document.getElementById("search__input"),
  searchClear: document.getElementById("search__clear")
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
    try {
      // Показываем лоадер при загрузке
      elements.loader.style.display = "flex";
      
      // Загружаем всех покемонов
      await fetchAllPokemons();
      
      // Сортируем покемонов
      sortPokemons();
      
      // Загружаем первую страницу
      await loadPokemons();
      
      // Настраиваем обработчики событий
      setupEventListeners();
    } catch (error) {
      console.error("Error initializing app:", error);
    } finally {
      // Скрываем лоадер после загрузки
      elements.loader.style.display = "none";
    }
  }

async function fetchTotalPokemonCount() {
  try {
    const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=20000");
    const data = await response.json();
    
    const filteredPokemons = data.results.filter(pokemon => getPokemonIDFromURL(pokemon.url) < 100000);
    totalPages = Math.ceil(filteredPokemons.length / POKEMONS_PER_PAGE);
    
    allPokemons = filteredPokemons;
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
    
    elements.filterSelect.addEventListener("change", handleTypeFilterChange);
    elements.searchInput.addEventListener("input", handleSearch);
    elements.searchClear.addEventListener("click", clearSearch);
  }

async function loadPokemons() {
    try {
      elements.listWrapper.innerHTML = "";
      elements.loader.style.display = "flex";
      
      // Определяем, какие покемоны загружать (все или отфильтрованные)
      const pokemonsToLoad = currentFilterType ? filteredPokemons : allPokemons;
      totalPages = Math.ceil(pokemonsToLoad.length / POKEMONS_PER_PAGE);
      
      // Получаем покемонов для текущей страницы
      const start = (currentPage - 1) * POKEMONS_PER_PAGE;
      const end = start + POKEMONS_PER_PAGE;
      const currentPagePokemons = pokemonsToLoad.slice(start, end);
      
      // Загружаем данные для каждого покемона
      const pokemonDataList = await Promise.all(
        currentPagePokemons.map(pokemon => fetchPokemonData(getPokemonIDFromURL(pokemon.url)))
      );
      
      // Отображаем покемонов
      displayPokemons(currentPagePokemons, pokemonDataList);
      updatePaginationUI();
    } catch (error) {
      console.error("Error loading pokemons:", error);
    } finally {
      elements.loader.style.display = "none";
    }
  }
  
// Отображение покемонов
function displayPokemons(pokemons, pokemonDataList) {
    elements.listWrapper.innerHTML = "";
    elements.listWrapper.style.opacity = "0"; // Скрываем, пока не загрузятся все картинки

    const fragment = document.createDocumentFragment();
    const imageLoadPromises = [];

    pokemons.forEach((pokemon, index) => {
        if (pokemonDataList[index]) {
            const pokemonID = getPokemonIDFromURL(pokemon.url);
            const { card, imageLoadPromise } = createPokemonCard(pokemon, pokemonID, pokemonDataList[index]);

            imageLoadPromises.push(imageLoadPromise);
            fragment.appendChild(card);
        }
    });

    elements.listWrapper.appendChild(fragment);

    // Ждём, пока загрузятся ВСЕ картинки, потом показываем карточки
    Promise.all(imageLoadPromises).then(() => {
        elements.listWrapper.style.opacity = "1";
    });
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
      <div class="card__img"></div>
      <div class="card__name">${capitalizeFirstLetter(pokemon.name)}</div>
      <div class="card__types">${typesHTML}</div>
    `;

    // Создаём изображение вручную
    const img = document.createElement("img");
    img.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonID}.png`;
    img.alt = pokemon.name;
    img.loading = "lazy";
    
    // Делаем промис для отслеживания загрузки изображения
    const imageLoadPromise = new Promise((resolve) => {
        img.onload = () => {
            img.classList.add('loaded');
            resolve();
        };
        img.onerror = () => resolve(); // Если ошибка, все равно разрешаем промис
    });

    // Вставляем изображение в карточку
    card.querySelector(".card__img").appendChild(img);

    return { card, imageLoadPromise };
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
    
    if (currentFilterType) {
      await filterPokemonsByType(currentFilterType);
    } else {
      await loadPokemons();
    }
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

function handleSearch() {
  const searchTerm = elements.searchInput.value.toLowerCase().trim();

  if (!searchTerm) {
    // Если строка поиска пустая, возвращаем стандартное отображение
    resetSearch();
  } else {
    filterAndDisplayPokemons(searchTerm);
  }

  // Показываем или скрываем крестик
  elements.searchClear.style.display = searchTerm ? "block" : "none";
}

// Функция для сброса поиска и отображения всех покемонов
function resetSearch() {
  filteredPokemons = []; 
  currentPage = 1;
  loadPokemons(); // Загружаем всех покемонов обратно
  elements.searchClear.style.display = 'none'; 
}

// Функция для фильтрации покемонов по поисковому запросу
function filterAndDisplayPokemons(searchTerm) {
  filteredPokemons = allPokemons.filter(pokemon => {
    const pokemonID = getPokemonIDFromURL(pokemon.url).toString();
    const pokemonName = pokemon.name.toLowerCase();
    return pokemonID.includes(searchTerm) || pokemonName.includes(searchTerm);
  });

  totalPages = Math.ceil(filteredPokemons.length / POKEMONS_PER_PAGE);
  currentPage = 1; 

  if (filteredPokemons.length === 0) {
    displayNoResultsMessage();
  } else {
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
    updatePaginationUI(); // Обновляем пагинацию после поиска
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





async function handleTypeFilterChange() {
    currentFilterType = elements.filterSelect.value;
    
    if (currentFilterType === "") {
      // Если выбран "All Types", сбрасываем фильтрацию
      resetTypeFilter();
    } else {
      // Фильтруем покемонов по выбранному типу
      await filterPokemonsByType(currentFilterType);
    }
  }

  async function filterPokemonsByType(type) {
    try {
      elements.listWrapper.innerHTML = "";
      elements.loader.style.display = "flex";
      
      // Сначала получаем данные всех покемонов
      const pokemonDataList = await Promise.all(
        allPokemons.map(pokemon => fetchPokemonData(getPokemonIDFromURL(pokemon.url)))
      );
      
      // Фильтруем покемонов по типу
      filteredPokemons = allPokemons.filter((pokemon, index) => {
        const pokemonData = pokemonDataList[index];
        return pokemonData && pokemonData.types.some(t => t.type.name === type);
      });
      
      totalPages = Math.ceil(filteredPokemons.length / POKEMONS_PER_PAGE);
      currentPage = 1;
      
      if (filteredPokemons.length === 0) {
        displayNoResultsMessage();
      } else {
        // Загружаем данные для отображения (только для текущей страницы)
        const start = (currentPage - 1) * POKEMONS_PER_PAGE;
        const end = start + POKEMONS_PER_PAGE;
        const currentPagePokemons = filteredPokemons.slice(start, end);
        
        const currentPageData = await Promise.all(
          currentPagePokemons.map(pokemon => fetchPokemonData(getPokemonIDFromURL(pokemon.url)))
        );
        
        displayPokemons(currentPagePokemons, currentPageData);
      }
      
      updatePaginationUI();
    } catch (error) {
      console.error("Error filtering pokemons by type:", error);
    } finally {
      elements.loader.style.display = "none";
    }
  }

  function resetTypeFilter() {
    currentFilterType = "";
    filteredPokemons = [];
    currentPage = 1;
    loadPokemons();
  }

  async function fetchAllPokemons() {
    try {
      const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=11000");
      const data = await response.json();
      
      // Фильтруем только покемонов с ID < 10000
      allPokemons = data.results.filter(pokemon => {
        const id = getPokemonIDFromURL(pokemon.url);
        return id < 100000;
      });
      
      totalPages = Math.ceil(allPokemons.length / POKEMONS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching all pokemons:", error);
      throw error;
    }
  }
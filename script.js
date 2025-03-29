// Переключение меню фильтрации
document.getElementById("filter-btn").addEventListener("click", function() {
    document.getElementById("filter-menu").classList.toggle("search__menu--active");
    document.getElementById("sort-menu").classList.remove("search__menu--active");
});

// Переключение меню сортировки
document.getElementById("sort-btn").addEventListener("click", function() {
    document.getElementById("sort-menu").classList.toggle("search__menu--active");
    document.getElementById("filter-menu").classList.remove("search__menu--active");
});

// Закрытие меню при клике вне их области
document.addEventListener("click", function(event) {
    if (!event.target.closest(".search__button")) {
        document.getElementById("filter-menu").classList.remove("search__menu--active");
        document.getElementById("sort-menu").classList.remove("search__menu--active");
    }
});

const MAX_POKEMON = 12;
const listWrapper = document.querySelector(".list-wrapper");
const searchInput = document.getElementById("search__input");

let allPokemons = [];

fetch(`https://pokeapi.co/api/v2/pokemon?limit=${MAX_POKEMON}&offset=0`)
    .then((response) => response.json())
    .then((data) => {
        allPokemons = data.results;
        displayPokemons(allPokemons);
    })
    .catch(error => {
        console.error("Error fetching pokemons:", error);
    });

async function fetchPokemonData(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch Pokemon data for ID ${id}:`, error);
        return null;
    }
}

async function displayPokemons(pokemonList) {
    listWrapper.innerHTML = "";

    // Обрабатываем покемонов последовательно, чтобы избежать проблем с порядком
    for (const pokemon of pokemonList) {
        try {
            const pokemonID = pokemon.url.split("/")[6];
            const pokemonData = await fetchPokemonData(pokemonID);
            

            const types = pokemonData.types.map(typeInfo => typeInfo.type.name);
            
            const listItem = document.createElement("div");
            listItem.className = "card";
            listItem.innerHTML = `
                <div class="card__id">#${pokemonID.padStart(4, '0')}</div>
                <div class="card__img">
                    <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonID}.png" 
                         alt="${pokemon.name}" 
                         loading="lazy">
                </div>
                <div class="card__name">${pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1)}</div>
                <div class="card__types"></div>
            `;

            listWrapper.appendChild(listItem);
            
            types.forEach(type => {
                console.log(type);
                const typesContainer = listItem.querySelector(".card__types");

                const typeElement = document.createElement('div');
                typeElement.classList = 'card__type';
                typeElement.classList.add(type);
                typeElement.innerHTML = `
                    <img src="img/types/${type}.svg" title="${type}" alt="${type}"/>
                    <div>${type}</div>
                `;

                typesContainer.appendChild(typeElement);
            });
        } catch (error) {
            console.error(`Error displaying pokemon ${pokemon.name}:`, error);
        }
    }
}

// Оптимизированная функция поиска с задержкой
let searchTimeout;
searchInput.addEventListener("input", function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        handleSearch();
    }, 300);
});

function handleSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        displayPokemons(allPokemons);
        return;
    }
    
    const filteredPokemons = allPokemons.filter(pokemon => {
        const pokemonID = pokemon.url.split("/")[6];
        return pokemon.name.toLowerCase().includes(searchTerm) || 
               pokemonID.toString().includes(searchTerm);
    });
    
    displayPokemons(filteredPokemons);
}
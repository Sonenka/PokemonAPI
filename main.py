import requests

# Запрос информации о Пикачу
response = requests.get("https://pokeapi.co/api/v2/pokemon/pikachu")
data = response.json()

# 1. Основная информация
print(f"Имя: {data['name'].capitalize()}")  # Пикачу
print(f"ID: {data['id']}")                 # 25
print(f"Вес: {data['weight']} кг")         # 60 кг
print(f"Рост: {data['height']} дм")        # 4 дм (дециметра)

# 2. Типы покемона (Electric, Flying и т.д.)
types = [t["type"]["name"] for t in data["types"]]
print(f"Типы: {', '.join(types)}")         # electric

# 3. Способности (Static, Lightning Rod и т.д.)
abilities = [a["ability"]["name"] for a in data["abilities"]]
print(f"Способности: {', '.join(abilities)}")  # static, lightning-rod

# 4. Ссылка на стандартный спрайт (изображение)
sprite_url = data["sprites"]["front_default"]
print(f"Спрайт: {sprite_url}")  # https://raw.githubusercontent.com/.../25.png
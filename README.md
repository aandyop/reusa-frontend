# ReUsa — Frontend ♻️

Plataforma web de economía circular, donación e intercambio comunitario de artículos y mobiliario para el hogar.

---

## Tecnologías usadas

* **Framework:** React 19 + Vite
* **Estilos:** Tailwind CSS
* **Iconografía:** Lucide React
* **Mapas:** Leaflet.js + OpenStreetMap

---

## Instalación y Ejecución Local

Sigue estos pasos para clonar e iniciar el proyecto en tu computadora:

### 1. Clonar el repositorio
```bash
git clone [https://github.com/aandyop/reusa-frontend.git](https://github.com/aandyop/reusa-frontend.git)
cd reusa-frontend
```

### 2. Instalar dependencias
Asegúrate de tener instalado Node.js (versión 18 o superior) y ejecuta:

```bash
npm install
```
### 3. Configurar variables de entorno
Crea un archivo .env en la raíz del proyecto y define la URL base del servidor backend:

Fragmento de código:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```
### 4. Iniciar el servidor de desarrollo
```bash
npm run dev
```
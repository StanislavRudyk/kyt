/* Shared presentation helpers and canonical catalog categories.
   Vehicle records themselves come only from /api/v1/vehicles. */

const IMG = (slug) => `assets/images/${slug}.jpg`;
const fmtMoney = (n) => Math.round(n).toLocaleString('uk-UA') + ' ₴';
const fmtKm = (n) => n.toLocaleString('uk-UA') + ' км';

// Homepage sections share this in-memory request instead of fetching the same catalog three times.
let vehicleCatalogPromise = null;
function getVehicleCatalog() {
  if (!vehicleCatalogPromise) {
    vehicleCatalogPromise = fetch('/api/v1/vehicles')
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.detail || 'Каталог тимчасово недоступний.');
        if (!Array.isArray(data)) throw new Error('Сервер повернув некоректний каталог.');
        return data;
      })
      .catch((error) => { vehicleCatalogPromise = null; throw error; });
  }
  return vehicleCatalogPromise;
}

Object.assign(window, { IMG, fmtMoney, fmtKm, getVehicleCatalog });

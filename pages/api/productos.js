import axios from 'axios';
import Papa from 'papaparse';

let cacheData = null;
let cacheTime = 0;
const CACHE_TTL = 600 * 1000;

const BLUE_API = "https://api.bluelytics.com.ar/v2/latest";

export default async function handler(req, res) {
  const now = Date.now();
  if (cacheData && now - cacheTime < CACHE_TTL) {
    return res.status(200).json(cacheData);
  }

  try {
    const dolarRes = await axios.get(BLUE_API);
    const dolarBlue = parseFloat(dolarRes.data.blue.value_sell);

    const descripcionesRes = await axios.get("https://docs.google.com/spreadsheets/d/e/2PACX-1vTH1RfD5gdv7KjRlfUEoH5zTtFtva0OLPsNnVNUZ-OTczOc7UIqsisNefFgraGKBP2Ic60p4dp4nVu2/pub?output=csv");

    const descripciones = await new Promise((resolve) => {
      const mapa = {};
      Papa.parse(descripcionesRes.data, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          results.data.forEach((row) => {
            const cod = (row.cod_item || '').toString().trim().toUpperCase();
            const desc = (row.descripcion || '').toString().trim();
            if (cod && desc) mapa[cod] = desc;
          });
          resolve(mapa);
        }
      });
    });

    const items = [];
    let offset = 0;
    const token = process.env.DUX_TOKEN;

    while (true) {
      const url = `https://erp.duxsoftware.com.ar/WSERP/rest/services/items?limit=50&offset=${offset}`;
      const headers = { Authorization: token || '', Accept: "application/json" };
      const resp = await axios.get(url, { headers });

      const batch = resp.data.results || [];
      if (batch.length === 0) break;

      items.push(...batch);
      if (batch.length < 50) break;
      offset += 50;
    }

    const productos = items.map(item => {
      const nombre = (item.name || '').trim().toUpperCase();
      const descripcion = descripciones[nombre] || "";
      const precioUsd = parseFloat(item.price || 0);
      const moneda = (item.currency_code || '').toUpperCase();
      const precioLocal = moneda === "USD" ? Math.round(precioUsd * dolarBlue) : item.price;

      return {
        nombre,
        descripcion,
        precio_usd: parseInt(precioUsd.toString()),
        moneda,
        precio_local: precioLocal
      };
    });

    cacheData = { productos };
    cacheTime = now;
    res.status(200).json(cacheData);

  } catch (error) {
    console.error("ERROR AL OBTENER PRODUCTOS:", error.message);
    res.status(500).json({ error: "Error interno al procesar productos." });
  }
}

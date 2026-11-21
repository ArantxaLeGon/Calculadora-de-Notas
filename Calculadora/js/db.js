// Módulo de conexión a IndexedDB.
// Solo abre la base y crea los ObjectStores. Las operaciones
// (guardar, leer) se agregan en las fases siguientes.

export const DB_NAME = "NotesCalculator";
export const DB_VERSION = 1;
export const STORE_USUARIOS = "usuarios";
export const STORE_CALCULOS = "calculos";

let dbInstance = null; // Se reutiliza la misma conexión

/**
 * Abre la base de datos (la crea si no existe).
 * @returns {Promise<IDBDatabase>}
 */
export function abrirDB() {
  // Si ya hay una conexión abierta, la devolvemos
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open(DB_NAME, DB_VERSION);

    // Se ejecuta solo al crear la base o al subir DB_VERSION
    solicitud.onupgradeneeded = (evento) => {
      const db = evento.target.result;

      // Store "usuarios": la clave primaria es el documento
      if (!db.objectStoreNames.contains(STORE_USUARIOS)) {
        db.createObjectStore(STORE_USUARIOS, { keyPath: "documento" });
      }

      // Store "calculos": id autoincremental + índice por documento
      if (!db.objectStoreNames.contains(STORE_CALCULOS)) {
        const calculos = db.createObjectStore(STORE_CALCULOS, {
          keyPath: "id",
          autoIncrement: true,
        });
        // No es único: un documento puede tener muchos cálculos
        calculos.createIndex("documento", "documento", { unique: false });
      }
    };

    solicitud.onsuccess = (evento) => {
      dbInstance = evento.target.result;

      // Si otra pestaña pide actualizar la base, cerramos esta conexión
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    solicitud.onerror = () => {
      reject(new Error("No se pudo abrir IndexedDB: " + solicitud.error));
    };

    // Otra pestaña con una versión anterior abierta impide actualizar
    solicitud.onblocked = () => {
      reject(new Error("Cierra otras pestañas de la app e intenta de nuevo."));
    };
  });
}
/**
 * Busca un usuario por documento.
 * @param {string} documento
 * @returns {Promise<object|undefined>} el usuario, o undefined si no existe
 */
export async function obtenerUsuario(documento) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USUARIOS, "readonly");
    const solicitud = tx.objectStore(STORE_USUARIOS).get(documento);
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

/**
 * Guarda un usuario nuevo.
 * @param {{documento: string, fechaRegistro: string}} usuario
 */
export async function guardarUsuario(usuario) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_USUARIOS, "readwrite");
    tx.objectStore(STORE_USUARIOS).add(usuario);
    // Se resuelve cuando la transacción termina, no al encolar la solicitud
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Guarda un cálculo. El id lo asigna IndexedDB (autoIncrement).
 * @param {object} calculo sin id
 * @returns {Promise<number>} el id generado
 */
export async function guardarCalculo(calculo) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULOS, "readwrite");
    const solicitud = tx.objectStore(STORE_CALCULOS).add(calculo);
    let id;
    solicitud.onsuccess = () => { id = solicitud.result; };
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Devuelve los cálculos de un documento, del más reciente al más antiguo.
 * Usa el índice "documento" creado en la Fase 2.
 * @param {string} documento
 * @returns {Promise<object[]>}
 */
export async function obtenerCalculos(documento) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CALCULOS, "readonly");
    const solicitud = tx.objectStore(STORE_CALCULOS)
      .index("documento")
      .getAll(documento);
    solicitud.onsuccess = () => {
      // El id es autoincremental: mayor id = más reciente
      resolve(solicitud.result.sort((a, b) => b.id - a.id));
    };
    solicitud.onerror = () => reject(solicitud.error);
  });
}
// Módulo de la interfaz de notas: generación dinámica de campos
// y validaciones en tiempo real. El cálculo llega en la Fase 5.

// ===== Referencias al DOM =====
const inputCantidad = document.getElementById("input-cantidad");
const btnGenerar = document.getElementById("btn-generar");
const errorCantidad = document.getElementById("error-cantidad");
const contenedor = document.getElementById("contenedor-notas");
const errorPorcentaje = document.getElementById("error-porcentaje");
const btnCalcular = document.getElementById("btn-calcular");

const MSG_VACIO = "Completa este campo con un número";
const MSG_NOTA = "Corrige la nota: debe estar entre 0.0 y 5.0";
const MSG_CANTIDAD = "Ingresa un número entero entre 1 y 10";

// ===== Utilidades =====

/**
 * Convierte texto a número. Acepta coma o punto decimal.
 * @returns {number} el número, o NaN si está vacío o no es numérico
 */
function parsearNumero(texto) {
  const limpio = texto.trim().replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) return NaN;
  return Number(limpio);
}

/** Muestra el error de un campo (borde rojo + mensaje debajo). */
function marcarError(input, mensaje) {
  input.classList.add("error");
  input.nextElementSibling.textContent = mensaje;
}

/** Quita el error de un campo. */
function limpiarError(input) {
  input.classList.remove("error");
  input.nextElementSibling.textContent = "";
}

// ===== Validaciones por campo =====

/** Entero entre 1 y 10. Rechaza vacío, 0, negativos y decimales. */
function validarCantidad() {
  const texto = inputCantidad.value;
  const valor = texto.trim() === "" ? NaN : Number(texto);

  if (!Number.isInteger(valor) || valor < 1 || valor > 10) {
    inputCantidad.classList.add("error");
    errorCantidad.textContent = MSG_CANTIDAD;
    return null;
  }
  inputCantidad.classList.remove("error");
  errorCantidad.textContent = "";
  return valor;
}

/** Nota numérica entre 0.0 y 5.0. @returns {boolean} */
function validarNota(input) {
  const valor = parsearNumero(input.value);

  if (Number.isNaN(valor)) {
    marcarError(input, MSG_VACIO);
    return false;
  }
  if (valor < 0 || valor > 5) {
    marcarError(input, MSG_NOTA);
    return false;
  }
  limpiarError(input);
  return true;
}

/** Porcentaje numérico mayor que 0 y máximo 100. @returns {boolean} */
function validarPorcentaje(input) {
  const valor = parsearNumero(input.value);

  if (Number.isNaN(valor)) {
    marcarError(input, MSG_VACIO);
    return false;
  }
  if (valor <= 0) {
    marcarError(input, "El porcentaje debe ser mayor que 0");
    return false;
  }
  if (valor > 100) {
    marcarError(input, "El porcentaje no puede superar 100");
    return false;
  }
  limpiarError(input);
  return true;
}

/**
 * Suma los porcentajes escritos y muestra "Faltan X%" o "Sobran X%".
 * @returns {boolean} true si la suma es 100
 */
function actualizarSuma() {
  let suma = 0;
  contenedor.querySelectorAll(".input-porcentaje").forEach((input) => {
    const valor = parsearNumero(input.value);
    if (!Number.isNaN(valor)) suma += valor;
  });

  const diferencia = 100 - suma;

  // Comparación con tolerancia por los decimales de JS
  if (Math.abs(diferencia) < 0.01) {
    errorPorcentaje.textContent = "";
    return true;
  }

  // Number(...toFixed(2)) quita ceros sobrantes: 20.00 -> 20
  const cantidad = Number(Math.abs(diferencia).toFixed(2));
  errorPorcentaje.textContent =
    diferencia > 0 ? `Faltan ${cantidad}%` : `Sobran ${cantidad}%`;
  return false;
}

// ===== Generación dinámica =====

/** Crea un campo con su párrafo de error justo debajo. */
function crearCampo(id, etiqueta, placeholder, clase) {
  const grupo = document.createElement("div");
  grupo.className = "campo";

  const label = document.createElement("label");
  label.htmlFor = id;
  label.textContent = etiqueta;

  const input = document.createElement("input");
  input.type = "text"; // "text" permite detectar datos no numéricos
  input.inputMode = "decimal";
  input.id = id;
  input.placeholder = placeholder;
  input.autocomplete = "off";
  input.className = clase;

  // Debe ir inmediatamente después del input (lo usa marcarError)
  const error = document.createElement("p");
  error.className = "mensaje-error";

  grupo.append(label, input, error);
  return grupo;
}

/** Dibuja un par valor/porcentaje por cada nota. */
function generarCampos(cantidad) {
  contenedor.innerHTML = "";
  errorPorcentaje.textContent = "";

  for (let i = 1; i <= cantidad; i++) {
    const fila = document.createElement("div");
    fila.className = "fila-nota";
    fila.append(
      crearCampo(`nota-${i}`, `Nota ${i}`, "0.0 - 5.0", "input-nota"),
      crearCampo(`porcentaje-${i}`, `Porcentaje ${i} (%)`, "Ej: 30", "input-porcentaje")
    );
    contenedor.appendChild(fila);
  }

  btnCalcular.classList.remove("oculto");
  document.getElementById("nota-1").focus();
}

// ===== API para la Fase 5 =====

/**
 * Valida todos los campos y la suma de porcentajes.
 * @returns {{valor: number, porcentaje: number}[] | null}
 *          las notas listas para calcular, o null si hay errores
 */
export function obtenerNotasValidadas() {
  let todoValido = true;

  contenedor.querySelectorAll(".input-nota").forEach((input) => {
    if (!validarNota(input)) todoValido = false;
  });
  contenedor.querySelectorAll(".input-porcentaje").forEach((input) => {
    if (!validarPorcentaje(input)) todoValido = false;
  });
  if (!actualizarSuma()) todoValido = false;

  if (!todoValido) {
    // Lleva el foco al primer campo con error
    const primero = contenedor.querySelector("input.error");
    if (primero) primero.focus();
    return null;
  }

  const notas = [];
  const filas = contenedor.querySelectorAll(".fila-nota");
  filas.forEach((fila) => {
    notas.push({
      valor: parsearNumero(fila.querySelector(".input-nota").value),
      porcentaje: parsearNumero(fila.querySelector(".input-porcentaje").value),
    });
  });
  return notas;
}

/** Limpia el formulario de notas (se usará al cerrar sesión o recalcular). */
export function reiniciarNotasUI() {
  inputCantidad.value = "";
  inputCantidad.classList.remove("error");
  errorCantidad.textContent = "";
  contenedor.innerHTML = "";
  errorPorcentaje.textContent = "";
  btnCalcular.classList.add("oculto");
}

// ===== Eventos =====

export function configurarNotasUI() {
  // Botón "Generar campos"
  btnGenerar.addEventListener("click", () => {
    const cantidad = validarCantidad();
    if (cantidad !== null) generarCampos(cantidad);
  });

  // Validación en tiempo real de la cantidad
  inputCantidad.addEventListener("input", validarCantidad);

  // Delegación de eventos: un solo listener para todos los campos
  // generados dinámicamente (no existen cuando se carga la página)
  contenedor.addEventListener("input", (e) => {
    const input = e.target;
    if (input.classList.contains("input-nota")) {
      validarNota(input);
    } else if (input.classList.contains("input-porcentaje")) {
      validarPorcentaje(input);
      actualizarSuma();
    }
  });
}
// Módulo de cálculo: promedio ponderado, estado, guardado y resultado/historial.

import { guardarCalculo, obtenerCalculos } from "./db.js";

const NOTA_MINIMA_APROBAR = 3.0;

// ===== Lógica pura (sin DOM ni base de datos) =====

/**
 * definitiva = Σ (nota_i × porcentaje_i / 100), redondeada a 2 decimales.
 * @param {{valor: number, porcentaje: number}[]} notas
 * @returns {number}
 */
export function calcularDefinitiva(notas) {
  const suma = notas.reduce(
    (acum, n) => acum + (n.valor * n.porcentaje) / 100,
    0
  );
  return Math.round(suma * 100) / 100;
}

/**
 * @param {number} definitiva ya redondeada
 * @returns {"Aprobado"|"Reprobado"}
 */
export function determinarEstado(definitiva) {
  return definitiva >= NOTA_MINIMA_APROBAR ? "Aprobado" : "Reprobado";
}

// ===== Cálculo + persistencia =====

/**
 * Calcula, guarda en IndexedDB y devuelve el registro completo (con id).
 * @param {string} documento
 * @param {{valor: number, porcentaje: number}[]} notas ya validadas
 */
export async function calcularYGuardar(documento, notas) {
  const definitiva = calcularDefinitiva(notas);
  const registro = {
    documento,
    notas,
    definitiva,
    estado: determinarEstado(definitiva),
    fecha: new Date().toISOString(),
  };
  registro.id = await guardarCalculo(registro);
  return registro;
}

// ===== Interfaz: resultado e historial =====

const seccionResultado = document.getElementById("resultado");
const valorDefinitiva = document.getElementById("valor-definitiva");
const valorEstado = document.getElementById("valor-estado");
const historial = document.getElementById("historial");

// Los dos <p> que contienen definitiva y estado
const lineasResultado = [valorDefinitiva.parentElement, valorEstado.parentElement];

/** Muestra la definitiva y el estado de un cálculo. */
export function mostrarResultado(registro) {
  valorDefinitiva.textContent = registro.definitiva.toFixed(2);
  valorEstado.textContent = registro.estado;
  valorEstado.className = registro.estado === "Aprobado" ? "aprobado" : "reprobado";

  lineasResultado.forEach((p) => p.classList.remove("oculto"));
  seccionResultado.classList.remove("oculto");
}

/** Dibuja la lista de cálculos guardados (o el mensaje si no hay). */
export async function renderHistorial(documento) {
  const calculos = await obtenerCalculos(documento);
  historial.innerHTML = "";

  if (calculos.length === 0) {
    const vacio = document.createElement("p");
    vacio.textContent = "Aún no tienes cálculos";
    historial.appendChild(vacio);
    return calculos;
  }

  const lista = document.createElement("ul");
  lista.className = "lista-historial";

  calculos.forEach((c) => {
    const item = document.createElement("li");

    const fecha = document.createElement("span");
    fecha.className = "historial-fecha";
    fecha.textContent = new Date(c.fecha).toLocaleString("es-CO");

    const detalle = document.createElement("span");
    detalle.textContent =
      c.notas.map((n) => `${n.valor} (${n.porcentaje}%)`).join(" · ");

    const final = document.createElement("strong");
    final.className = c.estado === "Aprobado" ? "aprobado" : "reprobado";
    final.textContent = `${c.definitiva.toFixed(2)} - ${c.estado}`;

    item.append(fecha, detalle, final);
    lista.appendChild(item);
  });

  historial.appendChild(lista);
  return calculos;
}

/**
 * Al entrar al panel: muestra solo el historial (sin definitiva/estado,
 * porque todavía no hay un cálculo en esta sesión de trabajo).
 */
export async function mostrarHistorialInicial(documento) {
  await renderHistorial(documento);
  lineasResultado.forEach((p) => p.classList.add("oculto"));
  seccionResultado.classList.remove("oculto");
}
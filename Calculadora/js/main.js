import { abrirDB } from "./db.js";
import { validarDocumento, iniciarSesion, obtenerSesion } from "./auth.js";
import { configurarNotasUI, obtenerNotasValidadas } from "./notas-ui.js";
import {
  calcularYGuardar,
  mostrarResultado,
  renderHistorial,
  mostrarHistorialInicial,
} from "./calculo.js";

// ===== Referencias al DOM =====
const formAcceso = document.getElementById("form-acceso");
const panelNotas = document.getElementById("panel-notas");
const resultado = document.getElementById("resultado");
const inputDocumento = document.getElementById("input-documento");
const btnIngresar = document.getElementById("btn-ingresar");
const btnCalcular = document.getElementById("btn-calcular");
const errorDocumento = document.getElementById("error-documento");
const errorPorcentaje = document.getElementById("error-porcentaje");

// ===== Cambio de estados de la UI =====
function mostrarAcceso() {
  formAcceso.classList.remove("oculto");
  panelNotas.classList.add("oculto");
  resultado.classList.add("oculto");
}

function mostrarConfiguracion() {
  formAcceso.classList.add("oculto");
  panelNotas.classList.remove("oculto");
  resultado.classList.add("oculto");
}

/** Entra al panel de notas y carga el historial del usuario. */
async function entrarAlPanel(documento) {
  mostrarConfiguracion();
  await mostrarHistorialInicial(documento);
}

// ===== Acceso =====
async function manejarIngreso() {
  const documento = inputDocumento.value;

  errorDocumento.textContent = "";
  inputDocumento.classList.remove("error");

  const mensaje = validarDocumento(documento);
  if (mensaje) {
    errorDocumento.textContent = mensaje;
    inputDocumento.classList.add("error");
    return;
  }

  btnIngresar.disabled = true;
  try {
    await iniciarSesion(documento);
    await entrarAlPanel(documento);
  } catch (error) {
    errorDocumento.textContent = "Error al acceder: " + error.message;
  } finally {
    btnIngresar.disabled = false;
  }
}

// ===== Cálculo =====
async function manejarCalculo() {
  // Si hay cualquier error, devuelve null y el cálculo se bloquea
  const notas = obtenerNotasValidadas();
  if (!notas) return;

  btnCalcular.disabled = true;
  try {
    const documento = obtenerSesion();
    const registro = await calcularYGuardar(documento, notas);
    mostrarResultado(registro);
    await renderHistorial(documento);
    resultado.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    errorPorcentaje.textContent = "No se pudo guardar el cálculo: " + error.message;
  } finally {
    btnCalcular.disabled = false;
  }
}

// ===== Inicio de la app =====
async function iniciar() {
  try {
    await abrirDB();
  } catch (error) {
    errorDocumento.textContent = error.message;
    return;
  }

  btnIngresar.addEventListener("click", manejarIngreso);
  btnCalcular.addEventListener("click", manejarCalculo);

  inputDocumento.addEventListener("keydown", (e) => {
    if (e.key === "Enter") manejarIngreso();
  });

  configurarNotasUI();

  // Si hay sesión activa (recarga de página), vuelve al panel de notas
  const documento = obtenerSesion();
  if (documento) {
    await entrarAlPanel(documento);
  } else {
    mostrarAcceso();
  }
}

iniciar();
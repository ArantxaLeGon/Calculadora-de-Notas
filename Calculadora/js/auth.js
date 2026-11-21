// Módulo de acceso: validación del documento, registro automático (RN-01)
// y manejo de la sesión con sessionStorage.

import { obtenerUsuario, guardarUsuario } from "./db.js";

const CLAVE_SESION = "documento";

/**
 * Valida el formato del documento.
 * No se hace trim a propósito: un documento con espacios debe rechazarse.
 * @param {string} valor
 * @returns {string} mensaje de error, o "" si es válido
 */
export function validarDocumento(valor) {
  if (valor === "") {
    return "Ingresa tu documento.";
  }
  if (!/^\d+$/.test(valor)) {
    return "El documento solo debe tener números, sin letras ni espacios.";
  }
  if (valor.length < 5 || valor.length > 12) {
    return "El documento debe tener entre 5 y 12 dígitos.";
  }
  return "";
}

/**
 * Inicia sesión. Si el documento no existe, lo registra automáticamente.
 * @param {string} documento ya validado
 * @returns {Promise<{nuevo: boolean}>} nuevo = true si se acaba de registrar
 */
export async function iniciarSesion(documento) {
  let usuario = await obtenerUsuario(documento);
  let nuevo = false;

  if (!usuario) {
    usuario = { documento, fechaRegistro: new Date().toISOString() };
    await guardarUsuario(usuario);
    nuevo = true;
  }

  // La sesión vive solo mientras la pestaña esté abierta
  sessionStorage.setItem(CLAVE_SESION, usuario.documento);
  return { nuevo };
}

/** @returns {string|null} documento de la sesión activa, o null */
export function obtenerSesion() {
  return sessionStorage.getItem(CLAVE_SESION);
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_SESION);
}
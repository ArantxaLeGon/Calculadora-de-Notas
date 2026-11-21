# Calculadora de Notas Definitivas

Aplicación web para calcular la nota definitiva de una materia con promedio ponderado. El estudiante entra solo con su documento de identidad, ingresa sus notas con sus porcentajes y consulta el historial de cálculos anteriores.

Los datos se guardan en el navegador con IndexedDB. No hay servidor ni base de datos externa.

## Tecnologías

- HTML5, CSS3 y JavaScript vanilla (ES6+ con módulos)
- IndexedDB nativa para los datos principales
- `sessionStorage` solo para mantener la sesión
- Despliegue como sitio estático en Vercel
- Sin frameworks ni librerías externas

## Funcionalidades

- **Acceso:** inicio de sesión o registro automático usando solo el documento.
- **Configuración:** el estudiante elige cuántas notas va a ingresar (de 1 a 10).
- **Ingreso de datos:** campos de nota y porcentaje generados dinámicamente, con validación en tiempo real.
- **Resultado:** definitiva con 2 decimales y estado (Aprobado o Reprobado).
- **Historial:** lista de cálculos anteriores del estudiante, del más reciente al más antiguo.

## Reglas de negocio

| Regla | Detalle |
|---|---|
| Documento | Solo dígitos, entre 5 y 12 caracteres. Sin letras ni espacios |
| Registro | Un documento nuevo se registra automáticamente al ingresar |
| Cantidad de notas | Número entero entre 1 y 10 |
| Nota | Entre 0.0 y 5.0 |
| Porcentaje | Mayor que 0. La suma de todos debe ser 100 |
| Fórmula | `definitiva = Σ (nota × porcentaje / 100)` |
| Redondeo | `Math.round(x * 100) / 100` |
| Estado | Definitiva `>= 3.0` es **Aprobado**; si no, **Reprobado** |

**Ejemplo:** 4.0 (30%), 3.0 (30%) y 5.0 (40%) dan una definitiva de **4.10**, Aprobado.

## Validaciones

| Caso | Comportamiento |
|---|---|
| La suma de porcentajes no es 100 | Bloquea el cálculo y muestra "Faltan X%" o "Sobran X%" |
| Nota fuera de rango | Borde rojo y mensaje "Corrige la nota: debe estar entre 0.0 y 5.0" |
| Campo vacío o no numérico | Borde rojo y mensaje "Completa este campo con un número" |
| Porcentaje en 0 o negativo | Se rechaza |
| Cantidad de notas en 0, negativa o decimal | Se bloquea con mensaje |
| Sin cálculos guardados | El historial muestra "Aún no tienes cálculos" |
| Recarga de la página | Se mantiene la sesión y vuelve al panel de notas |

## Estructura del proyecto

```
calculadora-notas/
├── index.html          Estructura de la página
├── vercel.json         Configuración de despliegue y cabeceras de seguridad
├── .gitignore
├── css/
│   └── styles.css      Estilos
└── js/
    ├── main.js         Punto de entrada y control de estados de la interfaz
    ├── db.js           Conexión y operaciones de IndexedDB
    ├── auth.js         Validación del documento, registro y sesión
    ├── notas-ui.js     Campos dinámicos y validaciones en tiempo real
    └── calculo.js      Cálculo, estado, resultado e historial
```

## Modelo de datos

Base de datos: `NotesCalculator`

**ObjectStore `usuarios`** (keyPath: `documento`)

| Campo | Tipo |
|---|---|
| documento | string |
| fechaRegistro | string (ISO) |

**ObjectStore `calculos`** (keyPath: `id`, autoIncrement; índice `documento`)

| Campo | Tipo |
|---|---|
| id | number |
| documento | string |
| notas | array de `{ valor, porcentaje }` |
| definitiva | number (2 decimales) |
| estado | `"Aprobado"` o `"Reprobado"` |
| fecha | string (ISO) |

## Cómo ejecutarlo en local

Los módulos ES no funcionan abriendo `index.html` con doble clic. Hay que usar un servidor local. Desde la carpeta del proyecto, cualquiera de estas opciones:

```bash
npx http-server -p 5500
```

```bash
npx live-server --port=5500
```

```bash
py -m http.server 5500
```

Luego abre `http://localhost:5500` en el navegador.

También sirve la extensión **Live Server** de VS Code (clic derecho en `index.html` y "Open with Live Server").

## Despliegue en Vercel

**Con la CLI:**

```bash
npx vercel          # vista previa
npx vercel --prod   # producción
```

**Con GitHub:**

1. Sube el proyecto a un repositorio.
2. En vercel.com elige **Add New → Project** e importa el repositorio.
3. Framework Preset: **Other**. Deja vacíos Build Command y Output Directory.

## Pruebas rápidas

1. Entra con el documento `1234567890`. Debe registrarse y mostrar el panel de notas.
2. Genera 3 notas e ingresa `4.0/30`, `3.0/30` y `5.0/40`. El resultado debe ser **4.10, Aprobado**.
3. Cambia un porcentaje para que la suma no sea 100. Debe bloquear y mostrar cuánto falta o sobra.
4. Escribe una nota de `6`. Debe marcarla en rojo.
5. Recarga la página. Debe seguir en el panel con el historial.
6. Abre una pestaña nueva. Debe volver a la pantalla de acceso.

Para revisar los datos guardados: F12 → **Application** → **IndexedDB** → `NotesCalculator`.

## Notas

- Los datos viven solo en el navegador y el dispositivo donde se usó la app. Si se borran los datos del sitio, se pierde el historial.
- No hay contraseña: cualquier persona que conozca un documento puede ver su historial en ese mismo navegador.

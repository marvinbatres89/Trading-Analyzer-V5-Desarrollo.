/*
=========================================================
TRADING ANALYZER V6
Archivo: app.js
Versión corregida y consolidada
=========================================================
*/

import { derivAPI } from "./deriv-api.js";

/* =====================================================
1. UTILIDADES Y ELEMENTOS DE LA INTERFAZ
===================================================== */

function obtenerElemento(id, obligatorio = true) {
  const elemento = document.getElementById(id);

  if (!elemento && obligatorio) {
    console.warn("No se encontró el elemento obligatorio:", id);
  }

  return elemento;
}

const interfaz = {
  estadoConexion: obtenerElemento("estadoConexion"),
  textoEstado: obtenerElemento("textoEstado"),

  botonConectar: obtenerElemento("botonConectar"),
  botonDesconectar: obtenerElemento("botonDesconectar"),
  botonAnalizar: obtenerElemento("botonAnalizar"),
  botonVoz: obtenerElemento("botonVoz"),
  botonAjustes: obtenerElemento("botonAjustes", false),

  selectorIndice: obtenerElemento("selectorIndice"),
  selectorOperacion: obtenerElemento("selectorOperacion"),
  selectorModo: obtenerElemento("selectorModo"),

  nombreIndice: obtenerElemento("nombreIndice"),
  estadoDatos: obtenerElemento("estadoDatos"),
  precioActual: obtenerElemento("precioActual"),
  contadorTicks: obtenerElemento("contadorTicks"),
  ultimoDigito: obtenerElemento("ultimoDigito"),
  horaActualizacion: obtenerElemento("horaActualizacion"),

  textoProgreso: obtenerElemento("textoProgreso"),
  numeroProgreso: obtenerElemento("numeroProgreso"),
  barraDatos: obtenerElemento("barraDatos"),

  tendencia: obtenerElemento("tendencia"),
  detalleTendencia: obtenerElemento("detalleTendencia"),
  rsi: obtenerElemento("rsi"),
  detalleRsi: obtenerElemento("detalleRsi"),
  momentum: obtenerElemento("momentum"),
  detalleMomentum: obtenerElemento("detalleMomentum"),
  volatilidad: obtenerElemento("volatilidad"),
  detalleVolatilidad: obtenerElemento("detalleVolatilidad"),

  panelSenal: obtenerElemento("panelSenal"),
  prediccionEstado: obtenerElemento("prediccionEstado"),
  prediccionTitulo: obtenerElemento("prediccionTitulo"),
  prediccionDireccion: obtenerElemento("prediccionDireccion"),
  prediccionConfianza: obtenerElemento("prediccionConfianza"),
  barraConfianza: obtenerElemento("barraConfianza"),
  prediccionMotivos: obtenerElemento("prediccionMotivos"),
  vigenciaSenal: obtenerElemento("vigenciaSenal"),
  cuentaRegresiva: obtenerElemento("cuentaRegresiva", false),

  botonLimpiarHistorial: obtenerElemento("botonLimpiarHistorial"),
  historialAnalisis: obtenerElemento("historialAnalisis"),

  botonLimpiarRegistro: obtenerElemento("botonLimpiarRegistro"),
  registroActividad: obtenerElemento("registroActividad"),

  contenedorGrafico: obtenerElemento("contenedorGrafico", false)
};

/* =====================================================
2. CONFIGURACIÓN
===================================================== */

const CONFIGURACION = {
  version: "6.0.1",
  maximoPreciosGuardados: 250,
  maximoDigitosGuardados: 120,
  minimoTicksRapido: 12,
  minimoTicksCompleto: 30,
  maximoHistorial: 10,
  duracionRapidaSegundos: 10,
  duracionCompletaSegundos: 30,
  intervaloAnalisisDuplicado: 1500,
  idiomaVoz: "es-SV",
  velocidadVoz: 0.95,
  tonoVoz: 1,
  volumenVoz: 1
};

const NOMBRES_MERCADOS = {
  "1HZ10V": "Volatility 10 (1s)",
  "1HZ25V": "Volatility 25 (1s)",
  "1HZ50V": "Volatility 50 (1s)",
  "1HZ75V": "Volatility 75 (1s)",
  "1HZ100V": "Volatility 100 (1s)",
  "R_10": "Volatility 10",
  "R_25": "Volatility 25",
  "R_50": "Volatility 50",
  "R_75": "Volatility 75",
  "R_100": "Volatility 100"
};

const NOMBRES_ESTRATEGIAS = {
  rise_fall: "Rise / Fall",
  even_odd: "Par / Impar",
  par_impar: "Par / Impar",
  over_under: "Más / Menos",
  mas_menos: "Más / Menos",
  match: "Match",
  matches: "Match"
};

const estadoAplicacion = {
  conectado: false,
  conectando: false,
  analizando: false,

  simboloActual: "",
  nombreMercadoActual: "",
  estrategiaActual: "rise_fall",
  nombreEstrategiaActual: "Rise / Fall",
  modoActual: "rapido",

  precios: [],
  ultimosDigitos: [],
  ticksRecibidos: 0,
  precioAnterior: null,
  ultimoPrecio: null,
  ultimoEpoch: null,
  ultimoPipSize: null,
  ultimoPrecioFormateado: "--",

  ultimoResultado: null,
  indicadoresActuales: null,
  historial: [],

  vozActiva: true,
  vozDisponible:
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window,

  ultimoAnalisisEpoch: 0,
  claveUltimoAnalisis: "",
  versionDatos: 0,
  versionAnalisis: 0
};

let temporizadorVigencia = null;

/* =====================================================
3. FUNCIONES GENERALES
===================================================== */

function obtenerNombreMercado(simbolo) {
  return NOMBRES_MERCADOS[simbolo] || simbolo || "Mercado desconocido";
}

function obtenerNombreEstrategia(estrategia) {
  return (
    NOMBRES_ESTRATEGIAS[estrategia] ||
    estrategia ||
    "Estrategia desconocida"
  );
}

function obtenerHora(epoch = null) {
  const fecha = Number.isFinite(epoch)
    ? new Date(epoch * 1000)
    : new Date();

  return fecha.toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function limitarNumero(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

function registrarActividad(mensaje, tipo = "normal") {
  if (!interfaz.registroActividad) return;

  const linea = document.createElement("p");
  linea.textContent = `[${obtenerHora()}] ${mensaje}`;

  if (["exito", "error", "advertencia"].includes(tipo)) {
    linea.classList.add(tipo);
  }

  interfaz.registroActividad.prepend(linea);

  while (interfaz.registroActividad.children.length > 50) {
    interfaz.registroActividad.lastElementChild?.remove();
  }
}

/* =====================================================
4. ASISTENTE DE VOZ
===================================================== */

function hablarMensaje(texto, forzar = false) {
  if (!texto || typeof texto !== "string") return false;
  if (!estadoAplicacion.vozDisponible) return false;
  if (!estadoAplicacion.vozActiva && !forzar) return false;

  try {
    window.speechSynthesis.cancel();

    const mensaje = new SpeechSynthesisUtterance(texto);
    mensaje.lang = CONFIGURACION.idiomaVoz;
    mensaje.rate = CONFIGURACION.velocidadVoz;
    mensaje.pitch = CONFIGURACION.tonoVoz;
    mensaje.volume = CONFIGURACION.volumenVoz;

    window.speechSynthesis.speak(mensaje);
    return true;
  } catch (error) {
    registrarActividad(
      "No fue posible reproducir el mensaje de voz.",
      "advertencia"
    );
    console.warn("Error de voz:", error);
    return false;
  }
}

function detenerVoz() {
  if (!estadoAplicacion.vozDisponible) return;

  try {
    window.speechSynthesis.cancel();
  } catch (error) {
    console.warn("No fue posible detener la voz:", error);
  }
}

function actualizarBotonVoz() {
  if (!interfaz.botonVoz) return;

  if (!estadoAplicacion.vozDisponible) {
    interfaz.botonVoz.textContent = "🔇 Voz no disponible";
    interfaz.botonVoz.disabled = true;
    interfaz.botonVoz.setAttribute("aria-pressed", "false");
    return;
  }

  interfaz.botonVoz.disabled = false;
  interfaz.botonVoz.textContent = estadoAplicacion.vozActiva
    ? "🔊 Voz activa"
    : "🔇 Voz silenciada";

  interfaz.botonVoz.setAttribute(
    "aria-pressed",
    String(estadoAplicacion.vozActiva)
  );

  interfaz.botonVoz.classList.toggle(
    "activo",
    estadoAplicacion.vozActiva
  );
}

function alternarVoz() {
  if (!estadoAplicacion.vozDisponible) {
    registrarActividad(
      "Este navegador no permite utilizar el asistente de voz.",
      "advertencia"
    );
    return;
  }

  estadoAplicacion.vozActiva = !estadoAplicacion.vozActiva;
  detenerVoz();
  actualizarBotonVoz();

  if (estadoAplicacion.vozActiva) {
    registrarActividad("Asistente de voz activado.", "exito");
    hablarMensaje("Asistente de voz activado.");
  } else {
    registrarActividad("Asistente de voz silenciado.");
  }
}

/* =====================================================
5. SELECCIÓN, ESTADO Y PROGRESO
===================================================== */

function sincronizarSeleccionActual() {
  if (interfaz.selectorIndice) {
    estadoAplicacion.simboloActual = interfaz.selectorIndice.value;
    estadoAplicacion.nombreMercadoActual = obtenerNombreMercado(
      estadoAplicacion.simboloActual
    );
  }

  if (interfaz.selectorOperacion) {
    estadoAplicacion.estrategiaActual =
      interfaz.selectorOperacion.value;

    estadoAplicacion.nombreEstrategiaActual =
      obtenerNombreEstrategia(
        estadoAplicacion.estrategiaActual
      );
  }

  if (interfaz.selectorModo) {
    estadoAplicacion.modoActual = interfaz.selectorModo.value;
  }

  if (interfaz.nombreIndice) {
    interfaz.nombreIndice.textContent =
      estadoAplicacion.nombreMercadoActual;
  }
}

function obtenerMinimoTicks() {
  return estadoAplicacion.modoActual === "completo"
    ? CONFIGURACION.minimoTicksCompleto
    : CONFIGURACION.minimoTicksRapido;
}

function obtenerDuracionSenal() {
  return estadoAplicacion.modoActual === "completo"
    ? CONFIGURACION.duracionCompletaSegundos
    : CONFIGURACION.duracionRapidaSegundos;
}

function obtenerTextoModoActual() {
  if (!interfaz.selectorModo) return "Modo desconocido";

  const opcion =
    interfaz.selectorModo.options[
      interfaz.selectorModo.selectedIndex
    ];

  return opcion ? opcion.textContent.trim() : "Modo desconocido";
}

function obtenerOperacionActual() {
  return interfaz.selectorOperacion?.value || "rise_fall";
}

function obtenerTextoOperacionActual() {
  if (!interfaz.selectorOperacion) return "Rise / Fall";

  const opcion =
    interfaz.selectorOperacion.options[
      interfaz.selectorOperacion.selectedIndex
    ];

  return opcion ? opcion.textContent.trim() : "Rise / Fall";
}

function mostrarEstadoConexion(estado, texto) {
  if (interfaz.estadoConexion) {
    interfaz.estadoConexion.className =
      `estado-conexion ${estado}`;
  }

  if (interfaz.textoEstado) {
    interfaz.textoEstado.textContent = texto;
  }

  if (interfaz.botonConectar) {
    interfaz.botonConectar.disabled =
      estado === "conectado" || estado === "conectando";
  }

  if (interfaz.botonDesconectar) {
    interfaz.botonDesconectar.disabled =
      estado !== "conectado";
  }

  estadoAplicacion.conectado = estado === "conectado";
  estadoAplicacion.conectando = estado === "conectando";
}

function actualizarProgresoDatos() {
  const minimo = obtenerMinimoTicks();
  const cantidad = Math.min(
    estadoAplicacion.precios.length,
    minimo
  );

  const porcentaje =
    minimo > 0
      ? Math.min(100, (cantidad / minimo) * 100)
      : 0;

  if (interfaz.numeroProgreso) {
    interfaz.numeroProgreso.textContent =
      `${cantidad}/${minimo}`;
  }

  if (interfaz.barraDatos) {
    interfaz.barraDatos.style.width = `${porcentaje}%`;
  }

  if (!estadoAplicacion.conectado) {
    if (interfaz.textoProgreso) {
      interfaz.textoProgreso.textContent =
        "Esperando conexión";
    }

    if (interfaz.botonAnalizar) {
      interfaz.botonAnalizar.disabled = true;
      interfaz.botonAnalizar.textContent =
        "Esperando conexión...";
    }

    return;
  }

  if (estadoAplicacion.precios.length < minimo) {
    if (interfaz.textoProgreso) {
      interfaz.textoProgreso.textContent =
        `Preparando ${estadoAplicacion.nombreEstrategiaActual}`;
    }

    if (interfaz.botonAnalizar) {
      interfaz.botonAnalizar.disabled = true;
      interfaz.botonAnalizar.textContent =
        `Recopilando datos ${cantidad}/${minimo}`;
    }

    return;
  }

  if (interfaz.textoProgreso) {
    interfaz.textoProgreso.textContent =
      "Análisis preparado";
  }

  if (interfaz.botonAnalizar) {
    interfaz.botonAnalizar.disabled = false;
    interfaz.botonAnalizar.textContent =
      "🔍 Analizar ahora";
  }
}

/* =====================================================
6. PANEL DE RESULTADO
===================================================== */

function limpiarMotivosResultado() {
  if (interfaz.prediccionMotivos) {
    interfaz.prediccionMotivos.innerHTML = "";
  }
}

function agregarMotivoResultado(texto) {
  if (!interfaz.prediccionMotivos) return;

  const elemento = document.createElement("li");
  elemento.textContent = texto;
  interfaz.prediccionMotivos.appendChild(elemento);
}

function detenerCuentaRegresiva() {
  if (temporizadorVigencia) {
    clearInterval(temporizadorVigencia);
    temporizadorVigencia = null;
  }
}

function reiniciarPanelSenal(
  mensaje = "Conecta la herramienta para comenzar."
) {
  detenerCuentaRegresiva();

  estadoAplicacion.ultimoResultado = null;
  estadoAplicacion.analizando = false;

  if (interfaz.panelSenal) {
    interfaz.panelSenal.className = "panel-senal neutral";
  }

  if (interfaz.prediccionEstado) {
    interfaz.prediccionEstado.textContent = "SIN ANALIZAR";
  }

  if (interfaz.prediccionTitulo) {
    interfaz.prediccionTitulo.textContent =
      "Esperando análisis";
  }

  if (interfaz.prediccionDireccion) {
    interfaz.prediccionDireccion.textContent = "--";
  }

  if (interfaz.prediccionConfianza) {
    interfaz.prediccionConfianza.textContent = "--";
  }

  if (interfaz.barraConfianza) {
    interfaz.barraConfianza.style.width = "0%";
  }

  if (interfaz.vigenciaSenal) {
    interfaz.vigenciaSenal.textContent =
      "Vigencia estimada: --";
  }

  limpiarMotivosResultado();
  agregarMotivoResultado(mensaje);
}

/* =====================================================
7. LIMPIEZA DE DATOS
===================================================== */

function limpiarDatosMercado(
  motivo = "Esperando nuevos datos"
) {
  detenerCuentaRegresiva();
  detenerVoz();

  estadoAplicacion.versionDatos++;
  estadoAplicacion.precios = [];
  estadoAplicacion.ultimosDigitos = [];
  estadoAplicacion.ticksRecibidos = 0;
  estadoAplicacion.precioAnterior = null;
  estadoAplicacion.ultimoPrecio = null;
  estadoAplicacion.ultimoEpoch = null;
  estadoAplicacion.ultimoPipSize = null;
  estadoAplicacion.ultimoPrecioFormateado = "--";
  estadoAplicacion.indicadoresActuales = null;
  estadoAplicacion.ultimoAnalisisEpoch = 0;
  estadoAplicacion.claveUltimoAnalisis = "";

  if (interfaz.precioActual) {
    interfaz.precioActual.textContent = "--";
    interfaz.precioActual.className = "precio-actual";
  }

  if (interfaz.contadorTicks) {
    interfaz.contadorTicks.textContent = "0";
  }

  if (interfaz.ultimoDigito) {
    interfaz.ultimoDigito.textContent = "--";
  }

  if (interfaz.horaActualizacion) {
    interfaz.horaActualizacion.textContent = "--";
  }

  if (interfaz.estadoDatos) {
    interfaz.estadoDatos.textContent = "Sin datos";
  }

  [
    interfaz.tendencia,
    interfaz.rsi,
    interfaz.momentum,
    interfaz.volatilidad
  ].forEach((elemento) => {
    if (elemento) elemento.textContent = "--";
  });

  [
    interfaz.detalleTendencia,
    interfaz.detalleRsi,
    interfaz.detalleMomentum,
    interfaz.detalleVolatilidad
  ].forEach((elemento) => {
    if (elemento) elemento.textContent = motivo;
  });

  reiniciarPanelSenal(
    `Esperando datos de ${estadoAplicacion.nombreMercadoActual} ` +
    `para ${estadoAplicacion.nombreEstrategiaActual}.`
  );

  actualizarProgresoDatos();
}

/* =====================================================
8. CONEXIÓN
===================================================== */

function conectarConDeriv() {
  sincronizarSeleccionActual();

  if (
    estadoAplicacion.conectado ||
    estadoAplicacion.conectando
  ) {
    registrarActividad(
      "La conexión ya está activa o en proceso.",
      "advertencia"
    );
    return;
  }

  registrarActividad(
    `Solicitando conexión para ${estadoAplicacion.nombreMercadoActual}.`
  );

  hablarMensaje("Conectando con Deriv.");
  derivAPI.conectar(estadoAplicacion.simboloActual);
}

function desconectarDeDeriv() {
  detenerCuentaRegresiva();
  detenerVoz();
  registrarActividad("Cerrando conexión con Deriv.");
  derivAPI.desconectar();
}

/* =====================================================
9. INDICADORES
===================================================== */

function calcularPromedio(valores) {
  if (!Array.isArray(valores) || valores.length === 0) {
    return 0;
  }

  return valores.reduce(
    (acumulado, valor) => acumulado + valor,
    0
  ) / valores.length;
}

function calcularDesviacion(valores) {
  if (!Array.isArray(valores) || valores.length < 2) {
    return 0;
  }

  const promedio = calcularPromedio(valores);
  const diferencias = valores.map(
    (valor) => Math.pow(valor - promedio, 2)
  );

  return Math.sqrt(calcularPromedio(diferencias));
}

function obtenerConfiguracionModo() {
  if (estadoAplicacion.modoActual === "completo") {
    return {
      periodoRSI: 14,
      ventanaTendencia: 30,
      ventanaMomentum: 10,
      ventanaVolatilidad: 30,
      vigencia: CONFIGURACION.duracionCompletaSegundos,
      ajusteConfianza: 3
    };
  }

  return {
    periodoRSI: 8,
    ventanaTendencia: 12,
    ventanaMomentum: 5,
    ventanaVolatilidad: 12,
    vigencia: CONFIGURACION.duracionRapidaSegundos,
    ajusteConfianza: 0
  };
}

function calcularRSI(precios, periodo = 14) {
  if (
    !Array.isArray(precios) ||
    precios.length < periodo + 1
  ) {
    return null;
  }

  const datos = precios.slice(-(periodo + 1));
  let ganancias = 0;
  let perdidas = 0;

  for (let indice = 1; indice < datos.length; indice++) {
    const diferencia = datos[indice] - datos[indice - 1];

    if (diferencia > 0) {
      ganancias += diferencia;
    } else if (diferencia < 0) {
      perdidas += Math.abs(diferencia);
    }
  }

  const promedioGanancias = ganancias / periodo;
  const promedioPerdidas = perdidas / periodo;

  if (
    promedioGanancias === 0 &&
    promedioPerdidas === 0
  ) {
    return 50;
  }

  if (promedioPerdidas === 0) return 100;

  const fuerzaRelativa =
    promedioGanancias / promedioPerdidas;

  return 100 - 100 / (1 + fuerzaRelativa);
}

function calcularTendencia(precios) {
  if (!Array.isArray(precios) || precios.length < 6) {
    return {
      direccion: "Sin datos",
      cambio: 0,
      fuerza: 0
    };
  }

  const configuracion = obtenerConfiguracionModo();
  const cantidad = Math.min(
    configuracion.ventanaTendencia,
    precios.length
  );

  const recientes = precios.slice(-cantidad);
  const mitad = Math.floor(recientes.length / 2);

  const primeraMitad = recientes.slice(0, mitad);
  const segundaMitad = recientes.slice(mitad);

  const promedioAnterior = calcularPromedio(primeraMitad);
  const promedioActual = calcularPromedio(segundaMitad);

  if (promedioAnterior === 0) {
    return {
      direccion: "Lateral",
      cambio: 0,
      fuerza: 0
    };
  }

  const cambio =
    ((promedioActual - promedioAnterior) /
      promedioAnterior) *
    100;

  let direccion = "Lateral";

  if (cambio > 0) direccion = "Alcista";
  if (cambio < 0) direccion = "Bajista";

  return {
    direccion,
    cambio,
    fuerza: Math.abs(cambio)
  };
}

function calcularMomentum(precios) {
  const periodo =
    obtenerConfiguracionModo().ventanaMomentum;

  if (
    !Array.isArray(precios) ||
    precios.length < periodo + 1
  ) {
    return {
      direccion: "Sin datos",
      valor: 0,
      porcentaje: 0
    };
  }

  const precioActual = precios[precios.length - 1];
  const precioAnterior =
    precios[precios.length - 1 - periodo];

  const valor = precioActual - precioAnterior;
  const porcentaje =
    precioAnterior !== 0
      ? (valor / precioAnterior) * 100
      : 0;

  let direccion = "Neutral";
  if (valor > 0) direccion = "Positivo";
  if (valor < 0) direccion = "Negativo";

  return { direccion, valor, porcentaje };
}

function calcularVolatilidad(precios) {
  const configuracion = obtenerConfiguracionModo();
  const cantidad = Math.min(
    configuracion.ventanaVolatilidad,
    precios.length
  );

  if (!Array.isArray(precios) || cantidad < 5) {
    return {
      nivel: "Sin datos",
      valor: 0,
      porcentaje: 0
    };
  }

  const recientes = precios.slice(-cantidad);
  const promedio = calcularPromedio(recientes);
  const desviacion = calcularDesviacion(recientes);

  const porcentaje =
    promedio !== 0
      ? (desviacion / promedio) * 100
      : 0;

  let nivel = "Baja";
  if (porcentaje >= 0.08) nivel = "Alta";
  else if (porcentaje >= 0.025) nivel = "Media";

  return {
    nivel,
    valor: desviacion,
    porcentaje
  };
}

function calcularIndicadores() {
  const precios = estadoAplicacion.precios;

  if (!Array.isArray(precios) || precios.length < 5) {
    return null;
  }

  const configuracion = obtenerConfiguracionModo();

  return {
    tendencia: calcularTendencia(precios),
    rsi: calcularRSI(precios, configuracion.periodoRSI),
    momentum: calcularMomentum(precios),
    volatilidad: calcularVolatilidad(precios)
  };
}

function actualizarIndicadores() {
  const indicadores = calcularIndicadores();
  estadoAplicacion.indicadoresActuales = indicadores;

  if (!indicadores) return;

  if (interfaz.tendencia) {
    interfaz.tendencia.textContent =
      indicadores.tendencia.direccion;
  }

  if (interfaz.detalleTendencia) {
    interfaz.detalleTendencia.textContent =
      `Cambio: ${indicadores.tendencia.cambio.toFixed(4)}%`;
  }

  if (interfaz.rsi) {
    interfaz.rsi.textContent =
      Number.isFinite(indicadores.rsi)
        ? indicadores.rsi.toFixed(1)
        : "--";
  }

  if (interfaz.detalleRsi) {
    if (!Number.isFinite(indicadores.rsi)) {
      interfaz.detalleRsi.textContent =
        "Esperando más datos";
    } else if (indicadores.rsi > 70) {
      interfaz.detalleRsi.textContent = "Zona alta";
    } else if (indicadores.rsi < 30) {
      interfaz.detalleRsi.textContent = "Zona baja";
    } else {
      interfaz.detalleRsi.textContent = "Zona neutral";
    }
  }

  if (interfaz.momentum) {
    interfaz.momentum.textContent =
      indicadores.momentum.direccion;
  }

  if (interfaz.detalleMomentum) {
    interfaz.detalleMomentum.textContent =
      `${indicadores.momentum.valor.toFixed(5)} · ` +
      `${indicadores.momentum.porcentaje.toFixed(4)}%`;
  }

  if (interfaz.volatilidad) {
    interfaz.volatilidad.textContent =
      `${indicadores.volatilidad.porcentaje.toFixed(4)}%`;
  }

  if (interfaz.detalleVolatilidad) {
    interfaz.detalleVolatilidad.textContent =
      `Nivel ${indicadores.volatilidad.nivel}`;
  }
}

/* =====================================================
10. RECEPCIÓN DE TICKS
===================================================== */

function formatearPrecio(precio, pipSize) {
  if (!Number.isFinite(precio)) return "--";

  const decimales =
    Number.isInteger(pipSize) &&
    pipSize >= 0 &&
    pipSize <= 10
      ? pipSize
      : 2;

  return precio.toFixed(decimales);
}

function obtenerUltimoDigito(precioFormateado) {
  const texto = String(precioFormateado || "");

  for (let indice = texto.length - 1; indice >= 0; indice--) {
    const caracter = texto.charAt(indice);

    if (caracter >= "0" && caracter <= "9") {
      return Number(caracter);
    }
  }

  return null;
}

function guardarPrecio(precio) {
  if (!Number.isFinite(precio)) return;

  estadoAplicacion.precios.push(precio);

  if (
    estadoAplicacion.precios.length >
    CONFIGURACION.maximoPreciosGuardados
  ) {
    estadoAplicacion.precios.shift();
  }
}

function guardarUltimoDigito(digito) {
  if (
    !Number.isInteger(digito) ||
    digito < 0 ||
    digito > 9
  ) {
    return;
  }

  estadoAplicacion.ultimosDigitos.push(digito);

  if (
    estadoAplicacion.ultimosDigitos.length >
    CONFIGURACION.maximoDigitosGuardados
  ) {
    estadoAplicacion.ultimosDigitos.shift();
  }
}

function mostrarMovimientoPrecio(precio) {
  if (!interfaz.precioActual) return;

  interfaz.precioActual.classList.remove("sube", "baja");

  const anterior = estadoAplicacion.precioAnterior;
  if (!Number.isFinite(anterior)) return;

  if (precio > anterior) {
    interfaz.precioActual.classList.add("sube");
  } else if (precio < anterior) {
    interfaz.precioActual.classList.add("baja");
  }
}

function validarTick(datosTick) {
  if (
    !datosTick ||
    !Number.isFinite(Number(datosTick.precio))
  ) {
    return false;
  }

  const simboloRecibido = String(
    datosTick.simbolo || ""
  ).trim();

  if (
    simboloRecibido &&
    simboloRecibido !== estadoAplicacion.simboloActual
  ) {
    return false;
  }

  return true;
}

function procesarTick(datosTick) {
  if (!validarTick(datosTick)) return;

  const precio = Number(datosTick.precio);
  const precioFormateado = formatearPrecio(
    precio,
    datosTick.pipSize
  );

  const ultimoDigito =
    obtenerUltimoDigito(precioFormateado);

  estadoAplicacion.ticksRecibidos++;
  guardarPrecio(precio);
  guardarUltimoDigito(ultimoDigito);
  mostrarMovimientoPrecio(precio);

  if (interfaz.precioActual) {
    interfaz.precioActual.textContent = precioFormateado;
  }

  if (interfaz.contadorTicks) {
    interfaz.contadorTicks.textContent =
      String(estadoAplicacion.ticksRecibidos);
  }

  if (interfaz.ultimoDigito) {
    interfaz.ultimoDigito.textContent =
      Number.isInteger(ultimoDigito)
        ? String(ultimoDigito)
        : "--";
  }

  if (interfaz.horaActualizacion) {
    interfaz.horaActualizacion.textContent =
      obtenerHora(datosTick.epoch);
  }

  if (interfaz.estadoDatos) {
    interfaz.estadoDatos.textContent = "Datos en vivo";
  }

  estadoAplicacion.precioAnterior = precio;
  estadoAplicacion.ultimoPrecio = precio;
  estadoAplicacion.ultimoEpoch =
    Number.isFinite(Number(datosTick.epoch))
      ? Number(datosTick.epoch)
      : null;

  estadoAplicacion.ultimoPipSize =
    Number.isInteger(Number(datosTick.pipSize))
      ? Number(datosTick.pipSize)
      : null;

  estadoAplicacion.ultimoPrecioFormateado =
    precioFormateado;

  actualizarIndicadores();
  actualizarProgresoDatos();
}

/* =====================================================
11. MOTOR DE PREDICCIÓN
===================================================== */

function obtenerUltimosDigitos(cantidad = 20) {
  return estadoAplicacion.ultimosDigitos.slice(-cantidad);
}

function contarDigitos(digitos) {
  const conteo = Array(10).fill(0);

  digitos.forEach((digito) => {
    if (
      Number.isInteger(digito) &&
      digito >= 0 &&
      digito <= 9
    ) {
      conteo[digito]++;
    }
  });

  return conteo;
}

function evaluarTendencia(tendencia) {
  const resultado = {
    puntaje: 0,
    razones: [],
    advertencias: []
  };

  if (!tendencia) {
    resultado.advertencias.push(
      "No fue posible evaluar la tendencia."
    );
    return resultado;
  }

  if (tendencia.direccion === "Alcista") {
    resultado.puntaje += 2;
    resultado.razones.push(
      "La tendencia reciente es alcista."
    );
  } else if (tendencia.direccion === "Bajista") {
    resultado.puntaje -= 2;
    resultado.razones.push(
      "La tendencia reciente es bajista."
    );
  } else {
    resultado.advertencias.push(
      "La tendencia se encuentra lateral."
    );
  }

  return resultado;
}

function evaluarMomentum(momentum) {
  const resultado = {
    puntaje: 0,
    razones: [],
    advertencias: []
  };

  if (!momentum) {
    resultado.advertencias.push(
      "No fue posible evaluar el momentum."
    );
    return resultado;
  }

  if (momentum.direccion === "Positivo") {
    resultado.puntaje += 1;
    resultado.razones.push(
      "El momentum inmediato es positivo."
    );
  } else if (momentum.direccion === "Negativo") {
    resultado.puntaje -= 1;
    resultado.razones.push(
      "El momentum inmediato es negativo."
    );
  } else {
    resultado.advertencias.push(
      "El momentum no muestra una dirección clara."
    );
  }

  return resultado;
}

function evaluarRSI(rsi) {
  const resultado = {
    puntaje: 0,
    razones: [],
    advertencias: []
  };

  if (!Number.isFinite(rsi)) {
    resultado.advertencias.push(
      "Todavía no hay suficientes datos para calcular el RSI."
    );
    return resultado;
  }

  if (rsi >= 55 && rsi <= 72) {
    resultado.puntaje += 1;
    resultado.razones.push(
      "El RSI acompaña el movimiento alcista."
    );
  } else if (rsi <= 45 && rsi >= 28) {
    resultado.puntaje -= 1;
    resultado.razones.push(
      "El RSI acompaña el movimiento bajista."
    );
  } else if (rsi > 72) {
    resultado.puntaje -= 1;
    resultado.advertencias.push(
      "El RSI está en una zona alta y podría existir agotamiento."
    );
  } else if (rsi < 28) {
    resultado.puntaje += 1;
    resultado.advertencias.push(
      "El RSI está en una zona baja y podría existir rebote."
    );
  } else {
    resultado.advertencias.push(
      "El RSI permanece en una zona neutral."
    );
  }

  return resultado;
}

function evaluarVolatilidad(volatilidad) {
  const resultado = {
    ajusteConfianza: 0,
    razones: [],
    advertencias: []
  };

  if (!volatilidad) {
    resultado.advertencias.push(
      "No fue posible evaluar la volatilidad."
    );
    return resultado;
  }

  if (volatilidad.nivel === "Baja") {
    resultado.ajusteConfianza += 3;
    resultado.razones.push(
      "La volatilidad se mantiene relativamente estable."
    );
  } else if (volatilidad.nivel === "Media") {
    resultado.razones.push(
      "La volatilidad se encuentra en un nivel medio."
    );
  } else if (volatilidad.nivel === "Alta") {
    resultado.ajusteConfianza -= 10;
    resultado.advertencias.push(
      "La volatilidad alta reduce la estabilidad de la predicción."
    );
  }

  return resultado;
}

function combinarEvaluaciones(evaluaciones) {
  const resultado = {
    puntaje: 0,
    ajusteConfianza: 0,
    razones: [],
    advertencias: []
  };

  evaluaciones.forEach((evaluacion) => {
    if (!evaluacion) return;

    if (Number.isFinite(evaluacion.puntaje)) {
      resultado.puntaje += evaluacion.puntaje;
    }

    if (Number.isFinite(evaluacion.ajusteConfianza)) {
      resultado.ajusteConfianza +=
        evaluacion.ajusteConfianza;
    }

    if (Array.isArray(evaluacion.razones)) {
      resultado.razones.push(...evaluacion.razones);
    }

    if (Array.isArray(evaluacion.advertencias)) {
      resultado.advertencias.push(
        ...evaluacion.advertencias
      );
    }
  });

  return resultado;
}

function calcularConfianza(fuerza, ajuste = 0) {
  const configuracion = obtenerConfiguracionModo();
  const base = 52;

  const confianza =
    base +
    Math.abs(fuerza) * 7 +
    ajuste +
    configuracion.ajusteConfianza;

  return Math.round(
    limitarNumero(confianza, 45, 88)
  );
}

function crearResultadoBase(
  direccion,
  confianza,
  razones = [],
  advertencias = []
) {
  return {
    direccion,
    confianza:
      direccion === "ESPERAR"
        ? 45
        : limitarNumero(confianza, 45, 88),
    titulo: `Predicción: ${direccion}`,
    razones,
    advertencias,
    vigencia: obtenerDuracionSenal(),
    mercado: estadoAplicacion.nombreMercadoActual,
    operacion: obtenerTextoOperacionActual(),
    modo: obtenerTextoModoActual(),
    hora: obtenerHora(),
    precio: estadoAplicacion.ultimoPrecio
  };
}

function generarResultadoRiseFall(indicadores) {
  const combinacion = combinarEvaluaciones([
    evaluarTendencia(indicadores.tendencia),
    evaluarMomentum(indicadores.momentum),
    evaluarRSI(indicadores.rsi),
    evaluarVolatilidad(indicadores.volatilidad)
  ]);

  let direccion = "ESPERAR";

  if (combinacion.puntaje >= 2) direccion = "SUBE";
  if (combinacion.puntaje <= -2) direccion = "BAJA";

  if (direccion === "ESPERAR") {
    combinacion.advertencias.push(
      "Los indicadores no presentan suficiente coincidencia."
    );
  }

  const confianza =
    direccion === "ESPERAR"
      ? 45
      : calcularConfianza(
          combinacion.puntaje,
          combinacion.ajusteConfianza
        );

  return crearResultadoBase(
    direccion,
    confianza,
    combinacion.razones,
    combinacion.advertencias
  );
}

function generarResultadoParImpar() {
  const digitos = obtenerUltimosDigitos(30);

  if (digitos.length < 10) {
    return crearResultadoBase(
      "ESPERAR",
      45,
      [],
      [
        "Todavía no existen suficientes dígitos para analizar Par/Impar."
      ]
    );
  }

  const cantidadPares = digitos.filter(
    (digito) => digito % 2 === 0
  ).length;

  const cantidadImpares =
    digitos.length - cantidadPares;

  const diferencia =
    cantidadPares - cantidadImpares;

  let direccion = "ESPERAR";

  if (diferencia >= 3) direccion = "PAR";
  if (diferencia <= -3) direccion = "IMPAR";

  const porcentajePares =
    (cantidadPares / digitos.length) * 100;

  const porcentajeImpares =
    100 - porcentajePares;

  const razones = [
    `Dígitos pares observados: ${cantidadPares} de ${digitos.length}.`,
    `Dígitos impares observados: ${cantidadImpares} de ${digitos.length}.`
  ];

  const advertencias = [];

  if (direccion === "ESPERAR") {
    advertencias.push(
      "La distribución entre pares e impares está demasiado equilibrada."
    );
  }

  const fuerza =
    Math.abs(porcentajePares - porcentajeImpares) / 10;

  return crearResultadoBase(
    direccion,
    direccion === "ESPERAR"
      ? 45
      : calcularConfianza(fuerza),
    razones,
    advertencias
  );
}

function generarResultadoMasMenos() {
  const digitos = obtenerUltimosDigitos(30);

  if (digitos.length < 10) {
    return crearResultadoBase(
      "ESPERAR",
      45,
      [],
      [
        "Todavía no existen suficientes dígitos para analizar Más/Menos."
      ]
    );
  }

  const menores = digitos.filter(
    (digito) => digito <= 4
  ).length;

  const mayores = digitos.filter(
    (digito) => digito >= 5
  ).length;

  const diferencia = mayores - menores;
  let direccion = "ESPERAR";

  if (diferencia >= 3) direccion = "MÁS";
  if (diferencia <= -3) direccion = "MENOS";

  const razones = [
    `Dígitos del 0 al 4: ${menores}.`,
    `Dígitos del 5 al 9: ${mayores}.`
  ];

  const advertencias = [];

  if (direccion === "ESPERAR") {
    advertencias.push(
      "No existe una diferencia suficiente entre dígitos altos y bajos."
    );
  }

  const fuerza = Math.abs(diferencia) / 3;

  return crearResultadoBase(
    direccion,
    direccion === "ESPERAR"
      ? 45
      : calcularConfianza(fuerza),
    razones,
    advertencias
  );
}

function generarResultadoMatch() {
  const digitos = obtenerUltimosDigitos(40);

  if (digitos.length < 15) {
    return crearResultadoBase(
      "ESPERAR",
      45,
      [],
      [
        "Todavía no existen suficientes dígitos para analizar Match."
      ]
    );
  }

  const conteo = contarDigitos(digitos);
  let digitoFrecuente = 0;
  let mayorFrecuencia = conteo[0];

  for (let digito = 1; digito <= 9; digito++) {
    if (conteo[digito] > mayorFrecuencia) {
      mayorFrecuencia = conteo[digito];
      digitoFrecuente = digito;
    }
  }

  const porcentaje =
    (mayorFrecuencia / digitos.length) * 100;

  let direccion = "ESPERAR";
  const advertencias = [];

  if (mayorFrecuencia >= 4 && porcentaje >= 15) {
    direccion = `MATCH ${digitoFrecuente}`;
  } else {
    advertencias.push(
      "Ningún dígito muestra una frecuencia suficientemente destacada."
    );
  }

  const razones = [
    `El dígito más frecuente es ${digitoFrecuente}.`,
    `Apareció ${mayorFrecuencia} veces en los últimos ${digitos.length} ticks.`,
    `Frecuencia observada: ${porcentaje.toFixed(1)}%.`
  ];

  const fuerza =
    Math.max(0, porcentaje - 10) / 3;

  return crearResultadoBase(
    direccion,
    direccion === "ESPERAR"
      ? 45
      : calcularConfianza(fuerza, -5),
    razones,
    advertencias
  );
}

function generarResultadoTecnico() {
  const indicadores =
    estadoAplicacion.indicadoresActuales ||
    calcularIndicadores();

  if (!indicadores) return null;

  const operacion = obtenerOperacionActual();

  if (
    operacion === "par_impar" ||
    operacion === "even_odd"
  ) {
    return generarResultadoParImpar();
  }

  if (
    operacion === "mas_menos" ||
    operacion === "over_under"
  ) {
    return generarResultadoMasMenos();
  }

  if (
    operacion === "match" ||
    operacion === "matches"
  ) {
    return generarResultadoMatch();
  }

  return generarResultadoRiseFall(indicadores);
}

/* =====================================================
12. MOSTRAR RESULTADO E HISTORIAL
===================================================== */

function mostrarResultado(resultado) {
  estadoAplicacion.ultimoResultado = resultado;

  if (interfaz.panelSenal) {
    interfaz.panelSenal.className = "panel-senal";

    if (
      ["SUBE", "PAR", "MÁS"].includes(resultado.direccion) ||
      resultado.direccion.startsWith("MATCH")
    ) {
      interfaz.panelSenal.classList.add("sube");
    } else if (
      ["BAJA", "IMPAR", "MENOS"].includes(
        resultado.direccion
      )
    ) {
      interfaz.panelSenal.classList.add("baja");
    } else {
      interfaz.panelSenal.classList.add("esperar");
    }
  }

  if (interfaz.prediccionEstado) {
    interfaz.prediccionEstado.textContent =
      resultado.direccion === "ESPERAR"
        ? "Sin ventaja clara"
        : "Predicción preparada";
  }

  if (interfaz.prediccionTitulo) {
    interfaz.prediccionTitulo.textContent =
      resultado.titulo;
  }

  if (interfaz.prediccionDireccion) {
    interfaz.prediccionDireccion.textContent =
      resultado.direccion;
  }

  if (interfaz.prediccionConfianza) {
    interfaz.prediccionConfianza.textContent =
      `${resultado.confianza}%`;
  }

  if (interfaz.barraConfianza) {
    interfaz.barraConfianza.style.width =
      `${resultado.confianza}%`;
  }

  if (interfaz.vigenciaSenal) {
    interfaz.vigenciaSenal.textContent =
      `Vigencia estimada: ${resultado.vigencia} segundos`;
  }

  limpiarMotivosResultado();

  resultado.razones.forEach(agregarMotivoResultado);

  resultado.advertencias.forEach((advertencia) => {
    agregarMotivoResultado(`⚠ ${advertencia}`);
  });

  if (
    resultado.razones.length === 0 &&
    resultado.advertencias.length === 0
  ) {
    agregarMotivoResultado(
      "No fue posible identificar una ventaja técnica clara."
    );
  }
}

function crearElementoHistorial(resultado) {
  const articulo = document.createElement("article");
  articulo.className = "historial-item";

  const titulo = document.createElement("strong");
  titulo.textContent =
    `${resultado.hora} · ${resultado.direccion} · ` +
    `${resultado.confianza}%`;

  const detalle = document.createElement("p");
  detalle.textContent =
    `${resultado.mercado} · ${resultado.operacion} · ` +
    `${resultado.modo}`;

  articulo.appendChild(titulo);
  articulo.appendChild(detalle);

  return articulo;
}

function actualizarHistorialPantalla() {
  if (!interfaz.historialAnalisis) return;

  interfaz.historialAnalisis.innerHTML = "";

  if (estadoAplicacion.historial.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "mensaje-vacio";
    mensaje.textContent =
      "Todavía no se han generado análisis.";

    interfaz.historialAnalisis.appendChild(mensaje);
    return;
  }

  estadoAplicacion.historial.forEach((resultado) => {
    interfaz.historialAnalisis.appendChild(
      crearElementoHistorial(resultado)
    );
  });
}

function agregarResultadoHistorial(resultado) {
  estadoAplicacion.historial.unshift(resultado);

  if (
    estadoAplicacion.historial.length >
    CONFIGURACION.maximoHistorial
  ) {
    estadoAplicacion.historial =
      estadoAplicacion.historial.slice(
        0,
        CONFIGURACION.maximoHistorial
      );
  }

  actualizarHistorialPantalla();
}

function limpiarHistorial() {
  estadoAplicacion.historial = [];
  actualizarHistorialPantalla();
  registrarActividad("Historial de análisis limpiado.");
}

/* =====================================================
13. CUENTA REGRESIVA Y EJECUCIÓN
===================================================== */

function actualizarTextoVigencia(segundos) {
  if (!interfaz.vigenciaSenal) return;

  if (segundos <= 0) {
    interfaz.vigenciaSenal.textContent =
      "Señal finalizada";
    return;
  }

  interfaz.vigenciaSenal.textContent =
    `Vigencia: ${segundos} ` +
    (segundos === 1 ? "segundo" : "segundos");

  if (interfaz.cuentaRegresiva) {
    interfaz.cuentaRegresiva.textContent =
      String(segundos);
  }
}

function iniciarCuentaRegresiva(resultado) {
  detenerCuentaRegresiva();

  if (!resultado || resultado.direccion === "ESPERAR") {
    if (interfaz.vigenciaSenal) {
      interfaz.vigenciaSenal.textContent =
        "Sin cuenta regresiva";
    }
    return;
  }

  let segundos = Math.max(
    1,
    Math.round(Number(resultado.vigencia) || 10)
  );

  actualizarTextoVigencia(segundos);

  temporizadorVigencia = setInterval(() => {
    segundos--;
    actualizarTextoVigencia(segundos);

    if (
      estadoAplicacion.vozActiva &&
      [5, 3, 2, 1].includes(segundos)
    ) {
      hablarMensaje(
        `Quedan ${segundos} ` +
        (segundos === 1 ? "segundo." : "segundos.")
      );
    }

    if (segundos <= 0) {
      detenerCuentaRegresiva();

      registrarActividad(
        "La vigencia de la señal ha finalizado.",
        "advertencia"
      );

      hablarMensaje("Señal finalizada.");

      if (interfaz.prediccionEstado) {
        interfaz.prediccionEstado.textContent =
          "SEÑAL FINALIZADA";
      }
    }
  }, 1000);
}

function anunciarResultadoPorVoz(resultado) {
  if (!resultado || !estadoAplicacion.vozActiva) return;

  if (resultado.direccion === "ESPERAR") {
    hablarMensaje(
      "No existe una ventaja clara. Se recomienda esperar."
    );
    return;
  }

  hablarMensaje(
    `Predicción ${resultado.direccion}. ` +
    `Confianza técnica ${resultado.confianza} por ciento. ` +
    `Quedan ${resultado.vigencia} segundos para utilizar la señal.`
  );
}

function ejecutarAnalisis() {
  const minimo = obtenerMinimoTicks();

  if (!estadoAplicacion.conectado) {
    registrarActividad(
      "No se puede analizar porque no existe conexión.",
      "advertencia"
    );
    return null;
  }

  if (estadoAplicacion.precios.length < minimo) {
    registrarActividad(
      "Todavía faltan datos para ejecutar el análisis.",
      "advertencia"
    );

    actualizarProgresoDatos();
    return null;
  }

  const ahora = Date.now();

  if (
    ahora - estadoAplicacion.ultimoAnalisisEpoch <
    CONFIGURACION.intervaloAnalisisDuplicado
  ) {
    registrarActividad(
      "Espera un momento antes de generar otro análisis.",
      "advertencia"
    );
    return null;
  }

  estadoAplicacion.ultimoAnalisisEpoch = ahora;
  estadoAplicacion.analizando = true;

  registrarActividad(
    `Analizando ${estadoAplicacion.nombreMercadoActual} ` +
    `con la estrategia ${obtenerTextoOperacionActual()}.`
  );

  actualizarIndicadores();
  const resultado = generarResultadoTecnico();

  estadoAplicacion.analizando = false;

  if (!resultado) {
    registrarActividad(
      "No fue posible generar un resultado técnico.",
      "error"
    );
    return null;
  }

  mostrarResultado(resultado);
  agregarResultadoHistorial(resultado);

  registrarActividad(
    `Predicción generada: ${resultado.direccion} con ` +
    `${resultado.confianza}% de confianza técnica.`,
    resultado.direccion === "ESPERAR"
      ? "advertencia"
      : "exito"
  );

  return resultado;
}

function ejecutarAnalisisCompleto() {
  hablarMensaje("Analizando mercado.");

  const resultado = ejecutarAnalisis();
  if (!resultado) return;

  anunciarResultadoPorVoz(resultado);
  iniciarCuentaRegresiva(resultado);
}

/* =====================================================
14. CAMBIOS DE MERCADO, ESTRATEGIA Y MODO
===================================================== */

function manejarCambioMercado() {
  detenerCuentaRegresiva();
  detenerVoz();
  sincronizarSeleccionActual();

  limpiarDatosMercado(
    "Esperando datos del nuevo mercado"
  );

  registrarActividad(
    `Mercado seleccionado: ${estadoAplicacion.nombreMercadoActual}.`
  );

  hablarMensaje(
    `Mercado cambiado a ${estadoAplicacion.nombreMercadoActual}.`
  );

  if (derivAPI.estaConectado()) {
    derivAPI.cambiarSimbolo(
      estadoAplicacion.simboloActual
    );

    registrarActividad(
      "Solicitando datos del nuevo mercado."
    );
  }
}

function manejarCambioOperacion() {
  detenerCuentaRegresiva();
  detenerVoz();
  sincronizarSeleccionActual();

  estadoAplicacion.versionAnalisis++;
  estadoAplicacion.ultimoResultado = null;
  estadoAplicacion.ultimoAnalisisEpoch = 0;
  estadoAplicacion.claveUltimoAnalisis = "";

  reiniciarPanelSenal(
    "La estrategia cambió. Ejecuta un nuevo análisis."
  );

  actualizarProgresoDatos();

  registrarActividad(
    `Estrategia seleccionada: ` +
    `${estadoAplicacion.nombreEstrategiaActual}.`
  );

  hablarMensaje(
    `Estrategia cambiada a ` +
    `${estadoAplicacion.nombreEstrategiaActual}.`
  );
}

function manejarCambioModo() {
  detenerCuentaRegresiva();
  detenerVoz();
  sincronizarSeleccionActual();

  estadoAplicacion.versionAnalisis++;
  estadoAplicacion.ultimoResultado = null;
  estadoAplicacion.ultimoAnalisisEpoch = 0;
  estadoAplicacion.claveUltimoAnalisis = "";

  reiniciarPanelSenal(
    "El modo cambió. Ejecuta un nuevo análisis."
  );

  actualizarIndicadores();
  actualizarProgresoDatos();

  const modo = obtenerTextoModoActual();

  registrarActividad(
    `Modo de análisis seleccionado: ${modo}.`
  );

  hablarMensaje(`Modo cambiado a ${modo}.`);
}

/* =====================================================
15. EVENTOS DE DERIV
===================================================== */

function procesarEstadoDeriv(datosEstado) {
  if (!datosEstado) return;

  const estado = datosEstado.estado || "desconectado";
  const texto = datosEstado.texto || estado;

  mostrarEstadoConexion(estado, texto);
  actualizarProgresoDatos();

  if (estado === "conectando") {
    if (interfaz.estadoDatos) {
      interfaz.estadoDatos.textContent = "Conectando...";
    }
    return;
  }

  if (estado === "conectado") {
    registrarActividad(
      "Conexión con Deriv activa.",
      "exito"
    );

    if (interfaz.estadoDatos) {
      interfaz.estadoDatos.textContent =
        "Esperando precios";
    }

    hablarMensaje(
      `Conectado a ${estadoAplicacion.nombreMercadoActual}.`
    );

    return;
  }

  if (estado === "desconectado") {
    detenerCuentaRegresiva();

    if (interfaz.estadoDatos) {
      interfaz.estadoDatos.textContent =
        "Sin conexión";
    }

    registrarActividad(
      "La conexión con Deriv está cerrada.",
      "advertencia"
    );
  }
}

function procesarErrorDeriv(datosError) {
  const mensaje =
    datosError?.mensaje ||
    "Error desconocido de conexión.";

  detenerCuentaRegresiva();

  mostrarEstadoConexion("error", "Error");
  registrarActividad(mensaje, "error");
  hablarMensaje("Se produjo un error de conexión.");
}

function procesarDiagnosticoDeriv(datosDiagnostico) {
  if (!datosDiagnostico) return;

  registrarActividad(
    `[Deriv] ${datosDiagnostico.mensaje || "Mensaje de diagnóstico."}`,
    datosDiagnostico.tipo || "normal"
  );
}

function configurarEventosDeriv() {
  derivAPI.al("estado", procesarEstadoDeriv);
  derivAPI.al("tick", procesarTick);
  derivAPI.al("error", procesarErrorDeriv);
  derivAPI.al("diagnostico", procesarDiagnosticoDeriv);
}

/* =====================================================
16. EVENTOS DE INTERFAZ
===================================================== */

function limpiarRegistroActividad() {
  if (!interfaz.registroActividad) return;

  interfaz.registroActividad.innerHTML = "";
  registrarActividad("Registro de actividad limpiado.");
}

function configurarEventosInterfaz() {
  interfaz.botonConectar?.addEventListener(
    "click",
    conectarConDeriv
  );

  interfaz.botonDesconectar?.addEventListener(
    "click",
    desconectarDeDeriv
  );

  interfaz.selectorIndice?.addEventListener(
    "change",
    manejarCambioMercado
  );

  interfaz.selectorOperacion?.addEventListener(
    "change",
    manejarCambioOperacion
  );

  interfaz.selectorModo?.addEventListener(
    "change",
    manejarCambioModo
  );

  interfaz.botonAnalizar?.addEventListener(
    "click",
    ejecutarAnalisisCompleto
  );

  interfaz.botonVoz?.addEventListener(
    "click",
    alternarVoz
  );

  interfaz.botonLimpiarHistorial?.addEventListener(
    "click",
    limpiarHistorial
  );

  interfaz.botonLimpiarRegistro?.addEventListener(
    "click",
    limpiarRegistroActividad
  );
}

/* =====================================================
17. INICIO DE LA APLICACIÓN
===================================================== */

function verificarElementosImportantes() {
  const elementosImportantes = [
    interfaz.botonConectar,
    interfaz.botonDesconectar,
    interfaz.selectorIndice,
    interfaz.selectorOperacion,
    interfaz.selectorModo,
    interfaz.precioActual,
    interfaz.botonAnalizar,
    interfaz.panelSenal
  ];

  const faltantes = elementosImportantes.filter(
    (elemento) => !elemento
  );

  if (faltantes.length > 0) {
    registrarActividad(
      "Faltan elementos importantes en index.html.",
      "error"
    );
    return false;
  }

  return true;
}

function iniciarAplicacion() {
  sincronizarSeleccionActual();

  mostrarEstadoConexion(
    "desconectado",
    "Desconectado"
  );

  limpiarDatosMercado();
  actualizarHistorialPantalla();
  actualizarBotonVoz();

  configurarEventosDeriv();
  configurarEventosInterfaz();

  if (!verificarElementosImportantes()) {
    registrarActividad(
      "La aplicación no pudo iniciar completamente.",
      "error"
    );
    return;
  }

  registrarActividad(
    `Trading Analyzer V${CONFIGURACION.version} cargado correctamente.`,
    "exito"
  );

  registrarActividad(
    "Mercado, estrategia e indicadores preparados."
  );

  registrarActividad(
    "Selecciona el mercado y presiona Conectar con Deriv."
  );
}

window.addEventListener("beforeunload", () => {
  detenerCuentaRegresiva();
  detenerVoz();
  derivAPI.desconectar();
});

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarAplicacion
  );
} else {
  iniciarAplicacion();
}

/*
=========================================================
FIN DEL ARCHIVO app.js
TRADING ANALYZER V6
=========================================================
*/

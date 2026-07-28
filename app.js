"use strict";

/*
====================================================
TRADING ANALYZER V4
Archivo: app.js
Función: controlar la interfaz y mostrar datos de Deriv
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  /*
  ====================================================
  ELEMENTOS DE LA INTERFAZ
  ====================================================
  */

  const selectorIndice = document.getElementById("selectorIndice");
  const selectorOperacion = document.getElementById("selectorOperacion");

  const botonConectar = document.getElementById("botonConectar");
  const botonDesconectar = document.getElementById("botonDesconectar");
  const botonLimpiarRegistro = document.getElementById(
    "botonLimpiarRegistro"
  );

  const estadoConexion = document.getElementById("estadoConexion");
  const textoConexion = document.getElementById("textoConexion");

  const nombreIndice = document.getElementById("nombreIndice");
  const mercadoEstado = document.getElementById("mercadoEstado");

  const precioActual = document.getElementById("precioActual");
  const horaActualizacion = document.getElementById("horaActualizacion");
  const contadorTicks = document.getElementById("contadorTicks");
  const ultimoDigito = document.getElementById("ultimoDigito");

  const tendencia = document.getElementById("tendencia");
  const rsi = document.getElementById("rsi");
  const volatilidad = document.getElementById("volatilidad");

  const estadoAplicacion = document.getElementById("estadoAplicacion");
  const estadoServidor = document.getElementById("estadoServidor");
  const estadoSuscripcion = document.getElementById("estadoSuscripcion");
  const simboloActivo = document.getElementById("simboloActivo");
  const ultimoMensaje = document.getElementById("ultimoMensaje");

  const registroActividad = document.getElementById("registroActividad");

  /*
  ====================================================
  ESTADO DE LA APLICACIÓN
  ====================================================
  */

  let totalTicks = 0;
  let precios = [];
  let simboloSeleccionado = selectorIndice
    ? selectorIndice.value
    : "1HZ100V";

  let conexionSolicitada = false;

  const MAXIMO_PRECIOS = 100;

  /*
  ====================================================
  VALIDACIÓN INICIAL
  ====================================================
  */

  if (!window.derivAPI) {
    console.error(
      "[App] No se encontró la instancia window.derivAPI."
    );

    actualizarTexto(
      estadoAplicacion,
      "Error: deriv-api.js no fue cargado"
    );

    actualizarTexto(
      ultimoMensaje,
      "No se encontró deriv-api.js"
    );

    agregarRegistro(
      "Error: no se pudo cargar el controlador de Deriv.",
      "error"
    );

    if (botonConectar) {
      botonConectar.disabled = true;
    }

    return;
  }

  actualizarTexto(estadoAplicacion, "Iniciada correctamente");
  actualizarTexto(estadoServidor, "Sin conexión");
  actualizarTexto(estadoSuscripcion, "Inactiva");
  actualizarTexto(simboloActivo, simboloSeleccionado);
  actualizarTexto(ultimoMensaje, "Aplicación preparada");

  actualizarNombreIndice();

  agregarRegistro(
    "Trading Analyzer V4 preparado correctamente.",
    "informacion"
  );

  /*
  ====================================================
  FUNCIONES GENERALES
  ====================================================
  */

  function actualizarTexto(elemento, texto) {
    if (elemento) {
      elemento.textContent = texto;
    }
  }

  function obtenerHoraActual() {
    return new Date().toLocaleTimeString("es-SV", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  function agregarRegistro(mensaje, tipo = "informacion") {
    if (!registroActividad) {
      return;
    }

    const elemento = document.createElement("p");
    const hora = obtenerHoraActual();

    elemento.textContent = `[${hora}] ${mensaje}`;
    elemento.classList.add("registro-linea");
    elemento.classList.add(`registro-${tipo}`);

    registroActividad.prepend(elemento);

    while (registroActividad.children.length > 40) {
      registroActividad.removeChild(
        registroActividad.lastElementChild
      );
    }
  }

  function obtenerNombreIndice(simbolo) {
    const nombres = {
      R_10: "Volatility 10 Index",
      R_25: "Volatility 25 Index",
      R_50: "Volatility 50 Index",
      R_75: "Volatility 75 Index",
      R_100: "Volatility 100 Index",

      "1HZ10V": "Volatility 10 (1s) Index",
      "1HZ15V": "Volatility 15 (1s) Index",
      "1HZ25V": "Volatility 25 (1s) Index",
      "1HZ30V": "Volatility 30 (1s) Index",
      "1HZ50V": "Volatility 50 (1s) Index",
      "1HZ75V": "Volatility 75 (1s) Index",
      "1HZ90V": "Volatility 90 (1s) Index",
      "1HZ100V": "Volatility 100 (1s) Index"
    };

    return nombres[simbolo] || simbolo;
  }

  function actualizarNombreIndice() {
    actualizarTexto(
      nombreIndice,
      obtenerNombreIndice(simboloSeleccionado)
    );

    actualizarTexto(simboloActivo, simboloSeleccionado);
  }

  function limpiarDatosMercado() {
    totalTicks = 0;
    precios = [];

    actualizarTexto(precioActual, "--");
    actualizarTexto(horaActualizacion, "Sin información");
    actualizarTexto(contadorTicks, "0");
    actualizarTexto(ultimoDigito, "--");

    actualizarTexto(tendencia, "Esperando");
    actualizarTexto(rsi, "--");
    actualizarTexto(volatilidad, "--");
  }

  function actualizarBotones(conectado) {
    if (botonConectar) {
      botonConectar.disabled = conectado;
    }

    if (botonDesconectar) {
      botonDesconectar.disabled = !conectado;
    }
  }

  function actualizarEstadoVisual(estado, mensaje = "") {
    actualizarTexto(
      textoConexion,
      mensaje || estado
    );

    actualizarTexto(
      estadoServidor,
      mensaje || estado
    );

    actualizarTexto(
      ultimoMensaje,
      mensaje || estado
    );

    if (!estadoConexion) {
      return;
    }

    estadoConexion.classList.remove(
      "estado-conexion-conectado",
      "estado-conexion-conectando",
      "estado-conexion-desconectado",
      "estado-conexion-error"
    );

    switch (estado) {
      case "conectado":
        estadoConexion.classList.add(
          "estado-conexion-conectado"
        );
        actualizarTexto(textoConexion, "Conectado");
        actualizarTexto(mercadoEstado, "Recibiendo datos");
        actualizarBotones(true);
        break;

      case "conectando":
      case "reconectando":
        estadoConexion.classList.add(
          "estado-conexion-conectando"
        );
        actualizarTexto(textoConexion, "Conectando...");
        actualizarTexto(mercadoEstado, "Esperando conexión");
        break;

      case "error":
        estadoConexion.classList.add(
          "estado-conexion-error"
        );
        actualizarTexto(textoConexion, "Error de conexión");
        actualizarTexto(mercadoEstado, "Error");
        actualizarBotones(false);
        break;

      default:
        estadoConexion.classList.add(
          "estado-conexion-desconectado"
        );
        actualizarTexto(textoConexion, "Desconectado");
        actualizarTexto(mercadoEstado, "Sin conexión");
        actualizarBotones(false);
        break;
    }
  }

  /*
  ====================================================
  FORMATO DEL PRECIO
  ====================================================
  */

  function formatearPrecio(precio, pipSize) {
    if (!Number.isFinite(precio)) {
      return "--";
    }

    let decimales = 2;

    if (
      Number.isInteger(pipSize) &&
      pipSize >= 0 &&
      pipSize <= 10
    ) {
      decimales = pipSize;
    }

    return precio.toLocaleString("es-SV", {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  function obtenerUltimoDigito(precioFormateado) {
    const soloNumeros = String(precioFormateado).replace(
      /\D/g,
      ""
    );

    if (!soloNumeros) {
      return "--";
    }

    return soloNumeros.slice(-1);
  }

  /*
  ====================================================
  INDICADORES BÁSICOS
  ====================================================
  */

  function calcularRSI(lista, periodo = 14) {
    if (lista.length < periodo + 1) {
      return null;
    }

    const recientes = lista.slice(-(periodo + 1));

    let ganancias = 0;
    let perdidas = 0;

    for (let i = 1; i < recientes.length; i += 1) {
      const diferencia = recientes[i] - recientes[i - 1];

      if (diferencia > 0) {
        ganancias += diferencia;
      } else if (diferencia < 0) {
        perdidas += Math.abs(diferencia);
      }
    }

    const promedioGanancias = ganancias / periodo;
    const promedioPerdidas = perdidas / periodo;

    if (promedioPerdidas === 0) {
      return promedioGanancias > 0 ? 100 : 50;
    }

    const fuerzaRelativa =
      promedioGanancias / promedioPerdidas;

    return 100 - 100 / (1 + fuerzaRelativa);
  }

  function calcularTendencia(lista) {
    if (lista.length < 10) {
      return "Esperando datos";
    }

    const recientes = lista.slice(-10);
    const primeraMitad = recientes.slice(0, 5);
    const segundaMitad = recientes.slice(5);

    const promedioPrimero =
      primeraMitad.reduce((total, valor) => total + valor, 0) /
      primeraMitad.length;

    const promedioSegundo =
      segundaMitad.reduce((total, valor) => total + valor, 0) /
      segundaMitad.length;

    const diferencia = promedioSegundo - promedioPrimero;

    if (Math.abs(diferencia) < 0.000001) {
      return "Lateral";
    }

    return diferencia > 0 ? "Alcista" : "Bajista";
  }

  function calcularVolatilidad(lista) {
    if (lista.length < 10) {
      return null;
    }

    const recientes = lista.slice(-20);
    const promedio =
      recientes.reduce((total, valor) => total + valor, 0) /
      recientes.length;

    const varianza =
      recientes.reduce((total, valor) => {
        return total + Math.pow(valor - promedio, 2);
      }, 0) / recientes.length;

    const desviacion = Math.sqrt(varianza);

    if (promedio === 0) {
      return 0;
    }

    return (desviacion / promedio) * 100;
  }

  function actualizarIndicadores() {
    const valorRSI = calcularRSI(precios);
    const valorVolatilidad = calcularVolatilidad(precios);
    const valorTendencia = calcularTendencia(precios);

    actualizarTexto(tendencia, valorTendencia);

    actualizarTexto(
      rsi,
      valorRSI === null ? "--" : valorRSI.toFixed(2)
    );

    actualizarTexto(
      volatilidad,
      valorVolatilidad === null
        ? "--"
        : `${valorVolatilidad.toFixed(4)} %`
    );
  }

  /*
  ====================================================
  CONTROL DE CONEXIÓN
  ====================================================
  */

  function conectarConDeriv() {
    if (conexionSolicitada || window.derivAPI.estaConectado()) {
      agregarRegistro(
        "Ya existe una conexión abierta o en proceso.",
        "advertencia"
      );
      return;
    }

    simboloSeleccionado = selectorIndice
      ? selectorIndice.value
      : "1HZ100V";

    conexionSolicitada = true;

    limpiarDatosMercado();
    actualizarNombreIndice();
    actualizarEstadoVisual(
      "conectando",
      "Conectando con Deriv..."
    );

    agregarRegistro(
      `Iniciando conexión para ${obtenerNombreIndice(
        simboloSeleccionado
      )}.`,
      "informacion"
    );

    window.derivAPI.activarReconexionAutomatica();
    window.derivAPI.suscribirseTicks(simboloSeleccionado);
  }

  function desconectarDeDeriv() {
    conexionSolicitada = false;

    actualizarTexto(
      ultimoMensaje,
      "Desconectando del servidor..."
    );

    agregarRegistro(
      "Desconexión solicitada por el usuario.",
      "informacion"
    );

    window.derivAPI.desconectar();
  }

  /*
  ====================================================
  BOTONES Y SELECTORES
  ====================================================
  */

  if (botonConectar) {
    botonConectar.addEventListener("click", conectarConDeriv);
  }

  if (botonDesconectar) {
    botonDesconectar.addEventListener(
      "click",
      desconectarDeDeriv
    );
  }

  if (botonLimpiarRegistro) {
    botonLimpiarRegistro.addEventListener("click", () => {
      if (registroActividad) {
        registroActividad.innerHTML = "";
      }

      agregarRegistro(
        "Registro de actividad limpiado.",
        "informacion"
      );
    });
  }

  if (selectorIndice) {
    selectorIndice.addEventListener("change", () => {
      simboloSeleccionado = selectorIndice.value;

      limpiarDatosMercado();
      actualizarNombreIndice();

      agregarRegistro(
        `Índice seleccionado: ${obtenerNombreIndice(
          simboloSeleccionado
        )}.`,
        "informacion"
      );

      if (window.derivAPI.estaConectado()) {
        actualizarTexto(
          estadoSuscripcion,
          "Cambiando símbolo..."
        );

        window.derivAPI.cambiarSimbolo(
          simboloSeleccionado
        );
      }
    });
  }

  if (selectorOperacion) {
    selectorOperacion.addEventListener("change", () => {
      const opcion =
        selectorOperacion.options[
          selectorOperacion.selectedIndex
        ];

      agregarRegistro(
        `Tipo de análisis seleccionado: ${opcion.text}.`,
        "informacion"
      );
    });
  }

  /*
  ====================================================
  EVENTOS RECIBIDOS DESDE deriv-api.js
  ====================================================
  */

  window.addEventListener("deriv:estado", (evento) => {
    const detalle = evento.detail || {};
    const estado = detalle.estado || "desconectado";
    const mensaje = detalle.mensaje || estado;

    actualizarEstadoVisual(estado, mensaje);
  });

  window.addEventListener("deriv:conectado", () => {
    conexionSolicitada = false;

    actualizarEstadoVisual(
      "conectado",
      "Conexión establecida correctamente"
    );

    actualizarTexto(
      estadoServidor,
      "Conectado correctamente"
    );

    agregarRegistro(
      "Conexión con Deriv establecida.",
      "exito"
    );
  });

  window.addEventListener("deriv:desconectado", (evento) => {
    conexionSolicitada = false;

    const detalle = evento.detail || {};
    const motivo =
      detalle.motivo || "Conexión finalizada";

    actualizarEstadoVisual("desconectado", motivo);
    actualizarTexto(estadoSuscripcion, "Inactiva");

    agregarRegistro(
      `Desconectado: ${motivo}.`,
      "advertencia"
    );
  });

  window.addEventListener("deriv:suscribiendo", (evento) => {
    const detalle = evento.detail || {};
    const simbolo = detalle.simbolo || simboloSeleccionado;

    actualizarTexto(estadoSuscripcion, "Solicitando...");
    actualizarTexto(simboloActivo, simbolo);

    agregarRegistro(
      `Solicitando ticks para ${obtenerNombreIndice(simbolo)}.`,
      "informacion"
    );
  });

  window.addEventListener("deriv:tick", (evento) => {
    const tick = evento.detail || {};
    const precio = Number(tick.precio);

    if (!Number.isFinite(precio)) {
      return;
    }

    totalTicks += 1;

    precios.push(precio);

    if (precios.length > MAXIMO_PRECIOS) {
      precios.shift();
    }

    const precioMostrado = formatearPrecio(
      precio,
      tick.pipSize
    );

    actualizarTexto(precioActual, precioMostrado);
    actualizarTexto(contadorTicks, String(totalTicks));
    actualizarTexto(
      ultimoDigito,
      obtenerUltimoDigito(precioMostrado)
    );

    actualizarTexto(
      horaActualizacion,
      tick.fecha instanceof Date
        ? tick.fecha.toLocaleTimeString("es-SV")
        : obtenerHoraActual()
    );

    actualizarTexto(estadoSuscripcion, "Activa");
    actualizarTexto(mercadoEstado, "Mercado en vivo");
    actualizarTexto(
      simboloActivo,
      tick.simbolo || simboloSeleccionado
    );

    actualizarTexto(
      ultimoMensaje,
      `Tick ${totalTicks} recibido correctamente`
    );

    actualizarIndicadores();
  });

  window.addEventListener(
    "deriv:suscripcionCancelada",
    () => {
      actualizarTexto(
        estadoSuscripcion,
        "Suscripción anterior cancelada"
      );
    }
  );

  window.addEventListener("deriv:reconexion", (evento) => {
    const detalle = evento.detail || {};
    const intento = detalle.intento || 1;
    const espera = detalle.espera || 0;

    conexionSolicitada = false;

    actualizarEstadoVisual(
      "reconectando",
      `Reconectando: intento ${intento}`
    );

    agregarRegistro(
      `Reconexión ${intento}; espera aproximada: ${Math.round(
        espera / 1000
      )} segundos.`,
      "advertencia"
    );
  });

  window.addEventListener("deriv:pong", () => {
    actualizarTexto(
      ultimoMensaje,
      "Servidor activo; respuesta ping recibida"
    );
  });

  window.addEventListener("deriv:error", (evento) => {
    conexionSolicitada = false;

    const detalle = evento.detail || {};
    const mensaje =
      detalle.mensaje || "Error desconocido de Deriv";

    actualizarEstadoVisual("error", mensaje);
    actualizarTexto(estadoSuscripcion, "Error");

    agregarRegistro(
      `Error de Deriv: ${mensaje}`,
      "error"
    );
  });

  /*
  ====================================================
  ESTADO INICIAL
  ====================================================
  */

  actualizarBotones(false);
  actualizarEstadoVisual(
    "desconectado",
    "Desconectado"
  );

  console.log("app.js cargado correctamente.");
});

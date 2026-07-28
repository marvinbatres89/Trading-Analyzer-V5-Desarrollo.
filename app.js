"use strict";

/*
====================================================
TRADING ANALYZER V5.2
Archivo: app.js

Funciones principales:
- Controlar la interfaz.
- Conectarse con Deriv mediante deriv-api.js.
- Recibir precios en tiempo real.
- Calcular RSI, tendencia y volatilidad.
- Generar un análisis explicado.
- Mostrar un porcentaje estimado de confianza.

IMPORTANTE:
La confianza mostrada es una puntuación técnica interna.
No garantiza el resultado de una operación.
====================================================
*/

document.addEventListener("DOMContentLoaded", () => {
  /*
  ====================================================
  ELEMENTOS DE CONFIGURACIÓN
  ====================================================
  */

  const selectorIndice =
    document.getElementById("selectorIndice");

  const selectorOperacion =
    document.getElementById("selectorOperacion");

  const selectorEstrategia =
    document.getElementById("selectorEstrategia");

  /*
  ====================================================
  BOTONES
  ====================================================
  */

  const botonConectar =
    document.getElementById("botonConectar");

  const botonDesconectar =
    document.getElementById("botonDesconectar");

  const botonAnalizar =
    document.getElementById("botonAnalizar");

  const botonVoz =
    document.getElementById("botonVoz");

  const botonLimpiarRegistro =
    document.getElementById("botonLimpiarRegistro");

  /*
  ====================================================
  ESTADO DE CONEXIÓN
  ====================================================
  */

  const estadoConexion =
    document.getElementById("estadoConexion");

  const textoConexion =
    document.getElementById("textoConexion");

  /*
  ====================================================
  INFORMACIÓN DEL MERCADO
  ====================================================
  */

  const nombreIndice =
    document.getElementById("nombreIndice");

  const mercadoEstado =
    document.getElementById("mercadoEstado");

  const precioActual =
    document.getElementById("precioActual");

  const horaActualizacion =
    document.getElementById("horaActualizacion");

  const contadorTicks =
    document.getElementById("contadorTicks");

  const ultimoDigito =
    document.getElementById("ultimoDigito");

  /*
  ====================================================
  INDICADORES
  ====================================================
  */

  const tendencia =
    document.getElementById("tendencia");

  const rsi =
    document.getElementById("rsi");

  const volatilidad =
    document.getElementById("volatilidad");

  /*
  ====================================================
  TARJETA DE PREDICCIÓN
  ====================================================
  */

  const prediccionTitulo =
    document.getElementById("prediccionTitulo");

  const prediccionConfianza =
    document.getElementById("prediccionConfianza");

  const prediccionMotivos =
    document.getElementById("prediccionMotivos");

  const prediccionEstado =
    document.getElementById("prediccionEstado");

  const prediccionDireccion =
    document.getElementById("prediccionDireccion");

  const barraConfianza =
    document.getElementById("barraConfianza");

  /*
  ====================================================
  DIAGNÓSTICOS
  ====================================================
  */

  const estadoAplicacion =
    document.getElementById("estadoAplicacion");

  const estadoServidor =
    document.getElementById("estadoServidor");

  const estadoSuscripcion =
    document.getElementById("estadoSuscripcion");

  const simboloActivo =
    document.getElementById("simboloActivo");

  const ultimoMensaje =
    document.getElementById("ultimoMensaje");

  /*
  ====================================================
  REGISTRO E HISTORIAL
  ====================================================
  */

  const registroActividad =
    document.getElementById("registroActividad");

  const historialAnalisis =
    document.getElementById("historialAnalisis");

  /*
  ====================================================
  ESTADO DE LA APLICACIÓN
  ====================================================
  */

  let totalTicks = 0;
  let precios = [];
  let analizandoMercado = false;

  let simboloSeleccionado = selectorIndice
    ? selectorIndice.value
    : "1HZ100V";

  let conexionSolicitada = false;

  const MAXIMO_PRECIOS = 100;
  const MINIMO_TICKS_ANALISIS = 30;

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

  function limitarNumero(numero, minimo, maximo) {
    return Math.min(
      Math.max(numero, minimo),
      maximo
    );
  }

  function calcularPromedio(lista) {
    if (!Array.isArray(lista) || lista.length === 0) {
      return 0;
    }

    const suma = lista.reduce(
      (total, valor) => total + valor,
      0
    );

    return suma / lista.length;
  }

  function agregarRegistro(
    mensaje,
    tipo = "informacion"
  ) {
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

  /*
  ====================================================
  NOMBRES DE LOS ÍNDICES
  ====================================================
  */

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

    actualizarTexto(
      simboloActivo,
      simboloSeleccionado
    );
  }

  /*
  ====================================================
  CONTROL DE BOTONES
  ====================================================
  */

  function actualizarBotonesConexion(conectado) {
    if (botonConectar) {
      botonConectar.disabled = conectado;
    }

    if (botonDesconectar) {
      botonDesconectar.disabled = !conectado;
    }

    actualizarBotonAnalizar();
  }

  function actualizarBotonAnalizar() {
    if (!botonAnalizar) {
      return;
    }

    const conectado =
      window.derivAPI &&
      window.derivAPI.estaConectado();

    const suficientesDatos =
      precios.length >= MINIMO_TICKS_ANALISIS;

    botonAnalizar.disabled =
      !conectado ||
      !suficientesDatos ||
      analizandoMercado;
  }

  /*
  ====================================================
  LIMPIEZA DE DATOS
  ====================================================
  */

  function limpiarPrediccion() {
    actualizarTexto(
      prediccionTitulo,
      "Esperando análisis"
    );

    actualizarTexto(
      prediccionConfianza,
      "--"
    );

    actualizarTexto(
      prediccionEstado,
      "Sin analizar"
    );

    actualizarTexto(
      prediccionDireccion,
      "--"
    );

    if (prediccionMotivos) {
      prediccionMotivos.innerHTML = "";

      const motivoInicial =
        document.createElement("li");

      motivoInicial.textContent =
        "Conecta la herramienta y espera al menos 30 ticks.";

      prediccionMotivos.appendChild(
        motivoInicial
      );
    }

    if (barraConfianza) {
      barraConfianza.style.width = "0%";
      barraConfianza.setAttribute(
        "aria-valuenow",
        "0"
      );
    }
  }

  function limpiarDatosMercado() {
    totalTicks = 0;
    precios = [];
    analizandoMercado = false;

    actualizarTexto(precioActual, "--");
    actualizarTexto(
      horaActualizacion,
      "Sin información"
    );
    actualizarTexto(contadorTicks, "0");
    actualizarTexto(ultimoDigito, "--");

    actualizarTexto(tendencia, "Esperando");
    actualizarTexto(rsi, "--");
    actualizarTexto(volatilidad, "--");

    limpiarPrediccion();
    actualizarBotonAnalizar();
  }

  /*
  ====================================================
  ESTADO VISUAL DE LA CONEXIÓN
  ====================================================
  */

  function actualizarEstadoVisual(
    estado,
    mensaje = ""
  ) {
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
      actualizarBotonAnalizar();
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

        actualizarTexto(
          textoConexion,
          "Conectado"
        );

        actualizarTexto(
          mercadoEstado,
          "Recibiendo datos"
        );

        actualizarBotonesConexion(true);
        break;

      case "conectando":
      case "reconectando":
        estadoConexion.classList.add(
          "estado-conexion-conectando"
        );

        actualizarTexto(
          textoConexion,
          "Conectando..."
        );

        actualizarTexto(
          mercadoEstado,
          "Esperando conexión"
        );

        actualizarBotonesConexion(false);
        break;

      case "error":
        estadoConexion.classList.add(
          "estado-conexion-error"
        );

        actualizarTexto(
          textoConexion,
          "Error de conexión"
        );

        actualizarTexto(
          mercadoEstado,
          "Error"
        );

        actualizarBotonesConexion(false);
        break;

      default:
        estadoConexion.classList.add(
          "estado-conexion-desconectado"
        );

        actualizarTexto(
          textoConexion,
          "Desconectado"
        );

        actualizarTexto(
          mercadoEstado,
          "Sin conexión"
        );

        actualizarBotonesConexion(false);
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

  function obtenerUltimoDigito(
    precioFormateado
  ) {
    const soloNumeros = String(
      precioFormateado
    ).replace(/\D/g, "");

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

    const recientes =
      lista.slice(-(periodo + 1));

    let ganancias = 0;
    let perdidas = 0;

    for (
      let i = 1;
      i < recientes.length;
      i += 1
    ) {
      const diferencia =
        recientes[i] - recientes[i - 1];

      if (diferencia > 0) {
        ganancias += diferencia;
      } else if (diferencia < 0) {
        perdidas += Math.abs(diferencia);
      }
    }

    const promedioGanancias =
      ganancias / periodo;

    const promedioPerdidas =
      perdidas / periodo;

    if (promedioPerdidas === 0) {
      return promedioGanancias > 0
        ? 100
        : 50;
    }

    const fuerzaRelativa =
      promedioGanancias /
      promedioPerdidas;

    return (
      100 -
      100 / (1 + fuerzaRelativa)
    );
  }

  function calcularTendencia(lista) {
    if (lista.length < 10) {
      return "Esperando datos";
    }

    const recientes = lista.slice(-10);
    const primeraMitad = recientes.slice(0, 5);
    const segundaMitad = recientes.slice(5);

    const promedioPrimero =
      calcularPromedio(primeraMitad);

    const promedioSegundo =
      calcularPromedio(segundaMitad);

    const diferencia =
      promedioSegundo - promedioPrimero;

    const precioReferencia =
      Math.abs(promedioPrimero) || 1;

    const cambioPorcentual =
      Math.abs(diferencia / precioReferencia) *
      100;

    if (cambioPorcentual < 0.00001) {
      return "Lateral";
    }

    return diferencia > 0
      ? "Alcista"
      : "Bajista";
  }

  function calcularVolatilidad(lista) {
    if (lista.length < 10) {
      return null;
    }

    const recientes = lista.slice(-20);

    const promedio =
      calcularPromedio(recientes);

    const varianza =
      recientes.reduce((total, valor) => {
        return (
          total +
          Math.pow(valor - promedio, 2)
        );
      }, 0) / recientes.length;

    const desviacion =
      Math.sqrt(varianza);

    if (promedio === 0) {
      return 0;
    }

    return (
      desviacion /
      Math.abs(promedio)
    ) * 100;
  }

  function calcularMomentum(
    lista,
    periodo = 10
  ) {
    if (lista.length < periodo + 1) {
      return null;
    }

    const precioActualLista =
      lista[lista.length - 1];

    const precioAnterior =
      lista[lista.length - 1 - periodo];

    if (precioAnterior === 0) {
      return 0;
    }

    return (
      (precioActualLista - precioAnterior) /
      Math.abs(precioAnterior)
    ) * 100;
  }

  function calcularDireccionMovimientos(lista) {
    if (lista.length < 11) {
      return null;
    }

    const recientes = lista.slice(-11);

    let movimientosAlcistas = 0;
    let movimientosBajistas = 0;
    let movimientosIguales = 0;

    for (
      let i = 1;
      i < recientes.length;
      i += 1
    ) {
      if (recientes[i] > recientes[i - 1]) {
        movimientosAlcistas += 1;
      } else if (
        recientes[i] < recientes[i - 1]
      ) {
        movimientosBajistas += 1;
      } else {
        movimientosIguales += 1;
      }
    }

    return {
      alcistas: movimientosAlcistas,
      bajistas: movimientosBajistas,
      iguales: movimientosIguales
    };
  }

  function actualizarIndicadores() {
    const valorRSI =
      calcularRSI(precios);

    const valorVolatilidad =
      calcularVolatilidad(precios);

    const valorTendencia =
      calcularTendencia(precios);

    actualizarTexto(
      tendencia,
      valorTendencia
    );

    actualizarTexto(
      rsi,
      valorRSI === null
        ? "--"
        : valorRSI.toFixed(2)
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
  MOTOR DE ANÁLISIS V5.2
  ====================================================
  */

  function crearResultadoInicial() {
    return {
      titulo: "Esperar mejores condiciones",
      direccion: "NEUTRAL",
      nivel: "bajo",
      confianza: 45,
      razones: [],
      advertencias: []
    };
  }

  function evaluarTendencia(
    resultado,
    valorTendencia
  ) {
    if (valorTendencia === "Alcista") {
      resultado.direccion = "SUBE";
      resultado.confianza += 15;

      resultado.razones.push(
        "La tendencia reciente presenta una dirección alcista."
      );

      return;
    }

    if (valorTendencia === "Bajista") {
      resultado.direccion = "BAJA";
      resultado.confianza += 15;

      resultado.razones.push(
        "La tendencia reciente presenta una dirección bajista."
      );

      return;
    }

    resultado.confianza -= 10;

    resultado.advertencias.push(
      "El mercado se encuentra lateral y no muestra una dirección clara."
    );
  }

  function evaluarRSI(
    resultado,
    valorRSI
  ) {
    if (valorRSI === null) {
      resultado.advertencias.push(
        "Todavía no fue posible calcular correctamente el RSI."
      );

      return;
    }

    if (
      resultado.direccion === "SUBE" &&
      valorRSI >= 52 &&
      valorRSI <= 68
    ) {
      resultado.confianza += 15;

      resultado.razones.push(
        `El RSI de ${valorRSI.toFixed(
          2
        )} confirma impulso alcista sin sobrecompra extrema.`
      );

      return;
    }

    if (
      resultado.direccion === "BAJA" &&
      valorRSI >= 32 &&
      valorRSI <= 48
    ) {
      resultado.confianza += 15;

      resultado.razones.push(
        `El RSI de ${valorRSI.toFixed(
          2
        )} confirma presión bajista sin sobreventa extrema.`
      );

      return;
    }

    if (valorRSI > 70) {
      resultado.confianza -= 12;

      resultado.advertencias.push(
        `El RSI está en ${valorRSI.toFixed(
          2
        )}, una zona de sobrecompra con riesgo de retroceso.`
      );

      return;
    }

    if (valorRSI < 30) {
      resultado.confianza -= 12;

      resultado.advertencias.push(
        `El RSI está en ${valorRSI.toFixed(
          2
        )}, una zona de sobreventa con riesgo de rebote.`
      );

      return;
    }

    resultado.razones.push(
      `El RSI se mantiene en una zona neutral: ${valorRSI.toFixed(
        2
      )}.`
    );
  }

  function evaluarMomentum(
    resultado,
    valorMomentum
  ) {
    if (valorMomentum === null) {
      return;
    }

    if (
      resultado.direccion === "SUBE" &&
      valorMomentum > 0
    ) {
      resultado.confianza += 10;

      resultado.razones.push(
        "El momentum reciente coincide con la dirección alcista."
      );

      return;
    }

    if (
      resultado.direccion === "BAJA" &&
      valorMomentum < 0
    ) {
      resultado.confianza += 10;

      resultado.razones.push(
        "El momentum reciente coincide con la dirección bajista."
      );

      return;
    }

    if (
      resultado.direccion !== "NEUTRAL"
    ) {
      resultado.confianza -= 8;

      resultado.advertencias.push(
        "El momentum no confirma completamente la tendencia detectada."
      );
    }
  }

  function evaluarMovimientos(
    resultado,
    movimientos
  ) {
    if (!movimientos) {
      return;
    }

    if (
      resultado.direccion === "SUBE" &&
      movimientos.alcistas >
        movimientos.bajistas
    ) {
      resultado.confianza += 8;

      resultado.razones.push(
        `${movimientos.alcistas} de los últimos 10 movimientos fueron alcistas.`
      );

      return;
    }

    if (
      resultado.direccion === "BAJA" &&
      movimientos.bajistas >
        movimientos.alcistas
    ) {
      resultado.confianza += 8;

      resultado.razones.push(
        `${movimientos.bajistas} de los últimos 10 movimientos fueron bajistas.`
      );

      return;
    }

    resultado.confianza -= 5;

    resultado.advertencias.push(
      "Los últimos movimientos están divididos y reducen la claridad de la señal."
    );
  }

  function evaluarVolatilidad(
    resultado,
    valorVolatilidad
  ) {
    if (valorVolatilidad === null) {
      return;
    }

    if (valorVolatilidad === 0) {
      resultado.confianza -= 10;

      resultado.advertencias.push(
        "El precio presenta muy poca variación."
      );

      return;
    }

    if (valorVolatilidad < 0.005) {
      resultado.confianza -= 5;

      resultado.advertencias.push(
        "La volatilidad actual es muy baja y el movimiento podría ser débil."
      );

      return;
    }

    if (valorVolatilidad <= 0.08) {
      resultado.confianza += 7;

      resultado.razones.push(
        "La volatilidad se encuentra dentro de un nivel controlado."
      );

      return;
    }

    resultado.confianza -= 8;

    resultado.advertencias.push(
      "La volatilidad es elevada y aumenta el riesgo de movimientos repentinos."
    );
  }

  function ajustarPorTipoOperacion(
    resultado
  ) {
    if (!selectorOperacion) {
      return;
    }

    const valorOperacion =
      String(selectorOperacion.value)
        .toLowerCase();

    if (
      valorOperacion.includes("rise") ||
      valorOperacion.includes("fall") ||
      valorOperacion.includes("sube") ||
      valorOperacion.includes("baja")
    ) {
      resultado.razones.push(
        "El análisis se ha orientado a una posible dirección de subida o bajada."
      );
    }
  }

  function definirNivelResultado(resultado) {
    resultado.confianza = Math.round(
      limitarNumero(
        resultado.confianza,
        20,
        95
      )
    );

    if (
      resultado.confianza >= 80 &&
      resultado.direccion !== "NEUTRAL"
    ) {
      resultado.nivel = "alto";

      resultado.titulo =
        resultado.direccion === "SUBE"
          ? "Probable continuación alcista"
          : "Probable continuación bajista";

      return;
    }

    if (
      resultado.confianza >= 65 &&
      resultado.direccion !== "NEUTRAL"
    ) {
      resultado.nivel = "medio";

      resultado.titulo =
        resultado.direccion === "SUBE"
          ? "Posible movimiento alcista"
          : "Posible movimiento bajista";

      return;
    }

    resultado.nivel = "bajo";
    resultado.titulo =
      "Esperar mejores condiciones";
  }

  function generarAnalisisMercado() {
    const resultado =
      crearResultadoInicial();

    const valorTendencia =
      calcularTendencia(precios);

    const valorRSI =
      calcularRSI(precios);

    const valorVolatilidad =
      calcularVolatilidad(precios);

    const valorMomentum =
      calcularMomentum(precios);

    const movimientos =
      calcularDireccionMovimientos(precios);

    evaluarTendencia(
      resultado,
      valorTendencia
    );

    evaluarRSI(
      resultado,
      valorRSI
    );

    evaluarMomentum(
      resultado,
      valorMomentum
    );

    evaluarMovimientos(
      resultado,
      movimientos
    );

    evaluarVolatilidad(
      resultado,
      valorVolatilidad
    );

    ajustarPorTipoOperacion(resultado);
    definirNivelResultado(resultado);

    return resultado;
  }

  /*
  ====================================================
  PRESENTACIÓN DEL ANÁLISIS
  ====================================================
  */

  function limpiarClasesPrediccion() {
    const elementos = [
      prediccionTitulo,
      prediccionConfianza,
      prediccionEstado
    ];

    elementos.forEach((elemento) => {
      if (!elemento) {
        return;
      }

      elemento.classList.remove(
        "prediccion-alta",
        "prediccion-media",
        "prediccion-baja",
        "senal-alta",
        "senal-media",
        "senal-baja"
      );
    });
  }

  function obtenerTextoNivel(nivel) {
    if (nivel === "alto") {
      return "Confianza alta";
    }

    if (nivel === "medio") {
      return "Confianza media";
    }

    return "Confianza baja";
  }

  function obtenerIconoNivel(nivel) {
    if (nivel === "alto") {
      return "🟢";
    }

    if (nivel === "medio") {
      return "🟡";
    }

    return "🔴";
  }

  function obtenerClaseNivel(nivel) {
    if (nivel === "alto") {
      return "prediccion-alta";
    }

    if (nivel === "medio") {
      return "prediccion-media";
    }

    return "prediccion-baja";
  }

  function mostrarMotivosAnalisis(resultado) {
    if (!prediccionMotivos) {
      return;
    }

    prediccionMotivos.innerHTML = "";

    resultado.razones.forEach((razon) => {
      const elemento =
        document.createElement("li");

      elemento.textContent = `✔ ${razon}`;

      prediccionMotivos.appendChild(
        elemento
      );
    });

    resultado.advertencias.forEach(
      (advertencia) => {
        const elemento =
          document.createElement("li");

        elemento.textContent =
          `⚠ ${advertencia}`;

        prediccionMotivos.appendChild(
          elemento
        );
      }
    );

    if (
      resultado.razones.length === 0 &&
      resultado.advertencias.length === 0
    ) {
      const elemento =
        document.createElement("li");

      elemento.textContent =
        "No se encontraron condiciones suficientes para generar una señal.";

      prediccionMotivos.appendChild(
        elemento
      );
    }
  }

  function actualizarBarraConfianza(
    confianza
  ) {
    if (!barraConfianza) {
      return;
    }

    barraConfianza.style.width =
      `${confianza}%`;

    barraConfianza.setAttribute(
      "aria-valuenow",
      String(confianza)
    );
  }

  function mostrarResultadoAnalisis(
    resultado
  ) {
    limpiarClasesPrediccion();

    const icono =
      obtenerIconoNivel(resultado.nivel);

    const clase =
      obtenerClaseNivel(resultado.nivel);

    actualizarTexto(
      prediccionTitulo,
      `${icono} ${resultado.titulo}`
    );

    actualizarTexto(
      prediccionConfianza,
      `${resultado.confianza}%`
    );

    actualizarTexto(
      prediccionEstado,
      obtenerTextoNivel(resultado.nivel)
    );

    actualizarTexto(
      prediccionDireccion,
      resultado.direccion
    );

    if (prediccionTitulo) {
      prediccionTitulo.classList.add(clase);
    }

    if (prediccionConfianza) {
      prediccionConfianza.classList.add(
        clase
      );
    }

    if (prediccionEstado) {
      prediccionEstado.classList.add(clase);
    }

    mostrarMotivosAnalisis(resultado);

    actualizarBarraConfianza(
      resultado.confianza
    );

    agregarAnalisisAlHistorial(resultado);

    agregarRegistro(
      `Análisis completado: ${resultado.titulo}, confianza técnica ${resultado.confianza}%.`,
      resultado.nivel === "alto"
        ? "exito"
        : resultado.nivel === "medio"
          ? "advertencia"
          : "informacion"
    );

    actualizarTexto(
      ultimoMensaje,
      `Análisis completado a las ${obtenerHoraActual()}`
    );
  }

  function mostrarEstadoAnalizando() {
    actualizarTexto(
      prediccionTitulo,
      "🔍 Analizando mercado..."
    );

    actualizarTexto(
      prediccionConfianza,
      "Calculando"
    );

    actualizarTexto(
      prediccionEstado,
      "Procesando datos"
    );

    actualizarTexto(
      prediccionDireccion,
      "--"
    );

    if (prediccionMotivos) {
      prediccionMotivos.innerHTML = "";

      const elemento =
        document.createElement("li");

      elemento.textContent =
        "Evaluando tendencia, RSI, volatilidad y momentum.";

      prediccionMotivos.appendChild(
        elemento
      );
    }

    actualizarBarraConfianza(0);
  }

  /*
  ====================================================
  HISTORIAL DE ANÁLISIS
  ====================================================
  */

  function agregarAnalisisAlHistorial(
    resultado
  ) {
    if (!historialAnalisis) {
      return;
    }

    const elemento =
      document.createElement("article");

    elemento.classList.add(
      "historial-item"
    );

    const encabezado =
      document.createElement("strong");

    encabezado.textContent =
      `${obtenerHoraActual()} · ${resultado.direccion}`;

    const descripcion =
      document.createElement("p");

    descripcion.textContent =
      `${resultado.titulo} · Confianza ${resultado.confianza}%`;

    elemento.appendChild(encabezado);
    elemento.appendChild(descripcion);

    historialAnalisis.prepend(elemento);

    while (
      historialAnalisis.children.length >
      10
    ) {
      historialAnalisis.removeChild(
        historialAnalisis.lastElementChild
      );
    }
  }

  /*
  ====================================================
  EJECUTAR ANÁLISIS
  ====================================================
  */

  function analizarMercado() {
    if (analizandoMercado) {
      return;
    }

    if (
      !window.derivAPI ||
      !window.derivAPI.estaConectado()
    ) {
      agregarRegistro(
        "No se puede analizar porque la herramienta está desconectada.",
        "advertencia"
      );

      actualizarTexto(
        prediccionTitulo,
        "Conecta la herramienta primero"
      );

      return;
    }

    if (
      precios.length <
      MINIMO_TICKS_ANALISIS
    ) {
      const faltantes =
        MINIMO_TICKS_ANALISIS -
        precios.length;

      actualizarTexto(
        prediccionTitulo,
        "Esperando más datos"
      );

      actualizarTexto(
        prediccionConfianza,
        "--"
      );

      if (prediccionMotivos) {
        prediccionMotivos.innerHTML = "";

        const elemento =
          document.createElement("li");

        elemento.textContent =
          `Faltan ${faltantes} ticks para ejecutar el análisis.`;

        prediccionMotivos.appendChild(
          elemento
        );
      }

      agregarRegistro(
        `Análisis detenido: faltan ${faltantes} ticks.`,
        "advertencia"
      );

      return;
    }

    analizandoMercado = true;

    actualizarBotonAnalizar();
    mostrarEstadoAnalizando();

    agregarRegistro(
      "El motor de análisis comenzó a evaluar el mercado.",
      "informacion"
    );

    window.setTimeout(() => {
      try {
        const resultado =
          generarAnalisisMercado();

        mostrarResultadoAnalisis(
          resultado
        );
      } catch (error) {
        console.error(
          "[App] Error al analizar el mercado:",
          error
        );

        actualizarTexto(
          prediccionTitulo,
          "Error durante el análisis"
        );

        actualizarTexto(
          prediccionConfianza,
          "--"
        );

        agregarRegistro(
          `Error durante el análisis: ${error.message}`,
          "error"
        );
      } finally {
        analizandoMercado = false;
        actualizarBotonAnalizar();
      }
    }, 1200);
  }

  /*
  ====================================================
  ASISTENTE DE VOZ BÁSICO
  ====================================================
  */

  function leerResultadoActual() {
    if (
      !("speechSynthesis" in window)
    ) {
      agregarRegistro(
        "El navegador no permite utilizar el asistente de voz.",
        "advertencia"
      );

      return;
    }

    const titulo =
      prediccionTitulo
        ? prediccionTitulo.textContent
        : "Sin análisis disponible";

    const confianza =
      prediccionConfianza
        ? prediccionConfianza.textContent
        : "";

    const direccion =
      prediccionDireccion
        ? prediccionDireccion.textContent
        : "";

    window.speechSynthesis.cancel();

    const mensaje =
      new SpeechSynthesisUtterance(
        `${titulo}. Confianza ${confianza}. Dirección ${direccion}.`
      );

    mensaje.lang = "es-SV";
    mensaje.rate = 0.95;
    mensaje.pitch = 1;

    window.speechSynthesis.speak(
      mensaje
    );

    agregarRegistro(
      "El asistente de voz leyó el resultado actual.",
      "informacion"
    );
  }

  /*
  ====================================================
  CONTROL DE CONEXIÓN
  ====================================================
  */

  function conectarConDeriv() {
    if (
      conexionSolicitada ||
      window.derivAPI.estaConectado()
    ) {
      agregarRegistro(
        "Ya existe una conexión abierta o en proceso.",
        "advertencia"
      );

      return;
    }

    simboloSeleccionado =
      selectorIndice
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

    window.derivAPI
      .activarReconexionAutomatica();

    window.derivAPI
      .suscribirseTicks(
        simboloSeleccionado
      );
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
  VALIDACIÓN INICIAL DE deriv-api.js
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

    if (botonAnalizar) {
      botonAnalizar.disabled = true;
    }

    return;
  }

  /*
  ====================================================
  EVENTOS DE BOTONES
  ====================================================
  */

  if (botonConectar) {
    botonConectar.addEventListener(
      "click",
      conectarConDeriv
    );
  }

  if (botonDesconectar) {
    botonDesconectar.addEventListener(
      "click",
      desconectarDeDeriv
    );
  }

  if (botonAnalizar) {
    botonAnalizar.addEventListener(
      "click",
      analizarMercado
    );
  }

  if (botonVoz) {
    botonVoz.addEventListener(
      "click",
      leerResultadoActual
    );
  }

  if (botonLimpiarRegistro) {
    botonLimpiarRegistro.addEventListener(
      "click",
      () => {
        if (registroActividad) {
          registroActividad.innerHTML = "";
        }

        agregarRegistro(
          "Registro de actividad limpiado.",
          "informacion"
        );
      }
    );
  }

  /*
  ====================================================
  EVENTOS DE SELECTORES
  ====================================================
  */

  if (selectorIndice) {
    selectorIndice.addEventListener(
      "change",
      () => {
        simboloSeleccionado =
          selectorIndice.value;

        limpiarDatosMercado();
        actualizarNombreIndice();

        agregarRegistro(
          `Índice seleccionado: ${obtenerNombreIndice(
            simboloSeleccionado
          )}.`,
          "informacion"
        );

        if (
          window.derivAPI.estaConectado()
        ) {
          actualizarTexto(
            estadoSuscripcion,
            "Cambiando símbolo..."
          );

          window.derivAPI.cambiarSimbolo(
            simboloSeleccionado
          );
        }
      }
    );
  }

  if (selectorOperacion) {
    selectorOperacion.addEventListener(
      "change",
      () => {
        const opcion =
          selectorOperacion.options[
            selectorOperacion.selectedIndex
          ];

        agregarRegistro(
          `Tipo de análisis seleccionado: ${opcion.text}.`,
          "informacion"
        );

        limpiarPrediccion();
      }
    );
  }

  if (selectorEstrategia) {
    selectorEstrategia.addEventListener(
      "change",
      () => {
        const opcion =
          selectorEstrategia.options[
            selectorEstrategia.selectedIndex
          ];

        agregarRegistro(
          `Estrategia seleccionada: ${opcion.text}.`,
          "informacion"
        );

        limpiarPrediccion();
      }
    );
  }

  /*
  ====================================================
  EVENTOS RECIBIDOS DESDE deriv-api.js
  ====================================================
  */

  window.addEventListener(
    "deriv:estado",
    (evento) => {
      const detalle =
        evento.detail || {};

      const estado =
        detalle.estado ||
        "desconectado";

      const mensaje =
        detalle.mensaje || estado;

      actualizarEstadoVisual(
        estado,
        mensaje
      );
    }
  );

  window.addEventListener(
    "deriv:conectado",
    () => {
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

      actualizarBotonAnalizar();
    }
  );

  window.addEventListener(
    "deriv:desconectado",
    (evento) => {
      conexionSolicitada = false;

      const detalle =
        evento.detail || {};

      const motivo =
        detalle.motivo ||
        "Conexión finalizada";

      actualizarEstadoVisual(
        "desconectado",
        motivo
      );

      actualizarTexto(
        estadoSuscripcion,
        "Inactiva"
      );

      agregarRegistro(
        `Desconectado: ${motivo}.`,
        "advertencia"
      );

      actualizarBotonAnalizar();
    }
  );

  window.addEventListener(
    "deriv:suscribiendo",
    (evento) => {
      const detalle =
        evento.detail || {};

      const simbolo =
        detalle.simbolo ||
        simboloSeleccionado;

      actualizarTexto(
        estadoSuscripcion,
        "Solicitando..."
      );

      actualizarTexto(
        simboloActivo,
        simbolo
      );

      agregarRegistro(
        `Solicitando ticks para ${obtenerNombreIndice(
          simbolo
        )}.`,
        "informacion"
      );
    }
  );

  window.addEventListener(
    "deriv:tick",
    (evento) => {
      const tick =
        evento.detail || {};

      const precio =
        Number(tick.precio);

      if (!Number.isFinite(precio)) {
        return;
      }

      totalTicks += 1;
      precios.push(precio);

      if (
        precios.length >
        MAXIMO_PRECIOS
      ) {
        precios.shift();
      }

      const precioMostrado =
        formatearPrecio(
          precio,
          tick.pipSize
        );

      actualizarTexto(
        precioActual,
        precioMostrado
      );

      actualizarTexto(
        contadorTicks,
        String(totalTicks)
      );

      actualizarTexto(
        ultimoDigito,
        obtenerUltimoDigito(
          precioMostrado
        )
      );

      actualizarTexto(
        horaActualizacion,
        tick.fecha instanceof Date
          ? tick.fecha.toLocaleTimeString(
              "es-SV"
            )
          : obtenerHoraActual()
      );

      actualizarTexto(
        estadoSuscripcion,
        "Activa"
      );

      actualizarTexto(
        mercadoEstado,
        "Mercado en vivo"
      );

      actualizarTexto(
        simboloActivo,
        tick.simbolo ||
          simboloSeleccionado
      );

      actualizarTexto(
        ultimoMensaje,
        `Tick ${totalTicks} recibido correctamente`
      );

      actualizarIndicadores();
      actualizarBotonAnalizar();
    }
  );

  window.addEventListener(
    "deriv:suscripcionCancelada",
    () => {
      actualizarTexto(
        estadoSuscripcion,
        "Suscripción anterior cancelada"
      );
    }
  );

  window.addEventListener(
    "deriv:reconexion",
    (evento) => {
      const detalle =
        evento.detail || {};

      const intento =
        detalle.intento || 1;

      const espera =
        detalle.espera || 0;

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

      actualizarBotonAnalizar();
    }
  );

  window.addEventListener(
    "deriv:pong",
    () => {
      actualizarTexto(
        ultimoMensaje,
        "Servidor activo; respuesta ping recibida"
      );
    }
  );

  window.addEventListener(
    "deriv:error",
    (evento) => {
      conexionSolicitada = false;

      const detalle =
        evento.detail || {};

      const mensaje =
        detalle.mensaje ||
        "Error desconocido de Deriv";

      actualizarEstadoVisual(
        "error",
        mensaje
      );

      actualizarTexto(
        estadoSuscripcion,
        "Error"
      );

      agregarRegistro(
        `Error de Deriv: ${mensaje}`,
        "error"
      );

      actualizarBotonAnalizar();
    }
  );

  /*
  ====================================================
  ESTADO INICIAL
  ====================================================
  */

  actualizarTexto(
    estadoAplicacion,
    "Iniciada correctamente"
  );

  actualizarTexto(
    estadoServidor,
    "Sin conexión"
  );

  actualizarTexto(
    estadoSuscripcion,
    "Inactiva"
  );

  actualizarTexto(
    simboloActivo,
    simboloSeleccionado
  );

  actualizarTexto(
    ultimoMensaje,
    "Aplicación preparada"
  );

  actualizarNombreIndice();
  limpiarPrediccion();

  actualizarBotonesConexion(false);

  actualizarEstadoVisual(
    "desconectado",
    "Desconectado"
  );

  agregarRegistro(
    "Trading Analyzer V5.2 preparado correctamente.",
    "informacion"
  );

  console.log(
    "app.js V5.2 cargado correctamente."
  );
});

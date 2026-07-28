"use strict";

/*
====================================================
TRADING ANALYZER V4
Archivo: deriv-api.js
Función: conexión y comunicación con Deriv
====================================================
*/

class DerivAPI {
  constructor() {
    // Servidor público de datos de mercado de Deriv.
    this.endpoint =
  "wss://api.derivws.com/trading/v1/options/ws/public";

    // Objeto WebSocket.
    this.socket = null;

    // Estado actual de la conexión.
    this.estado = "desconectado";

    // Símbolo actualmente seleccionado.
    this.simboloActual = null;

    // Identificador de la suscripción activa.
    this.subscriptionId = null;

    // Control de reconexión.
    this.reconexionAutomatica = true;
    this.intentosReconexion = 0;
    this.maxIntentosReconexion = 10;
    this.temporizadorReconexion = null;

    // Control para evitar conexiones duplicadas.
    this.conectando = false;
    this.desconexionManual = false;

    // Intervalo para mantener viva la conexión.
    this.pingInterval = null;

    // Tiempo máximo sin recibir mensajes.
    this.ultimoMensaje = 0;

    // Símbolos principales de índices sintéticos.
    this.simbolos = {
      V10: "R_10",
      V25: "R_25",
      V50: "R_50",
      V75: "R_75",
      V100: "R_100",

      V10_1S: "1HZ10V",
      V15_1S: "1HZ15V",
      V25_1S: "1HZ25V",
      V30_1S: "1HZ30V",
      V50_1S: "1HZ50V",
      V75_1S: "1HZ75V",
      V90_1S: "1HZ90V",
      V100_1S: "1HZ100V"
    };
  }

  /*
  ====================================================
  SISTEMA DE EVENTOS
  ====================================================
  */

  emitirEvento(nombre, detalle = {}) {
    window.dispatchEvent(
      new CustomEvent(nombre, {
        detail: detalle
      })
    );
  }

  cambiarEstado(nuevoEstado, mensaje = "") {
    this.estado = nuevoEstado;

    console.log(`[Deriv] Estado: ${nuevoEstado}`, mensaje);

    this.emitirEvento("deriv:estado", {
      estado: nuevoEstado,
      mensaje: mensaje
    });
  }

  /*
  ====================================================
  CONEXIÓN
  ====================================================
  */

  conectar() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      console.log("[Deriv] Ya existe una conexión abierta o en proceso.");
      return;
    }

    if (this.conectando) {
      console.log("[Deriv] La conexión ya se está iniciando.");
      return;
    }

    this.conectando = true;
    this.desconexionManual = false;

    this.cambiarEstado(
      "conectando",
      "Conectando con el servidor de Deriv..."
    );

    try {
      this.socket = new WebSocket(this.endpoint);
    } catch (error) {
      this.conectando = false;

      this.manejarError({
        message: "No fue posible crear la conexión WebSocket.",
        original: error
      });

      this.programarReconexion();
      return;
    }

    this.socket.onopen = () => {
      this.conectando = false;
      this.intentosReconexion = 0;
      this.ultimoMensaje = Date.now();

      this.cambiarEstado(
        "conectado",
        "Conexión establecida correctamente."
      );

      this.iniciarPing();

      this.emitirEvento("deriv:conectado", {
        conectado: true
      });

      // Si ya había un símbolo seleccionado,
      // vuelve a suscribirse automáticamente.
      if (this.simboloActual) {
        this.suscribirseTicks(this.simboloActual);
      }
    };

    this.socket.onmessage = (evento) => {
      this.ultimoMensaje = Date.now();
      this.procesarMensaje(evento);
    };

    this.socket.onerror = (evento) => {
      console.error("[Deriv] Error del WebSocket:", evento);

      this.manejarError({
        message: "Se produjo un error en la conexión con Deriv.",
        original: evento
      });
    };

    this.socket.onclose = (evento) => {
      this.conectando = false;
      this.detenerPing();

      const cierreEsperado = this.desconexionManual;

      this.subscriptionId = null;
      this.socket = null;

      if (cierreEsperado) {
        this.cambiarEstado(
          "desconectado",
          "La conexión fue cerrada manualmente."
        );
        return;
      }

      this.cambiarEstado(
        "desconectado",
        `La conexión se cerró. Código: ${evento.code}`
      );

      this.emitirEvento("deriv:desconectado", {
        codigo: evento.code,
        motivo: evento.reason || "Sin motivo especificado",
        limpio: evento.wasClean
      });

      this.programarReconexion();
    };
  }

  /*
  ====================================================
  DESCONEXIÓN
  ====================================================
  */

  desconectar() {
    this.desconexionManual = true;
    this.reconexionAutomatica = false;

    this.cancelarTemporizadorReconexion();
    this.detenerPing();

    if (
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    ) {
      this.cancelarSuscripcion();

      setTimeout(() => {
        if (this.socket) {
          this.socket.close(1000, "Desconexión manual");
        }
      }, 200);
    } else if (this.socket) {
      this.socket.close();
    }

    this.socket = null;
    this.subscriptionId = null;

    this.cambiarEstado(
      "desconectado",
      "Conexión detenida manualmente."
    );
  }

  activarReconexionAutomatica() {
    this.reconexionAutomatica = true;
    this.desconexionManual = false;
  }

  /*
  ====================================================
  ENVÍO DE SOLICITUDES
  ====================================================
  */

  enviar(solicitud) {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      console.warn(
        "[Deriv] No se pudo enviar la solicitud porque el WebSocket no está conectado.",
        solicitud
      );

      this.manejarError({
        message: "No hay conexión activa con Deriv."
      });

      return false;
    }

    try {
      this.socket.send(JSON.stringify(solicitud));
      return true;
    } catch (error) {
      this.manejarError({
        message: "No fue posible enviar la solicitud a Deriv.",
        original: error
      });

      return false;
    }
  }

  /*
  ====================================================
  SÍMBOLOS ACTIVOS
  ====================================================
  */

  solicitarSimbolosActivos() {
    return this.enviar({
      active_symbols: "brief",
      req_id: 1001
    });
  }

  /*
  ====================================================
  SUSCRIPCIÓN A TICKS
  ====================================================
  */

  suscribirseTicks(simbolo) {
    if (!simbolo || typeof simbolo !== "string") {
      this.manejarError({
        message: "El símbolo seleccionado no es válido."
      });
      return;
    }

    this.simboloActual = simbolo;

    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      console.log(
        "[Deriv] Se guardó el símbolo y se iniciará la suscripción cuando la conexión esté lista."
      );

      this.conectar();
      return;
    }

    // Evita que queden dos transmisiones activas.
    if (this.subscriptionId) {
      this.cancelarSuscripcion(() => {
        this.crearSuscripcionTicks(simbolo);
      });
    } else {
      this.crearSuscripcionTicks(simbolo);
    }
  }

  crearSuscripcionTicks(simbolo) {
    console.log(`[Deriv] Suscribiendo al símbolo: ${simbolo}`);

    const enviado = this.enviar({
      ticks: simbolo,
      subscribe: 1,
      req_id: 2001
    });

    if (enviado) {
      this.emitirEvento("deriv:suscribiendo", {
        simbolo: simbolo
      });
    }
  }

  cambiarSimbolo(nuevoSimbolo) {
    if (!nuevoSimbolo) {
      this.manejarError({
        message: "Debes seleccionar un índice válido."
      });
      return;
    }

    if (
      nuevoSimbolo === this.simboloActual &&
      this.subscriptionId
    ) {
      console.log(
        "[Deriv] El símbolo seleccionado ya está activo."
      );
      return;
    }

    this.suscribirseTicks(nuevoSimbolo);
  }

  cancelarSuscripcion(callback = null) {
    if (!this.subscriptionId) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      this.subscriptionId = null;

      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    const idAnterior = this.subscriptionId;

    const enviado = this.enviar({
      forget: idAnterior,
      req_id: 3001
    });

    if (!enviado) {
      this.subscriptionId = null;

      if (typeof callback === "function") {
        callback();
      }
      return;
    }

    const escucharCancelacion = (evento) => {
      const datos = evento.detail;

      if (datos.subscriptionId === idAnterior) {
        window.removeEventListener(
          "deriv:suscripcionCancelada",
          escucharCancelacion
        );

        if (typeof callback === "function") {
          callback();
        }
      }
    };

    window.addEventListener(
      "deriv:suscripcionCancelada",
      escucharCancelacion
    );

    // Protección: continúa aunque Deriv tarde en confirmar.
    setTimeout(() => {
      window.removeEventListener(
        "deriv:suscripcionCancelada",
        escucharCancelacion
      );

      if (this.subscriptionId === idAnterior) {
        this.subscriptionId = null;
      }

      if (typeof callback === "function") {
        callback();
        callback = null;
      }
    }, 1500);
  }

  /*
  ====================================================
  PROCESAMIENTO DE RESPUESTAS
  ====================================================
  */

  procesarMensaje(evento) {
    let datos;

    try {
      datos = JSON.parse(evento.data);
    } catch (error) {
      this.manejarError({
        message: "Deriv envió una respuesta que no pudo interpretarse.",
        original: error
      });
      return;
    }

    if (datos.error) {
      this.manejarError({
        message: datos.error.message || "Error desconocido de Deriv.",
        codigo: datos.error.code || "SIN_CODIGO",
        datos: datos
      });
      return;
    }

    switch (datos.msg_type) {
      case "tick":
        this.procesarTick(datos);
        break;

      case "active_symbols":
        this.procesarSimbolosActivos(datos);
        break;

      case "forget":
        this.procesarCancelacion(datos);
        break;

      case "ping":
        this.emitirEvento("deriv:pong", {
          recibido: true
        });
        break;

      default:
        this.emitirEvento("deriv:mensaje", {
          datos: datos
        });
        break;
    }
  }

  procesarTick(datos) {
    if (!datos.tick) {
      return;
    }

    if (
      datos.subscription &&
      datos.subscription.id
    ) {
      this.subscriptionId = datos.subscription.id;
    }

    const tick = {
      simbolo:
        datos.tick.symbol ||
        this.simboloActual,

      precio: Number(datos.tick.quote),

      epoch: Number(datos.tick.epoch),

      fecha: new Date(
        Number(datos.tick.epoch) * 1000
      ),

      pipSize:
        datos.tick.pip_size !== undefined
          ? Number(datos.tick.pip_size)
          : null,

      subscriptionId: this.subscriptionId
    };

    console.log(
      `[Deriv] ${tick.simbolo}: ${tick.precio}`
    );

    this.emitirEvento("deriv:tick", tick);
  }

  procesarSimbolosActivos(datos) {
    const lista = Array.isArray(datos.active_symbols)
      ? datos.active_symbols
      : [];

    this.emitirEvento("deriv:simbolos", {
      simbolos: lista
    });
  }

  procesarCancelacion(datos) {
    const idCancelado = this.subscriptionId;

    if (datos.forget === 1) {
      console.log(
        "[Deriv] Suscripción anterior cancelada correctamente."
      );

      this.subscriptionId = null;

      this.emitirEvento(
        "deriv:suscripcionCancelada",
        {
          subscriptionId: idCancelado,
          cancelada: true
        }
      );
    } else {
      console.warn(
        "[Deriv] No se encontró la suscripción para cancelar."
      );

      this.subscriptionId = null;

      this.emitirEvento(
        "deriv:suscripcionCancelada",
        {
          subscriptionId: idCancelado,
          cancelada: false
        }
      );
    }
  }

  /*
  ====================================================
  MANEJO DE ERRORES
  ====================================================
  */

  manejarError(error) {
    const mensaje =
      error && error.message
        ? error.message
        : "Se produjo un error desconocido.";

    console.error("[Deriv]", mensaje, error);

    this.emitirEvento("deriv:error", {
      mensaje: mensaje,
      codigo: error.codigo || null,
      detalle: error.original || error.datos || null
    });
  }

  /*
  ====================================================
  RECONEXIÓN AUTOMÁTICA
  ====================================================
  */

  programarReconexion() {
    if (
      !this.reconexionAutomatica ||
      this.desconexionManual
    ) {
      return;
    }

    if (
      this.intentosReconexion >=
      this.maxIntentosReconexion
    ) {
      this.cambiarEstado(
        "error",
        "No fue posible restablecer la conexión después de varios intentos."
      );

      this.manejarError({
        message:
          "Se alcanzó el número máximo de intentos de reconexión."
      });

      return;
    }

    this.cancelarTemporizadorReconexion();

    this.intentosReconexion += 1;

    const espera = Math.min(
      1000 * Math.pow(2, this.intentosReconexion - 1),
      30000
    );

    this.cambiarEstado(
      "reconectando",
      `Nuevo intento en ${Math.round(espera / 1000)} segundos.`
    );

    this.emitirEvento("deriv:reconexion", {
      intento: this.intentosReconexion,
      espera: espera
    });

    this.temporizadorReconexion = setTimeout(() => {
      this.conectar();
    }, espera);
  }

  cancelarTemporizadorReconexion() {
    if (this.temporizadorReconexion) {
      clearTimeout(this.temporizadorReconexion);
      this.temporizadorReconexion = null;
    }
  }

  /*
  ====================================================
  MANTENER VIVA LA CONEXIÓN
  ====================================================
  */

  iniciarPing() {
    this.detenerPing();

    this.pingInterval = setInterval(() => {
      if (
        this.socket &&
        this.socket.readyState === WebSocket.OPEN
      ) {
        this.enviar({
          ping: 1
        });
      }
    }, 30000);
  }

  detenerPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /*
  ====================================================
  INFORMACIÓN DEL ESTADO
  ====================================================
  */

  estaConectado() {
    return Boolean(
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    );
  }

  obtenerEstado() {
    return {
      estado: this.estado,
      conectado: this.estaConectado(),
      simbolo: this.simboloActual,
      subscriptionId: this.subscriptionId,
      intentosReconexion: this.intentosReconexion
    };
  }
}

/*
====================================================
INSTANCIA GLOBAL

app.js podrá utilizarla mediante:

derivAPI.conectar();
derivAPI.suscribirseTicks("1HZ100V");
derivAPI.cambiarSimbolo("1HZ75V");
====================================================
*/

const derivAPI = new DerivAPI();

window.DerivAPI = DerivAPI;
window.derivAPI = derivAPI;

console.log(
  "deriv-api.js cargado correctamente."
);

/*
=========================================================
TRADING ANALYZER V6
Archivo: deriv-api.js
Versión corregida y consolidada

Responsabilidad:
- Conexión pública con Deriv.
- Suscripción a ticks en tiempo real.
- Cambio seguro de mercado.
- Reconexión automática.
- Ping para mantener la conexión.
- Envío de eventos hacia app.js.
=========================================================
*/

const URL_DERIV =
  "wss://api.derivws.com/trading/v1/options/ws/public";

const TIEMPO_RECONEXION = 3000;
const INTERVALO_PING = 30000;
const TIEMPO_MAXIMO_CONEXION = 12000;

export class DerivAPI {
  constructor() {
    this.socket = null;
    this.estado = "desconectado";
    this.simboloActual = "";
    this.idSuscripcion = null;

    this.cierreManual = false;
    this.temporizadorReconexion = null;
    this.temporizadorPing = null;
    this.temporizadorConexion = null;

    this.numeroSolicitud = 0;
    this.versionSuscripcion = 0;

    this.eventos = {
      estado: [],
      tick: [],
      error: [],
      diagnostico: []
    };
  }

  /*
  =======================================================
  ESCUCHAR EVENTOS
  =======================================================
  */

  al(tipoEvento, funcion) {
    if (!this.eventos[tipoEvento]) return;
    if (typeof funcion !== "function") return;

    if (!this.eventos[tipoEvento].includes(funcion)) {
      this.eventos[tipoEvento].push(funcion);
    }
  }

  /*
  =======================================================
  DEJAR DE ESCUCHAR EVENTOS
  =======================================================
  */

  quitar(tipoEvento, funcion) {
    if (!this.eventos[tipoEvento]) return;

    this.eventos[tipoEvento] =
      this.eventos[tipoEvento].filter(
        (registrada) => registrada !== funcion
      );
  }

  /*
  =======================================================
  EMITIR EVENTOS
  =======================================================
  */

  emitir(tipoEvento, datos = {}) {
    const funciones = this.eventos[tipoEvento] || [];

    funciones.forEach((funcion) => {
      try {
        funcion(datos);
      } catch (error) {
        console.error(
          "Error ejecutando evento:",
          tipoEvento,
          error
        );
      }
    });
  }

  /*
  =======================================================
  DIAGNÓSTICO
  =======================================================
  */

  diagnostico(mensaje, tipo = "normal") {
    this.emitir("diagnostico", {
      mensaje,
      tipo
    });
  }

  /*
  =======================================================
  CAMBIAR ESTADO
  =======================================================
  */

  cambiarEstado(nuevoEstado, texto = nuevoEstado) {
    this.estado = nuevoEstado;

    this.emitir("estado", {
      estado: nuevoEstado,
      texto
    });
  }

  /*
  =======================================================
  VERIFICAR CONEXIÓN
  =======================================================
  */

  estaConectado() {
    return Boolean(
      this.socket &&
      this.socket.readyState === WebSocket.OPEN
    );
  }

  estaConectando() {
    return Boolean(
      this.socket &&
      this.socket.readyState === WebSocket.CONNECTING
    );
  }

  /*
  =======================================================
  LIMPIAR TEMPORIZADORES
  =======================================================
  */

  limpiarTemporizadorConexion() {
    if (this.temporizadorConexion) {
      clearTimeout(this.temporizadorConexion);
      this.temporizadorConexion = null;
    }
  }

  limpiarTemporizadorReconexion() {
    if (this.temporizadorReconexion) {
      clearTimeout(this.temporizadorReconexion);
      this.temporizadorReconexion = null;
    }
  }

  /*
  =======================================================
  CONECTAR
  =======================================================
  */

  conectar(simbolo = this.simboloActual) {
    const simboloLimpio =
      String(simbolo || "").trim();

    if (simboloLimpio) {
      this.simboloActual = simboloLimpio;
    }

    if (this.estaConectado()) {
      if (this.simboloActual) {
        this.suscribirseTicks(this.simboloActual);
      }
      return;
    }

    if (this.estaConectando()) {
      return;
    }

    this.cierreManual = false;
    this.limpiarTemporizadorReconexion();
    this.limpiarTemporizadorConexion();
    this.detenerPing();

    this.cambiarEstado(
      "conectando",
      "Conectando..."
    );

    this.diagnostico(
      "Abriendo conexión pública con Deriv."
    );

    try {
      this.socket = new WebSocket(URL_DERIV);
    } catch (error) {
      this.socket = null;

      this.gestionarError(
        "No se pudo crear la conexión: " +
        (error?.message || "error desconocido")
      );

      this.programarReconexion();
      return;
    }

    const socketCreado = this.socket;

    this.temporizadorConexion = setTimeout(() => {
      if (
        this.socket === socketCreado &&
        socketCreado.readyState === WebSocket.CONNECTING
      ) {
        this.diagnostico(
          "La conexión tardó demasiado y será reiniciada.",
          "advertencia"
        );

        try {
          socketCreado.close();
        } catch (error) {
          console.warn(
            "No fue posible cerrar la conexión lenta:",
            error
          );
        }
      }
    }, TIEMPO_MAXIMO_CONEXION);

    socketCreado.addEventListener("open", () => {
      if (this.socket !== socketCreado) return;

      this.limpiarTemporizadorConexion();

      this.cambiarEstado(
        "conectado",
        "Conectado"
      );

      this.diagnostico(
        "Conexión con Deriv establecida.",
        "exito"
      );

      this.iniciarPing();

      if (this.simboloActual) {
        this.suscribirseTicks(
          this.simboloActual
        );
      }
    });

    socketCreado.addEventListener("message", (evento) => {
      if (this.socket !== socketCreado) return;
      this.procesarMensaje(evento);
    });

    socketCreado.addEventListener("error", () => {
      if (this.socket !== socketCreado) return;

      this.gestionarError(
        "La conexión WebSocket informó un error."
      );
    });

    socketCreado.addEventListener("close", (evento) => {
      if (this.socket !== socketCreado) return;
      this.procesarCierre(evento);
    });
  }

  /*
  =======================================================
  PROCESAR RESPUESTAS DE DERIV
  =======================================================
  */

  procesarMensaje(evento) {
    let datos;

    try {
      datos = JSON.parse(evento.data);
    } catch (error) {
      this.gestionarError(
        "Deriv envió una respuesta inválida."
      );
      return;
    }

    if (datos.error) {
      const mensaje =
        datos.error.message ||
        datos.error.code ||
        "Error desconocido de Deriv";

      this.gestionarError(mensaje);
      return;
    }

    if (
      datos.msg_type === "tick" &&
      datos.tick
    ) {
      if (
        datos.subscription &&
        datos.subscription.id
      ) {
        this.idSuscripcion =
          datos.subscription.id;
      }

      const simboloRecibido = String(
        datos.tick.symbol ||
        this.simboloActual ||
        ""
      ).trim();

      if (
        simboloRecibido &&
        this.simboloActual &&
        simboloRecibido !== this.simboloActual
      ) {
        this.diagnostico(
          "Se descartó un precio atrasado del mercado anterior.",
          "advertencia"
        );
        return;
      }

      const precio = Number(datos.tick.quote);
      const epoch = Number(datos.tick.epoch);
      const pipSize = Number(
        datos.tick.pip_size
      );

      if (!Number.isFinite(precio)) {
        this.gestionarError(
          "Deriv envió un precio no válido."
        );
        return;
      }

      this.emitir("tick", {
        simbolo:
          simboloRecibido ||
          this.simboloActual,

        precio,

        epoch:
          Number.isFinite(epoch)
            ? epoch
            : null,

        pipSize:
          Number.isInteger(pipSize) &&
          pipSize >= 0
            ? pipSize
            : null
      });

      return;
    }

    if (datos.msg_type === "forget") {
      this.diagnostico(
        "La suscripción anterior fue cerrada."
      );
      return;
    }

    if (datos.msg_type === "ping") {
      return;
    }
  }

  /*
  =======================================================
  PROCESAR CIERRE
  =======================================================
  */

  procesarCierre(evento) {
    this.limpiarTemporizadorConexion();
    this.detenerPing();

    this.socket = null;
    this.idSuscripcion = null;

    this.cambiarEstado(
      "desconectado",
      "Desconectado"
    );

    if (this.cierreManual) {
      this.diagnostico(
        "La conexión fue cerrada manualmente."
      );
      return;
    }

    const codigo =
      Number.isFinite(evento?.code)
        ? evento.code
        : "desconocido";

    this.diagnostico(
      "Conexión cerrada. Código: " +
      codigo +
      ". Intentando reconectar...",
      "advertencia"
    );

    this.programarReconexion();
  }

  /*
  =======================================================
  PROGRAMAR RECONEXIÓN
  =======================================================
  */

  programarReconexion() {
    if (this.cierreManual) return;

    this.limpiarTemporizadorReconexion();

    this.temporizadorReconexion =
      setTimeout(() => {
        this.temporizadorReconexion = null;
        this.conectar(this.simboloActual);
      }, TIEMPO_RECONEXION);
  }

  /*
  =======================================================
  ENVIAR MENSAJE A DERIV
  =======================================================
  */

  enviar(datos) {
    if (!this.estaConectado()) {
      return false;
    }

    try {
      this.socket.send(
        JSON.stringify(datos)
      );

      return true;
    } catch (error) {
      this.gestionarError(
        "No se pudo enviar la solicitud: " +
        (error?.message || "error desconocido")
      );

      return false;
    }
  }

  /*
  =======================================================
  CREAR IDENTIFICADOR DE SOLICITUD
  =======================================================
  */

  siguienteSolicitud() {
    this.numeroSolicitud++;

    if (this.numeroSolicitud > 999999) {
      this.numeroSolicitud = 1;
    }

    return this.numeroSolicitud;
  }

  /*
  =======================================================
  CANCELAR SUSCRIPCIÓN ACTUAL
  =======================================================
  */

  cancelarSuscripcionActual() {
    if (
      !this.idSuscripcion ||
      !this.estaConectado()
    ) {
      this.idSuscripcion = null;
      return false;
    }

    const idAnterior = this.idSuscripcion;
    this.idSuscripcion = null;

    return this.enviar({
      forget: idAnterior,
      req_id: this.siguienteSolicitud()
    });
  }

  /*
  =======================================================
  SUSCRIBIRSE A PRECIOS
  =======================================================
  */

  suscribirseTicks(simbolo) {
    const simboloLimpio =
      String(simbolo || "").trim();

    if (!simboloLimpio) {
      this.gestionarError(
        "No se seleccionó un mercado válido."
      );
      return false;
    }

    this.simboloActual = simboloLimpio;
    this.versionSuscripcion++;

    if (!this.estaConectado()) {
      this.conectar(simboloLimpio);
      return true;
    }

    this.cancelarSuscripcionActual();

    this.diagnostico(
      "Solicitando precios de " +
      simboloLimpio +
      "."
    );

    return this.enviar({
      ticks: simboloLimpio,
      subscribe: 1,
      req_id: this.siguienteSolicitud()
    });
  }

  /*
  =======================================================
  CAMBIAR MERCADO
  =======================================================
  */

  cambiarSimbolo(simbolo) {
    const nuevoSimbolo =
      String(simbolo || "").trim();

    if (!nuevoSimbolo) {
      this.gestionarError(
        "No se seleccionó un mercado válido."
      );
      return false;
    }

    if (
      nuevoSimbolo === this.simboloActual &&
      this.idSuscripcion &&
      this.estaConectado()
    ) {
      this.diagnostico(
        "El mercado seleccionado ya está activo."
      );
      return true;
    }

    return this.suscribirseTicks(
      nuevoSimbolo
    );
  }

  /*
  =======================================================
  MANTENER LA CONEXIÓN ACTIVA
  =======================================================
  */

  iniciarPing() {
    this.detenerPing();

    this.temporizadorPing = setInterval(() => {
      if (this.estaConectado()) {
        this.enviar({
          ping: 1,
          req_id: this.siguienteSolicitud()
        });
      }
    }, INTERVALO_PING);
  }

  detenerPing() {
    if (this.temporizadorPing) {
      clearInterval(
        this.temporizadorPing
      );
    }

    this.temporizadorPing = null;
  }

  /*
  =======================================================
  DESCONECTAR MANUALMENTE
  =======================================================
  */

  desconectar() {
    this.cierreManual = true;

    this.limpiarTemporizadorReconexion();
    this.limpiarTemporizadorConexion();
    this.detenerPing();

    this.cancelarSuscripcionActual();
    this.idSuscripcion = null;

    const socketActual = this.socket;

    if (socketActual) {
      this.socket = null;

      try {
        socketActual.close(
          1000,
          "Cierre manual"
        );
      } catch (error) {
        console.warn(
          "No fue posible cerrar el WebSocket:",
          error
        );
      }
    }

    this.cambiarEstado(
      "desconectado",
      "Desconectado"
    );
  }

  /*
  =======================================================
  GESTIONAR ERRORES
  =======================================================
  */

  gestionarError(mensaje) {
    const texto =
      String(
        mensaje ||
        "Error desconocido de conexión."
      );

    this.emitir("error", {
      mensaje: texto
    });

    this.diagnostico(
      texto,
      "error"
    );
  }
}

export const derivAPI =
  new DerivAPI();

/*
=========================================================
FIN DEL ARCHIVO deriv-api.js
TRADING ANALYZER V6
=========================================================
*/

/*
=========================================================
TRADING ANALYZER V5
Archivo: deriv-api.js

Responsabilidad:
- Conexión pública con Deriv.
- Suscripción a ticks.
- Cambio de mercado.
- Reconexión automática.
- Envío de eventos hacia app.js.
=========================================================
*/


const URL_DERIV =
  "wss://api.derivws.com/trading/v1/op
  tions/ws/public";


const TIEMPO_RECONEXION = 3000;


const INTERVALO_PING = 30000;



export class DerivAPI {

  constructor() {

    this.socket = null;

    this.estado = "desconectado";

    this.simboloActual = "";

    this.idSuscripcion = null;

    this.cierreManual = false;

    this.temporizadorReconexion = null;

    this.temporizadorPing = null;


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

    if (!this.eventos[tipoEvento]) {
      return;
    }


    if (typeof funcion !== "function") {
      return;
    }


    this.eventos[tipoEvento].push(funcion);

  }



  /*
  =======================================================
  EMITIR EVENTOS
  =======================================================
  */

  emitir(tipoEvento, datos = {}) {

    const funciones =
      this.eventos[tipoEvento] || [];


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

  diagnostico(
    mensaje,
    tipo = "normal"
  ) {

    this.emitir(
      "diagnostico",
      {
        mensaje,
        tipo
      }
    );

  }



  /*
  =======================================================
  CAMBIAR ESTADO
  =======================================================
  */

  cambiarEstado(
    nuevoEstado,
    texto = nuevoEstado
  ) {

    this.estado = nuevoEstado;


    this.emitir(
      "estado",
      {
        estado: nuevoEstado,
        texto
      }
    );

  }



  /*
  =======================================================
  VERIFICAR CONEXIÓN
  =======================================================
  */

  estaConectado() {

    return Boolean(

      this.socket &&

      this.socket.readyState ===
        WebSocket.OPEN

    );

  }



  /*
  =======================================================
  CONECTAR
  =======================================================
  */

  conectar(simbolo = this.simboloActual) {

    if (simbolo) {

      this.simboloActual =
        String(simbolo).trim();

    }


    if (
      this.socket &&
      (
        this.socket.readyState ===
          WebSocket.OPEN ||

        this.socket.readyState ===
          WebSocket.CONNECTING
      )
    ) {

      return;

    }


    this.cierreManual = false;


    clearTimeout(
      this.temporizadorReconexion
    );


    this.detenerPing();


    this.cambiarEstado(
      "conectando",
      "Conectando..."
    );


    this.diagnostico(
      "Abriendo conexión pública con Deriv."
    );


    try {

      this.socket =
        new WebSocket(URL_DERIV);

    } catch (error) {

      this.gestionarError(
        "No se pudo crear la conexión: " +
        error.message
      );

      return;

    }



    this.socket.addEventListener(
      "open",
      () => {

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

      }
    );



    this.socket.addEventListener(
      "message",
      (evento) => {

        this.procesarMensaje(evento);

      }
    );



    this.socket.addEventListener(
      "error",
      () => {

        this.gestionarError(
          "La conexión WebSocket informó un error."
        );

      }
    );



    this.socket.addEventListener(
      "close",
      (evento) => {

        this.procesarCierre(evento);

      }
    );

  }



  /*
  =======================================================
  PROCESAR RESPUESTAS DE DERIV
  =======================================================
  */

  procesarMensaje(evento) {

    let datos;


    try {

      datos =
        JSON.parse(evento.data);

    } catch (error) {

      this.gestionarError(
        "Deriv envió una respuesta inválida."
      );

      return;

    }



    if (datos.error) {

      this.gestionarError(

        datos.error.message ||

        datos.error.code ||

        "Error desconocido de Deriv"

      );

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


      const precio =
        Number(datos.tick.quote);


      const epoch =
        Number(datos.tick.epoch);


      const pipSize =
        Number.isFinite(
          datos.tick.pip_size
        )
          ? datos.tick.pip_size
          : null;


      this.emitir(
        "tick",
        {
          simbolo:
            datos.tick.symbol ||
            this.simboloActual,

          precio,

          epoch,

          pipSize
        }
      );

    }

  }



  /*
  =======================================================
  PROCESAR CIERRE
  =======================================================
  */

  procesarCierre(evento) {

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


    this.diagnostico(
      "Conexión cerrada. Intentando reconectar...",
      "advertencia"
    );


    this.temporizadorReconexion =
      setTimeout(
        () => {

          this.conectar(
            this.simboloActual
          );

        },
        TIEMPO_RECONEXION
      );

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
        error.message
      );


      return false;

    }

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


    this.simboloActual =
      simboloLimpio;


    if (!this.estaConectado()) {

      this.conectar(
        simboloLimpio
      );


      return true;

    }


    if (this.idSuscripcion) {

      this.enviar(
        {
          forget:
            this.idSuscripcion
        }
      );

    }


    this.idSuscripcion = null;


    this.diagnostico(
      "Solicitando precios de " +
      simboloLimpio +
      "."
    );


    return this.enviar(
      {
        ticks:
          simboloLimpio,

        subscribe: 1
      }
    );

  }



  /*
  =======================================================
  CAMBIAR MERCADO
  =======================================================
  */

  cambiarSimbolo(simbolo) {

    return this.suscribirseTicks(
      simbolo
    );

  }



  /*
  =======================================================
  MANTENER LA CONEXIÓN ACTIVA
  =======================================================
  */

  iniciarPing() {

    this.detenerPing();


    this.temporizadorPing =
      setInterval(
        () => {

          if (this.estaConectado()) {

            this.enviar(
              {
                ping: 1
              }
            );

          }

        },
        INTERVALO_PING
      );

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


    clearTimeout(
      this.temporizadorReconexion
    );


    this.detenerPing();


    if (
      this.idSuscripcion &&
      this.estaConectado()
    ) {

      this.enviar(
        {
          forget:
            this.idSuscripcion
        }
      );

    }


    this.idSuscripcion = null;


    if (this.socket) {

      this.socket.close(
        1000,
        "Cierre manual"
      );

    } else {

      this.cambiarEstado(
        "desconectado",
        "Desconectado"
      );

    }

  }



  /*
  =======================================================
  GESTIONAR ERRORES
  =======================================================
  */

  gestionarError(mensaje) {

    this.emitir(
      "error",
      {
        mensaje
      }
    );


    this.diagnostico(
      mensaje,
      "error"
    );

  }

}



export const derivAPI =
  new DerivAPI();

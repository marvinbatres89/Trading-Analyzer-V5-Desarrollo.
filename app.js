/*
=========================================================
TRADING ANALYZER V6
Archivo: app.js

PARTE 1 DE 4
- Importación de Deriv API
- Elementos de la interfaz
- Estado general de V6
- Configuración de mercados y estrategias
- Sistema central de voz
- Sincronización y limpieza segura
- Preparación de la conexión
=========================================================
*/


import { derivAPI } from "./deriv-api.js";


/*
=========================================================
1. BUSCAR ELEMENTOS DEL HTML
=========================================================
*/

function obtenerElemento(
  id,
  obligatorio = true
) {

  const elemento =
    document.getElementById(id);


  if (
    !elemento &&
    obligatorio
  ) {

    console.warn(
      "No se encontró el elemento obligatorio:",
      id
    );

  }


  return elemento;

}



/*
=========================================================
2. ELEMENTOS DE LA INTERFAZ
=========================================================
*/

const interfaz = {

  estadoConexion:
    obtenerElemento(
      "estadoConexion"
    ),

  textoEstado:
    obtenerElemento(
      "textoEstado"
    ),


  botonConectar:
    obtenerElemento(
      "botonConectar"
    ),

  botonDesconectar:
    obtenerElemento(
      "botonDesconectar"
    ),

  botonAnalizar:
    obtenerElemento(
      "botonAnalizar"
    ),

  botonVoz:
    obtenerElemento(
      "botonVoz"
    ),

  botonAjustes:
    obtenerElemento(
      "botonAjustes",
      false
    ),


  selectorIndice:
    obtenerElemento(
      "selectorIndice"
    ),

  selectorOperacion:
    obtenerElemento(
      "selectorOperacion"
    ),

  selectorModo:
    obtenerElemento(
      "selectorModo"
    ),


  nombreIndice:
    obtenerElemento(
      "nombreIndice"
    ),

  estadoDatos:
    obtenerElemento(
      "estadoDatos"
    ),

  precioActual:
    obtenerElemento(
      "precioActual"
    ),

  contadorTicks:
    obtenerElemento(
      "contadorTicks"
    ),

  ultimoDigito:
    obtenerElemento(
      "ultimoDigito"
    ),

  horaActualizacion:
    obtenerElemento(
      "horaActualizacion"
    ),


  textoProgreso:
    obtenerElemento(
      "textoProgreso"
    ),

  numeroProgreso:
    obtenerElemento(
      "numeroProgreso"
    ),

  barraDatos:
    obtenerElemento(
      "barraDatos"
    ),


  tendencia:
    obtenerElemento(
      "tendencia"
    ),

  detalleTendencia:
    obtenerElemento(
      "detalleTendencia"
    ),

  rsi:
    obtenerElemento(
      "rsi"
    ),

  detalleRsi:
    obtenerElemento(
      "detalleRsi"
    ),

  momentum:
    obtenerElemento(
      "momentum"
    ),

  detalleMomentum:
    obtenerElemento(
      "detalleMomentum"
    ),

  volatilidad:
    obtenerElemento(
      "volatilidad"
    ),

  detalleVolatilidad:
    obtenerElemento(
      "detalleVolatilidad"
    ),


  panelSenal:
    obtenerElemento(
      "panelSenal"
    ),

  prediccionEstado:
    obtenerElemento(
      "prediccionEstado"
    ),

  prediccionTitulo:
    obtenerElemento(
      "prediccionTitulo"
    ),

  prediccionDireccion:
    obtenerElemento(
      "prediccionDireccion"
    ),

  prediccionConfianza:
    obtenerElemento(
      "prediccionConfianza"
    ),

  barraConfianza:
    obtenerElemento(
      "barraConfianza"
    ),

  prediccionMotivos:
    obtenerElemento(
      "prediccionMotivos"
    ),

  vigenciaSenal:
    obtenerElemento(
      "vigenciaSenal"
    ),

  cuentaRegresiva:
    obtenerElemento(
      "cuentaRegresiva",
      false
    ),


  botonLimpiarHistorial:
    obtenerElemento(
      "botonLimpiarHistorial"
    ),

  historialAnalisis:
    obtenerElemento(
      "historialAnalisis"
    ),


  botonLimpiarRegistro:
    obtenerElemento(
      "botonLimpiarRegistro"
    ),

  registroActividad:
    obtenerElemento(
      "registroActividad"
    ),


  contenedorGrafico:
    obtenerElemento(
      "contenedorGrafico",
      false
    )

};



/*
=========================================================
3. CONFIGURACIÓN GENERAL
=========================================================
*/

const CONFIGURACION = {

  version:
    "6.0",

  maximoPreciosGuardados:
    250,

  maximoDigitosGuardados:
    120,

  minimoTicksRapido:
    12,

  minimoTicksCompleto:
    30,

  maximoHistorial:
    10,

  duracionRapidaSegundos:
    10,

  duracionCompletaSegundos:
    30,

  intervaloAnalisisDuplicado:
    1500,

  idiomaVoz:
    "es-SV",

  velocidadVoz:
    0.95,

  tonoVoz:
    1,

  volumenVoz:
    1

};



/*
=========================================================
4. NOMBRES DE LOS MERCADOS
=========================================================
*/

const NOMBRES_MERCADOS = {

  "1HZ10V":
    "Volatility 10 (1s)",

  "1HZ25V":
    "Volatility 25 (1s)",

  "1HZ50V":
    "Volatility 50 (1s)",

  "1HZ75V":
    "Volatility 75 (1s)",

  "1HZ100V":
    "Volatility 100 (1s)",


  "R_10":
    "Volatility 10",

  "R_25":
    "Volatility 25",

  "R_50":
    "Volatility 50",

  "R_75":
    "Volatility 75",

  "R_100":
    "Volatility 100"

};



/*
=========================================================
5. NOMBRES DE LAS ESTRATEGIAS
=========================================================
*/

const NOMBRES_ESTRATEGIAS = {

  rise_fall:
    "Rise / Fall",

  even_odd:
    "Par / Impar",

  over_under:
    "Más / Menos",

  match:
    "Match"

};



/*
=========================================================
6. ESTADO GENERAL DE LA APLICACIÓN
=========================================================
*/

const estadoAplicacion = {

  conectado:
    false,

  conectando:
    false,

  analizando:
    false,


  simboloActual:
    "",

  nombreMercadoActual:
    "",

  estrategiaActual:
    "rise_fall",

  nombreEstrategiaActual:
    "Rise / Fall",

  modoActual:
    "rapido",


  precios:
    [],

  ultimosDigitos:
    [],

  ticksRecibidos:
    0,

  precioAnterior:
    null,

  ultimoPrecio:
    null,

  ultimoEpoch:
    null,

  ultimoPipSize:
    null,

  ultimoPrecioFormateado:
    "--",


  ultimoResultado:
    null,

  indicadoresActuales:
    null,

  historial:
    [],


  vozActiva:
    true,

  vozDisponible:
    (
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    ),


  temporizadorSenal:
    null,

  segundosRestantes:
    0,

  senalActiva:
    false,


  ultimoAnalisisEpoch:
    0,

  claveUltimoAnalisis:
    "",


  versionDatos:
    0,

  versionAnalisis:
    0

};



/*
=========================================================
7. OBTENER NOMBRE DEL MERCADO
=========================================================
*/

function obtenerNombreMercado(
  simbolo
) {

  return (

    NOMBRES_MERCADOS[simbolo] ||

    simbolo ||

    "Mercado desconocido"

  );

}



/*
=========================================================
8. OBTENER NOMBRE DE LA ESTRATEGIA
=========================================================
*/

function obtenerNombreEstrategia(
  estrategia
) {

  return (

    NOMBRES_ESTRATEGIAS[
      estrategia
    ] ||

    estrategia ||

    "Estrategia desconocida"

  );

}



/*
=========================================================
9. FORMATEAR LA HORA
=========================================================
*/

function obtenerHora(
  epoch = null
) {

  const fecha =
    Number.isFinite(epoch)
      ? new Date(epoch * 1000)
      : new Date();


  return fecha.toLocaleTimeString(
    "es-SV",
    {
      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit"
    }
  );

}



/*
=========================================================
10. REGISTRO DE ACTIVIDAD
=========================================================
*/

function registrarActividad(
  mensaje,
  tipo = "normal"
) {

  if (
    !interfaz.registroActividad
  ) {

    return;

  }


  const linea =
    document.createElement("p");


  linea.textContent =
    "[" +
    obtenerHora() +
    "] " +
    mensaje;


  if (
    tipo === "exito" ||
    tipo === "error" ||
    tipo === "advertencia"
  ) {

    linea.classList.add(
      tipo
    );

  }


  interfaz.registroActividad.prepend(
    linea
  );


  while (
    interfaz.registroActividad
      .children.length >
    50
  ) {

    const ultimoElemento =
      interfaz.registroActividad
        .lastElementChild;


    if (
      !ultimoElemento
    ) {

      break;

    }


    ultimoElemento.remove();

  }

}



/*
=========================================================
11. HABLAR MENSAJE
=========================================================
*/

function hablarMensaje(
  texto,
  forzar = false
) {

  if (
    !texto ||
    typeof texto !==
      "string"
  ) {

    return false;

  }


  if (
    !estadoAplicacion
      .vozDisponible
  ) {

    return false;

  }


  if (
    !estadoAplicacion
      .vozActiva &&
    !forzar
  ) {

    return false;

  }


  try {

    window.speechSynthesis.cancel();


    const mensaje =
      new SpeechSynthesisUtterance(
        texto
      );


    mensaje.lang =
      CONFIGURACION
        .idiomaVoz;


    mensaje.rate =
      CONFIGURACION
        .velocidadVoz;


    mensaje.pitch =
      CONFIGURACION
        .tonoVoz;


    mensaje.volume =
      CONFIGURACION
        .volumenVoz;


    window.speechSynthesis.speak(
      mensaje
    );


    return true;

  } catch (error) {

    registrarActividad(
      "No fue posible reproducir el mensaje de voz.",
      "advertencia"
    );


    console.warn(
      "Error de voz:",
      error
    );


    return false;

  }

}



/*
=========================================================
12. DETENER MENSAJES DE VOZ
=========================================================
*/

function detenerVoz() {

  if (
    !estadoAplicacion
      .vozDisponible
  ) {

    return;

  }


  try {

    window.speechSynthesis.cancel();

  } catch (error) {

    console.warn(
      "No fue posible detener la voz:",
      error
    );

  }

}



/*
=========================================================
13. ACTUALIZAR BOTÓN DE VOZ
=========================================================
*/

function actualizarBotonVoz() {

  if (
    !interfaz.botonVoz
  ) {

    return;

  }


  if (
    !estadoAplicacion
      .vozDisponible
  ) {

    interfaz.botonVoz
      .textContent =
        "🔇 Voz no disponible";


    interfaz.botonVoz
      .disabled =
        true;


    interfaz.botonVoz
      .setAttribute(
        "aria-pressed",
        "false"
      );


    return;

  }


  interfaz.botonVoz
    .disabled =
      false;


  interfaz.botonVoz
    .textContent =
      estadoAplicacion
        .vozActiva
        ? "🔊 Voz activa"
        : "🔇 Voz silenciada";


  interfaz.botonVoz
    .setAttribute(
      "aria-pressed",
      String(
        estadoAplicacion
          .vozActiva
      )
    );


  interfaz.botonVoz
    .classList.toggle(
      "activo",
      estadoAplicacion
        .vozActiva
    );

}



/*
=========================================================
14. ACTIVAR O SILENCIAR VOZ
=========================================================
*/

function alternarVoz() {

  if (
    !estadoAplicacion
      .vozDisponible
  ) {

    registrarActividad(
      "Este navegador no permite utilizar el asistente de voz.",
      "advertencia"
    );

    return;

  }


  estadoAplicacion
    .vozActiva =
      !estadoAplicacion
        .vozActiva;


  detenerVoz();


  actualizarBotonVoz();


  if (
    estadoAplicacion
      .vozActiva
  ) {

    registrarActividad(
      "Asistente de voz activado.",
      "exito"
    );


    hablarMensaje(
      "Asistente de voz activado."
    );

  } else {

    registrarActividad(
      "Asistente de voz silenciado."
    );

  }

}



/*
=========================================================
15. OBTENER MÍNIMO DE TICKS
=========================================================
*/

function obtenerMinimoTicks() {

  if (
    interfaz.selectorModo &&
    interfaz.selectorModo.value ===
      "completo"
  ) {

    return CONFIGURACION
      .minimoTicksCompleto;

  }


  return CONFIGURACION
    .minimoTicksRapido;

}



/*
=========================================================
16. OBTENER DURACIÓN DE LA SEÑAL
=========================================================
*/

function obtenerDuracionSenal() {

  if (
    interfaz.selectorModo &&
    interfaz.selectorModo.value ===
      "completo"
  ) {

    return CONFIGURACION
      .duracionCompletaSegundos;

  }


  return CONFIGURACION
    .duracionRapidaSegundos;

}



/*
=========================================================
17. CAMBIAR ESTADO VISUAL DE CONEXIÓN
=========================================================
*/

function mostrarEstadoConexion(
  estado,
  texto
) {

  if (
    interfaz.estadoConexion
  ) {

    interfaz.estadoConexion
      .className =
        "estado-conexion " +
        estado;

  }


  if (
    interfaz.textoEstado
  ) {

    interfaz.textoEstado
      .textContent =
        texto;

  }


  if (
    interfaz.botonConectar
  ) {

    interfaz.botonConectar
      .disabled =
        estado === "conectado" ||
        estado === "conectando";

  }


  if (
    interfaz.botonDesconectar
  ) {

    interfaz.botonDesconectar
      .disabled =
        estado !== "conectado";

  }


  estadoAplicacion.conectado =
    estado === "conectado";


  estadoAplicacion.conectando =
    estado === "conectando";

}



/*
=========================================================
18. SINCRONIZAR SELECCIÓN ACTUAL
=========================================================
*/

function sincronizarSeleccionActual() {

  if (
    interfaz.selectorIndice
  ) {

    estadoAplicacion
      .simboloActual =
        interfaz.selectorIndice
          .value;


    estadoAplicacion
      .nombreMercadoActual =
        obtenerNombreMercado(
          estadoAplicacion
            .simboloActual
        );
  
  }


  if (
    interfaz.selectorOperacion
  ) {

    estadoAplicacion
      .estrategiaActual =
        interfaz.selectorOperacion
          .value;


    estadoAplicacion
      .nombreEstrategiaActual =
        obtenerNombreEstrategia(
          estadoAplicacion
            .estrategiaActual
        );

  }


  if (
    interfaz.selectorModo
  ) {

    estadoAplicacion
      .modoActual =
        interfaz.selectorModo
          .value;

  }


  if (interfaz.nombreIndice) {

    interfaz.nombreIndice.textContent =
        estadoAplicacion.nombreMercadoActual;

}

} 

/*
=========================================================
20. LIMPIAR MOTIVOS DEL RESULTADO
=========================================================
*/

function limpiarMotivosResultado() {

  if (
    interfaz.prediccionMotivos
  ) {

    interfaz.prediccionMotivos
      .innerHTML = "";

  }

}



/*
=========================================================
21. AGREGAR MOTIVO AL RESULTADO
=========================================================
*/

function agregarMotivoResultado(
  texto
) {

  if (
    !interfaz.prediccionMotivos
  ) {

    return;

  }


  const elemento =
    document.createElement("li");


  elemento.textContent =
    texto;


  interfaz.prediccionMotivos
    .appendChild(
      elemento
    );

}



/*
=========================================================
22. REINICIAR PANEL DE SEÑAL
=========================================================
*/

function reiniciarPanelSenal(
  mensaje =
    "Conecta la herramienta para comenzar."
) {

  detenerCuentaRegresiva();


  estadoAplicacion
    .ultimoResultado =
      null;


  estadoAplicacion
    .analizando =
      false;


  if (
    interfaz.panelSenal
  ) {

    interfaz.panelSenal
      .className =
        "panel-senal neutral";

  }


  if (
    interfaz.prediccionEstado
  ) {

    interfaz.prediccionEstado
      .textContent =
        "SIN ANALIZAR";

  }


  if (
    interfaz.prediccionTitulo
  ) {

    interfaz.prediccionTitulo
      .textContent =
        "Esperando análisis";

  }


  if (
    interfaz.prediccionDireccion
  ) {

    interfaz.prediccionDireccion
      .textContent =
        "--";

  }


  if (
    interfaz.prediccionConfianza
  ) {

    interfaz.prediccionConfianza
      .textContent =
        "--";

  }


  if (
    interfaz.barraConfianza
  ) {

    interfaz.barraConfianza
      .style.width =
        "0%";

  }


  if (
    interfaz.vigenciaSenal
  ) {

    interfaz.vigenciaSenal
      .textContent =
        "Vigencia estimada: --";

  }


  limpiarMotivosResultado();


  agregarMotivoResultado(
    mensaje
  );

}



/*
=========================================================
23. ACTUALIZAR PROGRESO DE DATOS
=========================================================
*/

function actualizarProgresoDatos() {

  const minimo =
    obtenerMinimoTicks();


  const cantidad =
    Math.min(
      estadoAplicacion
        .precios.length,
      minimo
    );


  const porcentaje =
    minimo > 0
      ? Math.min(
          100,
          (
            cantidad /
            minimo
          ) * 100
        )
      : 0;


  if (
    interfaz.numeroProgreso
  ) {

    interfaz.numeroProgreso
      .textContent =
        cantidad +
        "/" +
        minimo;

  }


  if (
    interfaz.barraDatos
  ) {

    interfaz.barraDatos
      .style.width =
        porcentaje + "%";

  }


  if (
    !estadoAplicacion.conectado
  ) {

    if (
      interfaz.textoProgreso
    ) {

      interfaz.textoProgreso
        .textContent =
          "Esperando conexión";

    }


    if (
      interfaz.botonAnalizar
    ) {

      interfaz.botonAnalizar
        .disabled =
          true;


      interfaz.botonAnalizar
        .textContent =
          "Esperando conexión...";

    }


    return;

  }


  if (
    estadoAplicacion
      .precios.length <
    minimo
  ) {

    if (
      interfaz.textoProgreso
    ) {

      interfaz.textoProgreso
        .textContent =
          "Preparando " +
          estadoAplicacion
            .nombreEstrategiaActual;

    }


    if (
      interfaz.botonAnalizar
    ) {

      interfaz.botonAnalizar
        .disabled =
          true;


      interfaz.botonAnalizar
        .textContent =
          "Recopilando datos " +
          cantidad +
          "/" +
          minimo;

    }


    return;

  }


  if (
    interfaz.textoProgreso
  ) {

    interfaz.textoProgreso
      .textContent =
        "Análisis preparado";

  }


  if (
    interfaz.botonAnalizar
  ) {

    interfaz.botonAnalizar
      .disabled =
        false;


    interfaz.botonAnalizar
      .textContent =
        "🔍 Analizar ahora";

  }

}



/*
=========================================================
24. LIMPIAR DATOS DEL MERCADO
=========================================================
*/

function limpiarDatosMercado(
  motivo =
    "Esperando nuevos datos"
) {

  detenerCuentaRegresiva();

  detenerVoz();


  estadoAplicacion
    .versionDatos++;


  estadoAplicacion
    .precios = [];


  estadoAplicacion
    .ultimosDigitos = [];


  estadoAplicacion
    .ticksRecibidos = 0;


  estadoAplicacion
    .precioAnterior = null;


  estadoAplicacion
    .ultimoPrecio = null;


  estadoAplicacion
    .ultimoEpoch = null;


  estadoAplicacion
    .ultimoPipSize = null;


  estadoAplicacion
    .ultimoPrecioFormateado =
      "--";


  estadoAplicacion
    .indicadoresActuales =
      null;


  estadoAplicacion
    .ultimoAnalisisEpoch =
      0;


  estadoAplicacion
    .claveUltimoAnalisis =
      "";


  if (
    interfaz.precioActual
  ) {

    interfaz.precioActual
      .textContent =
        "--";


    interfaz.precioActual
      .className =
        "precio-actual";

  }


  if (
    interfaz.contadorTicks
  ) {

    interfaz.contadorTicks
      .textContent =
        "0";

  }


  if (
    interfaz.ultimoDigito
  ) {

    interfaz.ultimoDigito
      .textContent =
        "--";

  }


  if (
    interfaz.horaActualizacion
  ) {

    interfaz.horaActualizacion
      .textContent =
        "--";

  }


  if (
    interfaz.estadoDatos
  ) {

    interfaz.estadoDatos
      .textContent =
        "Sin datos";

  }


  if (
    interfaz.tendencia
  ) {

    interfaz.tendencia
      .textContent =
        "--";

  }


  if (
    interfaz.rsi
  ) {

    interfaz.rsi
      .textContent =
        "--";

  }


  if (
    interfaz.momentum
  ) {

    interfaz.momentum
      .textContent =
        "--";

  }


  if (
    interfaz.volatilidad
  ) {

    interfaz.volatilidad
      .textContent =
        "--";

  }


  if (
    interfaz.detalleTendencia
  ) {

    interfaz.detalleTendencia
      .textContent =
        motivo;

  }


  if (
    interfaz.detalleRsi
  ) {

    interfaz.detalleRsi
      .textContent =
        motivo;

  }


  if (
    interfaz.detalleMomentum
  ) {

    interfaz.detalleMomentum
      .textContent =
        motivo;

  }


  if (
    interfaz.detalleVolatilidad
  ) {

    interfaz.detalleVolatilidad
      .textContent =
        motivo;

  }


  reiniciarPanelSenal(
    "Esperando datos de " +
    estadoAplicacion
      .nombreMercadoActual +
    " para " +
    estadoAplicacion
      .nombreEstrategiaActual +
    "."
  );


  actualizarProgresoDatos();

}



/*
=========================================================
25. CONECTAR CON DERIV
=========================================================
*/

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
    "Solicitando conexión para " +
    estadoAplicacion
      .nombreMercadoActual +
    "."
  );


  hablarMensaje(
    "Conectando con Deriv."
  );


  derivAPI.conectar(
    estadoAplicacion
      .simboloActual
  );

}



/*
=========================================================
26. DESCONECTAR DE DERIV
=========================================================
*/

function desconectarDeDeriv() {

  detenerCuentaRegresiva();

  detenerVoz();


  registrarActividad(
    "Cerrando conexión con Deriv."
  );


  derivAPI.desconectar();

}



/*
=========================================================
FIN DE LA PARTE 1 DE 4

NO BORRES ESTA LÍNEA.
LA PARTE 2 DEBE PEGARSE INMEDIATAMENTE DEBAJO.
=========================================================
*/


/*
=========================================================
TRADING ANALYZER V6
Archivo: app.js

PARTE 2 DE 4
- Recepción y validación de ticks
- Precio y último dígito
- Tendencia
- RSI
- Momentum
- Volatilidad
- Sincronización de mercado, estrategia y modo
=========================================================
*/


/*
=========================================================
27. CALCULAR PROMEDIO
=========================================================
*/

function calcularPromedio(
  valores
) {

  if (
    !Array.isArray(valores) ||
    valores.length === 0
  ) {

    return 0;

  }


  const suma =
    valores.reduce(
      (
        acumulado,
        valor
      ) => {

        return acumulado + valor;

      },
      0
    );


  return suma /
    valores.length;

}



/*
=========================================================
28. CALCULAR DESVIACIÓN ESTÁNDAR
=========================================================
*/

function calcularDesviacion(
  valores
) {

  if (
    !Array.isArray(valores) ||
    valores.length < 2
  ) {

    return 0;

  }


  const promedio =
    calcularPromedio(
      valores
    );


  const diferencias =
    valores.map(
      (valor) => {

        return Math.pow(
          valor - promedio,
          2
        );

      }
    );


  const varianza =
    calcularPromedio(
      diferencias
    );


  return Math.sqrt(
    varianza
  );

}



/*
=========================================================
29. OBTENER CONFIGURACIÓN DEL MODO
=========================================================
*/

function obtenerConfiguracionModo() {

  if (
    estadoAplicacion
      .modoActual ===
      "completo"
  ) {

    return {

      periodoRSI:
        14,

      ventanaTendencia:
        30,

      ventanaMomentum:
        10,

      ventanaVolatilidad:
        30,

      vigencia:
        CONFIGURACION
          .duracionCompletaSegundos,

      ajusteConfianza:
        3

    };

  }


  return {

    periodoRSI:
      8,

    ventanaTendencia:
      12,

    ventanaMomentum:
      5,

    ventanaVolatilidad:
      12,

      vigencia:
        CONFIGURACION
          .duracionRapidaSegundos,

      ajusteConfianza:
        0

  };

}


/*
=========================================================
30. CALCULAR RSI
=========================================================
*/

function calcularRSI(
  precios,
  periodo = 14
) {

  if (
    !Array.isArray(precios) ||
    precios.length <
      periodo + 1
  ) {

    return null;

  }


  const datos =
    precios.slice(
      -(
        periodo + 1
      )
    );


  let ganancias = 0;

  let perdidas = 0;


  for (
    let indice = 1;
    indice < datos.length;
    indice++
  ) {

    const diferencia =
      datos[indice] -
      datos[indice - 1];


    if (
      diferencia > 0
    ) {

      ganancias +=
        diferencia;

    } else if (
      diferencia < 0
    ) {

      perdidas +=
        Math.abs(
          diferencia
        );

    }

  }


  const promedioGanancias =
    ganancias /
    periodo;


  const promedioPerdidas =
    perdidas /
    periodo;


  if (
    promedioGanancias === 0 &&
    promedioPerdidas === 0
  ) {

    return 50;

  }


  if (
    promedioPerdidas === 0
  ) {

    return 100;

  }


  const fuerzaRelativa =
    promedioGanancias /
    promedioPerdidas;


  return 100 -
    (
      100 /
      (
        1 +
        fuerzaRelativa
      )
    );

}



/*
=========================================================
31. CALCULAR TENDENCIA
=========================================================
*/

function calcularTendencia(
  precios
) {

  if (
    !Array.isArray(precios) ||
    precios.length < 6
  ) {

    return {

      direccion:
        "Sin datos",

      cambio:
        0,

      fuerza:
        0

    };

  }


  const configuracion =
    obtenerConfiguracionModo();


  const cantidad =
    Math.min(
      configuracion
        .ventanaTendencia,
      precios.length
    );


  const recientes =
    precios.slice(
      -cantidad
    );


  const mitad =
    Math.floor(
      recientes.length / 2
    );


  const primeraMitad =
    recientes.slice(
      0,
      mitad
    );


  const segundaMitad =
    recientes.slice(
      mitad
    );


  const promedioAnterior =
    calcularPromedio(
      primeraMitad
    );


  const promedioActual =
    calcularPromedio(
      segundaMitad
    );


  if (
    promedioAnterior === 0
  ) {

    return {

      direccion:
        "Lateral",

      cambio:
        0,

      fuerza:
        0

    };

  }


  const cambio =
    (
      (
        promedioActual -
        promedioAnterior
      ) /
      promedioAnterior
    ) *
    100;


  const fuerza =
    Math.abs(
      cambio
    );


  let direccion =
    "Lateral";


  if (
    cambio > 0
  ) {

    direccion =
      "Alcista";

  } else if (
    cambio < 0
  ) {

    direccion =
      "Bajista";

  }


  return {

    direccion,

    cambio,

    fuerza

  };

}



/*
=========================================================
32. CALCULAR MOMENTUM
=========================================================
*/

function calcularMomentum(
  precios
) {

  const configuracion =
    obtenerConfiguracionModo();


  const periodo =
    configuracion
      .ventanaMomentum;


  if (
    !Array.isArray(precios) ||
    precios.length <
      periodo + 1
  ) {

    return {

      direccion:
        "Sin datos",

      valor:
        0,

      porcentaje:
        0

    };

  }


  const precioActual =
    precios[
      precios.length - 1
    ];


  const precioAnterior =
    precios[
      precios.length -
      1 -
      periodo
    ];


  const valor =
    precioActual -
    precioAnterior;


  const porcentaje =
    precioAnterior !== 0
      ? (
          valor /
          precioAnterior
        ) *
        100
      : 0;


  let direccion =
    "Neutral";


  if (
    valor > 0
  ) {

    direccion =
      "Positivo";

  } else if (
    valor < 0
  ) {

    direccion =
      "Negativo";

  }


  return {

    direccion,

    valor,

    porcentaje

  };

}



/*
=========================================================
33. CALCULAR VOLATILIDAD
=========================================================
*/

function calcularVolatilidad(
  precios
) {

  const configuracion =
    obtenerConfiguracionModo();


  const cantidad =
    Math.min(
      configuracion
        .ventanaVolatilidad,
      precios.length
    );


  if (
    !Array.isArray(precios) ||
    cantidad < 5
  ) {

    return {

      nivel:
        "Sin datos",

      valor:
        0,

      porcentaje:
        0

    };

  }


  const recientes =
    precios.slice(
      -cantidad
    );


  const promedio =
    calcularPromedio(
      recientes
    );


  const desviacion =
    calcularDesviacion(
      recientes
    );


  const porcentaje =
    promedio !== 0
      ? (
          desviacion /
          promedio
        ) *
        100
      : 0;


  let nivel =
    "Baja";


  if (
    porcentaje >= 0.08
  ) {

    nivel =
      "Alta";

  } else if (
    porcentaje >= 0.025
  ) {

    nivel =
      "Media";

  }


  return {

    nivel,

    valor:
      desviacion,

    porcentaje

  };

}



/*
=========================================================
34. CALCULAR INDICADORES
=========================================================
*/

function calcularIndicadores() {

  const precios =
    estadoAplicacion
      .precios;


  if (
    !Array.isArray(precios) ||
    precios.length < 5
  ) {

    return null;

  }


  const configuracion =
    obtenerConfiguracionModo();


  const tendencia =
    calcularTendencia(
      precios
    );


  const rsi =
    calcularRSI(
      precios,
      configuracion
        .periodoRSI
    );


  const momentum =
    calcularMomentum(
      precios
    );


  const volatilidad =
    calcularVolatilidad(
      precios
    );


  return {

    tendencia,

    rsi,

    momentum,

    volatilidad

  };

}



/*
=========================================================
35. MOSTRAR TENDENCIA
=========================================================
*/

function mostrarTendencia(
  tendencia
) {

  if (
    !tendencia
  ) {

    return;

  }


  if (
    interfaz.tendencia
  ) {

    interfaz.tendencia
      .textContent =
        tendencia.direccion;

  }


  if (
    interfaz.detalleTendencia
  ) {

    interfaz.detalleTendencia
      .textContent =
        "Cambio: " +
        tendencia.cambio
          .toFixed(4) +
        "%";

  }

}



/*
=========================================================
36. MOSTRAR RSI
=========================================================
*/

function mostrarRSI(
  rsi
) {

  if (
    interfaz.rsi
  ) {

    interfaz.rsi
      .textContent =
        Number.isFinite(rsi)
          ? rsi.toFixed(1)
          : "--";

  }


  if (
    !interfaz.detalleRsi
  ) {

    return;

  }


  if (
    !Number.isFinite(rsi)
  ) {

    interfaz.detalleRsi
      .textContent =
        "Esperando más datos";

    return;

  }


  if (
    rsi > 70
  ) {

    interfaz.detalleRsi
      .textContent =
        "Zona alta";

  } else if (
    rsi < 30
  ) {

    interfaz.detalleRsi
      .textContent =
        "Zona baja";

  } else {

    interfaz.detalleRsi
      .textContent =
        "Zona neutral";

  }

}



/*
=========================================================
37. MOSTRAR MOMENTUM
=========================================================
*/

function mostrarMomentum(
  momentum
) {

  if (
    !momentum
  ) {

    return;

  }


  if (
    interfaz.momentum
  ) {

    interfaz.momentum
      .textContent =
        momentum.direccion;

  }


  if (
    interfaz.detalleMomentum
  ) {

    interfaz.detalleMomentum
      .textContent =
        momentum.valor
          .toFixed(5) +
        " · " +
        momentum.porcentaje
          .toFixed(4) +
        "%";

  }

}



/*
=========================================================
38. MOSTRAR VOLATILIDAD
=========================================================
*/

function mostrarVolatilidad(
  volatilidad
) {

  if (
    !volatilidad
  ) {

    return;

  }


  if (
    interfaz.volatilidad
  ) {

    interfaz.volatilidad
      .textContent =
        volatilidad.porcentaje
          .toFixed(4) +
        "%";

  }


  if (
    interfaz.detalleVolatilidad
  ) {

    interfaz.detalleVolatilidad
      .textContent =
        "Nivel " +
        volatilidad.nivel;

  }

}



/*
=========================================================
39. ACTUALIZAR INDICADORES
=========================================================
*/

function actualizarIndicadores() {

  const indicadores =
    calcularIndicadores();


  estadoAplicacion
    .indicadoresActuales =
      indicadores;


  if (
    !indicadores
  ) {

    return;

  }


  mostrarTendencia(
    indicadores.tendencia
  );


  mostrarRSI(
    indicadores.rsi
  );


  mostrarMomentum(
    indicadores.momentum
  );


  mostrarVolatilidad(
    indicadores.volatilidad
  );

}



/*
=========================================================
40. FORMATEAR PRECIO
=========================================================
*/

function formatearPrecio(
  precio,
  pipSize
) {

  if (
    !Number.isFinite(precio)
  ) {

    return "--";

  }


  const decimales =
    Number.isInteger(pipSize) &&
    pipSize >= 0 &&
    pipSize <= 10
      ? pipSize
      : 2;


  return precio.toFixed(
    decimales
  );

}



/*
=========================================================
41. OBTENER ÚLTIMO DÍGITO
=========================================================
*/

function obtenerUltimoDigito(
  precioFormateado
) {

  const texto =
    String(
      precioFormateado || ""
    );


  for (
    let indice =
      texto.length - 1;
    indice >= 0;
    indice--
  ) {

    const caracter =
      texto.charAt(indice);


    if (
      caracter >= "0" &&
      caracter <= "9"
    ) {

      return Number(
        caracter
      );

    }

  }


  return null;

}



/*
=========================================================
42. GUARDAR PRECIO
=========================================================
*/

function guardarPrecio(
  precio
) {

  if (
    !Number.isFinite(precio)
  ) {

    return;

  }


  estadoAplicacion
    .precios.push(
      precio
    );


  if (
    estadoAplicacion
      .precios.length >
    CONFIGURACION
      .maximoPreciosGuardados
  ) {

    estadoAplicacion
      .precios.shift();

  }

}



/*
=========================================================
43. GUARDAR ÚLTIMO DÍGITO
=========================================================
*/

function guardarUltimoDigito(
  digito
) {

  if (
    !Number.isInteger(digito) ||
    digito < 0 ||
    digito > 9
  ) {

    return;

  }


  estadoAplicacion
    .ultimosDigitos.push(
      digito
    );


  if (
    estadoAplicacion
      .ultimosDigitos.length >
    CONFIGURACION
      .maximoDigitosGuardados
  ) {

    estadoAplicacion
      .ultimosDigitos.shift();

  }

}



/*
=========================================================
44. MOSTRAR MOVIMIENTO DEL PRECIO
=========================================================
*/

function mostrarMovimientoPrecio(
  precio
) {

  if (
    !interfaz.precioActual
  ) {

    return;

  }


  interfaz.precioActual
    .classList.remove(
      "sube",
      "baja"
    );


  const anterior =
    estadoAplicacion
      .precioAnterior;


  if (
    !Number.isFinite(anterior)
  ) {

    return;

  }


  if (
    precio > anterior
  ) {

    interfaz.precioActual
      .classList.add(
        "sube"
      );

  } else if (
    precio < anterior
  ) {

    interfaz.precioActual
      .classList.add(
        "baja"
      );

  }

}



/*
=========================================================
45. VALIDAR TICK RECIBIDO
=========================================================
*/

function validarTick(
  datosTick
) {

  if (
    !datosTick ||
    !Number.isFinite(
      datosTick.precio
    )
  ) {

    return false;

  }


  const simboloRecibido =
    String(
      datosTick.simbolo || ""
    ).trim();


  if (
    simboloRecibido &&
    simboloRecibido !==
      estadoAplicacion
        .simboloActual
  ) {

    registrarActividad(
      "Se ignoró un tick perteneciente al mercado anterior.",
      "advertencia"
    );


    return false;

  }


  return true;

}



/*
=========================================================
46. PROCESAR TICK RECIBIDO
=========================================================
*/

function procesarTick(
  datosTick
) {

  if (
    !validarTick(
      datosTick
    )
  ) {

    return;

  }


  const precio =
    Number(
      datosTick.precio
    );


  const precioFormateado =
    formatearPrecio(
      precio,
      datosTick.pipSize
    );


  const ultimoDigito =
    obtenerUltimoDigito(
      precioFormateado
    );


  estadoAplicacion
    .ticksRecibidos++;


  guardarPrecio(
    precio
  );


  guardarUltimoDigito(
    ultimoDigito
  );


  mostrarMovimientoPrecio(
    precio
  );


  if (
    interfaz.precioActual
  ) {

    interfaz.precioActual
      .textContent =
        precioFormateado;

  }


  if (
    interfaz.contadorTicks
  ) {

    interfaz.contadorTicks
      .textContent =
        String(
          estadoAplicacion
            .ticksRecibidos
        );

  }


  if (
    interfaz.ultimoDigito
  ) {

    interfaz.ultimoDigito
      .textContent =
        Number.isInteger(
          ultimoDigito
        )
          ? String(
              ultimoDigito
            )
          : "--";

  }


  if (
    interfaz.horaActualizacion
  ) {

    interfaz.horaActualizacion
      .textContent =
        obtenerHora(
          datosTick.epoch
        );

  }


  if (
    interfaz.estadoDatos
  ) {

    interfaz.estadoDatos
      .textContent =
        "Datos en vivo";

  }


  estadoAplicacion
    .precioAnterior =
      precio;


  estadoAplicacion
    .ultimoPrecio =
      precio;


  estadoAplicacion
    .ultimoEpoch =
      Number.isFinite(
        datosTick.epoch
      )
        ? datosTick.epoch
        : null;


  estadoAplicacion
    .ultimoPipSize =
      Number.isInteger(
        datosTick.pipSize
      )
        ? datosTick.pipSize
        : null;


  estadoAplicacion
    .ultimoPrecioFormateado =
      precioFormateado;


  actualizarIndicadores();


  actualizarProgresoDatos();

}



/*
=========================================================
47. CAMBIAR MERCADO
=========================================================
*/

function cambiarMercado() {

  const mercadoAnterior =
    estadoAplicacion
      .nombreMercadoActual;


  sincronizarSeleccionActual();


  limpiarDatosMercado(
    "Esperando datos del nuevo mercado"
  );


  registrarActividad(
    "Mercado seleccionado: " +
    estadoAplicacion
      .nombreMercadoActual +
    "."
  );


  hablarMensaje(
    "Mercado cambiado a " +
    estadoAplicacion
      .nombreMercadoActual +
    "."
  );


  if (
    derivAPI.estaConectado()
  ) {

    derivAPI.cambiarSimbolo(
      estadoAplicacion
        .simboloActual
    );

  }


  if (
    mercadoAnterior &&
    mercadoAnterior ===
      estadoAplicacion
        .nombreMercadoActual
  ) {

    registrarActividad(
      "El mercado seleccionado no cambió."
    );

  }

}



/*
=========================================================
48. CAMBIAR ESTRATEGIA
=========================================================
*/

function cambiarEstrategia() {

  sincronizarSeleccionActual();


  detenerCuentaRegresiva();

  detenerVoz();


  estadoAplicacion
    .versionAnalisis++;


  estadoAplicacion
    .ultimoAnalisisEpoch =
      0;


  estadoAplicacion
    .claveUltimoAnalisis =
      "";


  reiniciarPanelSenal(
    "La estrategia cambió. Ejecuta un nuevo análisis."
  );


  actualizarProgresoDatos();


  registrarActividad(
    "Estrategia seleccionada: " +
    estadoAplicacion
      .nombreEstrategiaActual +
    "."
  );


  hablarMensaje(
    "Estrategia seleccionada: " +
    estadoAplicacion
      .nombreEstrategiaActual +
    "."
  );

}



/*
=========================================================
49. CAMBIAR MODO DE ANÁLISIS
=========================================================
*/

function cambiarModoAnalisis() {

  sincronizarSeleccionActual();


  detenerCuentaRegresiva();

  detenerVoz();


  estadoAplicacion
    .versionAnalisis++;


  estadoAplicacion
    .ultimoAnalisisEpoch =
      0;


  estadoAplicacion
    .claveUltimoAnalisis =
      "";


  reiniciarPanelSenal(
    "El modo cambió. Ejecuta un nuevo análisis."
  );


  actualizarIndicadores();


  actualizarProgresoDatos();


  const textoModo =
    interfaz.selectorModo
      ? interfaz.selectorModo
          .options[
            interfaz.selectorModo
              .selectedIndex
          ]
          .textContent
          .trim()
      : estadoAplicacion
          .modoActual;


  registrarActividad(
    "Modo seleccionado: " +
    textoModo +
    "."
  );

}



/*
=========================================================
FIN DE LA PARTE 2 DE 4

NO BORRES ESTA LÍNEA.
LA PARTE 3 DEBE PEGARSE INMEDIATAMENTE DEBAJO.
=========================================================
*/

/*
=========================================================
TRADING ANALYZER V6
Archivo: app.js

PARTE 3 DE 4
- Motor de predicción
- Rise/Fall
- Par/Impar
- Más/Menos
- Match
- Confianza técnica
- Historial de resultados
=========================================================
*/


/*
=========================================================
35. OBTENER TEXTO DEL MODO ACTUAL
=========================================================
*/

function obtenerTextoModoActual() {

  if (
    !interfaz.selectorModo
  ) {

    return "Modo desconocido";

  }


  const opcionSeleccionada =
    interfaz.selectorModo.options[
      interfaz.selectorModo.selectedIndex
    ];


  return opcionSeleccionada
    ? opcionSeleccionada.text
    : "Modo desconocido";

}



/*
=========================================================
36. OBTENER VALOR DE LA OPERACIÓN ACTUAL
=========================================================
*/

function obtenerOperacionActual() {

  if (
    !interfaz.selectorOperacion
  ) {

    return "rise_fall";

  }


  return interfaz.selectorOperacion.value ||
    "rise_fall";

}



/*
=========================================================
37. OBTENER TEXTO DE LA OPERACIÓN ACTUAL
=========================================================
*/

function obtenerTextoOperacionActual() {

  if (
    !interfaz.selectorOperacion
  ) {

    return "Rise/Fall";

  }


  const opcionSeleccionada =
    interfaz.selectorOperacion.options[
      interfaz.selectorOperacion.selectedIndex
    ];


  return opcionSeleccionada
    ? opcionSeleccionada.text
    : "Rise/Fall";

}



/*
=========================================================
38. OBTENER VIGENCIA ESTIMADA
=========================================================
*/

function obtenerVigenciaEstimada() {

  return obtenerConfiguracionModo()
    .vigencia;

}



/*
=========================================================
39. LIMITAR UN NÚMERO
=========================================================
*/

function limitarNumero(
  valor,
  minimo,
  maximo
) {

  return Math.max(
    minimo,
    Math.min(
      maximo,
      valor
    )
  );

}



/*
=========================================================
40. OBTENER ÚLTIMOS DÍGITOS GUARDADOS
=========================================================
*/

function obtenerUltimosDigitos(
  cantidad = 20
) {

  const precios =
    estadoAplicacion
      .precios.slice(
        -cantidad
      );


  return precios
    .map(
      (precio) => {

        const precioFormateado =
          formatearPrecio(
            precio,
            estadoAplicacion
              .ultimoPipSize
          );


        const ultimoDigito =
          obtenerUltimoDigito(
            precioFormateado
          );


        const numero =
          Number(
            ultimoDigito
          );


        return Number.isInteger(numero)
          ? numero
          : null;

      }
    )
    .filter(
      (digito) =>
        digito !== null
    );

}



/*
=========================================================
41. CONTAR REPETICIONES DE DÍGITOS
=========================================================
*/

function contarDigitos(
  digitos
) {

  const conteo =
    Array(10).fill(0);


  digitos.forEach(
    (digito) => {

      if (
        Number.isInteger(digito) &&
        digito >= 0 &&
        digito <= 9
      ) {

        conteo[digito]++;

      }

    }
  );


  return conteo;

}



/*
=========================================================
42. EVALUAR TENDENCIA
=========================================================
*/

function evaluarTendencia(
  tendencia
) {

  const resultado = {

    puntaje: 0,

    razones: [],

    advertencias: []

  };


  if (
    !tendencia
  ) {

    resultado.advertencias.push(
      "No fue posible evaluar la tendencia."
    );

    return resultado;

  }


  if (
    tendencia.direccion ===
      "Alcista"
  ) {

    resultado.puntaje += 2;


    resultado.razones.push(
      "La tendencia reciente es alcista."
    );

  } else if (
    tendencia.direccion ===
      "Bajista"
  ) {

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



/*
=========================================================
43. EVALUAR MOMENTUM
=========================================================
*/

function evaluarMomentum(
  momentum
) {

  const resultado = {

    puntaje: 0,

    razones: [],

    advertencias: []

  };


  if (
    !momentum
  ) {

    resultado.advertencias.push(
      "No fue posible evaluar el momentum."
    );

    return resultado;

  }


  if (
    momentum.direccion ===
      "Positivo"
  ) {

    resultado.puntaje += 1;


    resultado.razones.push(
      "El momentum inmediato es positivo."
    );

  } else if (
    momentum.direccion ===
      "Negativo"
  ) {

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



/*
=========================================================
44. EVALUAR RSI
=========================================================
*/

function evaluarRSI(
  rsi
) {

  const resultado = {

    puntaje: 0,

    razones: [],

    advertencias: []

  };


  if (
    rsi === null ||
    !Number.isFinite(rsi)
  ) {

    resultado.advertencias.push(
      "Todavía no hay suficientes datos para calcular el RSI."
    );

    return resultado;

  }


  if (
    rsi >= 55 &&
    rsi <= 72
  ) {

    resultado.puntaje += 1;


    resultado.razones.push(
      "El RSI acompaña el movimiento alcista."
    );

  } else if (
    rsi <= 45 &&
    rsi >= 28
  ) {

    resultado.puntaje -= 1;


    resultado.razones.push(
      "El RSI acompaña el movimiento bajista."
    );

  } else if (
    rsi > 72
  ) {

    resultado.puntaje -= 1;


    resultado.advertencias.push(
      "El RSI está en una zona alta y podría existir agotamiento."
    );

  } else if (
    rsi < 28
  ) {

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



/*
=========================================================
45. EVALUAR VOLATILIDAD
=========================================================
*/

function evaluarVolatilidad(
  volatilidad
) {

  const resultado = {

    ajusteConfianza: 0,

    razones: [],

    advertencias: []

  };


  if (
    !volatilidad
  ) {

    resultado.advertencias.push(
      "No fue posible evaluar la volatilidad."
    );

    return resultado;

  }


  if (
    volatilidad.nivel ===
      "Baja"
  ) {

    resultado.ajusteConfianza += 3;


    resultado.razones.push(
      "La volatilidad se mantiene relativamente estable."
    );

  } else if (
    volatilidad.nivel ===
      "Media"
  ) {

    resultado.razones.push(
      "La volatilidad se encuentra en un nivel medio."
    );

  } else if (
    volatilidad.nivel ===
      "Alta"
  ) {

    resultado.ajusteConfianza -= 10;


    resultado.advertencias.push(
      "La volatilidad alta reduce la estabilidad de la predicción."
    );

  }


  return resultado;

}



/*
=========================================================
46. COMBINAR EVALUACIONES
=========================================================
*/

function combinarEvaluaciones(
  evaluaciones
) {

  const resultado = {

    puntaje: 0,

    ajusteConfianza: 0,

    razones: [],

    advertencias: []

  };


  evaluaciones.forEach(
    (evaluacion) => {

      if (
        !evaluacion
      ) {

        return;

      }


      if (
        Number.isFinite(
          evaluacion.puntaje
        )
      ) {

        resultado.puntaje +=
          evaluacion.puntaje;

      }


      if (
        Number.isFinite(
          evaluacion.ajusteConfianza
        )
      ) {

        resultado.ajusteConfianza +=
          evaluacion.ajusteConfianza;

      }


      if (
        Array.isArray(
          evaluacion.razones
        )
      ) {

        resultado.razones.push(
          ...evaluacion.razones
        );

      }


      if (
        Array.isArray(
          evaluacion.advertencias
        )
      ) {

        resultado.advertencias.push(
          ...evaluacion.advertencias
        );

      }

    }
  );


  return resultado;

}



/*
=========================================================
47. CALCULAR CONFIANZA
=========================================================
*/

function calcularConfianza(
  fuerza,
  ajuste = 0
) {

  const configuracion =
    obtenerConfiguracionModo();


  const base =
    52;


  const confianza =
    base +
    (
      Math.abs(fuerza) *
      7
    ) +
    ajuste +
    configuracion
      .ajusteConfianza;


  return Math.round(
    limitarNumero(
      confianza,
      45,
      88
    )
  );

}



/*
=========================================================
48. CREAR RESULTADO BASE
=========================================================
*/

function crearResultadoBase(
  direccion,
  confianza,
  razones,
  advertencias
) {

  return {

    direccion,

    confianza,

    titulo:
      "Predicción: " +
      direccion,

    razones:
      razones || [],

    advertencias:
      advertencias || [],

    vigencia:
      obtenerVigenciaEstimada(),

    mercado:
      estadoAplicacion
        .nombreMercadoActual,

    operacion:
      obtenerTextoOperacionActual(),

    modo:
      obtenerTextoModoActual(),

    hora:
      obtenerHora(),

    precio:
      estadoAplicacion
        .ultimoPrecio

  };

}



/*
=========================================================
49. GENERAR RESULTADO RISE/FALL
=========================================================
*/

function generarResultadoRiseFall(
  indicadores
) {


  const combinacion =
    combinarEvaluaciones(
      [
        evaluarTendencia(
          indicadores.tendencia
        ),

        evaluarMomentum(
          indicadores.momentum
        ),

        evaluarRSI(
          indicadores.rsi
        ),

        evaluarVolatilidad(
          indicadores.volatilidad
        )
      ]
    );


  let direccion =
    "ESPERAR";


  if (
    combinacion.puntaje >= 2
  ) {

    direccion =
      "SUBE";

  }


  if (
    combinacion.puntaje <= -2
  ) {

    direccion =
      "BAJA";

  }


  if (
    direccion === "ESPERAR"
  ) {

    combinacion.advertencias.push(
      "Los indicadores no presentan suficiente coincidencia."
    );

  }


  const confianza =
  direccion === "ESPERAR"
    ? 45
    : calcularConfianza(
        combinacion.puntaje,
        combinacion
          .ajusteConfianza
      );


  return crearResultadoBase(
    direccion,
    confianza,
    combinacion.razones,
    combinacion.advertencias
  );

}



/*
=========================================================
50. GENERAR RESULTADO PAR/IMPAR
=========================================================
*/

function generarResultadoParImpar() {

  const digitos =
    obtenerUltimosDigitos(
      30
    );


  if (
    digitos.length < 10
  ) {

    return crearResultadoBase(
      "ESPERAR",
      45,
      [],
      [
        "Todavía no existen suficientes dígitos para analizar Par/Impar."
      ]
    );

  }


  const cantidadPares =
    digitos.filter(
      (digito) =>
        digito % 2 === 0
    ).length;


  const cantidadImpares =
    digitos.length -
    cantidadPares;


  const diferencia =
    cantidadPares -
    cantidadImpares;


  let direccion =
    "ESPERAR";


  if (
    diferencia >= 3
  ) {

    direccion =
      "PAR";

  }


  if (
    diferencia <= -3
  ) {

    direccion =
      "IMPAR";

  }


  const porcentajePares =
    (
      cantidadPares /
      digitos.length
    ) * 100;


  const porcentajeImpares =
    100 -
    porcentajePares;


  const razones = [

    "Dígitos pares observados: " +
    cantidadPares +
    " de " +
    digitos.length +
    ".",

    "Dígitos impares observados: " +
    cantidadImpares +
    " de " +
    digitos.length +
    "."

  ];


  const advertencias = [];


  if (
    direccion === "ESPERAR"
  ) {

    advertencias.push(
      "La distribución entre pares e impares está demasiado equilibrada."
    );

  }


  const fuerza =
    Math.abs(
      porcentajePares -
      porcentajeImpares
    ) / 10;


  const confianza =
    calcularConfianza(
      fuerza
    );


  return crearResultadoBase(
    direccion,
    confianza,
    razones,
    advertencias
  );

}



/*
=========================================================
51. GENERAR RESULTADO MÁS/MENOS
=========================================================
*/

function generarResultadoMasMenos() {

  const digitos =
    obtenerUltimosDigitos(
      30
    );


  if (
    digitos.length < 10
  ) {

    return crearResultadoBase(
      "ESPERAR",
      45,
      [],
      [
        "Todavía no existen suficientes dígitos para analizar Más/Menos."
      ]
    );

  }


  const menores =
    digitos.filter(
      (digito) =>
        digito <= 4
    ).length;


  const mayores =
    digitos.filter(
      (digito) =>
        digito >= 5
    ).length;


  const diferencia =
    mayores -
    menores;


  let direccion =
    "ESPERAR";


  if (
    diferencia >= 3
  ) {

    direccion =
      "MÁS";

  }


  if (
    diferencia <= -3
  ) {

    direccion =
      "MENOS";

  }


  const razones = [

    "Dígitos del 0 al 4: " +
    menores +
    ".",

    "Dígitos del 5 al 9: " +
    mayores +
    "."

  ];


  const advertencias = [];


  if (
    direccion === "ESPERAR"
  ) {

    advertencias.push(
      "No existe una diferencia suficiente entre dígitos altos y bajos."
    );

  }


  const fuerza =
    Math.abs(
      diferencia
    ) / 3;


  const confianza =
    calcularConfianza(
      fuerza
    );


  return crearResultadoBase(
    direccion,
    confianza,
    razones,
    advertencias
  );

}



/*
=========================================================
52. GENERAR RESULTADO MATCH
=========================================================
*/

function generarResultadoMatch() {

  const digitos =
    obtenerUltimosDigitos(
      40
    );


  if (
    digitos.length < 15
  ) {

    return crearResultadoBase(
      "ESPERAR",
      45,
      [],
      [
        "Todavía no existen suficientes dígitos para analizar Match."
      ]
    );

  }


  const conteo =
    contarDigitos(
      digitos
    );


  let digitoFrecuente = 0;

  let mayorFrecuencia =
    conteo[0];


  for (
    let digito = 1;
    digito <= 9;
    digito++
  ) {

    if (
      conteo[digito] >
      mayorFrecuencia
    ) {

      mayorFrecuencia =
        conteo[digito];


      digitoFrecuente =
        digito;

    }

  }


  const porcentaje =
    (
      mayorFrecuencia /
      digitos.length
    ) * 100;


  let direccion =
    "ESPERAR";


  const advertencias = [];


  if (
    mayorFrecuencia >= 4 &&
    porcentaje >= 15
  ) {

    direccion =
      "MATCH " +
      digitoFrecuente;

  } else {

    advertencias.push(
      "Ningún dígito muestra una frecuencia suficientemente destacada."
    );

  }


  const razones = [

    "El dígito más frecuente es " +
    digitoFrecuente +
    ".",

    "Apareció " +
    mayorFrecuencia +
    " veces en los últimos " +
    digitos.length +
    " ticks.",

    "Frecuencia observada: " +
    porcentaje.toFixed(1) +
    "%."

  ];


  const fuerza =
    Math.max(
      0,
      porcentaje - 10
    ) / 3;


  const confianza =
    calcularConfianza(
      fuerza,
      -5
    );


  return crearResultadoBase(
    direccion,
    confianza,
    razones,
    advertencias
  );

}



/*
=========================================================
53. GENERAR RESULTADO SEGÚN LA OPERACIÓN
=========================================================
*/

function generarResultadoTecnico() {

  const indicadores =
    estadoAplicacion
      .indicadoresActuales ||
    calcularIndicadores();


  if (
    !indicadores
  ) {

    return null;

  }


  const operacion =
    obtenerOperacionActual();


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


  return generarResultadoRiseFall(
    indicadores
  );

} 


/*
=========================================================
56. MOSTRAR RESULTADO
=========================================================
*/

function mostrarResultado(
  resultado
) {

  estadoAplicacion
    .ultimoResultado =
      resultado;


  if (
    interfaz.panelSenal
  ) {

    interfaz.panelSenal
      .className =
        "panel-senal";


    if (
      resultado.direccion ===
        "SUBE" ||
      resultado.direccion ===
        "PAR" ||
      resultado.direccion ===
        "MÁS" ||
      resultado.direccion
        .startsWith("MATCH")
    ) {

      interfaz.panelSenal
        .classList.add(
          "sube"
        );

    } else if (
      resultado.direccion ===
        "BAJA" ||
      resultado.direccion ===
        "IMPAR" ||
      resultado.direccion ===
        "MENOS"
    ) {

      interfaz.panelSenal
        .classList.add(
          "baja"
        );

    } else {

      interfaz.panelSenal
        .classList.add(
          "esperar"
        );

    }

  }


  if (
    interfaz.prediccionEstado
  ) {

    interfaz.prediccionEstado
      .textContent =
        resultado.direccion ===
          "ESPERAR"
          ? "Sin ventaja clara"
          : "Predicción preparada";

  }


  if (
    interfaz.prediccionTitulo
  ) {

    interfaz.prediccionTitulo
      .textContent =
        resultado.titulo;

  }


  if (
    interfaz.prediccionDireccion
  ) {

    interfaz.prediccionDireccion
      .textContent =
        resultado.direccion;

  }


  if (
    interfaz.prediccionConfianza
  ) {

    interfaz.prediccionConfianza
      .textContent =
        resultado.confianza +
        "%";

  }


  if (
    interfaz.barraConfianza
  ) {

    interfaz.barraConfianza
      .style.width =
        resultado.confianza +
        "%";

  }


  if (
    interfaz.vigenciaSenal
  ) {

    interfaz.vigenciaSenal
      .textContent =
        "Vigencia estimada: " +
        resultado.vigencia;

  }


  limpiarMotivosResultado();


  resultado.razones.forEach(
    (razon) => {

      agregarMotivoResultado(
        razon
      );

    }
  );


  resultado.advertencias.forEach(
    (advertencia) => {

      agregarMotivoResultado(
        "⚠ " +
        advertencia
      );

    }
  );


  if (
    resultado.razones.length === 0 &&
    resultado.advertencias.length === 0
  ) {

    agregarMotivoResultado(
      "No fue posible identificar una ventaja técnica clara."
    );

  }

}



/*
=========================================================
57. CREAR ELEMENTO DEL HISTORIAL
=========================================================
*/

function crearElementoHistorial(
  resultado
) {

  const articulo =
    document.createElement(
      "article"
    );


  articulo.className =
    "historial-item";


  const titulo =
    document.createElement(
      "strong"
    );


  titulo.textContent =
    resultado.hora +
    " · " +
    resultado.direccion +
    " · " +
    resultado.confianza +
    "%";


  const detalle =
    document.createElement(
      "p"
    );


  detalle.textContent =
    resultado.mercado +
    " · " +
    resultado.operacion +
    " · " +
    resultado.modo;


  articulo.appendChild(
    titulo
  );


  articulo.appendChild(
    detalle
  );


  return articulo;

}



/*
=========================================================
58. ACTUALIZAR HISTORIAL EN PANTALLA
=========================================================
*/

function actualizarHistorialPantalla() {

  if (
    !interfaz.historialAnalisis
  ) {

    return;

  }


  interfaz.historialAnalisis
    .innerHTML = "";


  if (
    estadoAplicacion
      .historial.length === 0
  ) {

    const mensaje =
      document.createElement(
        "p"
      );


    mensaje.className =
      "mensaje-vacio";


    mensaje.textContent =
      "Todavía no se han generado análisis.";


    interfaz.historialAnalisis
      .appendChild(
        mensaje
      );


    return;

  }


  estadoAplicacion
    .historial
    .forEach(
      (resultado) => {

        interfaz.historialAnalisis
          .appendChild(
            crearElementoHistorial(
              resultado
            )
          );

      }
    );

}



/*
=========================================================
59. AGREGAR RESULTADO AL HISTORIAL
=========================================================
*/

function agregarResultadoHistorial(
  resultado
) {

  estadoAplicacion
    .historial.unshift(
      resultado
    );


  if (
    estadoAplicacion
      .historial.length >
    CONFIGURACION
      .maximoHistorial
  ) {

    estadoAplicacion
      .historial =
        estadoAplicacion
          .historial.slice(
            0,
            CONFIGURACION
              .maximoHistorial
          );

  }


  actualizarHistorialPantalla();

}



/*
=========================================================
60. LIMPIAR HISTORIAL
=========================================================
*/

function limpiarHistorial() {

  estadoAplicacion
    .historial = [];


  actualizarHistorialPantalla();


  registrarActividad(
    "Historial de análisis limpiado."
  );

}



/*
=========================================================
61. EJECUTAR ANÁLISIS
=========================================================
*/

function ejecutarAnalisis() {

  const minimo =
    obtenerMinimoTicks();


  if (
    !estadoAplicacion.conectado
  ) {

    registrarActividad(
      "No se puede analizar porque no existe conexión.",
      "advertencia"
    );

    return;

  }


  if (
    estadoAplicacion
      .precios.length <
    minimo
  ) {

    registrarActividad(
      "Todavía faltan datos para ejecutar el análisis.",
      "advertencia"
    );


    actualizarProgresoDatos();


    return;

  }


  registrarActividad(
    "Analizando " +
    estadoAplicacion
      .nombreMercadoActual +
    " con la estrategia " +
    obtenerTextoOperacionActual() +
    "."
  );


  actualizarIndicadores();


  const resultado =
    generarResultadoTecnico();


  if (
    !resultado
  ) {

    registrarActividad(
      "No fue posible generar un resultado técnico.",
      "error"
    );

    return;

  }


  mostrarResultado(
    resultado
  );


  agregarResultadoHistorial(
    resultado
  );


  registrarActividad(
    "Predicción generada: " +
    resultado.direccion +
    " con " +
    resultado.confianza +
    "% de confianza técnica.",
    resultado.direccion ===
      "ESPERAR"
      ? "advertencia"
      : "exito"
  );

}



/*
=========================================================
FIN DE LA PARTE 3 DE 4

NO BORRES ESTA LÍNEA.
LA PARTE 4 DEBE PEGARSE INMEDIATAMENTE DEBAJO.
=========================================================
*/   

/*
=========================================================
TRADING ANALYZER V6
Archivo: app.js

PARTE 4 DE 4
- Eventos de la interfaz
- Eventos de Deriv
- Asistente de voz
- Cuenta regresiva
- Limpieza del registro
- Inicio general de la aplicación
=========================================================
*/


/*
=========================================================
62. TEMPORIZADOR DE VIGENCIA
=========================================================
*/

let temporizadorVigencia = null;



/*
=========================================================
63. OBTENER SEGUNDOS DE VIGENCIA
=========================================================
*/

function obtenerSegundosVigencia(
  resultado = null
) {

  const valor =
    resultado &&
    resultado.vigencia !== undefined
      ? resultado.vigencia
      : obtenerVigenciaEstimada();


  if (
    Number.isFinite(
      Number(valor)
    )
  ) {

    return Math.max(
      1,
      Math.round(
        Number(valor)
      )
    );

  }


  const texto =
    String(
      valor || ""
    );


  const coincidencia =
    texto.match(
      /\d+/
    );


  if (
    coincidencia
  ) {

    return Math.max(
      1,
      Number(
        coincidencia[0]
      )
    );

  }


  if (
    interfaz.selectorModo &&
    interfaz.selectorModo.value ===
      "completo"
  ) {

    return 30;

  }


  return 10;

}



/*
=========================================================
64. DETENER CUENTA REGRESIVA
=========================================================
*/

function detenerCuentaRegresiva() {

  if (
    temporizadorVigencia
  ) {

    clearInterval(
      temporizadorVigencia
    );


    temporizadorVigencia =
      null;

  }

}



/*
=========================================================
65. ACTUALIZAR TEXTO DE VIGENCIA
=========================================================
*/

function actualizarTextoVigencia(
  segundos
) {

  if (
    !interfaz.vigenciaSenal
  ) {

    return;

  }


  if (
    segundos <= 0
  ) {

    interfaz.vigenciaSenal
      .textContent =
        "Señal finalizada";

    return;

  }


  interfaz.vigenciaSenal
    .textContent =
      "Vigencia: " +
      segundos +
      (
        segundos === 1
          ? " segundo"
          : " segundos"
      );

}



/*
=========================================================
66. INICIAR CUENTA REGRESIVA
=========================================================
*/

function iniciarCuentaRegresiva(
  resultado
) {

  detenerCuentaRegresiva();


  if (
    !resultado ||
    resultado.direccion ===
      "ESPERAR"
  ) {

    if (
      interfaz.vigenciaSenal
    ) {

      interfaz.vigenciaSenal
        .textContent =
          "Sin cuenta regresiva";

    }


    return;

  }


  let segundos =
    obtenerSegundosVigencia(
      resultado
    );


  actualizarTextoVigencia(
    segundos
  );


  temporizadorVigencia =
    setInterval(
      () => {

        segundos--;


        actualizarTextoVigencia(
          segundos
        );


        if (
          estadoAplicacion
            .vozActiva &&
          (
            segundos === 5 ||
            segundos === 3 ||
            segundos === 2 ||
            segundos === 1
          )
        ) {

          hablarMensaje(
            "Quedan " +
            segundos +
            (
              segundos === 1
                ? " segundo."
                : " segundos."
            )
          );

        }


        if (
          segundos <= 0
        ) {

          detenerCuentaRegresiva();


          registrarActividad(
            "La vigencia de la señal ha finalizado.",
            "advertencia"
          );


          if (
            estadoAplicacion
              .vozActiva
          ) {

            hablarMensaje(
              "Señal finalizada."
            );

          }


          if (
            interfaz.prediccionEstado
          ) {

            interfaz.prediccionEstado
              .textContent =
                "SEÑAL FINALIZADA";

          }

        }

      },
      1000
    );

}



/*
=========================================================
67. ANUNCIAR RESULTADO POR VOZ
=========================================================
*/

function anunciarResultadoPorVoz(
  resultado
) {

  if (
    !resultado ||
    !estadoAplicacion
      .vozActiva
  ) {

    return;

  }


  if (
    resultado.direccion ===
      "ESPERAR"
  ) {

    hablarMensaje(
      "No existe una ventaja clara. Se recomienda esperar."
    );

    return;

  }


  const segundos =
    obtenerSegundosVigencia(
      resultado
    );


  const texto =
    "Predicción " +
    resultado.direccion +
    ". Confianza técnica " +
    resultado.confianza +
    " por ciento. Quedan " +
    segundos +
    " segundos para utilizar la señal.";


  hablarMensaje(
    texto
  );

}



/*
=========================================================
68. EJECUTAR ANÁLISIS COMPLETO
=========================================================
*/

function ejecutarAnalisisCompleto() {

  if (
    estadoAplicacion
      .vozActiva
  ) {

    hablarMensaje(
      "Analizando mercado."
    );

  }


  ejecutarAnalisis();


  const resultado =
    estadoAplicacion
      .ultimoResultado;


  if (
    !resultado
  ) {

    return;

  }


  anunciarResultadoPorVoz(
    resultado
  );


  iniciarCuentaRegresiva(
    resultado
  );

}



/*
=========================================================
69. LIMPIAR REGISTRO DE ACTIVIDAD
=========================================================
*/

function limpiarRegistroActividad() {

  if (
    !interfaz.registroActividad
  ) {

    return;

  }


  interfaz.registroActividad
    .innerHTML = "";


  registrarActividad(
    "Registro de actividad limpiado."
  );

}



/*
=========================================================
70. MANEJAR CAMBIO DE MERCADO
=========================================================
*/

function manejarCambioMercado() {

  detenerCuentaRegresiva();


  sincronizarSeleccionActual();


  limpiarDatosMercado();


  prepararResultadoInicial();


  registrarActividad(
    "Mercado seleccionado: " +
    estadoAplicacion
      .nombreMercadoActual +
    "."
  );


  if (
    estadoAplicacion
      .vozActiva
  ) {

    hablarMensaje(
      "Mercado cambiado a " +
      estadoAplicacion
        .nombreMercadoActual +
      "."
    );

  }


  if (
    derivAPI.estaConectado()
  ) {

    derivAPI.cambiarSimbolo(
  estadoAplicacion
    .simboloActual
);


    registrarActividad(
      "Solicitando datos del nuevo mercado."
    );

  }

}



/*
=========================================================
71. MANEJAR CAMBIO DE OPERACIÓN
=========================================================
*/

function manejarCambioOperacion() {

  detenerCuentaRegresiva();


  const operacion =
    obtenerTextoOperacionActual();


  estadoAplicacion
    .ultimoResultado =
      null;


  prepararResultadoInicial();


  registrarActividad(
    "Estrategia seleccionada: " +
    operacion +
    "."
  );


  if (
    estadoAplicacion
      .vozActiva
  ) {

    hablarMensaje(
      "Estrategia cambiada a " +
      operacion +
      "."
    );

  }

}



/*
=========================================================
72. MANEJAR CAMBIO DE MODO
=========================================================
*/

function manejarCambioModo() {

  detenerCuentaRegresiva();


  cambiarModoAnalisis();


  estadoAplicacion
    .ultimoResultado =
      null;


  prepararResultadoInicial();


  const modo =
    obtenerTextoModoActual();


  registrarActividad(
    "Modo de análisis seleccionado: " +
    modo +
    "."
  );


  if (
    estadoAplicacion
      .vozActiva
  ) {

    hablarMensaje(
      "Modo cambiado a " +
      modo +
      "."
    );

  }

}



/*
=========================================================
73. PROCESAR ESTADO DE DERIV
=========================================================
*/

function procesarEstadoDeriv(
  datosEstado
) {

  if (
    !datosEstado
  ) {

    return;

  }


  const estado =
    datosEstado.estado ||
    "desconectado";


  const texto =
    datosEstado.texto ||
    estado;


  mostrarEstadoConexion(
    estado,
    texto
  );


  actualizarProgresoDatos();


  if (
    estado ===
      "conectando"
  ) {

    if (
      interfaz.estadoDatos
    ) {

      interfaz.estadoDatos
        .textContent =
          "Conectando...";

    }


    return;

  }


  if (
    estado ===
      "conectado"
  ) {

    registrarActividad(
      "Conexión con Deriv activa.",
      "exito"
    );


    if (
      interfaz.estadoDatos
    ) {

      interfaz.estadoDatos
        .textContent =
          "Esperando precios";

    }


if (
  estadoAplicacion
    .vozActiva
) {

  hablarMensaje(
    "Conectado a " +
    estadoAplicacion
      .nombreMercadoActual +
    "."
  );

}

    
    return;

  }


  if (
    estado ===
      "desconectado"
  ) {

    detenerCuentaRegresiva();


    if (
      interfaz.estadoDatos
    ) {

      interfaz.estadoDatos
        .textContent =
          "Sin conexión";

    }


    registrarActividad(
      "La conexión con Deriv está cerrada.",
      "advertencia"
    );

  }

}



/*
=========================================================
74. PROCESAR ERROR DE DERIV
=========================================================
*/

function procesarErrorDeriv(
  datosError
) {

  const mensaje =
    datosError &&
    datosError.mensaje
      ? datosError.mensaje
      : "Error desconocido de conexión.";


  detenerCuentaRegresiva();


  mostrarEstadoConexion(
    "error",
    "Error"
  );


  registrarActividad(
    mensaje,
    "error"
  );


  if (
    estadoAplicacion
      .vozActiva
  ) {

    hablarMensaje(
      "Se produjo un error de conexión."
    );

  }

}



/*
=========================================================
75. PROCESAR DIAGNÓSTICO DE DERIV
=========================================================
*/

function procesarDiagnosticoDeriv(
  datosDiagnostico
) {

  if (
    !datosDiagnostico
  ) {

    return;

  }


  const mensaje =
    datosDiagnostico.mensaje ||
    "Mensaje de diagnóstico.";


  const tipo =
    datosDiagnostico.tipo ||
    "normal";


  registrarActividad(
    "[Deriv] " +
    mensaje,
    tipo
  );

}



/*
=========================================================
76. CONFIGURAR EVENTOS DE DERIV
=========================================================
*/

function configurarEventosDeriv() {

  derivAPI.al(
    "estado",
    procesarEstadoDeriv
  );


  derivAPI.al(
    "tick",
    procesarTick
  );


  derivAPI.al(
    "error",
    procesarErrorDeriv
  );


  derivAPI.al(
    "diagnostico",
    procesarDiagnosticoDeriv
  );

}



/*
=========================================================
77. CONFIGURAR BOTÓN CONECTAR
=========================================================
*/

function configurarBotonConectar() {

  if (
    !interfaz.botonConectar
  ) {

    return;

  }


  interfaz.botonConectar
    .addEventListener(
      "click",
      conectarConDeriv
    );

}



/*
=========================================================
78. CONFIGURAR BOTÓN DESCONECTAR
=========================================================
*/

function configurarBotonDesconectar() {

  if (
    !interfaz.botonDesconectar
  ) {

    return;

  }


  interfaz.botonDesconectar
    .addEventListener(
      "click",
      () => {

        detenerCuentaRegresiva();


        detenerVoz();


        desconectarDeDeriv();

      }
    );

}



/*
=========================================================
79. CONFIGURAR SELECTOR DE MERCADO
=========================================================
*/

function configurarSelectorMercado() {

  if (
    !interfaz.selectorIndice
  ) {

    return;

  }


  interfaz.selectorIndice
    .addEventListener(
      "change",
      manejarCambioMercado
    );

}



/*
=========================================================
80. CONFIGURAR SELECTOR DE OPERACIÓN
=========================================================
*/

function configurarSelectorOperacion() {

  if (
    !interfaz.selectorOperacion
  ) {

    return;

  }


  interfaz.selectorOperacion
    .addEventListener(
      "change",
      manejarCambioOperacion
    );

}



/*
=========================================================
81. CONFIGURAR SELECTOR DE MODO
=========================================================
*/

function configurarSelectorModo() {

  if (
    !interfaz.selectorModo
  ) {

    return;

  }


  interfaz.selectorModo
    .addEventListener(
      "change",
      manejarCambioModo
    );

}



/*
=========================================================
82. CONFIGURAR BOTÓN ANALIZAR
=========================================================
*/

function configurarBotonAnalizar() {

  if (
    !interfaz.botonAnalizar
  ) {

    return;

  }


  interfaz.botonAnalizar
    .addEventListener(
      "click",
      ejecutarAnalisisCompleto
    );

}



/*
=========================================================
83. CONFIGURAR BOTÓN DE VOZ
=========================================================
*/

function configurarBotonVoz() {

  if (
    !interfaz.botonVoz
  ) {

    return;

  }


  interfaz.botonVoz
    .addEventListener(
      "click",
      alternarVoz
    );

}



/*
=========================================================
84. CONFIGURAR BOTÓN LIMPIAR HISTORIAL
=========================================================
*/

function configurarBotonLimpiarHistorial() {

  if (
    !interfaz.botonLimpiarHistorial
  ) {

    return;

  }


  interfaz.botonLimpiarHistorial
    .addEventListener(
      "click",
      limpiarHistorial
    );

}



/*
=========================================================
85. CONFIGURAR BOTÓN LIMPIAR REGISTRO
=========================================================
*/

function configurarBotonLimpiarRegistro() {

  if (
    !interfaz.botonLimpiarRegistro
  ) {

    return;

  }


  interfaz.botonLimpiarRegistro
    .addEventListener(
      "click",
      limpiarRegistroActividad
    );

}



/*
=========================================================
86. CONFIGURAR TODOS LOS EVENTOS
=========================================================
*/

function configurarEventosInterfaz() {

  configurarBotonConectar();

  configurarBotonDesconectar();

  configurarSelectorMercado();

  configurarSelectorOperacion();

  configurarSelectorModo();

  configurarBotonAnalizar();

  configurarBotonVoz();

  configurarBotonLimpiarHistorial();

  configurarBotonLimpiarRegistro();

}



/*
=========================================================
87. PREPARAR RESULTADO INICIAL
=========================================================
*/

function prepararResultadoInicial() {

  estadoAplicacion
    .ultimoResultado =
      null;


  if (
    interfaz.panelSenal
  ) {

    interfaz.panelSenal
      .className =
        "panel-senal neutral";

  }


  if (
    interfaz.prediccionEstado
  ) {

    interfaz.prediccionEstado
      .textContent =
        "SIN ANALIZAR";

  }


  if (
    interfaz.prediccionTitulo
  ) {

    interfaz.prediccionTitulo
      .textContent =
        "Esperando análisis";

  }


  if (
    interfaz.prediccionDireccion
  ) {

    interfaz.prediccionDireccion
      .textContent =
        "--";

  }


  if (
    interfaz.prediccionConfianza
  ) {

    interfaz.prediccionConfianza
      .textContent =
        "--";

  }


  if (
    interfaz.barraConfianza
  ) {

    interfaz.barraConfianza
      .style.width =
        "0%";

  }


  if (
    interfaz.vigenciaSenal
  ) {

    interfaz.vigenciaSenal
      .textContent =
        "Vigencia estimada: --";

  }


  limpiarMotivosResultado();


  agregarMotivoResultado(
    "Conecta la herramienta para comenzar."
  );

}



/*
=========================================================
88. VERIFICAR ELEMENTOS IMPORTANTES
=========================================================
*/

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


  const elementosFaltantes =
    elementosImportantes.filter(
      (elemento) =>
        !elemento
    );


  if (
    elementosFaltantes.length >
    0
  ) {

    registrarActividad(
      "Faltan elementos importantes en index.html.",
      "error"
    );


    return false;

  }


  return true;

}



/*
=========================================================
89. PREPARAR ESTADO DEL BOTÓN DE VOZ
=========================================================
*/

function prepararBotonVoz() {

  if (
    !interfaz.botonVoz
  ) {

    return;

  }


  interfaz.botonVoz
    .textContent =
      estadoAplicacion
        .vozActiva
        ? "Voz: activada"
        : "Voz: desactivada";


  interfaz.botonVoz
    .setAttribute(
      "aria-pressed",
      estadoAplicacion
        .vozActiva
        ? "true"
        : "false"
    );

}



/*
=========================================================
90. INICIAR APLICACIÓN
=========================================================
*/

function iniciarAplicacion() {

  sincronizarSeleccionActual();


  mostrarEstadoConexion(
    "desconectado",
    "Desconectado"
  );


  limpiarDatosMercado();


  prepararResultadoInicial();


  actualizarHistorialPantalla();


  prepararBotonVoz();


  configurarEventosDeriv();


  configurarEventosInterfaz();


  const estructuraCorrecta =
    verificarElementosImportantes();


  if (
    !estructuraCorrecta
  ) {

    registrarActividad(
      "La aplicación no pudo iniciar completamente.",
      "error"
    );


    return;

  }


  registrarActividad(
    "Trading Analyzer V6 cargado correctamente.",
    "exito"
  );


  registrarActividad(
    "Mercado, estrategia e indicadores preparados."
  );


  registrarActividad(
    "Selecciona el mercado y presiona Conectar con Deriv."
  );

}



/*
=========================================================
91. DETENER PROCESOS AL CERRAR LA PÁGINA
=========================================================
*/

window.addEventListener(
  "beforeunload",
  () => {

    detenerCuentaRegresiva();


    detenerVoz();


    derivAPI.desconectar();

  }
);



/*
=========================================================
92. INICIO SEGURO DEL DOCUMENTO
=========================================================
*/

if (
  document.readyState ===
    "loading"
) {

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

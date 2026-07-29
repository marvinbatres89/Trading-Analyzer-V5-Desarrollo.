/*
=========================================================
TRADING ANALYZER V5
Archivo: app.js

PARTE 1 DE 4
- Importación de Deriv API
- Elementos de la interfaz
- Estado general
- Funciones básicas
- Preparación de la conexión
=========================================================
*/


import { derivAPI } from "./deriv-api.js";


/*
=========================================================
1. FUNCIÓN PARA BUSCAR ELEMENTOS DEL HTML
=========================================================
*/

function obtenerElemento(id) {

  const elemento =
    document.getElementById(id);


  if (!elemento) {

    console.warn(
      "No se encontró el elemento:",
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


  botonAnalizar:
    obtenerElemento(
      "botonAnalizar"
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


  botonVoz:
    obtenerElemento(
      "botonVoz"
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
    )

};



/*
=========================================================
3. ESTADO GENERAL DE LA APLICACIÓN
=========================================================
*/

const estadoAplicacion = {

  conectado: false,

  conectando: false,

  simboloActual: "",

  nombreMercadoActual: "",

  precios: [],

  ticksRecibidos: 0,

  precioAnterior: null,

  ultimoPrecio: null,

  ultimoEpoch: null,

  ultimoPipSize: null,

  ultimoResultado: null,

  indicadoresActuales: null,

   historial: [],

  vozActiva: true,

  analisisAutomaticoActivo: true,

  alertaActiva: false,

  ultimaDireccionAlertada: "",

  ultimaAlertaTiempo: 0,

ultimoAnalisisAutomaticoTiempo: 0,

temporizadorCuentaRegresiva: null
 

};



/*
=========================================================
4. CONFIGURACIÓN GENERAL
=========================================================
*/

const CONFIGURACION = {

  maximoPreciosGuardados: 200,

  minimoTicksRapido: 12,

  minimoTicksCompleto: 30,

  maximoHistorial: 10,

  idiomaVoz: "es-SV",

  velocidadVoz: 0.95,

  confianzaMinimaAlerta: 70,

tiempoEntreAlertas: 15000,

intervaloAnalisisAutomatico: 3000,

duracionCuentaRegresiva: 10

}; 




/*
=========================================================
5. NOMBRES DE LOS MERCADOS
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
6. OBTENER NOMBRE DEL MERCADO
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
7. FORMATEAR LA HORA
=========================================================
*/

function obtenerHora(
  epoch = null
) {

  let fecha;


  if (
    Number.isFinite(epoch)
  ) {

    fecha =
      new Date(epoch * 1000);

  } else {

    fecha =
      new Date();

  }


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
8. REGISTRO DE ACTIVIDAD
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

    linea.classList.add(tipo);

  }


  interfaz.registroActividad.prepend(
    linea
  );


  while (
    interfaz.registroActividad
      .children.length >
    45
  ) {

    interfaz.registroActividad
      .lastElementChild
      .remove();

  }

}



/*
=========================================================
9. OBTENER EL MÍNIMO DE TICKS
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
10. CAMBIAR ESTADO VISUAL DE CONEXIÓN
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
11. ACTUALIZAR NOMBRE DEL MERCADO
=========================================================
*/

function actualizarNombreMercado() {

  if (
    !interfaz.selectorIndice
  ) {

    return;

  }


  const simbolo =
    interfaz.selectorIndice.value;


  const nombre =
    obtenerNombreMercado(
      simbolo
    );


  estadoAplicacion.simboloActual =
    simbolo;


  estadoAplicacion
    .nombreMercadoActual =
      nombre;


  if (
    interfaz.nombreIndice
  ) {

    interfaz.nombreIndice
      .textContent =
        nombre;

  }

}



/*
=========================================================
12. ACTUALIZAR PROGRESO DE DATOS
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
    Math.min(
      100,

      (
        cantidad /
        minimo
      ) * 100
    );


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
          "Preparando análisis";

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
        "Analizar ahora";

  }

}



/*
=========================================================
13. LIMPIAR DATOS DEL MERCADO
=========================================================
*/

function limpiarDatosMercado() {

  estadoAplicacion.precios = [];

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
    .indicadoresActuales = null;


  if (
    interfaz.precioActual
  ) {

    interfaz.precioActual
      .textContent = "--";


    interfaz.precioActual
      .className =
        "precio-actual";

  }


  if (
    interfaz.contadorTicks
  ) {

    interfaz.contadorTicks
      .textContent = "0";

  }


  if (
    interfaz.ultimoDigito
  ) {

    interfaz.ultimoDigito
      .textContent = "--";

  }


  if (
    interfaz.horaActualizacion
  ) {

    interfaz.horaActualizacion
      .textContent = "--";

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
      .textContent = "--";

  }


  if (
    interfaz.rsi
  ) {

    interfaz.rsi
      .textContent = "--";

  }


  if (
    interfaz.momentum
  ) {

    interfaz.momentum
      .textContent = "--";

  }


  if (
    interfaz.volatilidad
  ) {

    interfaz.volatilidad
      .textContent = "--";

  }


  if (
    interfaz.detalleTendencia
  ) {

    interfaz.detalleTendencia
      .textContent =
        "Esperando datos";

  }


  if (
    interfaz.detalleRsi
  ) {

    interfaz.detalleRsi
      .textContent =
        "Esperando datos";

  }


  if (
    interfaz.detalleMomentum
  ) {

    interfaz.detalleMomentum
      .textContent =
        "Esperando datos";

  }


  if (
    interfaz.detalleVolatilidad
  ) {

    interfaz.detalleVolatilidad
      .textContent =
        "Esperando datos";

  }


  actualizarProgresoDatos();

}



/*
=========================================================
14. CONECTAR CON DERIV
=========================================================
*/

function conectarConDeriv() {

  actualizarNombreMercado();


  const simbolo =
    estadoAplicacion
      .simboloActual;


  registrarActividad(
    "Solicitando conexión para " +
    obtenerNombreMercado(
      simbolo
    ) +
    "."
  );


  derivAPI.conectar(
    simbolo
  );

}



/*
=========================================================
15. DESCONECTAR DE DERIV
=========================================================
*/

function desconectarDeDeriv() {

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
TRADING ANALYZER V5
Archivo: app.js

PARTE 2 DE 4
- Recepción de precios
- Actualización del mercado en vivo
- Cálculo de indicadores
- Preparación rápida del análisis
=========================================================
*/


/*
=========================================================
16. CALCULAR PROMEDIO
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
17. CALCULAR DESVIACIÓN ESTÁNDAR
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


  const diferenciasCuadradas =
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
      diferenciasCuadradas
    );


  return Math.sqrt(
    varianza
  );

}



/*
=========================================================
18. CALCULAR RSI
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

      ganancias += diferencia;

    } else {

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
19. CALCULAR TENDENCIA
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
        0
    };

  }


  const cantidadVentana =
    Math.min(
      30,
      precios.length
    );


  const ventana =
    precios.slice(
      -cantidadVentana
    );


  const mitad =
    Math.floor(
      ventana.length / 2
    );


  const primeraMitad =
    ventana.slice(
      0,
      mitad
    );


  const segundaMitad =
    ventana.slice(
      mitad
    );


  const promedioAnterior =
    calcularPromedio(
      primeraMitad
    );


  const promedioReciente =
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
        0
    };

  }


  const cambio =
    (
      (
        promedioReciente -
        promedioAnterior
      ) /
      promedioAnterior
    ) * 100;


  let direccion =
    "Lateral";


  if (
    cambio > 0.001
  ) {

    direccion =
      "Alcista";

  }


  if (
    cambio < -0.001
  ) {

    direccion =
      "Bajista";

  }


  return {
    direccion,
    cambio
  };

}



/*
=========================================================
20. CALCULAR MOMENTUM
=========================================================
*/

function calcularMomentum(
  precios
) {

  if (
    !Array.isArray(precios) ||
    precios.length < 3
  ) {

    return {
      direccion:
        "Sin datos",

      valor:
        0
    };

  }


  const distancia =
    Math.min(
      8,
      precios.length - 1
    );


  const precioActual =
    precios[
      precios.length - 1
    ];


  const precioAnterior =
    precios[
      precios.length -
      distancia -
      1
    ];


  const valor =
    precioActual -
    precioAnterior;


  let direccion =
    "Neutral";


  if (
    valor > 0
  ) {

    direccion =
      "Positivo";

  }


  if (
    valor < 0
  ) {

    direccion =
      "Negativo";

  }


  return {
    direccion,
    valor
  };

}



/*
=========================================================
21. CALCULAR VOLATILIDAD
=========================================================
*/

function calcularVolatilidad(
  precios
) {

  if (
    !Array.isArray(precios) ||
    precios.length < 5
  ) {

    return {
      nivel:
        "Sin datos",

      porcentaje:
        0
    };

  }


  const ventana =
    precios.slice(
      -Math.min(
        30,
        precios.length
      )
    );


  const promedio =
    calcularPromedio(
      ventana
    );


  const desviacion =
    calcularDesviacion(
      ventana
    );


  if (
    promedio === 0
  ) {

    return {
      nivel:
        "Baja",

      porcentaje:
        0
    };

  }


  const porcentaje =
    (
      desviacion /
      promedio
    ) * 100;


  let nivel =
    "Baja";


  if (
    porcentaje >
    0.08
  ) {

    nivel =
      "Alta";

  } else if (
    porcentaje >
    0.025
  ) {

    nivel =
      "Media";

  }


  return {
    nivel,
    porcentaje
  };

}



/*
=========================================================
22. CALCULAR TODOS LOS INDICADORES
=========================================================
*/

function calcularIndicadores() {

  const precios =
    estadoAplicacion
      .precios;


  if (
    precios.length < 5
  ) {

    return null;

  }


  const tendencia =
    calcularTendencia(
      precios
    );


  const rsi =
    calcularRSI(
      precios
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
23. MOSTRAR TENDENCIA
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
        tendencia.cambio
          .toFixed(4) +
        "%";

  }

}



/*
=========================================================
24. MOSTRAR RSI
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
        rsi === null
          ? "--"
          : rsi.toFixed(1);

  }


  if (
    !interfaz.detalleRsi
  ) {

    return;

  }


  if (
    rsi === null
  ) {

    interfaz.detalleRsi
      .textContent =
        "Requiere 15 ticks";

    return;

  }


  if (
    rsi > 70
  ) {

    interfaz.detalleRsi
      .textContent =
        "Zona alta";

    return;

  }


  if (
    rsi < 30
  ) {

    interfaz.detalleRsi
      .textContent =
        "Zona baja";

    return;

  }


  interfaz.detalleRsi
    .textContent =
      "Zona neutral";

}



/*
=========================================================
25. MOSTRAR MOMENTUM
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
          .toFixed(5);

  }

}



/*
=========================================================
26. MOSTRAR VOLATILIDAD
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
          .toFixed(3) +
        "%";

  }


  if (
    interfaz.detalleVolatilidad
  ) {

    interfaz.detalleVolatilidad
      .textContent =
        volatilidad.nivel;

  }

}



/*
=========================================================
27. ACTUALIZAR INDICADORES
=========================================================
*/

function actualizarIndicadores() {

  const indicadores =
    calcularIndicadores();


  if (
    !indicadores
  ) {

    return;

  }


  estadoAplicacion
    .indicadoresActuales =
      indicadores;


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
28. FORMATEAR PRECIO
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


  if (
    Number.isFinite(pipSize) &&
    pipSize >= 0 &&
    pipSize <= 8
  ) {

    return precio.toFixed(
      pipSize
    );

  }


  return String(precio);

}



/*
=========================================================
29. OBTENER ÚLTIMO DÍGITO
=========================================================
*/

function obtenerUltimoDigito(
  precioFormateado
) {

  const digitos =
    String(
      precioFormateado
    ).replace(
      /\D/g,
      ""
    );


  if (
    digitos.length === 0
  ) {

    return "--";

  }


  return digitos[
    digitos.length - 1
  ];

}



/*
=========================================================
30. MOSTRAR MOVIMIENTO DEL PRECIO
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
    .className =
      "precio-actual";


  if (
    estadoAplicacion
      .precioAnterior === null
  ) {

    return;

  }


  if (
    precio >
    estadoAplicacion
      .precioAnterior
  ) {

    interfaz.precioActual
      .classList.add(
        "sube"
      );

  }


  if (
    precio <
    estadoAplicacion
      .precioAnterior
  ) {

    interfaz.precioActual
      .classList.add(
        "baja"
      );

  }

}



/*
=========================================================
31. GUARDAR NUEVO PRECIO
=========================================================
*/

function guardarPrecio(
  precio
) {

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
32. PROCESAR TICK RECIBIDO
=========================================================
*/

function procesarTick(
  datosTick
) {

  if (
    !datosTick ||
    !Number.isFinite(
      datosTick.precio
    )
  ) {

    registrarActividad(
      "Se recibió un precio inválido.",
      "advertencia"
    );

    return;

  }


  const precio =
    datosTick.precio;


  const precioFormateado =
    formatearPrecio(
      precio,
      datosTick.pipSize
    );


  estadoAplicacion
    .ticksRecibidos++;


  guardarPrecio(
    precio
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
        obtenerUltimoDigito(
          precioFormateado
        );

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
      datosTick.epoch;


  estadoAplicacion
    .ultimoPipSize =
      datosTick.pipSize;


    actualizarIndicadores();


  actualizarProgresoDatos();


  ejecutarAnalisisAutomatico();


}



/*
=========================================================
33. CAMBIAR DE MERCADO
=========================================================
*/

function cambiarMercado() {

  actualizarNombreMercado();


  limpiarDatosMercado();


  registrarActividad(
    "Mercado seleccionado: " +
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

}



/*
=========================================================
34. CAMBIAR MODO DE ANÁLISIS
=========================================================
*/

function cambiarModoAnalisis() {

  actualizarProgresoDatos();


  const modo =
    interfaz.selectorModo
      ? interfaz.selectorModo
          .options[
            interfaz.selectorModo
              .selectedIndex
          ].text
      : "Modo desconocido";


  registrarActividad(
    "Modo seleccionado: " +
    modo +
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
TRADING ANALYZER V5
Archivo: app.js

PARTE 3 DE 4
- Motor de análisis
- Cálculo de confianza
- Señal SUBE, BAJA o ESPERAR
- Razones técnicas
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
36. OBTENER TEXTO DE LA OPERACIÓN ACTUAL
=========================================================
*/

function obtenerTextoOperacionActual() {

  if (
    !interfaz.selectorOperacion
  ) {

    return "Operación desconocida";

  }


  const opcionSeleccionada =
    interfaz.selectorOperacion.options[
      interfaz.selectorOperacion.selectedIndex
    ];


  return opcionSeleccionada
    ? opcionSeleccionada.text
    : "Operación desconocida";

}



/*
=========================================================
37. OBTENER VIGENCIA ESTIMADA
=========================================================
*/

function obtenerVigenciaEstimada() {

  if (
    interfaz.selectorModo &&
    interfaz.selectorModo.value ===
      "completo"
  ) {

    return "aproximadamente 30 segundos";

  }


  return "aproximadamente 10 segundos";

}



/*
=========================================================
38. LIMITAR UN NÚMERO
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
39. EVALUAR TENDENCIA
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
40. EVALUAR MOMENTUM
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
41. EVALUAR RSI
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
      "El RSI acompaña el impulso alcista."
    );

  } else if (
    rsi <= 45 &&
    rsi >= 28
  ) {

    resultado.puntaje -= 1;


    resultado.razones.push(
      "El RSI acompaña el impulso bajista."
    );

  } else if (
    rsi > 72
  ) {

    resultado.advertencias.push(
      "El RSI está en una zona alta y podría existir agotamiento."
    );

  } else if (
    rsi < 28
  ) {

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
42. EVALUAR VOLATILIDAD
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
      "La volatilidad es alta y reduce la estabilidad de la señal."
    );

  }


  return resultado;

}



/*
=========================================================
43. COMBINAR RESULTADOS DE EVALUACIÓN
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
44. DETERMINAR DIRECCIÓN
=========================================================
*/

function determinarDireccion(
  puntaje
) {

  if (
    puntaje >= 3
  ) {

    return "SUBE";

  }


  if (
    puntaje <= -3
  ) {

    return "BAJA";

  }


  return "ESPERAR";

}



/*
=========================================================
45. CALCULAR CONFIANZA
=========================================================
*/

function calcularConfianza(
  direccion,
  puntaje,
  ajusteConfianza
) {

  let confianza;


  if (
    direccion ===
      "ESPERAR"
  ) {

    confianza =
      43 +
      Math.abs(
        puntaje
      ) * 5;

  } else {

    confianza =
      58 +
      Math.abs(
        puntaje
      ) * 8;

  }


  confianza +=
    ajusteConfianza;


  if (
    interfaz.selectorModo &&
    interfaz.selectorModo.value ===
      "rapido"
  ) {

    confianza -= 5;

  }


  return Math.round(
    limitarNumero(
      confianza,
      35,
      92
    )
  );

}



/*
=========================================================
46. CREAR TÍTULO DEL RESULTADO
=========================================================
*/

function crearTituloResultado(
  direccion
) {

  if (
    direccion === "SUBE"
  ) {

    return "Probabilidad de subida";

  }


  if (
    direccion === "BAJA"
  ) {

    return "Probabilidad de bajada";

  }


  return "Sin ventaja técnica clara";

}



/*
=========================================================
47. VALIDAR TIPO DE OPERACIÓN
=========================================================
*/

function validarTipoOperacion(
  resultado
) {

  if (
    !interfaz.selectorOperacion
  ) {

    return resultado;

  }


  const tipoOperacion =
    interfaz.selectorOperacion.value;


  if (
    tipoOperacion ===
      "rise_fall"
  ) {

    return resultado;

  }


  resultado.direccion =
    "ESPERAR";


  resultado.titulo =
    "Análisis todavía no disponible";


  resultado.confianza =
    Math.min(
      resultado.confianza,
      55
    );


  resultado.advertencias.push(
    "La primera versión del motor está optimizada para Rise/Fall."
  );


  resultado.advertencias.push(
    "Par/Impar y Más/Menos se activarán en una etapa posterior."
  );


  return resultado;

}



/*
=========================================================
48. GENERAR RESULTADO TÉCNICO
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


  const evaluacionTendencia =
    evaluarTendencia(
      indicadores.tendencia
    );


  const evaluacionMomentum =
    evaluarMomentum(
      indicadores.momentum
    );


  const evaluacionRSI =
    evaluarRSI(
      indicadores.rsi
    );


  const evaluacionVolatilidad =
    evaluarVolatilidad(
      indicadores.volatilidad
    );


  const combinacion =
    combinarEvaluaciones(
      [
        evaluacionTendencia,
        evaluacionMomentum,
        evaluacionRSI,
        evaluacionVolatilidad
      ]
    );


  const direccion =
    determinarDireccion(
      combinacion.puntaje
    );


  const confianza =
    calcularConfianza(
      direccion,
      combinacion.puntaje,
      combinacion.ajusteConfianza
    );


  let resultado = {

    direccion,

    confianza,

    titulo:
      crearTituloResultado(
        direccion
      ),

    razones:
      combinacion.razones,

    advertencias:
      combinacion.advertencias,

    puntaje:
      combinacion.puntaje,

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


  resultado =
    validarTipoOperacion(
      resultado
    );


  return resultado;

}



/*
=========================================================
49. LIMPIAR LISTA DE MOTIVOS
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
50. AGREGAR MOTIVO AL RESULTADO
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
51. MOSTRAR CLASE VISUAL DEL RESULTADO
=========================================================
*/

function mostrarClaseResultado(
  direccion
) {

  if (
    !interfaz.panelSenal
  ) {

    return;

  }


  interfaz.panelSenal
    .className =
      "panel-senal";


  if (
    direccion === "SUBE"
  ) {

    interfaz.panelSenal
      .classList.add(
        "sube"
      );

    return;

  }


  if (
    direccion === "BAJA"
  ) {

    interfaz.panelSenal
      .classList.add(
        "baja"
      );

    return;

  }


  interfaz.panelSenal
    .classList.add(
      "esperar"
    );

}



/*
=========================================================
52. MOSTRAR RESULTADO EN PANTALLA
=========================================================
*/

function mostrarResultado(
  resultado
) {

  if (
    !resultado
  ) {

    return;

  }


  estadoAplicacion
    .ultimoResultado =
      resultado;


  mostrarClaseResultado(
    resultado.direccion
  );


  if (
    interfaz.prediccionEstado
  ) {

    interfaz.prediccionEstado
      .textContent =
        resultado.direccion ===
          "ESPERAR"
          ? "NO OPERAR"
          : "SEÑAL TÉCNICA";

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
        "✔ " + razon
      );

    }
  );


  resultado.advertencias.forEach(
    (advertencia) => {

      agregarMotivoResultado(
        "⚠ " + advertencia
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
53. CREAR ELEMENTO DEL HISTORIAL
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
54. ACTUALIZAR HISTORIAL EN PANTALLA
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
55. AGREGAR RESULTADO AL HISTORIAL
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
56. LIMPIAR HISTORIAL
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
57. EJECUTAR ANÁLISIS
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
    "Análisis generado: " +
    resultado.direccion +
    " con " +
    resultado.confianza +
    "% de confianza técnica.",
    "exito"
  );

}

/*
=========================================================
57A. EJECUTAR ANÁLISIS AUTOMÁTICO
=========================================================
*/

function ejecutarAnalisisAutomatico() {

  if (
    !estadoAplicacion
      .analisisAutomaticoActivo ||
    estadoAplicacion
      .alertaActiva
  ) {

    return;

  }


  if (
    !estadoAplicacion.conectado
  ) {

    return;

  }


  const minimo =
    obtenerMinimoTicks();


  if (
    estadoAplicacion
      .precios.length <
    minimo
  ) {

    return;

  }


  const tiempoActual =
    Date.now();


  const tiempoDesdeUltimoAnalisis =
    tiempoActual -
    estadoAplicacion
      .ultimoAnalisisAutomaticoTiempo;


  if (
    tiempoDesdeUltimoAnalisis <
    CONFIGURACION
      .intervaloAnalisisAutomatico
  ) {

    return;

  }


  estadoAplicacion
    .ultimoAnalisisAutomaticoTiempo =
      tiempoActual;


  actualizarIndicadores();


  const resultado =
    generarResultadoTecnico();


  if (
    !resultado ||
    resultado.direccion ===
      "ESPERAR" ||
    resultado.confianza <
      CONFIGURACION
        .confianzaMinimaAlerta
  ) {

    return;

  }


  const tiempoDesdeUltimaAlerta =
    tiempoActual -
    estadoAplicacion
      .ultimaAlertaTiempo;


  if (
    resultado.direccion ===
      estadoAplicacion
        .ultimaDireccionAlertada &&
    tiempoDesdeUltimaAlerta <
      CONFIGURACION
        .tiempoEntreAlertas
  ) {

    return;

  }


  estadoAplicacion
    .ultimaDireccionAlertada =
      resultado.direccion;


  estadoAplicacion
    .ultimaAlertaTiempo =
      tiempoActual;


  mostrarResultado(
    resultado
  );


  agregarResultadoHistorial(
    resultado
  );


  registrarActividad(
    "Señal automática detectada: " +
    resultado.direccion +
    " con " +
    resultado.confianza +
    "% de confianza técnica.",
    "exito"
);
  iniciarAlertaAutomatica(resultado);

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
TRADING ANALYZER V5
Archivo: app.js

PARTE 4 DE 4
- Eventos de la interfaz
- Eventos de Deriv
- Lectura por voz
- Limpieza del registro
- Inicio general de la aplicación
=========================================================
*/


/*
=========================================================
58. LEER RESULTADO POR VOZ
=========================================================
*/

function leerResultadoPorVoz() {

  const resultado =
    estadoAplicacion
      .ultimoResultado;


  if (
    !resultado
  ) {

    registrarActividad(
      "Todavía no existe un resultado para leer.",
      "advertencia"
    );

    return;

  }


  if (
    !(
      "speechSynthesis" in window
    )
  ) {

    registrarActividad(
      "Este navegador no permite lectura por voz.",
      "advertencia"
    );

    return;

  }


  window.speechSynthesis.cancel();


  const texto =
    resultado.titulo +
    ". Dirección probable: " +
    resultado.direccion +
    ". Confianza técnica: " +
    resultado.confianza +
    " por ciento. " +
    "Vigencia estimada: " +
    resultado.vigencia +
    ".";


  const mensaje =
    new SpeechSynthesisUtterance(
      texto
    );


  mensaje.lang =
    CONFIGURACION.idiomaVoz;


  mensaje.rate =
    CONFIGURACION.velocidadVoz;


  mensaje.pitch = 1;


  mensaje.volume = 1;


  window.speechSynthesis.speak(
    mensaje
  );


  registrarActividad(
    "Leyendo el resultado por voz."
  )/*
=========================================================
57B. HABLAR MENSAJE AUTOMÁTICO
=========================================================
*/

function hablarMensajeAutomatico(
  texto
) {

  if (
    !estadoAplicacion.vozActiva ||
    !(
      "speechSynthesis" in window
    )
  ) {

    return;

  }


  const mensaje =
    new SpeechSynthesisUtterance(
      texto
    );


  mensaje.lang =
    CONFIGURACION.idiomaVoz;


  mensaje.rate =
    CONFIGURACION.velocidadVoz;


  mensaje.pitch = 1;

  mensaje.volume = 1;


  window.speechSynthesis.speak(
    mensaje
  );

}



/*
=========================================================
57C. INICIAR ALERTA AUTOMÁTICA
=========================================================
*/

function iniciarAlertaAutomatica(
  resultado
) {

  if (
    !resultado ||
    estadoAplicacion.alertaActiva
  ) {

    return;

  }


  estadoAplicacion.alertaActiva =
    true;


  let segundosRestantes =
    CONFIGURACION
      .duracionCuentaRegresiva;


  const direccionVoz =
    resultado.direccion === "SUBE"
      ? "subida"
      : "bajada";


  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis.cancel();

  }


  hablarMensajeAutomatico(
    "Atención. Señal de " +
    direccionVoz +
    " detectada. Tienes diez segundos para realizar la operación."
  );


  if (
    interfaz.vigenciaSenal
  ) {

    interfaz.vigenciaSenal
      .textContent =
        "Tiempo para entrar: " +
        segundosRestantes +
        " segundos";

  }


  clearInterval(
    estadoAplicacion
      .temporizadorCuentaRegresiva
  );


  estadoAplicacion
    .temporizadorCuentaRegresiva =
      setInterval(
        () => {

          segundosRestantes--;


          if (
            interfaz.vigenciaSenal
          ) {

            interfaz.vigenciaSenal
              .textContent =
                segundosRestantes > 0
                  ? "Tiempo para entrar: " +
                    segundosRestantes +
                    " segundos"
                  : "Tiempo de entrada terminado";

          }


          if (
            segundosRestantes > 0
          ) {

            hablarMensajeAutomatico(
              String(
                segundosRestantes
              )
            );

            return;

          }


          clearInterval(
            estadoAplicacion
              .temporizadorCuentaRegresiva
          );


          estadoAplicacion
            .temporizadorCuentaRegresiva =
              null;


          estadoAplicacion.alertaActiva =
            false;


          hablarMensajeAutomatico(
            "Cero. Tiempo terminado."
          );


          registrarActividad(
            "La ventana de entrada automática terminó."
          );

        },
        1000
      );

};

}



/*
=========================================================
59. LIMPIAR REGISTRO DE ACTIVIDAD
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
60. CAMBIAR TIPO DE OPERACIÓN
=========================================================
*/

function cambiarTipoOperacion() {

  const operacion =
    obtenerTextoOperacionActual();


  registrarActividad(
    "Tipo de operación seleccionado: " +
    operacion +
    "."
  );


  if (
    interfaz.selectorOperacion &&
    interfaz.selectorOperacion.value !==
      "rise_fall"
  ) {

    registrarActividad(
      "El motor inicial de la V5 está optimizado para Rise/Fall.",
      "advertencia"
    );

  }

}



/*
=========================================================
61. PROCESAR ESTADO DE DERIV
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
      "conectado"
  ) {

    registrarActividad(
      "Conexión con Deriv activa.",
      "exito"
    );

  }


  if (
    estado ===
      "desconectado"
  ) {

    if (
      interfaz.estadoDatos
    ) {

      interfaz.estadoDatos
        .textContent =
          "Sin conexión";

    }

  }

}



/*
=========================================================
62. PROCESAR ERROR DE DERIV
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


  mostrarEstadoConexion(
    "error",
    "Error"
  );


  registrarActividad(
    mensaje,
    "error"
  );

}



/*
=========================================================
63. PROCESAR DIAGNÓSTICO DE DERIV
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
64. CONFIGURAR BOTÓN CONECTAR
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
65. CONFIGURAR BOTÓN DESCONECTAR
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
      desconectarDeDeriv
    );

}



/*
=========================================================
66. CONFIGURAR SELECTOR DE MERCADO
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
      cambiarMercado
    );

}



/*
=========================================================
67. CONFIGURAR SELECTOR DE OPERACIÓN
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
      cambiarTipoOperacion
    );

}



/*
=========================================================
68. CONFIGURAR SELECTOR DE MODO
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
      cambiarModoAnalisis
    );

}



/*
=========================================================
69. CONFIGURAR BOTÓN ANALIZAR
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
      ejecutarAnalisis
    );

}



/*
=========================================================
70. CONFIGURAR BOTÓN DE VOZ
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
      leerResultadoPorVoz
    );

}



/*
=========================================================
71. CONFIGURAR BOTÓN LIMPIAR HISTORIAL
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
72. CONFIGURAR BOTÓN LIMPIAR REGISTRO
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
73. CONFIGURAR EVENTOS DE LA INTERFAZ
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
74. CONFIGURAR EVENTOS DE DERIV
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
75. PREPARAR RESULTADO INICIAL
=========================================================
*/

function prepararResultadoInicial() {

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
76. VERIFICAR ELEMENTOS IMPORTANTES
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
77. INICIAR APLICACIÓN
=========================================================
*/

function iniciarAplicacion() {

  actualizarNombreMercado();


  mostrarEstadoConexion(
    "desconectado",
    "Desconectado"
  );


  limpiarDatosMercado();


  prepararResultadoInicial();


  actualizarHistorialPantalla();


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
    "Trading Analyzer V5 cargado correctamente.",
    "exito"
  );


  registrarActividad(
    "La conexión con Deriv está separada del motor de análisis."
  );


  registrarActividad(
    "Selecciona el mercado y presiona Conectar con Deriv."
  );

}



/*
=========================================================
78. INICIO SEGURO DEL DOCUMENTO
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
TRADING ANALYZER V5
=========================================================
*/

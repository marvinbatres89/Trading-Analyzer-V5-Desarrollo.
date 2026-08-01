import { derivAPI } from "./deriv-api.js";

const $ = (id, required = true) => {
  const element = document.getElementById(id);
  if (!element && required) console.warn("Elemento no encontrado:", id);
  return element;
};

const ui = {
  estadoConexion: $("estadoConexion"),
  textoEstado: $("textoEstado"),
  estadoMotor: $("estadoMotor"),
  estadoMemoria: $("estadoMemoria"),
  botonConectar: $("botonConectar"),
  botonDesconectar: $("botonDesconectar"),
  botonEncender: $("botonEncender"),
  botonAnalizar: $("botonAnalizar"),
  botonVoz: $("botonVoz"),
  mensajeControl: $("mensajeControl"),

  abrirSelectorMercado: $("abrirSelectorMercado"),
  cerrarSelectorMercado: $("cerrarSelectorMercado"),
  dialogoMercados: $("dialogoMercados"),
  listaMercados: $("listaMercados"),
  mercadoSeleccionado: $("mercadoSeleccionado"),
  simboloSeleccionado: $("simboloSeleccionado"),
  selectorOperacion: $("selectorOperacion"),
  selectorModo: $("selectorModo"),

  nombreIndice: $("nombreIndice"),
  estadoDatos: $("estadoDatos"),
  precioActual: $("precioActual"),
  contadorTicks: $("contadorTicks"),
  ultimoDigito: $("ultimoDigito"),
  horaActualizacion: $("horaActualizacion"),
  ultimosDigitos: $("ultimosDigitos"),
  conteoReciente: $("conteoReciente"),
  textoProgreso: $("textoProgreso"),
  numeroProgreso: $("numeroProgreso"),
  barraDatos: $("barraDatos"),

  tendencia: $("tendencia"),
  detalleTendencia: $("detalleTendencia"),
  rsi: $("rsi"),
  detalleRsi: $("detalleRsi"),
  momentum: $("momentum"),
  detalleMomentum: $("detalleMomentum"),
  volatilidad: $("volatilidad"),
  detalleVolatilidad: $("detalleVolatilidad"),

  panelSenal: $("panelSenal"),
  prediccionEstado: $("prediccionEstado"),
  prediccionTitulo: $("prediccionTitulo"),
  prediccionDireccion: $("prediccionDireccion"),
  prediccionConfianza: $("prediccionConfianza"),
  precisionObservada: $("precisionObservada"),
  barraConfianza: $("barraConfianza"),
  prediccionMotivos: $("prediccionMotivos"),
  vigenciaSenal: $("vigenciaSenal"),
  cuentaRegresiva: $("cuentaRegresiva"),

  statsIntentos: $("statsIntentos"),
  statsAciertos: $("statsAciertos"),
  statsPrecision: $("statsPrecision"),
  botonReiniciarEstadisticas: $("botonReiniciarEstadisticas"),

  selectorVoz: $("selectorVoz"),
  velocidadVoz: $("velocidadVoz"),
  tonoVoz: $("tonoVoz"),
  volumenVoz: $("volumenVoz"),
  valorVelocidad: $("valorVelocidad"),
  valorTono: $("valorTono"),
  valorVolumen: $("valorVolumen"),
  botonProbarVoz: $("botonProbarVoz"),

  botonLimpiarHistorial: $("botonLimpiarHistorial"),
  historialAnalisis: $("historialAnalisis"),
  botonLimpiarRegistro: $("botonLimpiarRegistro"),
  registroActividad: $("registroActividad")
};

const CFG = {
  version: "7.1.0",
  maxTicks: 1000,
  recentWindow: 30,
  voiceRecentWindow: 20,
  riseFallCountdown: 10,
  maxHistory: 12,
  storageKey: "ta_v7_1_validation_stats"
};

const MARKETS = [
  { symbol: "1HZ10V", name: "Volatility 10 (1s) Index", code: "V10 1s" },
  { symbol: "1HZ25V", name: "Volatility 25 (1s) Index", code: "V25 1s" },
  { symbol: "1HZ50V", name: "Volatility 50 (1s) Index", code: "V50 1s" },
  { symbol: "1HZ75V", name: "Volatility 75 (1s) Index", code: "V75 1s" },
  { symbol: "1HZ100V", name: "Volatility 100 (1s) Index", code: "V100 1s" },
  { symbol: "R_10", name: "Volatility 10 Index", code: "V10" },
  { symbol: "R_25", name: "Volatility 25 Index", code: "V25" },
  { symbol: "R_50", name: "Volatility 50 Index", code: "V50" },
  { symbol: "R_75", name: "Volatility 75 Index", code: "V75" },
  { symbol: "R_100", name: "Volatility 100 Index", code: "V100" }
];

const STRATEGY_NAMES = {
  rise_fall: "Rise / Fall",
  even_odd: "Even / Odd",
  over_under: "Over / Under",
  match: "Match"
};

const state = {
  connected: false,
  connecting: false,
  engineOn: false,
  signalActive: false,
  symbol: "1HZ100V",
  market: "Volatility 100 (1s) Index",
  strategy: "rise_fall",
  mode: "fast",

  prices: [],
  digits: [],
  ticks: 0,
  previousPrice: null,
  lastPrice: null,
  lastDigit: null,
  pipSize: 2,

  indicators: null,
  preparedPrediction: null,
  history: [],
  pendingValidation: null,
  stats: loadStats(),

  voiceOn: true,
  voices: [],
  selectedVoice: null,
  voiceSequenceId: 0,
  countdownTimer: null
};

function loadStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CFG.storageKey) || "{}");
    return {
      rise_fall: parsed.rise_fall || { attempts: 0, hits: 0 },
      even_odd: parsed.even_odd || { attempts: 0, hits: 0 },
      over_under: parsed.over_under || { attempts: 0, hits: 0 },
      match: parsed.match || { attempts: 0, hits: 0 }
    };
  } catch {
    return {
      rise_fall: { attempts: 0, hits: 0 },
      even_odd: { attempts: 0, hits: 0 },
      over_under: { attempts: 0, hits: 0 },
      match: { attempts: 0, hits: 0 }
    };
  }
}

function saveStats() {
  localStorage.setItem(CFG.storageKey, JSON.stringify(state.stats));
}

function time(epoch = null) {
  const date = Number.isFinite(epoch) ? new Date(epoch * 1000) : new Date();
  return date.toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function log(message, type = "normal") {
  if (!ui.registroActividad) return;
  const line = document.createElement("p");
  line.textContent = `[${time()}] ${message}`;
  if (type !== "normal") line.classList.add(type);
  ui.registroActividad.prepend(line);
  while (ui.registroActividad.children.length > 60) {
    ui.registroActividad.lastElementChild?.remove();
  }
}

function currentMarket() {
  return MARKETS.find((market) => market.symbol === state.symbol) || MARKETS[4];
}

function setConnection(status, text) {
  ui.estadoConexion.className = `status-pill ${status}`;
  ui.textoEstado.textContent = text;

  state.connected = status === "connected";
  state.connecting = status === "connecting";

  ui.botonConectar.disabled = state.connected || state.connecting;
  ui.botonDesconectar.disabled = !state.connected;
  ui.botonEncender.disabled = !state.connected;

  refreshButtons();
}

function setEngine(on) {
  state.engineOn = on;
  ui.estadoMotor.className = `status-pill ${on ? "engine-on" : "engine-off"}`;
  ui.estadoMotor.querySelector("strong").textContent = on ? "ENCENDIDO" : "APAGADO";
  ui.botonEncender.textContent = on ? "⚡ APAGAR" : "⚡ ENCENDER";
  ui.botonEncender.classList.toggle("on", on);

  if (!on) {
    state.preparedPrediction = null;
    stopSignal();
    resetSignal("El motor está apagado.");
  } else {
    updateEngine();
  }

  refreshButtons();
}

function refreshButtons() {
  ui.botonAnalizar.disabled =
    !(state.connected && state.engineOn) || state.signalActive;

  ui.botonAnalizar.innerHTML = state.signalActive
    ? "<span>⏳</span> SEÑAL ACTIVA"
    : "<span>✦</span> PREDICTION";

  if (!state.connected) {
    ui.mensajeControl.textContent =
      "Conecte primero. El motor se enciende manualmente.";
  } else if (!state.engineOn) {
    ui.mensajeControl.textContent =
      "Conectado. Presione ENCENDER para activar el análisis continuo.";
  } else {
    ui.mensajeControl.textContent =
      "Motor encendido. La predicción se prepara continuamente en segundo plano.";
  }
}

function renderMarketSelector() {
  ui.listaMercados.innerHTML = "";

  MARKETS.forEach((market) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      `market-option${market.symbol === state.symbol ? " active" : ""}`;
    button.innerHTML = `
      <span class="market-code">${market.code}</span>
      <div>
        <b>${market.name}</b>
        <small>${market.symbol}</small>
      </div>
    `;
    button.addEventListener("click", () => {
      selectMarket(market.symbol);
      ui.dialogoMercados.close();
    });
    ui.listaMercados.appendChild(button);
  });
}

function updateMarketLabels() {
  const market = currentMarket();
  state.market = market.name;
  ui.mercadoSeleccionado.textContent = market.name;
  ui.simboloSeleccionado.textContent = market.symbol;
  ui.nombreIndice.textContent = market.name;
  renderMarketSelector();
}

function selectMarket(symbol) {
  if (symbol === state.symbol) return;
  stopSignal();
  state.symbol = symbol;
  updateMarketLabels();
  clearMarketData();

  if (derivAPI.estaConectado()) {
    derivAPI.cambiarSimbolo(state.symbol);
    log(`Mercado cambiado a ${state.market}.`);
  }

  speakSequence([
    "Mercado cambiado.",
    state.market.replace("Volatility", "Volatilidad").replace("Index", "Índice")
  ]);
}

function populateVoices() {
  if (!("speechSynthesis" in window)) return;

  const allVoices = window.speechSynthesis.getVoices();
  state.voices = allVoices.filter((voice) =>
    voice.lang?.toLowerCase().startsWith("es")
  );

  if (!state.voices.length) state.voices = allVoices;

  const previousValue = ui.selectorVoz.value;
  ui.selectorVoz.innerHTML = "";

  state.voices.forEach((voice, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `${voice.name} — ${voice.lang}`;
    ui.selectorVoz.appendChild(option);
  });

  if (previousValue && Number(previousValue) < state.voices.length) {
    ui.selectorVoz.value = previousValue;
  }

  state.selectedVoice =
    state.voices[Number(ui.selectorVoz.value) || 0] || null;
}

function stopVoice() {
  state.voiceSequenceId++;
  window.speechSynthesis?.cancel();
}

function createUtterance(text, { rate = null, onend = null, onerror = null } = {}) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.selectedVoice?.lang || "es-SV";
  if (state.selectedVoice) utterance.voice = state.selectedVoice;
  utterance.rate = rate ?? Number(ui.velocidadVoz.value);
  utterance.pitch = Number(ui.tonoVoz.value);
  utterance.volume = Number(ui.volumenVoz.value);
  if (onend) utterance.onend = onend;
  if (onerror) utterance.onerror = onerror;
  return utterance;
}

function speak(text, { cancel = true, onend = null, rate = null } = {}) {
  if (!state.voiceOn || !("speechSynthesis" in window) || !text) {
    onend?.();
    return;
  }

  if (cancel) stopVoice();

  const utterance = createUtterance(text, {
    rate,
    onend,
    onerror: onend
  });

  window.speechSynthesis.speak(utterance);
}

function speakSequence(parts, { onend = null, pause = 320, rate = null } = {}) {
  if (!state.voiceOn || !("speechSynthesis" in window)) {
    onend?.();
    return;
  }

  stopVoice();
  const sequence = state.voiceSequenceId;
  let index = 0;

  const next = () => {
    if (sequence !== state.voiceSequenceId) return;

    if (index >= parts.length) {
      onend?.();
      return;
    }

    const text = String(parts[index++] || "").trim();
    if (!text) {
      setTimeout(next, pause);
      return;
    }

    const utterance = createUtterance(text, {
      rate,
      onend: () => setTimeout(next, pause),
      onerror: () => setTimeout(next, pause)
    });

    window.speechSynthesis.speak(utterance);
  };

  next();
}

function updateVoiceUi() {
  ui.botonVoz.textContent = state.voiceOn ? "🔊" : "🔇";
  ui.botonVoz.classList.toggle("active", state.voiceOn);
  ui.botonVoz.setAttribute("aria-pressed", String(state.voiceOn));
  ui.valorVelocidad.textContent =
    `${Number(ui.velocidadVoz.value).toFixed(2)}x`;
  ui.valorTono.textContent =
    Number(ui.tonoVoz.value).toFixed(1);
  ui.valorVolumen.textContent =
    `${Math.round(Number(ui.volumenVoz.value) * 100)}%`;
}

function average(values) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(
    average(values.map((value) => (value - mean) ** 2))
  );
}

function calculateRSI(prices, period) {
  if (prices.length < period + 1) return null;

  const data = prices.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < data.length; index++) {
    const difference = data[index] - data[index - 1];
    if (difference > 0) gains += difference;
    if (difference < 0) losses += Math.abs(difference);
  }

  if (!gains && !losses) return 50;
  if (!losses) return 100;

  const relativeStrength =
    (gains / period) / (losses / period);

  return 100 - 100 / (1 + relativeStrength);
}

function computeIndicators() {
  const prices = state.prices;
  if (prices.length < 2) return null;

  const fast = state.mode === "fast";
  const trendWindow = Math.min(fast ? 12 : 30, prices.length);
  const momentumWindow = Math.min(fast ? 5 : 10, prices.length - 1);

  const recent = prices.slice(-trendWindow);
  const half = Math.max(1, Math.floor(recent.length / 2));
  const firstAverage = average(recent.slice(0, half));
  const secondAverage = average(recent.slice(half));

  const change = firstAverage
    ? ((secondAverage - firstAverage) / firstAverage) * 100
    : 0;

  const trend =
    change > 0 ? "ALCISTA" :
    change < 0 ? "BAJISTA" :
    "LATERAL";

  const comparisonPrice =
    prices[prices.length - 1 - momentumWindow];

  const momentum =
    prices.at(-1) - comparisonPrice;

  const momentumPercentage =
    comparisonPrice
      ? (momentum / comparisonPrice) * 100
      : 0;

  const deviation = standardDeviation(recent);
  const volatilityPercentage =
    average(recent)
      ? (deviation / average(recent)) * 100
      : 0;

  const volatilityLevel =
    volatilityPercentage >= 0.08 ? "ALTA" :
    volatilityPercentage >= 0.025 ? "MEDIA" :
    "BAJA";

  return {
    trend,
    change,
    momentum,
    momentumPercentage,
    rsi: calculateRSI(prices, fast ? 8 : 14),
    volatilityPercentage,
    volatilityLevel
  };
}

function renderIndicators() {
  state.indicators = computeIndicators();
  const indicators = state.indicators;
  if (!indicators) return;

  ui.tendencia.textContent = indicators.trend;
  ui.detalleTendencia.textContent =
    `Cambio: ${indicators.change.toFixed(4)}%`;

  ui.rsi.textContent =
    Number.isFinite(indicators.rsi)
      ? indicators.rsi.toFixed(1)
      : "--";

  ui.detalleRsi.textContent =
    !Number.isFinite(indicators.rsi) ? "Reuniendo datos" :
    indicators.rsi > 70 ? "Zona alta" :
    indicators.rsi < 30 ? "Zona baja" :
    "Zona neutral";

  ui.momentum.textContent =
    indicators.momentum > 0 ? "POSITIVO" :
    indicators.momentum < 0 ? "NEGATIVO" :
    "NEUTRAL";

  ui.detalleMomentum.textContent =
    `${indicators.momentum.toFixed(5)} · ` +
    `${indicators.momentumPercentage.toFixed(4)}%`;

  ui.volatilidad.textContent =
    `${indicators.volatilityPercentage.toFixed(4)}%`;

  ui.detalleVolatilidad.textContent =
    `Nivel ${indicators.volatilityLevel.toLowerCase()}`;
}

function digitStats(list) {
  const counts = Array(10).fill(0);
  list.forEach((digit) => {
    if (Number.isInteger(digit)) counts[digit]++;
  });

  return {
    counts,
    total: list.length,
    percentages: counts.map((count) =>
      list.length ? (count / list.length) * 100 : 0
    )
  };
}

function technicalScore(value) {
  return Math.round(clamp(value, 0, 100));
}

function prediction(direction, score, reasons, warnings = []) {
  return {
    direction,
    score: direction === "NO RECOMENDADO" ? Math.min(49, score) : technicalScore(score),
    reasons,
    warnings,
    time: time(),
    market: state.market,
    strategy: STRATEGY_NAMES[state.strategy],
    strategyKey: state.strategy,
    tickNumber: state.ticks,
    referencePrice: state.lastPrice,
    referenceDigit: state.lastDigit
  };
}

function noRecommendation(reason, extraReasons = []) {
  return prediction(
    "NO RECOMENDADO",
    35,
    extraReasons,
    [reason]
  );
}

function predictRiseFall() {
  const indicators = state.indicators || computeIndicators();

  if (!indicators || state.prices.length < 3) {
    return noRecommendation(
      "El motor todavía está reuniendo los primeros movimientos."
    );
  }

  let bullish = 0;
  let bearish = 0;
  const reasons = [];
  const warnings = [];

  if (indicators.trend === "ALCISTA") {
    bullish += 28;
    reasons.push("La tendencia reciente es alcista.");
  } else if (indicators.trend === "BAJISTA") {
    bearish += 28;
    reasons.push("La tendencia reciente es bajista.");
  } else {
    warnings.push("La tendencia permanece lateral.");
  }

  if (indicators.momentum > 0) {
    bullish += 24;
    reasons.push("El momentum es positivo.");
  } else if (indicators.momentum < 0) {
    bearish += 24;
    reasons.push("El momentum es negativo.");
  }

  if (Number.isFinite(indicators.rsi)) {
    if (indicators.rsi >= 55 && indicators.rsi <= 70) {
      bullish += 30;
      reasons.push(
        `El RSI de ${indicators.rsi.toFixed(1)} confirma presión alcista.`
      );
    } else if (indicators.rsi <= 45 && indicators.rsi >= 30) {
      bearish += 30;
      reasons.push(
        `El RSI de ${indicators.rsi.toFixed(1)} confirma presión bajista.`
      );
    } else if (indicators.rsi > 70) {
      warnings.push("El RSI está alto y puede existir agotamiento.");
    } else if (indicators.rsi < 30) {
      warnings.push("El RSI está bajo y puede existir rebote.");
    } else {
      warnings.push("El RSI se encuentra en zona neutral.");
    }
  }

  if (indicators.volatilityLevel === "BAJA") {
    bullish += 8;
    bearish += 8;
    reasons.push("La volatilidad se mantiene estable.");
  } else if (indicators.volatilityLevel === "ALTA") {
    warnings.push("La volatilidad alta reduce la estabilidad de la señal.");
  }

  const difference = Math.abs(bullish - bearish);
  const winningScore = Math.max(bullish, bearish);

  if (difference < 18 || winningScore < 55) {
    return noRecommendation(
      "Los indicadores no presentan suficiente coincidencia.",
      reasons
    );
  }

  return prediction(
    bullish > bearish ? "RISE" : "FALL",
    Math.min(92, 50 + difference / 1.5),
    reasons,
    warnings
  );
}

function predictEvenOdd() {
  const recent = state.digits.slice(-30);
  const historical = state.digits.slice(-1000);

  if (recent.length < 3) {
    return noRecommendation(
      "Todavía no hay suficientes dígitos para comparar pares e impares."
    );
  }

  const recentEven =
    recent.filter((digit) => digit % 2 === 0).length;

  const historicalEven =
    historical.filter((digit) => digit % 2 === 0).length;

  const recentEvenPercentage =
    (recentEven / recent.length) * 100;

  const historicalEvenPercentage =
    historical.length
      ? (historicalEven / historical.length) * 100
      : 50;

  const combined =
    recentEvenPercentage * 0.7 +
    historicalEvenPercentage * 0.3;

  const advantage = Math.abs(combined - 50);

  const reasons = [
    `Dígitos pares recientes: ${recentEvenPercentage.toFixed(1)}%.`,
    `Dígitos pares históricos: ${historicalEvenPercentage.toFixed(1)}%.`
  ];

  if (advantage < 8) {
    return noRecommendation(
      "La distribución entre pares e impares está demasiado equilibrada.",
      reasons
    );
  }

  return prediction(
    combined > 50 ? "EVEN" : "ODD",
    Math.min(82, 50 + advantage * 2.1),
    reasons,
    [
      "La frecuencia histórica describe datos anteriores; no garantiza el próximo dígito."
    ]
  );
}

function predictOverUnder() {
  const recent = state.digits.slice(-30);
  const historical = state.digits.slice(-1000);

  if (recent.length < 3) {
    return noRecommendation(
      "Todavía no hay suficientes dígitos para comparar Over y Under."
    );
  }

  const recentOver =
    recent.filter((digit) => digit >= 5).length;

  const historicalOver =
    historical.filter((digit) => digit >= 5).length;

  const recentOverPercentage =
    (recentOver / recent.length) * 100;

  const historicalOverPercentage =
    historical.length
      ? (historicalOver / historical.length) * 100
      : 50;

  const combined =
    recentOverPercentage * 0.7 +
    historicalOverPercentage * 0.3;

  const advantage = Math.abs(combined - 50);

  const reasons = [
    `Dígitos del 5 al 9 recientes: ${recentOverPercentage.toFixed(1)}%.`,
    `Dígitos del 5 al 9 históricos: ${historicalOverPercentage.toFixed(1)}%.`
  ];

  if (advantage < 8) {
    return noRecommendation(
      "La distribución entre dígitos altos y bajos está demasiado equilibrada.",
      reasons
    );
  }

  return prediction(
    combined > 50 ? "OVER" : "UNDER",
    Math.min(82, 50 + advantage * 2.1),
    reasons,
    [
      "La frecuencia histórica describe datos anteriores; no garantiza el próximo dígito."
    ]
  );
}

function predictMatch() {
  const recent = state.digits.slice(-20);
  const historical = state.digits.slice(-1000);

  if (recent.length < 4) {
    return noRecommendation(
      "Todavía no hay suficientes dígitos para evaluar Match."
    );
  }

  const recentStats = digitStats(recent);
  const historicalStats = digitStats(historical);

  let selectedDigit = 0;
  let bestRecentCount = recentStats.counts[0];

  for (let digit = 1; digit <= 9; digit++) {
    if (recentStats.counts[digit] > bestRecentCount) {
      selectedDigit = digit;
      bestRecentCount = recentStats.counts[digit];
    }
  }

  const recentPercentage =
    recentStats.percentages[selectedDigit];

  const historicalPercentage =
    historicalStats.percentages[selectedDigit] || 10;

  const expectedRecent = recent.length / 10;
  const excess = bestRecentCount - expectedRecent;

  const reasons = [
    `El número ${selectedDigit} apareció ${bestRecentCount} veces en los últimos ${recent.length} ticks.`,
    `Frecuencia reciente: ${recentPercentage.toFixed(1)}%.`,
    `Frecuencia histórica: ${historicalPercentage.toFixed(1)}%.`
  ];

  if (
    bestRecentCount < 3 ||
    excess < 1.2 ||
    recentPercentage < 18
  ) {
    return noRecommendation(
      "Los últimos 20 ticks no muestran un número con ventaja estadística clara.",
      reasons
    );
  }

  const score =
    Math.min(
      78,
      48 +
      Math.max(0, recentPercentage - 10) * 1.4 +
      Math.max(0, recentPercentage - historicalPercentage) * 0.8
    );

  return prediction(
    `MATCH ${selectedDigit}`,
    score,
    reasons,
    [
      "Match se valida con el siguiente tick y no puede considerarse una certeza."
    ]
  );
}

function buildPrediction() {
  if (!state.engineOn) {
    return noRecommendation("El motor está apagado.");
  }

  if (state.strategy === "even_odd") return predictEvenOdd();
  if (state.strategy === "over_under") return predictOverUnder();
  if (state.strategy === "match") return predictMatch();
  return predictRiseFall();
}

function updateEngine() {
  if (!state.engineOn) return;
  state.preparedPrediction = buildPrediction();
}

function renderProgress() {
  const count = state.digits.length;
  const percentage = Math.min(100, (count / CFG.maxTicks) * 100);

  ui.estadoMemoria.textContent = `${count} / ${CFG.maxTicks}`;
  ui.numeroProgreso.textContent = `${count}/${CFG.maxTicks}`;
  ui.barraDatos.style.width = `${percentage}%`;

  if (!state.connected) {
    ui.textoProgreso.textContent = "ESPERANDO CONEXIÓN";
  } else if (!state.engineOn) {
    ui.textoProgreso.textContent = "CONECTADO · MOTOR APAGADO";
  } else {
    ui.textoProgreso.textContent = "ANÁLISIS CONTINUO · MEMORIA AMPLIADA";
  }
}

function renderRecentDigits() {
  const digits = state.digits.slice(-20);
  ui.conteoReciente.textContent = String(digits.length);
  ui.ultimosDigitos.innerHTML = "";

  if (!digits.length) {
    ui.ultimosDigitos.innerHTML =
      '<span class="empty-chip">Esperando datos</span>';
    return;
  }

  digits.forEach((digit, index) => {
    const chip = document.createElement("span");
    chip.className =
      `digit-chip${index === digits.length - 1 ? " current" : ""}`;
    chip.textContent = String(digit);
    ui.ultimosDigitos.appendChild(chip);
  });

  ui.ultimosDigitos.scrollLeft = ui.ultimosDigitos.scrollWidth;
}

function currentStats() {
  return state.stats[state.strategy] || { attempts: 0, hits: 0 };
}

function statsAccuracy(stats) {
  return stats.attempts
    ? (stats.hits / stats.attempts) * 100
    : null;
}

function renderStats() {
  const stats = currentStats();
  const accuracy = statsAccuracy(stats);

  ui.statsIntentos.textContent = String(stats.attempts);
  ui.statsAciertos.textContent = String(stats.hits);
  ui.statsPrecision.textContent =
    accuracy === null ? "SIN DATOS" : `${accuracy.toFixed(1)}%`;

  ui.precisionObservada.textContent =
    stats.attempts < 20
      ? "SIN VALIDAR"
      : `${accuracy.toFixed(1)}%`;
}

function resetSignal(message = "Conecte y encienda el motor.") {
  ui.panelSenal.className = "signal-panel neutral";
  ui.prediccionEstado.textContent =
    state.engineOn ? "MOTOR ANALIZANDO" : "MOTOR APAGADO";
  ui.prediccionTitulo.textContent =
    state.engineOn
      ? "La predicción se prepara en segundo plano"
      : "Encienda el motor para comenzar";
  ui.prediccionDireccion.textContent = "--";
  ui.prediccionConfianza.textContent = "--";
  ui.barraConfianza.style.width = "0%";
  ui.prediccionMotivos.innerHTML = `<li>${message}</li>`;
  ui.vigenciaSenal.textContent = "Sin señal activa.";
  ui.cuentaRegresiva.textContent = "--";
  renderStats();
}

function renderPrediction(result) {
  const notRecommended = result.direction === "NO RECOMENDADO";
  const negative =
    ["FALL", "ODD", "UNDER"].includes(result.direction);

  ui.panelSenal.className =
    `signal-panel ${notRecommended ? "bad" : negative ? "warn" : "good"}`;

  ui.prediccionEstado.textContent =
    notRecommended ? "NO RECOMENDADO" : "PREDICTION READY";

  ui.prediccionTitulo.textContent =
    notRecommended
      ? "Espere una configuración más sólida"
      : "Señal técnica disponible";

  ui.prediccionDireccion.textContent = result.direction;
  ui.prediccionConfianza.textContent = `${result.score}/100`;
  ui.barraConfianza.style.width = `${result.score}%`;

  ui.prediccionMotivos.innerHTML = "";

  [
    ...result.reasons,
    ...result.warnings.map((warning) => `⚠ ${warning}`)
  ].forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    ui.prediccionMotivos.appendChild(item);
  });

  if (notRecommended) {
    ui.vigenciaSenal.textContent = "Espere una nueva oportunidad.";
    ui.cuentaRegresiva.textContent = "--";
  } else if (result.strategyKey === "rise_fall") {
    ui.vigenciaSenal.textContent =
      `Tiene ${CFG.riseFallCountdown} segundos para realizar la operación.`;
    ui.cuentaRegresiva.textContent =
      String(CFG.riseFallCountdown);
  } else {
    ui.vigenciaSenal.textContent =
      "ENTRAR ANTES DEL SIGUIENTE TICK · La señal vence con el próximo precio.";
    ui.cuentaRegresiva.textContent = "NEXT TICK";
  }

  renderStats();
}

function addHistory(result) {
  state.history.unshift(result);
  state.history = state.history.slice(0, CFG.maxHistory);

  ui.historialAnalisis.innerHTML = "";

  state.history.forEach((item) => {
    const article = document.createElement("article");
    article.innerHTML = `
      <strong>${item.time} · ${item.direction} · ${item.score}/100</strong>
      <p>${item.market} · ${item.strategy}</p>
    `;
    ui.historialAnalisis.appendChild(article);
  });
}

function spokenOperation(direction) {
  if (direction.startsWith("MATCH ")) {
    const digit = direction.split(" ")[1];
    return `coincidencia, número ${digit}`;
  }

  const translations = {
    RISE: "sube, operación Ráis",
    FALL: "baja, operación Fol",
    EVEN: "par, operación Íven",
    ODD: "impar, operación Od",
    OVER: "más de cuatro, operación Óuver",
    UNDER: "menos de cinco, operación Ánder"
  };

  return translations[direction] || direction;
}

function voiceExplanation(result) {
  if (result.direction === "NO RECOMENDADO") {
    return [
      "Operación no recomendada.",
      result.warnings[0] || "No existe suficiente coincidencia.",
      "Espere una nueva oportunidad."
    ];
  }

  const parts = [];

  if (result.strategyKey === "match") {
    const recent = state.digits.slice(-20);
    const digit = result.direction.split(" ")[1];
    const count =
      recent.filter((value) => String(value) === String(digit)).length;

    parts.push("Analizando los últimos veinte ticks.");
    parts.push(`El número con mayor presencia es el ${digit}.`);
    parts.push(`Apareció ${count} veces.`);
    parts.push(`Predicción de ${spokenOperation(result.direction)}.`);
  } else {
    parts.push(`Predicción ${spokenOperation(result.direction)}.`);
    result.reasons.slice(0, 3).forEach((reason) => parts.push(reason));
  }

  parts.push(`Puntaje técnico de ${result.score} sobre cien.`);

  const stats = state.stats[result.strategyKey];
  const accuracy = statsAccuracy(stats);

  if (stats.attempts >= 20 && accuracy !== null) {
    parts.push(
      `La precisión observada en señales anteriores es de ${accuracy.toFixed(0)} por ciento.`
    );
  } else {
    parts.push("La precisión todavía no está validada.");
  }

  if (result.strategyKey === "rise_fall") {
    parts.push(
      `Tiene ${CFG.riseFallCountdown} segundos para realizar la operación.`
    );
  } else {
    parts.push("Realice la operación antes del siguiente tick.");
  }

  return parts;
}

function stopSignal() {
  if (state.countdownTimer) {
    clearTimeout(state.countdownTimer);
    state.countdownTimer = null;
  }

  state.signalActive = false;
  refreshButtons();
}

function startRiseFallCountdown() {
  stopSignal();
  state.signalActive = true;
  refreshButtons();

  const startTime = performance.now();
  let lastValue = CFG.riseFallCountdown + 1;

  const step = () => {
    if (!state.signalActive) return;

    const elapsed = Math.floor(
      (performance.now() - startTime) / 1000
    );

    const remaining =
      Math.max(0, CFG.riseFallCountdown - elapsed);

    if (remaining !== lastValue) {
      lastValue = remaining;
      ui.cuentaRegresiva.textContent = String(remaining);
      speak(String(remaining), {
        cancel: false,
        rate: 0.82
      });
    }

    if (remaining <= 0) {
      stopSignal();
      ui.prediccionEstado.textContent = "SEÑAL FINALIZADA";
      ui.vigenciaSenal.textContent =
        "Puede generar una nueva señal.";
      ui.cuentaRegresiva.textContent = "0";

      setTimeout(() => {
        speakSequence([
          "Señal finalizada.",
          "Puede generar una nueva señal."
        ], { pause: 360, rate: 0.86 });
      }, 350);

      return;
    }

    const nextBoundary =
      startTime + (elapsed + 1) * 1000;

    state.countdownTimer = setTimeout(
      step,
      Math.max(25, nextBoundary - performance.now())
    );
  };

  step();
}

function prepareValidation(result) {
  if (result.direction === "NO RECOMENDADO") {
    state.pendingValidation = null;
    return;
  }

  state.pendingValidation = {
    strategy: result.strategyKey,
    direction: result.direction,
    referencePrice: result.referencePrice,
    referenceDigit: result.referenceDigit,
    tickNumber: result.tickNumber
  };
}

function validatePendingSignal(price, digit) {
  const pending = state.pendingValidation;
  if (!pending) return;

  if (state.ticks <= pending.tickNumber) return;

  let hit = false;

  if (pending.strategy === "rise_fall") {
    hit =
      pending.direction === "RISE"
        ? price > pending.referencePrice
        : price < pending.referencePrice;
  }

  if (pending.strategy === "even_odd") {
    hit =
      pending.direction === "EVEN"
        ? digit % 2 === 0
        : digit % 2 !== 0;
  }

  if (pending.strategy === "over_under") {
    hit =
      pending.direction === "OVER"
        ? digit >= 5
        : digit <= 4;
  }

  if (pending.strategy === "match") {
    const expectedDigit =
      Number(pending.direction.split(" ")[1]);
    hit = digit === expectedDigit;
  }

  const stats = state.stats[pending.strategy];
  stats.attempts++;
  if (hit) stats.hits++;

  saveStats();
  state.pendingValidation = null;
  renderStats();

  log(
    `Resultado observado: ${hit ? "ACIERTO" : "FALLO"}.`,
    hit ? "success" : "warning"
  );

  if (
    pending.strategy !== "rise_fall" &&
    state.signalActive
  ) {
    stopSignal();
    ui.prediccionEstado.textContent =
      hit ? "RESULTADO: ACIERTO" : "RESULTADO: FALLO";
    ui.vigenciaSenal.textContent =
      "La señal venció con el siguiente tick.";
    ui.cuentaRegresiva.textContent =
      hit ? "✓" : "×";
  }
}

function requestPrediction() {
  if (!state.connected || !state.engineOn || state.signalActive) return;

  updateEngine();
  const result =
    state.preparedPrediction || buildPrediction();

  renderPrediction(result);
  addHistory(result);

  log(
    `Predicción: ${result.direction} · ${result.score}/100.`,
    result.direction === "NO RECOMENDADO"
      ? "warning"
      : "success"
  );

  if (result.direction === "NO RECOMENDADO") {
    speakSequence(voiceExplanation(result), {
      pause: 380,
      rate: 0.86
    });
    return;
  }

  prepareValidation(result);
  state.signalActive = true;
  refreshButtons();

  speakSequence(voiceExplanation(result), {
    pause: 400,
    rate: 0.86,
    onend: () => {
      if (result.strategyKey === "rise_fall") {
        setTimeout(startRiseFallCountdown, 450);
      }
    }
  });
}

function formatPrice(price, pipSize) {
  if (!Number.isFinite(price)) return "--";
  return price.toFixed(
    Number.isInteger(pipSize) ? pipSize : 2
  );
}

function processTick(tick) {
  if (!tick || !Number.isFinite(Number(tick.precio))) return;
  if (tick.simbolo && tick.simbolo !== state.symbol) return;

  const price = Number(tick.precio);
  const pipSize =
    Number.isInteger(Number(tick.pipSize))
      ? Number(tick.pipSize)
      : state.pipSize;

  const formatted = formatPrice(price, pipSize);
  const numericText = formatted.replace(/\D/g, "");
  const digit = Number(numericText.slice(-1));

  state.ticks++;
  state.prices.push(price);
  state.digits.push(digit);

  if (state.prices.length > CFG.maxTicks) state.prices.shift();
  if (state.digits.length > CFG.maxTicks) state.digits.shift();

  ui.precioActual.classList.remove("up", "down");

  if (Number.isFinite(state.previousPrice)) {
    if (price > state.previousPrice) ui.precioActual.classList.add("up");
    if (price < state.previousPrice) ui.precioActual.classList.add("down");
  }

  state.previousPrice = price;
  state.lastPrice = price;
  state.lastDigit = digit;
  state.pipSize = pipSize;

  ui.precioActual.textContent = formatted;
  ui.contadorTicks.textContent = String(state.ticks);
  ui.ultimoDigito.textContent =
    Number.isInteger(digit) ? String(digit) : "--";
  ui.horaActualizacion.textContent =
    time(Number(tick.epoch));
  ui.estadoDatos.textContent = "EN VIVO";

  validatePendingSignal(price, digit);
  renderRecentDigits();
  renderIndicators();
  updateEngine();
  renderProgress();
}

function clearMarketData() {
  state.prices = [];
  state.digits = [];
  state.ticks = 0;
  state.previousPrice = null;
  state.lastPrice = null;
  state.lastDigit = null;
  state.indicators = null;
  state.preparedPrediction = null;
  state.pendingValidation = null;

  ui.precioActual.textContent = "--";
  ui.precioActual.className = "live-price";
  ui.contadorTicks.textContent = "0";
  ui.ultimoDigito.textContent = "--";
  ui.horaActualizacion.textContent = "--";
  ui.estadoDatos.textContent =
    state.connected ? "ESPERANDO" : "SIN DATOS";

  [ui.tendencia, ui.rsi, ui.momentum, ui.volatilidad]
    .forEach((element) => element.textContent = "--");

  [
    ui.detalleTendencia,
    ui.detalleRsi,
    ui.detalleMomentum,
    ui.detalleVolatilidad
  ].forEach((element) => element.textContent = "Esperando datos");

  renderRecentDigits();
  resetSignal(
    state.engineOn
      ? "El motor está preparando el nuevo mercado."
      : "Conecte y encienda el motor."
  );
  renderProgress();
}

function connect() {
  if (state.connected || state.connecting) return;
  log("Abriendo conexión con Deriv.");
  speak("Conectando.");
  derivAPI.conectar(state.symbol);
}

function disconnect() {
  stopSignal();
  stopVoice();
  setEngine(false);
  derivAPI.desconectar();
}

function toggleEngine() {
  if (!state.connected) return;

  if (state.engineOn) {
    setEngine(false);
    speak("Herramienta apagada.");
    log("Motor apagado.", "warning");
  } else {
    setEngine(true);
    renderProgress();
    speak("Herramienta encendida.");
    log(
      "Motor encendido. Análisis continuo en segundo plano.",
      "success"
    );
  }
}

function changeStrategy() {
  stopSignal();
  state.strategy = ui.selectorOperacion.value;
  state.preparedPrediction = null;
  state.pendingValidation = null;
  updateEngine();
  resetSignal(
    "Estrategia cambiada. La predicción se prepara en segundo plano."
  );
  renderStats();

  const spoken = {
    rise_fall: "Rise y Fall",
    even_odd: "Íven y Od, par e impar",
    over_under: "Óuver y Ánder",
    match: "Match, coincidencia"
  };

  speakSequence([
    "Estrategia cambiada.",
    spoken[state.strategy]
  ]);
}

function changeMode() {
  stopSignal();
  state.mode = ui.selectorModo.value;
  state.preparedPrediction = null;
  renderIndicators();
  updateEngine();
  resetSignal(
    "Modo cambiado. La predicción se prepara en segundo plano."
  );
}

derivAPI.al("estado", (data) => {
  const status = data?.estado || "desconectado";

  if (status === "conectando") {
    setConnection("connecting", "CONECTANDO");
    ui.estadoDatos.textContent = "CONECTANDO";
    return;
  }

  if (status === "conectado") {
    setConnection("connected", "CONECTADO");
    ui.estadoDatos.textContent = "ESPERANDO";
    log("Conexión con Deriv establecida.", "success");
    speak("Conectado.");
    return;
  }

  setConnection("offline", "DESCONECTADO");
  setEngine(false);
  ui.estadoDatos.textContent = "SIN DATOS";
});

derivAPI.al("tick", processTick);

derivAPI.al("error", (data) => {
  setConnection("error", "ERROR");
  log(data?.mensaje || "Error de conexión.", "error");
  speak("Se produjo un error de conexión.");
});

derivAPI.al("diagnostico", (data) => {
  const type =
    data?.tipo === "exito" ? "success" :
    data?.tipo === "advertencia" ? "warning" :
    data?.tipo || "normal";

  log(`[Deriv] ${data?.mensaje || "Mensaje de diagnóstico."}`, type);
});

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch((error) => {
        console.warn("No se pudo registrar la PWA:", error);
      });
  }
}

function init() {
  updateMarketLabels();
  renderMarketSelector();
  populateVoices();

  window.speechSynthesis?.addEventListener?.(
    "voiceschanged",
    populateVoices
  );

  updateVoiceUi();
  setConnection("offline", "DESCONECTADO");
  setEngine(false);
  clearMarketData();
  renderStats();

  ui.abrirSelectorMercado.addEventListener("click", () => {
    renderMarketSelector();
    ui.dialogoMercados.showModal();
  });

  ui.cerrarSelectorMercado.addEventListener("click", () => {
    ui.dialogoMercados.close();
  });

  ui.dialogoMercados.addEventListener("click", (event) => {
    if (event.target === ui.dialogoMercados) {
      ui.dialogoMercados.close();
    }
  });

  ui.botonConectar.addEventListener("click", connect);
  ui.botonDesconectar.addEventListener("click", disconnect);
  ui.botonEncender.addEventListener("click", toggleEngine);
  ui.botonAnalizar.addEventListener("click", requestPrediction);

  ui.botonVoz.addEventListener("click", () => {
    state.voiceOn = !state.voiceOn;
    stopVoice();
    updateVoiceUi();
    if (state.voiceOn) speak("Asistente de voz activado.");
  });

  ui.selectorOperacion.addEventListener("change", changeStrategy);
  ui.selectorModo.addEventListener("change", changeMode);

  ui.selectorVoz.addEventListener("change", () => {
    state.selectedVoice =
      state.voices[Number(ui.selectorVoz.value)] || null;
  });

  [
    ui.velocidadVoz,
    ui.tonoVoz,
    ui.volumenVoz
  ].forEach((element) => {
    element.addEventListener("input", updateVoiceUi);
  });

  ui.botonProbarVoz.addEventListener("click", () => {
    speakSequence([
      "Prueba de voz.",
      "El asistente está listo para anunciar las predicciones.",
      "La velocidad y el acento pueden ajustarse en esta sección."
    ], { pause: 420, rate: 0.86 });
  });

  ui.botonReiniciarEstadisticas.addEventListener("click", () => {
    const confirmed = window.confirm(
      "¿Desea borrar las estadísticas observadas de todas las estrategias?"
    );

    if (!confirmed) return;

    localStorage.removeItem(CFG.storageKey);
    state.stats = loadStats();
    renderStats();
    log("Estadísticas de validación reiniciadas.");
  });

  ui.botonLimpiarHistorial.addEventListener("click", () => {
    state.history = [];
    ui.historialAnalisis.innerHTML =
      '<p class="empty">Todavía no se han generado predicciones.</p>';
  });

  ui.botonLimpiarRegistro.addEventListener("click", () => {
    ui.registroActividad.innerHTML = "";
  });

  registerServiceWorker();
  log(`Trading Analyzer V${CFG.version} cargado.`, "success");
}

window.addEventListener("beforeunload", () => {
  stopSignal();
  stopVoice();
  derivAPI.desconectar();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

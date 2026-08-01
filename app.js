import { derivAPI } from "./deriv-api.js";
const $=(id,ob=true)=>{const e=document.getElementById(id);if(!e&&ob)console.warn("Falta elemento:",id);return e};
const ui={estadoConexion:$("estadoConexion"),textoEstado:$("textoEstado"),botonConectar:$("botonConectar"),botonDesconectar:$("botonDesconectar"),botonAnalizar:$("botonAnalizar"),botonVoz:$("botonVoz"),selectorIndice:$("selectorIndice"),selectorOperacion:$("selectorOperacion"),selectorModo:$("selectorModo"),nombreIndice:$("nombreIndice"),estadoDatos:$("estadoDatos"),precioActual:$("precioActual"),contadorTicks:$("contadorTicks"),ultimoDigito:$("ultimoDigito"),horaActualizacion:$("horaActualizacion"),textoProgreso:$("textoProgreso"),numeroProgreso:$("numeroProgreso"),barraDatos:$("barraDatos"),tendencia:$("tendencia"),detalleTendencia:$("detalleTendencia"),rsi:$("rsi"),detalleRsi:$("detalleRsi"),momentum:$("momentum"),detalleMomentum:$("detalleMomentum"),volatilidad:$("volatilidad"),detalleVolatilidad:$("detalleVolatilidad"),panelSenal:$("panelSenal"),prediccionEstado:$("prediccionEstado"),prediccionTitulo:$("prediccionTitulo"),prediccionDireccion:$("prediccionDireccion"),prediccionConfianza:$("prediccionConfianza"),barraConfianza:$("barraConfianza"),prediccionMotivos:$("prediccionMotivos"),vigenciaSenal:$("vigenciaSenal"),cuentaRegresiva:$("cuentaRegresiva",false),botonLimpiarHistorial:$("botonLimpiarHistorial"),historialAnalisis:$("historialAnalisis"),botonLimpiarRegistro:$("botonLimpiarRegistro"),registroActividad:$("registroActividad")};
const CFG={version:"6.1.0",maxPrecios:1000,maxDigitos:1000,minRapido:12,minCompleto:30,maxHistorial:10,duracionRapida:10,duracionCompleta:30,idioma:"es-SV",vozRate:.95,ventanaReciente:30,ventanaHistorica:1000,confianzaMinima:60};
const mercados={"1HZ10V":"Volatility 10 (1s)","1HZ25V":"Volatility 25 (1s)","1HZ50V":"Volatility 50 (1s)","1HZ75V":"Volatility 75 (1s)","1HZ100V":"Volatility 100 (1s)",R_10:"Volatility 10",R_25:"Volatility 25",R_50:"Volatility 50",R_75:"Volatility 75",R_100:"Volatility 100"};
const estrategias={rise_fall:"Rise / Fall",even_odd:"Par / Impar",over_under:"Más / Menos",match:"Match"};
const st={conectado:false,conectando:false,simbolo:"",mercado:"",estrategia:"rise_fall",modo:"rapido",precios:[],digitos:[],ticks:0,previo:null,pip:null,indicadores:null,resultado:null,resultadoPreparado:null,historial:[],vozActiva:true,vozDisponible:("speechSynthesis"in window&&"SpeechSynthesisUtterance"in window)};
let timer=null;
const hora=(epoch=null)=>(Number.isFinite(epoch)?new Date(epoch*1000):new Date()).toLocaleTimeString("es-SV",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
function log(m,t="normal"){if(!ui.registroActividad)return;const p=document.createElement("p");p.textContent=`[${hora()}] ${m}`;if(["exito","error","advertencia"].includes(t))p.classList.add(t);ui.registroActividad.prepend(p);while(ui.registroActividad.children.length>50)ui.registroActividad.lastElementChild?.remove()}
function voz(texto){if(!texto||!st.vozDisponible||!st.vozActiva)return false;try{speechSynthesis.cancel();const m=new SpeechSynthesisUtterance(texto);m.lang=CFG.idioma;m.rate=CFG.vozRate;speechSynthesis.speak(m);return true}catch{return false}}
function detenerVoz(){try{speechSynthesis.cancel()}catch{}}
function sync(){st.simbolo=ui.selectorIndice.value;st.mercado=mercados[st.simbolo]||st.simbolo;st.estrategia=ui.selectorOperacion.value;st.modo=ui.selectorModo.value;ui.nombreIndice.textContent=st.mercado}
function minTicks(){return st.modo==="completo"?CFG.minCompleto:CFG.minRapido}
function duracion(){return st.modo==="completo"?CFG.duracionCompleta:CFG.duracionRapida}
function estadoConexion(estado,texto){ui.estadoConexion.className=`estado-conexion ${estado}`;ui.textoEstado.textContent=texto;ui.botonConectar.disabled=["conectado","conectando"].includes(estado);ui.botonDesconectar.disabled=estado!=="conectado";st.conectado=estado==="conectado";st.conectando=estado==="conectando"}
function botonVoz(){ui.botonVoz.disabled=!st.vozDisponible;ui.botonVoz.textContent=!st.vozDisponible?"🔇 Voz no disponible":st.vozActiva?"🔊 Voz activa":"🔇 Voz silenciada";ui.botonVoz.setAttribute("aria-pressed",String(st.vozActiva))}
function progreso(){const m=minTicks(),c=Math.min(st.precios.length,m);ui.numeroProgreso.textContent=`${c}/${m}`;ui.barraDatos.style.width=`${Math.min(100,c/m*100)}%`;if(!st.conectado){ui.textoProgreso.textContent="Esperando conexión";ui.botonAnalizar.disabled=true;ui.botonAnalizar.textContent="Esperando conexión...";return}if(st.precios.length<m){ui.textoProgreso.textContent=`Preparando ${estrategias[st.estrategia]}`;ui.botonAnalizar.disabled=true;ui.botonAnalizar.textContent=`Recopilando datos ${c}/${m}`;return}ui.textoProgreso.textContent="Análisis preparado";ui.botonAnalizar.disabled=false;ui.botonAnalizar.textContent="🔍 Predicción"}
function resetPanel(msg="Conecta la herramienta para comenzar."){detenerCuenta();ui.panelSenal.className="panel-senal neutral";ui.prediccionEstado.textContent="SIN ANALIZAR";ui.prediccionTitulo.textContent="Esperando análisis";ui.prediccionDireccion.textContent="--";ui.prediccionConfianza.textContent="--";ui.barraConfianza.style.width="0%";ui.vigenciaSenal.textContent="Vigencia estimada: --";if(ui.cuentaRegresiva)ui.cuentaRegresiva.textContent="";ui.prediccionMotivos.innerHTML="";const li=document.createElement("li");li.textContent=msg;ui.prediccionMotivos.appendChild(li)}
function resetDatos(motivo="Esperando nuevos datos"){detenerCuenta();detenerVoz();st.precios=[];st.digitos=[];st.ticks=0;st.previo=null;st.pip=null;st.indicadores=null;st.resultadoPreparado=null;ui.precioActual.textContent="--";ui.precioActual.className="precio-actual";ui.contadorTicks.textContent="0";ui.ultimoDigito.textContent="--";ui.horaActualizacion.textContent="--";ui.estadoDatos.textContent="Sin datos";[[ui.tendencia,"--"],[ui.rsi,"--"],[ui.momentum,"--"],[ui.volatilidad,"--"],[ui.detalleTendencia,motivo],[ui.detalleRsi,motivo],[ui.detalleMomentum,motivo],[ui.detalleVolatilidad,motivo]].forEach(([e,v])=>e.textContent=v);resetPanel(`Esperando datos de ${st.mercado} para ${estrategias[st.estrategia]}.`);progreso()}
function promedio(a){return a.length?a.reduce((s,v)=>s+v,0)/a.length:0}
function indicadores(){const p=st.precios;if(p.length<5)return null;const n=st.modo==="completo"?30:12,rec=p.slice(-n),mitad=Math.floor(rec.length/2),a=promedio(rec.slice(0,mitad)),b=promedio(rec.slice(mitad)),cambio=a?((b-a)/a)*100:0;let tend="Lateral";if(cambio>0)tend="Alcista";if(cambio<0)tend="Bajista";const per=st.modo==="completo"?14:8;let rsi=null;if(p.length>=per+1){let g=0,l=0;const d=p.slice(-(per+1));for(let i=1;i<d.length;i++){const x=d[i]-d[i-1];if(x>0)g+=x;else l+=Math.abs(x)}rsi=l===0?(g===0?50:100):100-100/(1+(g/per)/(l/per))}const pm=st.modo==="completo"?10:5;const val=p.length>pm?p.at(-1)-p.at(-1-pm):0;const mom=val>0?"Positivo":val<0?"Negativo":"Neutral";const desv=Math.sqrt(promedio(rec.map(x=>(x-promedio(rec))**2)));const vol=promedio(rec)?desv/promedio(rec)*100:0;const nivel=vol>=.08?"Alta":vol>=.025?"Media":"Baja";return{tendencia:{direccion:tend,cambio},rsi,momentum:{direccion:mom,valor:val,porcentaje:p.at(-1-pm)?val/p.at(-1-pm)*100:0},volatilidad:{nivel,porcentaje:vol}}}
function pintarIndicadores(){st.indicadores=indicadores();const i=st.indicadores;if(!i)return;ui.tendencia.textContent=i.tendencia.direccion;ui.detalleTendencia.textContent=`Cambio: ${i.tendencia.cambio.toFixed(4)}%`;ui.rsi.textContent=Number.isFinite(i.rsi)?i.rsi.toFixed(1):"--";ui.detalleRsi.textContent=!Number.isFinite(i.rsi)?"Esperando más datos":i.rsi>70?"Zona alta":i.rsi<30?"Zona baja":"Zona neutral";ui.momentum.textContent=i.momentum.direccion;ui.detalleMomentum.textContent=`${i.momentum.valor.toFixed(5)} · ${i.momentum.porcentaje.toFixed(4)}%`;ui.volatilidad.textContent=`${i.volatilidad.porcentaje.toFixed(4)}%`;ui.detalleVolatilidad.textContent=`Nivel ${i.volatilidad.nivel}`}
function procesarTick(t){if(!t||!Number.isFinite(Number(t.precio))||(t.simbolo&&t.simbolo!==st.simbolo))return;const precio=Number(t.precio),pip=Number.isInteger(Number(t.pipSize))?Number(t.pipSize):2,fmt=precio.toFixed(pip),dig=Number(fmt.match(/\d(?=\D*$)/)?.[0]);st.ticks++;st.precios.push(precio);if(st.precios.length>CFG.maxPrecios)st.precios.shift();if(Number.isInteger(dig)){st.digitos.push(dig);if(st.digitos.length>CFG.maxDigitos)st.digitos.shift()}ui.precioActual.classList.remove("sube","baja");if(Number.isFinite(st.previo))ui.precioActual.classList.add(precio>st.previo?"sube":precio<st.previo?"baja":"");ui.precioActual.textContent=fmt;ui.contadorTicks.textContent=String(st.ticks);ui.ultimoDigito.textContent=Number.isInteger(dig)?String(dig):"--";ui.horaActualizacion.textContent=hora(t.epoch);ui.estadoDatos.textContent="Datos en vivo";st.previo=precio;st.pip=pip;pintarIndicadores();actualizarMotorSegundoPlano();progreso()}
function confianza(valor){return Math.round(Math.max(45,Math.min(92,valor)))}
function sesgoNormalizado(valor,escala=1){return Math.max(-1,Math.min(1,valor/escala))}
function evaluarRiseFallAvanzado(i){
  const razones=[],adv=[];
  let puntaje=0;
  const rsi=i.rsi;
  if(Number.isFinite(rsi)){
    if(rsi>=55&&rsi<=72){puntaje+=35*sesgoNormalizado((rsi-50)/22);razones.push(`RSI ${rsi.toFixed(1)} confirma presión alcista.`)}
    else if(rsi<=45&&rsi>=28){puntaje-=35*sesgoNormalizado((50-rsi)/22);razones.push(`RSI ${rsi.toFixed(1)} confirma presión bajista.`)}
    else if(rsi>72){puntaje-=12;adv.push("RSI en zona alta: posible agotamiento o retroceso.")}
    else if(rsi<28){puntaje+=12;adv.push("RSI en zona baja: posible rebote.")}
    else adv.push("RSI neutral, sin confirmación fuerte.");
  }
  const mom=i.momentum;
  const momF=Math.min(1,Math.abs(mom.porcentaje)/0.01);
  if(mom.direccion==="Positivo"){puntaje+=30*Math.max(.35,momF);razones.push("Momentum positivo y alineado con subida.")}
  else if(mom.direccion==="Negativo"){puntaje-=30*Math.max(.35,momF);razones.push("Momentum negativo y alineado con bajada.")}
  else adv.push("Momentum neutral.");
  const tend=i.tendencia;
  const tendF=Math.min(1,Math.abs(tend.cambio)/0.01);
  if(tend.direccion==="Alcista"){puntaje+=25*Math.max(.35,tendF);razones.push("Tendencia reciente alcista.")}
  else if(tend.direccion==="Bajista"){puntaje-=25*Math.max(.35,tendF);razones.push("Tendencia reciente bajista.")}
  else adv.push("Tendencia lateral.");
  let ajusteVol=0;
  if(i.volatilidad.nivel==="Baja"){ajusteVol=5;razones.push("Volatilidad estable.")}
  else if(i.volatilidad.nivel==="Alta"){ajusteVol=-12;adv.push("Volatilidad alta reduce la calidad de la señal.")}
  const direccion=puntaje>=35?"SUBE":puntaje<=-35?"BAJA":"ESPERAR";
  const coherencia=Math.min(90,52+Math.abs(puntaje)*.45+ajusteVol);
  if(direccion==="ESPERAR")adv.push("RSI, Momentum y Tendencia no coinciden lo suficiente.");
  return crearResultado(direccion,direccion==="ESPERAR"?45:confianza(coherencia),razones,adv);
}
function estadisticaDigitos(lista){
  const conteo=Array(10).fill(0);lista.forEach(d=>{if(Number.isInteger(d)&&d>=0&&d<=9)conteo[d]++});
  return {conteo,total:lista.length,porcentajes:conteo.map(c=>lista.length?c/lista.length*100:0)};
}
function combinarSesgos(reciente,historico,selector){
  const sr=selector(reciente),sh=selector(historico);
  return sr*.7+sh*.3;
}
function resultado(){
  const i=st.indicadores||indicadores();if(!i)return null;
  if(st.estrategia==="rise_fall")return evaluarRiseFallAvanzado(i);
  const recientes=st.digitos.slice(-CFG.ventanaReciente);
  const historicos=st.digitos.slice(-CFG.ventanaHistorica);
  if(recientes.length<10)return crearResultado("ESPERAR",45,[],["Todavía no existen suficientes dígitos para este análisis."]);
  const er=estadisticaDigitos(recientes),eh=estadisticaDigitos(historicos),razones=[],adv=[];
  if(st.estrategia==="even_odd"){
    const sesgo=combinarSesgos(recientes,historicos,l=>{const p=l.filter(x=>x%2===0).length;return l.length?(p-(l.length-p))/l.length:0});
    const d=sesgo>=.12?"PAR":sesgo<=-.12?"IMPAR":"ESPERAR";
    const pr=recientes.filter(x=>x%2===0).length/recentes.length*100;
    const ph=historicos.filter(x=>x%2===0).length/historicos.length*100;
    razones.push(`Pares recientes: ${pr.toFixed(1)}% en ${recientes.length} ticks.`,`Pares históricos: ${ph.toFixed(1)}% en ${historicos.length} ticks.`);
    if(d==="ESPERAR")adv.push("La diferencia entre pares e impares no es suficiente.");
    return crearResultado(d,d==="ESPERAR"?45:confianza(55+Math.abs(sesgo)*180),razones,adv);
  }
  if(st.estrategia==="over_under"){
    const sesgo=combinarSesgos(recientes,historicos,l=>{const a=l.filter(x=>x>=5).length;return l.length?(a-(l.length-a))/l.length:0});
    const d=sesgo>=.12?"MÁS":sesgo<=-.12?"MENOS":"ESPERAR";
    const ar=recientes.filter(x=>x>=5).length/recentes.length*100;
    const ah=historicos.filter(x=>x>=5).length/historicos.length*100;
    razones.push(`Dígitos 5–9 recientes: ${ar.toFixed(1)}%.`,`Dígitos 5–9 históricos: ${ah.toFixed(1)}%.`);
    if(d==="ESPERAR")adv.push("No existe una diferencia suficiente entre dígitos altos y bajos.");
    return crearResultado(d,d==="ESPERAR"?45:confianza(55+Math.abs(sesgo)*180),razones,adv);
  }
  let mejor=0,mejorScore=-Infinity;
  for(let d=0;d<10;d++){
    const score=er.porcentajes[d]*.7+eh.porcentajes[d]*.3;
    if(score>mejorScore){mejorScore=score;mejor=d}
  }
  const promedioEsperado=10;
  const ventaja=mejorScore-promedioEsperado;
  const direccion=ventaja>=2.5&&er.conteo[mejor]>=4?`MATCH ${mejor}`:"ESPERAR";
  razones.push(`El dígito ${mejor} apareció ${er.conteo[mejor]} veces en los últimos ${recientes.length} ticks.`,`Frecuencia reciente: ${er.porcentajes[mejor].toFixed(1)}%.`,`Frecuencia histórica: ${eh.porcentajes[mejor].toFixed(1)}% en ${historicos.length} ticks.`);
  if(direccion==="ESPERAR")adv.push("Ningún dígito presenta una ventaja reciente e histórica suficientemente clara.");
  return crearResultado(direccion,direccion==="ESPERAR"?45:confianza(58+ventaja*4),razones,adv);
}
function actualizarMotorSegundoPlano(){
  if(!st.conectado||st.precios.length<minTicks()){st.resultadoPreparado=null;return}
  st.resultadoPreparado=resultado();
}
function crearResultado(d,c,r,a){return{direccion:d,confianza:c,titulo:`Predicción: ${d}`,razones:r,advertencias:a,vigencia:duracion(),mercado:st.mercado,operacion:estrategias[st.estrategia],modo:ui.selectorModo.options[ui.selectorModo.selectedIndex].textContent.trim(),hora:hora()}}
function mostrar(r){st.resultado=r;ui.panelSenal.className="panel-senal";ui.panelSenal.classList.add(r.direccion==="ESPERAR"?"esperar":["BAJA","IMPAR","MENOS"].includes(r.direccion)?"baja":"sube");ui.prediccionEstado.textContent=r.direccion==="ESPERAR"?"Sin ventaja clara":"Predicción preparada";ui.prediccionTitulo.textContent=r.titulo;ui.prediccionDireccion.textContent=r.direccion;ui.prediccionConfianza.textContent=`${r.confianza}%`;ui.barraConfianza.style.width=`${r.confianza}%`;ui.vigenciaSenal.textContent=`Vigencia estimada: ${r.vigencia} segundos`;ui.prediccionMotivos.innerHTML="";[...r.razones,...r.advertencias.map(x=>"⚠ "+x)].forEach(x=>{const li=document.createElement("li");li.textContent=x;ui.prediccionMotivos.appendChild(li)})}
function historial(r){st.historial.unshift(r);st.historial=st.historial.slice(0,CFG.maxHistorial);ui.historialAnalisis.innerHTML="";st.historial.forEach(x=>{const a=document.createElement("article");a.className="historial-item";a.innerHTML=`<strong>${x.hora} · ${x.direccion} · ${x.confianza}%</strong><p>${x.mercado} · ${x.operacion} · ${x.modo}</p>`;ui.historialAnalisis.appendChild(a)})}
function detenerCuenta(){if(timer){clearInterval(timer);timer=null}}
function cuenta(r){detenerCuenta();if(!r||r.direccion==="ESPERAR"){ui.vigenciaSenal.textContent="Sin cuenta regresiva";return}let s=r.vigencia;ui.vigenciaSenal.textContent=`Vigencia: ${s} segundos`;if(ui.cuentaRegresiva)ui.cuentaRegresiva.textContent=s;timer=setInterval(()=>{s--;ui.vigenciaSenal.textContent=s>0?`Vigencia: ${s} ${s===1?"segundo":"segundos"}`:"Señal finalizada";if(ui.cuentaRegresiva)ui.cuentaRegresiva.textContent=s>0?s:"";if([5,3,2,1].includes(s))voz(`Quedan ${s} ${s===1?"segundo":"segundos"}.`);if(s<=0){detenerCuenta();voz("Señal finalizada.");ui.prediccionEstado.textContent="SEÑAL FINALIZADA"}},1000)}
function analizar(){if(!st.conectado||st.precios.length<minTicks()){progreso();return}voz("Generando predicción.");pintarIndicadores();actualizarMotorSegundoPlano();const r=st.resultadoPreparado||resultado();if(!r)return;mostrar(r);historial(r);log(`Predicción generada: ${r.direccion} con ${r.confianza}% de confianza técnica.`,r.direccion==="ESPERAR"?"advertencia":"exito");voz(r.direccion==="ESPERAR"?"No existe una ventaja clara. Se recomienda esperar.":`Predicción ${r.direccion}. Confianza técnica ${r.confianza} por ciento. Tienes ${r.vigencia} segundos para realizar la operación.`);cuenta(r)}
function conectar(){sync();if(st.conectado||st.conectando)return;log(`Solicitando conexión para ${st.mercado}.`);voz("Conectando.");derivAPI.conectar(st.simbolo)}
function desconectar(){detenerCuenta();detenerVoz();log("Cerrando conexión con Deriv.");derivAPI.desconectar()}
function cambioMercado(){detenerCuenta();detenerVoz();sync();resetDatos("Esperando datos del nuevo mercado");log(`Mercado seleccionado: ${st.mercado}.`);voz(`Mercado cambiado a ${st.mercado}.`);if(derivAPI.estaConectado())derivAPI.cambiarSimbolo(st.simbolo)}
function cambioOperacion(){detenerCuenta();detenerVoz();sync();resetPanel("La estrategia cambió. Ejecuta un nuevo análisis.");progreso();log(`Estrategia seleccionada: ${estrategias[st.estrategia]}.`);voz(`Estrategia cambiada a ${estrategias[st.estrategia]}.`)}
function cambioModo(){detenerCuenta();detenerVoz();sync();resetPanel("El modo cambió. Ejecuta un nuevo análisis.");pintarIndicadores();progreso();voz(`Modo cambiado a ${ui.selectorModo.options[ui.selectorModo.selectedIndex].textContent.trim()}.`)}
derivAPI.al("estado",d=>{const e=d?.estado||"desconectado";estadoConexion(e,d?.texto||e);progreso();if(e==="conectando"){ui.estadoDatos.textContent="Conectando...";return}if(e==="conectado"){ui.estadoDatos.textContent="Esperando precios";log("Conexión con Deriv activa.","exito");voz("Conectado.");return}if(e==="desconectado"){ui.estadoDatos.textContent="Sin conexión";log("La conexión con Deriv está cerrada.","advertencia")}});
derivAPI.al("tick",procesarTick);derivAPI.al("error",d=>{estadoConexion("error","Error");log(d?.mensaje||"Error desconocido de conexión.","error");voz("Se produjo un error de conexión.")});derivAPI.al("diagnostico",d=>log(`[Deriv] ${d?.mensaje||"Mensaje de diagnóstico."}`,d?.tipo||"normal"));
function iniciar(){sync();estadoConexion("desconectado","Desconectado");resetDatos();botonVoz();ui.botonConectar.addEventListener("click",conectar);ui.botonDesconectar.addEventListener("click",desconectar);ui.selectorIndice.addEventListener("change",cambioMercado);ui.selectorOperacion.addEventListener("change",cambioOperacion);ui.selectorModo.addEventListener("change",cambioModo);ui.botonAnalizar.addEventListener("click",analizar);ui.botonVoz.addEventListener("click",()=>{st.vozActiva=!st.vozActiva;detenerVoz();botonVoz();if(st.vozActiva)voz("Asistente de voz activado.")});ui.botonLimpiarHistorial.addEventListener("click",()=>{st.historial=[];ui.historialAnalisis.innerHTML='<p class="mensaje-vacio">Todavía no se han generado análisis.</p>';log("Historial de análisis limpiado.")});ui.botonLimpiarRegistro.addEventListener("click",()=>{ui.registroActividad.innerHTML="";log("Registro de actividad limpiado.")});log(`Trading Analyzer V${CFG.version} cargado correctamente.`,"exito")}
window.addEventListener("beforeunload",()=>{detenerCuenta();detenerVoz();derivAPI.desconectar()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",iniciar);else iniciar();

export type Tool = 'inspect' | 'focus' | 'probe';
export type Crime = { id:string; suspect:string; category:string; observation:string; tool:Tool; trigger:string; explanation:string };
export type Case = { id:number; title:string; subtitle:string; victim:string; incident:string; mission:string; tools:Tool[]; crimes:Crime[]; suspects:Record<string,string> };
export const cases:Case[] = [
 {id:1,title:'La primera sospecha',subtitle:'THE REGISTRATION FILE',victim:'Forma',incident:'41% de registros abandonados',mission:'Crea una cuenta en Forma.',tools:['inspect'],suspects:{name:'Nombre',email:'Correo electrónico',password:'Contraseña',submit:'Crear cuenta',badge:'Acceso gratuito'},crimes:[
 {id:'label',suspect:'email',category:'Etiqueta ausente',observation:'El correo solo tiene un placeholder: desaparece al escribir y el campo carece de nombre accesible.',tool:'inspect',trigger:'always',explanation:'Una etiqueta persistente y asociada al campo permite entenderlo después de escribir y con lector de pantalla.'},
 {id:'requirements',suspect:'password',category:'Instrucciones insuficientes',observation:'La contraseña exige 8 caracteres, pero esa condición solo se comunica después de enviar.',tool:'inspect',trigger:'register-error',explanation:'Explica las condiciones antes de que el usuario cometa el error.'}]},
 {id:2,title:'Dirección desconocida',subtitle:'THE DELIVERY FILE',victim:'Parcel',incident:'1 de cada 3 envíos necesita corrección',mission:'Introduce una dirección y confirma el envío.',tools:['inspect','focus'],suspects:{address:'Dirección',postal:'Código postal',city:'Ciudad',submit:'Confirmar envío',badge:'Envío estándar'},crimes:[
 {id:'color',suspect:'postal',category:'Error comunicado solo por color',observation:'Al enviar un código inválido, el campo cambia de color sin texto de error asociado.',tool:'inspect',trigger:'delivery-error',explanation:'El color debe acompañarse de un mensaje que identifique el error y cómo corregirlo.'},
 {id:'focus',suspect:'city',category:'Orden de foco incoherente',observation:'El recorrido observado es Dirección → Ciudad → Código postal, aunque el orden visual es Dirección → Código postal → Ciudad.',tool:'focus',trigger:'focus-seen',explanation:'El recorrido de teclado debe seguir una secuencia lógica y coherente con la presentación.'}]},
 {id:3,title:'El checkout desaparecido',subtitle:'THE CHECKOUT FILE',victim:'Shoply',incident:'68% de abandono en el checkout',mission:'Compra la lámpara y confirma el pedido.',tools:['inspect','focus','probe'],suspects:{promo:'Código promocional',terms:'Condiciones',pay:'Pagar pedido',badge:'Pago seguro'},crimes:[
 {id:'feedback',suspect:'pay',category:'Falta de feedback',observation:'La operación permaneció pendiente durante más de 2 segundos sin indicador de carga ni mensaje visible.',tool:'probe',trigger:'payment-pending',explanation:'Una operación asíncrona necesita feedback inmediato para evitar incertidumbre y reintentos.'},
 {id:'consent',suspect:'terms',category:'Consentimiento preseleccionado',observation:'El consentimiento para recibir publicidad está activado por defecto al abrir el checkout.',tool:'inspect',trigger:'always',explanation:'El consentimiento opcional debe ser una elección activa y separada de la compra.'}]}
];
export type Evidence = {id:string; crimeId:string|null; suspect:string; observation:string; tool:Tool};
export function observe(c:Case,suspect:string,tool:Tool,triggers:string[]):Omit<Evidence,'id'> {
 const crime=c.crimes.find(x=>x.suspect===suspect && x.tool===tool && (x.trigger==='always'||triggers.includes(x.trigger)));
 return {crimeId:crime?.id??null,suspect,tool,observation:crime?.observation??'No se ha observado una anomalía demostrable con esta herramienta en el estado actual. Prueba una interacción o una herramienta diferente.'};
}
export function evaluate(c:Case,e:Evidence,category:string,solved:string[]):'correct'|'false'|'duplicate' {
 const crime=c.crimes.find(x=>x.id===e.crimeId && x.suspect===e.suspect && x.category===category);
 return !crime?'false':solved.includes(crime.id)?'duplicate':'correct';
}
export const categories=['Etiqueta ausente','Instrucciones insuficientes','Error comunicado solo por color','Orden de foco incoherente','Falta de feedback','Consentimiento preseleccionado','Jerarquía visual deficiente','Objetivo táctil pequeño'];
export const toolNames:Record<Tool,string>={inspect:'Inspector',focus:'Focus tracker',probe:'Interaction probe'};

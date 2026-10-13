import"./modulepreload-polyfill-B5Qt9EMX.js";const R="alvrichGymMonthlyPlanV1",O=["alvrichGymMayAutoV2","alvrichGymMayAutoV1"],A={Lunes:{title:"Espalda + bíceps + cardio",cardio:"15-20 min de cinta inclinada o bici al final. Opcional: comba suave 5 rondas de 1 min salto + 1 min descanso.",exercises:[["Jalón al pecho","4 x 8-12"],["Remo sentado en polea","4 x 10-12"],["Remo con mancuerna o máquina","3 x 10-12"],["Pullover en polea","3 x 12-15"],["Curl bíceps","3 x 10-12"],["Curl martillo","3 x 12"]]},Martes:{title:"Piernas + core",cardio:"10-15 min suave. Mejor bici o caminar; evitar comba fuerte para no machacar gemelos/rodillas después de pierna.",exercises:[["Prensa de piernas","4 x 10-12"],["Hack squat o sentadilla goblet","3 x 10-12"],["Curl femoral","4 x 10-12"],["Extensión cuádriceps","3 x 12-15"],["Gemelos","4 x 12-20"],["Plancha","3 x 40 s"]]},Miércoles:{title:"Pecho + tríceps + comba",cardio:"15-20 min cardio final. Si hay ganas: comba 8-10 rondas de 1 min salto + 45 s descanso.",exercises:[["Press pecho máquina o banca","4 x 8-12"],["Press inclinado con mancuernas","3 x 10-12"],["Aperturas en máquina o polea","3 x 12-15"],["Fondos asistidos o press cerrado","3 x 8-12"],["Tríceps en polea","3 x 12-15"],["Extensión tríceps por encima cabeza","2 x 12-15"]]},Jueves:{title:"Hombros + abdomen + cardio",cardio:"15-20 min suave/medio al final. Bici, elíptica o cinta inclinada para sumar gasto sin romperte.",exercises:[["Press hombro máquina o mancuernas","4 x 8-12"],["Elevaciones laterales","4 x 12-15"],["Reverse pec deck / pájaros","3 x 12-15"],["Encogimientos trapecio","3 x 12"],["Elevaciones de piernas","3 x 12-15"],["Crunch máquina","3 x 15"]]},Viernes:{title:"Full upper + brazos + comba",cardio:"15 min final. Opción rápida: comba 6-8 rondas de 1 min salto + 1 min descanso.",exercises:[["Jalón al pecho","3 x 10-12"],["Press pecho máquina","3 x 10-12"],["Remo sentado","3 x 10-12"],["Elevaciones laterales","3 x 12-15"],["Curl bíceps barra o máquina","3 x 10-12"],["Tríceps polea","3 x 12"]]},Sábado:{title:"Cardio largo + movilidad",cardio:"40-60 min cardio. Ritmo constante: cinta inclinada, bici, elíptica o caminata larga. Prioridad: sudar sin reventarte.",exercises:[["Cardio largo","40-60 min"],["Movilidad cadera/espalda","10 min"],["Estiramientos suaves","10 min"],["Core opcional","2-3 series"]]},Domingo:{title:"Descanso activo editable",cardio:"Paseo largo o descanso total. Si te apetece: 8.000-12.000 pasos y movilidad suave.",exercises:[["Caminar","8.000-12.000 pasos"],["Movilidad o estiramientos","10-15 min"],["Preparar semana","comida + ropa gym"]]}},Q=["Pesas: 15-20 min de cardio al final casi todos los días.","Comba: 2-3 días por semana, por intervalos, no todos los días fuerte.","Pierna: cardio suave; evitar comba fuerte ese día.","Sábado: cardio largo 40-60 min a ritmo constante."],p=e=>String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]),X=(e,a)=>{try{return JSON.parse(localStorage.getItem(e)||JSON.stringify(a))}catch{return a}},I=(e,a)=>localStorage.setItem(e,JSON.stringify(a)),u=()=>{for(const e of O){const a=localStorage.getItem(e);if(a)try{return JSON.parse(a)}catch{}}return{logs:{},checks:{},exerciseNotes:{}}},f=e=>I(O[0],e),Z=()=>{const e=new Date;return e.setMinutes(e.getMinutes()-e.getTimezoneOffset()),e.toISOString().slice(0,10)},S=e=>["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date(`${e}T12:00:00`).getDay()],$=e=>A[S(e)]||A.Lunes,l=Z(),ee=()=>{if(document.querySelector("[data-gym-monthly-plan-style]"))return;const e=document.createElement("style");e.setAttribute("data-gym-monthly-plan-style","true"),e.textContent=`
    .actualLogCard{border:1px solid rgba(112,225,161,.28);background:rgba(112,225,161,.07);border-radius:20px;padding:14px;margin:12px 0}.actualLogCard h3{margin:0 0 10px}.cardioRulesCard{border:1px solid rgba(101,167,255,.24);background:rgba(101,167,255,.07);border-radius:20px;padding:14px;margin:12px 0}.cardioRulesCard h3{margin:0 0 8px}.cardioRulesCard ul{margin:0;padding-left:18px;color:var(--muted);line-height:1.5}.extraExerciseGrid{display:grid;gap:8px;margin-top:10px}.extraExerciseRow{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center}.extraExerciseRow button{border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.06);color:var(--text);padding:8px 10px;font-weight:900}.recommendedTag{display:inline-flex;margin-top:5px;color:var(--accent);font-size:.68rem;font-weight:900}.calPlanTitle{font-size:.64rem;color:var(--accent);line-height:1.12;font-weight:900;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.gym-modal-plan{border:1px solid rgba(112,225,161,.22);border-radius:18px;background:rgba(112,225,161,.07);padding:13px}.gym-modal-plan span{display:block;color:var(--accent);font-size:.78rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px}.gym-modal-plan ul{margin:8px 0 0;padding-left:18px;color:var(--muted);line-height:1.45}.gym-modal-plan p{margin:0;color:var(--text);line-height:1.45}.gym-modal-plan strong{color:var(--text)}
  `,document.head.appendChild(e)},b=()=>X(R,{actual:{},extra:{}}),Y=e=>I(R,e),ae=(e,a)=>`${e}|${a}`,y=(e,a)=>`${e}|extra-${a}`,M=e=>{var a;return((a=b().actual)==null?void 0:a[e])||{}},te=(e,a)=>{const t=b();t.actual=t.actual||{},t.actual[e]={...t.actual[e]||{},...a,updatedAt:new Date().toISOString()},Y(t)},x=e=>{var a;return((a=b().extra)==null?void 0:a[e])||[]},D=(e,a)=>{const t=b();t.extra=t.extra||{},t.extra[e]=a,Y(t)},w=()=>{const e=document.getElementById("todayTraining");if(!e)return;const a=u(),t=$(l),r=M(l),o=x(l),n=S(l);e.innerHTML=`
    <div class="today"><strong>Rutina recomendada:</strong> ${n} · ${t.title}<br><span class="small">Puedes seguirla tal cual, saltarte cosas o añadir lo que hayas hecho realmente.</span></div>
    <section class="cardioRulesCard">
      <h3>Cardio recomendado</h3>
      <ul>${Q.map(i=>`<li>${i}</li>`).join("")}</ul>
    </section>
    <section class="actualLogCard">
      <h3>Lo que he hecho hoy</h3>
      <label>Título real del entreno<input id="actualWorkoutTitle" class="input" placeholder="Ej: Espalda fuerte + cardio" value="${p(r.title||"")}"></label>
      <label style="margin-top:10px">Descripción real<textarea id="actualWorkoutDescription" placeholder="Ej: hice jalón, remo, curl y 25 min de cinta. Me faltó una serie de bíceps.">${p(r.description||"")}</textarea></label>
      <button class="save" id="saveActualWorkout">Guardar descripción</button>
      <p class="small" id="actualSavedMsg"></p>
    </section>
    <article class="day"><div class="dayHead"><h2>${t.title}</h2><p>${n} · ${l}</p></div><div class="content" style="display:block"><h3 class="sectionTitle">Ejercicios recomendados</h3>${t.exercises.map((i,s)=>{const d=ae(l,s);return`<div class="exercise"><div class="exerciseTop"><input class="check" type="checkbox" data-check="${d}" ${a.checks&&a.checks[d]?"checked":""}><div class="exMain"><b>${i[0]}</b><span>${i[1]}</span><textarea class="miniNote" data-note="${d}" placeholder="Opcional: peso usado, reps reales, si faltó algo...">${p(a.exerciseNotes&&a.exerciseNotes[d]||"")}</textarea></div></div></div>`}).join("")}<h3 class="sectionTitle">Añadir ejercicios extra</h3><div class="extraExerciseGrid" id="extraExerciseList">${o.map((i,s)=>re(l,i,s,a)).join("")}</div><label style="margin-top:10px">Nuevo ejercicio<input id="extraExerciseName" class="input" placeholder="Ej: Abdominales, press, bici..."></label><label style="margin-top:8px">Series / detalle<input id="extraExerciseDetail" class="input" placeholder="Ej: 3 x 12 o 20 min"></label><button class="ghost" id="addExtraExercise">Añadir ejercicio</button><h3 class="sectionTitle">Cardio / nota recomendada</h3><p class="small">${t.cardio}</p></div></article>`,oe()},re=(e,a,t,r)=>{const o=y(e,t);return`<div class="exercise"><div class="exerciseTop"><input class="check" type="checkbox" data-check="${o}" ${r.checks&&r.checks[o]?"checked":""}><div class="exMain"><b>${p(a.name)}</b><span>${p(a.detail||"Extra personalizado")}</span><textarea class="miniNote" data-note="${o}" placeholder="Nota del extra...">${p(r.exerciseNotes&&r.exerciseNotes[o]||"")}</textarea><div class="extraExerciseRow"><span class="small">Ejercicio añadido por ti</span><button type="button" data-remove-extra="${t}">Quitar</button></div></div></div></div>`},oe=()=>{var e,a;document.querySelectorAll("[data-check]").forEach(t=>t.addEventListener("change",()=>{var o,n;const r=u();r.checks=r.checks||{},r.checks[t.dataset.check]=t.checked,f(r),(o=window.renderStats)==null||o.call(window),(n=window.renderCalendar)==null||n.call(window)})),document.querySelectorAll("[data-note]").forEach(t=>t.addEventListener("input",()=>{var o;const r=u();r.exerciseNotes=r.exerciseNotes||{},r.exerciseNotes[t.dataset.note]=t.value,f(r),(o=window.renderCalendar)==null||o.call(window)})),(e=document.getElementById("saveActualWorkout"))==null||e.addEventListener("click",()=>{var r,o,n;te(l,{title:((r=document.getElementById("actualWorkoutTitle"))==null?void 0:r.value.trim())||"",description:((o=document.getElementById("actualWorkoutDescription"))==null?void 0:o.value.trim())||""});const t=document.getElementById("actualSavedMsg");t&&(t.textContent="Entreno real guardado para hoy."),(n=window.renderCalendar)==null||n.call(window)}),(a=document.getElementById("addExtraExercise"))==null||a.addEventListener("click",()=>{var n,i,s;const t=(n=document.getElementById("extraExerciseName"))==null?void 0:n.value.trim(),r=(i=document.getElementById("extraExerciseDetail"))==null?void 0:i.value.trim();if(!t)return;const o=x(l);o.push({name:t,detail:r}),D(l,o),w(),(s=window.renderCalendar)==null||s.call(window)}),document.querySelectorAll("[data-remove-extra]").forEach(t=>t.addEventListener("click",()=>{var i,s;const r=Number(t.dataset.removeExtra),o=x(l),n=u();["checks","exerciseNotes"].forEach(d=>{const c=n[d]||{};for(let m=r;m<o.length;m+=1){const g=c[y(l,m+1)];g===void 0?delete c[y(l,m)]:c[y(l,m)]=g}delete c[y(l,o.length-1)],n[d]=c}),f(n),D(l,o.filter((d,c)=>c!==r)),(i=window.renderStats)==null||i.call(window),w(),(s=window.renderCalendar)==null||s.call(window)}))},k=()=>{var d,c;const e=document.getElementById("calendarGrid"),a=((c=(d=document.getElementById("calendarTitle"))==null?void 0:d.textContent)==null?void 0:c.trim().toLowerCase())||"";if(!e)return;const t={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11},r=a.match(/^([a-záéíóúüñ]+)\s+de\s+(\d{4})$/i),o=new Date,n=typeof window.gymCalendarMonth=="function"?window.gymCalendarMonth():null,i=n?n.year:r?Number(r[2]):o.getFullYear(),s=n?n.month:r?t[r[1]]??o.getMonth():o.getMonth();e.querySelectorAll(".calDay:not(.empty)").forEach(m=>{var N,L;const g=(L=(N=m.querySelector(".dayNum"))==null?void 0:N.textContent)==null?void 0:L.trim();if(!g||m.querySelector(".calPlanTitle"))return;const q=`${i}-${String(s+1).padStart(2,"0")}-${String(g).padStart(2,"0")}`,W=M(q),K=$(q),U=W.title||K.title,h=document.createElement("div");h.className="calPlanTitle",h.textContent=U,m.appendChild(h)})},ne=e=>{const a=document.querySelector("[data-gym-modal-body]");if(!a||a.querySelector("[data-modal-plan-extra]"))return;const t=$(e),r=M(e),o=x(e),n=document.createElement("div");n.className="gym-modal-plan",n.setAttribute("data-modal-plan-extra","true"),n.innerHTML=`
    <span>Rutina / tareas del día</span>
    <p><strong>${p(r.title||t.title)}</strong></p>
    ${r.description?`<p>${p(r.description)}</p>`:`<p class="small">Rutina recomendada para ${S(e)}. Puedes editar lo real desde Hoy.</p>`}
    <ul>${t.exercises.map(([i,s])=>`<li>${i} · ${s}</li>`).join("")}${o.map(i=>`<li>${p(i.name)} · ${p(i.detail||"Extra")}</li>`).join("")}</ul>
    <p class="small" style="margin-top:8px"><strong>Cardio:</strong> ${t.cardio}</p>
  `,a.prepend(n)},ie=()=>{document.addEventListener("click",e=>{var r;const a=e.target.closest(".calDay:not(.empty)"),t=(r=a==null?void 0:a.dataset)==null?void 0:r.date;t&&window.setTimeout(()=>ne(t),80)},!0)},se=()=>{if(typeof window.renderCalendar=="function"&&!window.renderCalendar.__monthlyPlanPatched){const e=window.renderCalendar;window.renderCalendar=function(...t){const r=e.apply(this,t);return window.requestAnimationFrame(k),r},window.renderCalendar.__monthlyPlanPatched=!0}k()},P=()=>{ee(),w(),se(),ie(),window.requestAnimationFrame(k)};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",P):P();const de=["alvrichGymMayAutoV2","alvrichGymMayAutoV1"],ce=()=>{for(const e of de){const a=localStorage.getItem(e);if(a)try{return JSON.parse(a)}catch(t){console.warn("Could not parse gym storage",e,t)}}return{logs:{},checks:{},exerciseNotes:{}}},le=()=>{if(document.querySelector("[data-gym-pro-max-style]"))return;const e=document.createElement("style");e.setAttribute("data-gym-pro-max-style","true"),e.textContent=`
    :root {
      --gym-radius-xl: 28px;
      --gym-radius-lg: 22px;
      --gym-glass: rgba(16, 24, 39, .78);
      --gym-glass-strong: rgba(16, 24, 39, .92);
      --gym-surface-line: rgba(255, 255, 255, .14);
      --gym-soft-shadow: 0 26px 72px rgba(0, 0, 0, .38);
    }

    body.gym-pro-max {
      position: relative;
      background:
        radial-gradient(circle at 16% -8%, rgba(112,225,161,.24), transparent 30%),
        radial-gradient(circle at 88% 4%, rgba(101,167,255,.24), transparent 27%),
        linear-gradient(180deg, #08101a 0%, #05070d 58%, #060a12 100%);
    }

    body.gym-pro-max::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      opacity: .36;
      background-image:
        linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
      background-size: 44px 44px;
      mask-image: radial-gradient(circle at top, #000 0%, transparent 68%);
      -webkit-mask-image: radial-gradient(circle at top, #000 0%, transparent 68%);
    }

    body.gym-pro-max .app {
      position: relative;
      z-index: 1;
    }

    body.gym-pro-max .top {
      border-radius: 0 0 26px 26px;
    }

    body.gym-pro-max .back {
      min-height: 2.8rem;
      align-items: center;
      gap: .4rem;
      border-color: rgba(255,255,255,.12);
      background: rgba(255,255,255,.055);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
      transition: transform .18s ease, border-color .18s ease, background .18s ease;
    }

    body.gym-pro-max .back:hover,
    body.gym-pro-max .back:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.36);
      background: rgba(112,225,161,.09);
    }

    body.gym-pro-max .brand h1 {
      letter-spacing: -.06em;
      background: linear-gradient(135deg, #f7fbff 16%, var(--accent) 62%, var(--accent2));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    body.gym-pro-max .brand p {
      max-width: 34ch;
      line-height: 1.35;
    }

    body.gym-pro-max .pill {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      border-color: rgba(112,225,161,.28);
      background: rgba(112,225,161,.09);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 0 0 1px rgba(112,225,161,.08);
    }

    body.gym-pro-max .pill::before {
      content: "";
      width: .48rem;
      height: .48rem;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 6px rgba(112,225,161,.12);
    }

    body.gym-pro-max .hero,
    body.gym-pro-max .card,
    body.gym-pro-max .day,
    body.gym-pro-max .today {
      border-color: var(--gym-surface-line);
      box-shadow: var(--gym-soft-shadow), inset 0 1px 0 rgba(255,255,255,.065);
    }

    body.gym-pro-max .hero {
      position: relative;
      overflow: hidden;
      padding: clamp(1rem, 4vw, 1.45rem);
      border-radius: var(--gym-radius-xl);
      background:
        radial-gradient(circle at 8% 0%, rgba(112,225,161,.2), transparent 33%),
        radial-gradient(circle at 100% 10%, rgba(101,167,255,.18), transparent 36%),
        linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.026)),
        var(--gym-glass);
    }

    body.gym-pro-max .hero::after {
      content: "";
      position: absolute;
      inset: auto -20% -45% -20%;
      height: 11rem;
      background: radial-gradient(circle, rgba(112,225,161,.12), transparent 62%);
      pointer-events: none;
    }

    body.gym-pro-max .hero > * {
      position: relative;
      z-index: 1;
    }

    body.gym-pro-max .hero p {
      margin-top: 0;
      color: #d7e5f5;
      font-size: clamp(.98rem, 2.4vw, 1.08rem);
      line-height: 1.55;
    }

    .gym-command-strip {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: .62rem;
      margin: .95rem 0 0;
    }

    .gym-command-card {
      min-width: 0;
      border: 1px solid rgba(255,255,255,.11);
      border-radius: 18px;
      padding: .82rem;
      background: rgba(0,0,0,.18);
    }

    .gym-command-card span {
      display: block;
      color: var(--muted);
      font-size: .7rem;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
      line-height: 1.2;
    }

    .gym-command-card strong {
      display: block;
      margin-top: .35rem;
      color: var(--text);
      font-size: clamp(.92rem, 2.8vw, 1.08rem);
      line-height: 1.08;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    body.gym-pro-max .quickActions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .72rem;
    }

    body.gym-pro-max .quickBtn:first-child {
      grid-column: 1 / -1;
    }

    body.gym-pro-max .quickBtn {
      min-height: 3.3rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 18px;
      box-shadow: 0 18px 42px rgba(112,225,161,.14);
      transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
    }

    body.gym-pro-max .quickBtn:hover,
    body.gym-pro-max .quickBtn:focus-visible {
      transform: translateY(-2px);
      filter: brightness(1.04);
      box-shadow: 0 22px 52px rgba(112,225,161,.18);
    }

    body.gym-pro-max .quickBtn.secondary {
      background: rgba(255,255,255,.07);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
    }

    body.gym-pro-max .stats {
      gap: .72rem;
    }

    body.gym-pro-max .stat {
      position: relative;
      overflow: hidden;
      border-radius: 18px;
      border-color: rgba(255,255,255,.11);
      background:
        linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.018)),
        rgba(0,0,0,.2);
    }

    body.gym-pro-max .stat::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at top right, rgba(112,225,161,.09), transparent 52%);
      opacity: .9;
      pointer-events: none;
    }

    body.gym-pro-max .stat > * {
      position: relative;
      z-index: 1;
    }

    body.gym-pro-max .stat span {
      font-weight: 900;
      letter-spacing: .06em;
      text-transform: uppercase;
    }

    body.gym-pro-max .stat b {
      display: block;
      margin-top: .22rem;
      font-size: clamp(1.05rem, 4.5vw, 1.48rem);
      line-height: 1.05;
    }

    body.gym-pro-max .tabs {
      box-shadow: 0 -18px 54px rgba(0,0,0,.34), inset 0 1px 0 rgba(255,255,255,.055);
    }

    body.gym-pro-max .tab {
      min-height: 3rem;
      transition: transform .16s ease, background .16s ease, color .16s ease, border-color .16s ease;
    }

    body.gym-pro-max .tab:active {
      transform: scale(.97);
    }

    body.gym-pro-max .today {
      background:
        radial-gradient(circle at 100% 0%, rgba(112,225,161,.12), transparent 40%),
        rgba(112,225,161,.07);
    }

    body.gym-pro-max .dayHead h2,
    body.gym-pro-max .card h2,
    body.gym-pro-max .card h3 {
      letter-spacing: -.035em;
      line-height: 1.08;
    }

    body.gym-pro-max .exercise {
      transition: background .16s ease, border-color .16s ease;
    }

    body.gym-pro-max .exercise:focus-within,
    body.gym-pro-max .exercise:hover {
      background: rgba(255,255,255,.025);
    }

    body.gym-pro-max .check {
      width: 32px;
      height: 32px;
      cursor: pointer;
    }

    body.gym-pro-max .input,
    body.gym-pro-max textarea,
    body.gym-pro-max select,
    body.gym-pro-max .miniNote {
      transition: border-color .16s ease, box-shadow .16s ease, background .16s ease;
    }

    body.gym-pro-max .input:focus,
    body.gym-pro-max textarea:focus,
    body.gym-pro-max select:focus,
    body.gym-pro-max .miniNote:focus {
      outline: 0;
      border-color: rgba(112,225,161,.48);
      box-shadow: 0 0 0 4px rgba(112,225,161,.12);
      background: #0c1627;
    }

    body.gym-pro-max .save,
    body.gym-pro-max .ghost {
      min-height: 3.25rem;
      cursor: pointer;
      transition: transform .16s ease, filter .16s ease, border-color .16s ease;
    }

    body.gym-pro-max .save:hover,
    body.gym-pro-max .ghost:hover,
    body.gym-pro-max .save:focus-visible,
    body.gym-pro-max .ghost:focus-visible {
      transform: translateY(-1px);
      filter: brightness(1.04);
    }

    body.gym-pro-max .calendarHead {
      position: sticky;
      top: 0;
      z-index: 2;
      padding: .25rem 0 .45rem;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    body.gym-pro-max .monthBtn {
      min-width: 2.8rem;
      cursor: pointer;
      transition: transform .16s ease, border-color .16s ease, background .16s ease;
    }

    body.gym-pro-max .monthBtn:hover,
    body.gym-pro-max .monthBtn:focus-visible {
      transform: translateY(-1px);
      border-color: rgba(112,225,161,.34);
      background: rgba(112,225,161,.09);
    }

    body.gym-pro-max .calendarTitle {
      letter-spacing: -.02em;
    }

    body.gym-pro-max .calDay {
      position: relative;
      transition: transform .16s ease, border-color .16s ease, background .16s ease, box-shadow .16s ease;
    }

    body.gym-pro-max .calDay:not(.empty):hover,
    body.gym-pro-max .calDay:not(.empty):focus-visible {
      transform: translateY(-2px);
      border-color: rgba(112,225,161,.34);
      box-shadow: 0 14px 28px rgba(0,0,0,.24);
    }

    body.gym-pro-max .calDay.todayCal::after {
      content: "";
      position: absolute;
      top: .42rem;
      right: .42rem;
      width: .45rem;
      height: .45rem;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 5px rgba(112,225,161,.13);
    }

    @media (max-width: 520px) {
      body.gym-pro-max {
        padding-top: 10px;
      }

      body.gym-pro-max .tabs {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      body.gym-pro-max .tab,
      body.gym-pro-max .quickBtn,
      body.gym-pro-max .stat,
      .gym-command-card {
        min-width: 0;
      }

      body.gym-pro-max .tab,
      body.gym-pro-max .quickBtn {
        line-height: 1.12;
        overflow-wrap: anywhere;
        white-space: normal;
      }

      body.gym-pro-max .quickBtn {
        padding-inline: .68rem;
        font-size: .94rem;
      }

      .gym-command-strip {
        grid-template-columns: 1fr;
        gap: .52rem;
      }

      .gym-command-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: .75rem;
        padding: .78rem .86rem;
      }

      .gym-command-card strong {
        margin-top: 0;
        text-align: right;
        max-width: 54%;
        white-space: normal;
        overflow-wrap: anywhere;
      }

      body.gym-pro-max .quickActions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      body.gym-pro-max .stats {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 400px) {
      body.gym-pro-max .quickActions {
        grid-template-columns: 1fr;
      }

      body.gym-pro-max .tabs {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      body.gym-pro-max .tab {
        min-height: 2.65rem;
      }
    }

    @media (min-width: 700px) {
      body.gym-pro-max .quickActions {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      body.gym-pro-max .quickBtn:first-child {
        grid-column: auto;
      }

      body.gym-pro-max .tabs {
        position: sticky;
        top: .8rem;
        z-index: 8;
        background: rgba(7,10,18,.72);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      body.gym-pro-max *,
      body.gym-pro-max *::before,
      body.gym-pro-max *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
        transition-duration: .01ms !important;
      }
    }
  `,document.head.appendChild(e)},me=()=>{let e=document.querySelector('meta[name="theme-color"]');e||(e=document.createElement("meta"),e.name="theme-color",document.head.appendChild(e)),e.content="#08101a"},pe=e=>{const a=new Set;return Object.entries(e.checks||{}).forEach(([t,r])=>{r&&a.add(t.split("|")[0])}),a.size},ge=()=>{const e=document.querySelector(".hero");if(!e||e.querySelector("[data-gym-command-strip]"))return;const a=e.querySelector("p"),t=document.createElement("div");t.className="gym-command-strip",t.setAttribute("data-gym-command-strip","true"),t.innerHTML=`
    <div class="gym-command-card">
      <span>Foco hoy</span>
      <strong data-gym-pro-focus>Hoy</strong>
    </div>
    <div class="gym-command-card">
      <span>Peso actual</span>
      <strong data-gym-pro-weight>—</strong>
    </div>
    <div class="gym-command-card">
      <span>Consistencia</span>
      <strong data-gym-pro-consistency>0 días</strong>
    </div>
  `,a?a.insertAdjacentElement("afterend",t):e.prepend(t)},_=()=>{var i,s,d,c;const e=ce(),a=document.querySelector("[data-gym-pro-focus]"),t=document.querySelector("[data-gym-pro-weight]"),r=document.querySelector("[data-gym-pro-consistency]"),o=document.getElementById("todayPill"),n=document.getElementById("currentWeight");a&&(a.textContent=((d=(s=(i=o==null?void 0:o.textContent)==null?void 0:i.split("·"))==null?void 0:s[0])==null?void 0:d.trim())||"Hoy"),t&&(t.textContent=((c=n==null?void 0:n.textContent)==null?void 0:c.trim())||"—"),r&&(r.textContent=`${pe(e)} días`)},ye=()=>{const e=()=>window.setTimeout(_,80);document.addEventListener("click",e,!0),document.addEventListener("input",e,!0),window.addEventListener("storage",e)},T=()=>{document.body.classList.add("gym-pro-max"),le(),me(),ge(),_(),ye()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",T):T();const v=e=>String(e??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a]),ue=["alvrichGymMayAutoV2","alvrichGymMayAutoV1"],H=()=>{for(const e of ue){const a=localStorage.getItem(e);if(a)try{return JSON.parse(a)}catch(t){console.warn("Could not parse gym storage",e,t)}}return{logs:{},checks:{},exerciseNotes:{}}},z=e=>{if(!e)return"";const a=Number.parseFloat(String(e).replace(",","."));return Number.isNaN(a)?String(e):`${a.toFixed(1)} kg`},xe=e=>["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][new Date(`${e}T12:00:00`).getDay()],be={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,setiembre:8,octubre:9,noviembre:10,diciembre:11},he=()=>{var t,r;if(typeof window.gymCalendarMonth=="function")return window.gymCalendarMonth();const a=(((r=(t=document.getElementById("calendarTitle"))==null?void 0:t.textContent)==null?void 0:r.trim().toLowerCase())||"").match(/^([a-záéíóúüñ]+)\s+de\s+(\d{4})$/i);if(!a){const o=new Date;return{year:o.getFullYear(),month:o.getMonth()}}return{year:Number(a[2]),month:be[a[1]]??new Date().getMonth()}},fe=()=>{if(document.querySelector("[data-gym-polish-style]"))return;const e=document.createElement("style");e.setAttribute("data-gym-polish-style","true"),e.textContent=`
    .calDay:not(.empty) {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: transform .16s ease, border-color .16s ease, background .16s ease;
    }

    .calDay:not(.empty):active {
      transform: scale(.97);
    }

    .calDay.has-entry {
      border-color: rgba(112,225,161,.42);
      background: linear-gradient(180deg, rgba(112,225,161,.11), rgba(255,255,255,.045));
    }

    .gym-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      display: grid;
      place-items: end center;
      padding: 18px 14px calc(18px + env(safe-area-inset-bottom));
      background: rgba(3, 6, 12, .66);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease;
    }

    .gym-modal-backdrop.is-open {
      opacity: 1;
      pointer-events: auto;
    }

    .gym-modal {
      width: min(100%, 520px);
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 28px;
      background:
        radial-gradient(circle at top left, rgba(112,225,161,.16), transparent 34%),
        linear-gradient(180deg, rgba(16,24,39,.96), rgba(7,10,18,.98));
      box-shadow: 0 28px 80px rgba(0,0,0,.48);
      padding: 18px;
      transform: translateY(18px) scale(.98);
      transition: transform .18s ease;
    }

    .gym-modal-backdrop.is-open .gym-modal {
      transform: translateY(0) scale(1);
    }

    .gym-modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 14px;
    }

    .gym-modal-kicker {
      margin: 0 0 5px;
      color: var(--accent);
      font-weight: 900;
      font-size: .82rem;
      letter-spacing: .09em;
      text-transform: uppercase;
    }

    .gym-modal-title {
      margin: 0;
      font-size: 1.38rem;
      line-height: 1.05;
    }

    .gym-modal-close {
      width: 42px;
      height: 42px;
      flex: 0 0 auto;
      border: 1px solid rgba(255,255,255,.13);
      border-radius: 15px;
      background: rgba(255,255,255,.06);
      color: var(--text);
      font-size: 1.35rem;
      font-weight: 900;
    }

    .gym-modal-grid {
      display: grid;
      gap: 10px;
    }

    .gym-modal-stat,
    .gym-modal-note,
    .gym-modal-empty {
      border: 1px solid rgba(255,255,255,.11);
      border-radius: 18px;
      background: rgba(255,255,255,.055);
      padding: 13px;
    }

    .gym-modal-stat span,
    .gym-modal-note span {
      display: block;
      color: var(--muted);
      font-size: .78rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: 4px;
    }

    .gym-modal-stat strong {
      color: var(--accent);
      font-size: 1.32rem;
    }

    .gym-modal-note p,
    .gym-modal-empty p {
      margin: 0;
      color: var(--text);
      line-height: 1.45;
    }

    .gym-modal-notes-list {
      margin: 8px 0 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.45;
    }

    @media (max-width: 520px) {
      body {
        padding: 8px 8px 94px;
      }

      .app {
        max-width: 100%;
      }

      .top {
        position: relative;
        padding: 0 0 8px;
        background: transparent;
      }

      .back {
        margin-bottom: 8px;
        padding: 9px 12px;
        font-size: .93rem;
      }

      .brand {
        display: grid;
        grid-template-columns: 1fr;
        gap: 8px;
        align-items: start;
      }

      .brand h1 {
        font-size: clamp(2rem, 12vw, 2.55rem);
        letter-spacing: -.055em;
      }

      .brand p {
        max-width: 14rem;
        margin-top: 4px;
        font-size: .98rem;
        line-height: 1.18;
      }

      .pill {
        justify-self: start;
        padding: 8px 11px;
        font-size: .9rem;
        max-width: 100%;
      }

      .hero {
        margin-top: 6px;
        padding: 16px;
        border-radius: 22px;
      }

      .hero p {
        margin-top: 0;
      }

      .quickActions {
        margin-top: 12px;
        gap: 8px;
      }

      .quickBtn {
        padding: 14px 12px;
        border-radius: 16px;
      }

      .stats {
        gap: 8px;
      }

      .stat {
        padding: 10px;
      }

      .tabs {
        gap: 6px;
        padding-left: 8px;
        padding-right: 8px;
      }

      .tab {
        padding: 10px 4px;
        font-size: .78rem;
        border-radius: 14px;
      }

      .calendarGrid {
        gap: 5px;
      }

      .calDay {
        min-height: 68px;
        border-radius: 14px;
        padding: 7px;
      }
    }
  `,document.head.appendChild(e)},F=()=>{let e=document.querySelector("[data-gym-modal-backdrop]");return e||(e=document.createElement("div"),e.className="gym-modal-backdrop",e.setAttribute("data-gym-modal-backdrop","true"),e.innerHTML=`
    <section class="gym-modal" role="dialog" aria-modal="true" aria-labelledby="gym-modal-title">
      <div class="gym-modal-head">
        <div>
          <p class="gym-modal-kicker" data-gym-modal-kicker>Día</p>
          <h2 class="gym-modal-title" id="gym-modal-title" data-gym-modal-title></h2>
        </div>
        <button class="gym-modal-close" type="button" data-gym-modal-close aria-label="Cerrar">×</button>
      </div>
      <div class="gym-modal-grid" data-gym-modal-body></div>
    </section>
  `,document.body.appendChild(e),e.addEventListener("click",a=>{(a.target===e||a.target.closest("[data-gym-modal-close]"))&&G()}),document.addEventListener("keydown",a=>{a.key==="Escape"&&G()}),e)},G=()=>{const e=document.querySelector("[data-gym-modal-backdrop]");e&&(e.classList.remove("is-open"),document.body.style.overflow="")},J=(e,a)=>Object.entries(e.exerciseNotes||{}).filter(([t,r])=>t.startsWith(`${a}|`)&&String(r).trim()).map(([,t])=>String(t).trim()),V=(e,a)=>Object.entries(e.checks||{}).filter(([t,r])=>t.startsWith(`${a}|`)&&r).length,j=e=>{const a=F(),t=H(),r=(t.logs||{})[e]||{},o=a.querySelector("[data-gym-modal-title]"),n=a.querySelector("[data-gym-modal-kicker]"),i=a.querySelector("[data-gym-modal-body]"),s=V(t,e),d=J(t,e);n.textContent=`${xe(e)} · ${e}`,o.textContent=r.weight?z(r.weight):"Sin peso guardado";const c=d.length?`<ul class="gym-modal-notes-list">${d.map(m=>`<li>${v(m)}</li>`).join("")}</ul>`:"";i.innerHTML=`
    <div class="gym-modal-stat">
      <span>Peso</span>
      <strong>${r.weight?z(r.weight):"—"}</strong>
    </div>
    <div class="gym-modal-stat">
      <span>Ejercicios marcados</span>
      <strong>${s}</strong>
    </div>
    ${r.feeling?`<div class="gym-modal-note"><span>Sensación</span><p>${v(r.feeling)}</p></div>`:""}
    ${r.notes?`<div class="gym-modal-note"><span>Nota del día</span><p>${v(r.notes)}</p></div>`:""}
    ${c?`<div class="gym-modal-note"><span>Notas de ejercicios</span>${c}</div>`:""}
    ${!r.weight&&!r.notes&&!r.feeling&&s===0&&!d.length?'<div class="gym-modal-empty"><p>No hay datos guardados para este día todavía.</p></div>':""}
  `,document.body.style.overflow="hidden",a.classList.add("is-open")},E=()=>{const e=document.getElementById("calendarGrid");if(!e)return;const a=H(),{year:t,month:r}=he();e.querySelectorAll(".calDay:not(.empty)").forEach(o=>{var m,g;const n=(g=(m=o.querySelector(".dayNum"))==null?void 0:m.textContent)==null?void 0:g.trim();if(!n)return;const i=`${t}-${String(r+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`,s=!!(a.logs||{})[i],d=V(a,i)>0,c=J(a,i).length>0;o.dataset.date=i,o.setAttribute("role","button"),o.setAttribute("tabindex","0"),o.setAttribute("aria-label",`Ver detalles del ${i}`),o.classList.toggle("has-entry",s||d||c)})},C=()=>{const e=document.getElementById("calendarGrid");!e||e.dataset.gymModalHooked==="true"||(e.dataset.gymModalHooked="true",e.addEventListener("click",a=>{var r;const t=a.target.closest(".calDay:not(.empty)");(r=t==null?void 0:t.dataset)!=null&&r.date&&j(t.dataset.date)}),e.addEventListener("keydown",a=>{var r;if(a.key!=="Enter"&&a.key!==" ")return;const t=a.target.closest(".calDay:not(.empty)");(r=t==null?void 0:t.dataset)!=null&&r.date&&(a.preventDefault(),j(t.dataset.date))}))},ve=()=>{if(typeof window.renderCalendar!="function"||window.renderCalendar.__gymPatched){E(),C();return}const e=window.renderCalendar;window.renderCalendar=function(...t){const r=e.apply(this,t);return window.requestAnimationFrame(()=>{E(),C()}),r},window.renderCalendar.__gymPatched=!0},B=()=>{fe(),F(),ve(),window.requestAnimationFrame(()=>{E(),C()})};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",B):B();

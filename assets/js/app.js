/* EduLab – Matemática & Física (front-end puro) */

// ---------- Estado & Dados ----------
const state = {
  route: "home",
  query: "",
  subject: "todas",
  level: "todos",
  user: JSON.parse(localStorage.getItem("edulab_user") || "null"),
  progress: JSON.parse(localStorage.getItem("edulab_progress") || "{}"),
  wishlist: JSON.parse(localStorage.getItem("edulab_wishlist") || "[]"),
};

// Cursos e E-books exemplos (Matemática & Física)
/** Tipos:
 * course: {id,title,subject,level,tags,desc,cover,lessons:[{id,title,type,videoUrl,content,duration}]}
 * ebook: {id,title,subject,level,tags,desc,cover,chapters:[{id,title,content}]}
 */
const db = {
  courses: [
    {
      id: "fis-cinematica",
      title: "Cinemática Clássica do Zero",
      subject: "fisica",
      level: "basico",
      tags: ["movimento", "MRU", "MRUV"],
      desc: "Conceitos fundamentais de posição, velocidade e aceleração com exercícios guiados.",
      cover: "🎥",
      lessons: [
        { id: "l1", title: "Introdução: Grandezas e Unidades", type: "video", duration: "08:21", videoUrl: "" },
        { id: "l2", title: "Movimento Retilíneo Uniforme (MRU)", type: "video", duration: "12:04", videoUrl: "" },
        { id: "l3", title: "Movimento Uniformemente Variado (MUV)", type: "video", duration: "14:56", videoUrl: "" },
        { id: "l4", title: "Lançamento Vertical", type: "video", duration: "11:10", videoUrl: "" },
        { id: "l5", title: "Exercícios Comentados", type: "article", content: sampleExercises("cinematica") },
      ],
    },
    {
      id: "mat-calculo1",
      title: "Cálculo I: Limites e Derivadas",
      subject: "matematica",
      level: "intermediario",
      tags: ["limites", "derivadas", "regras"],
      desc: "Da definição de limite às principais regras de derivação, com aplicações físicas.",
      cover: "∂",
      lessons: [
        { id: "l1", title: "Intuição de Limites", type: "video", duration: "09:48", videoUrl: "" },
        { id: "l2", title: "Definição ε-δ (opcional)", type: "article", content: sampleArticle("epsdelta") },
        { id: "l3", title: "Regras de Derivação", type: "video", duration: "13:37", videoUrl: "" },
        { id: "l4", title: "Máximos, Mínimos e Otimização", type: "video", duration: "10:45", videoUrl: "" },
        { id: "l5", title: "Exercícios Práticos", type: "article", content: sampleExercises("derivadas") },
      ],
    },
    {
      id: "fis-eletricidade",
      title: "Eletricidade Básica",
      subject: "fisica",
      level: "basico",
      tags: ["circuitos", "resistores", "ohm"],
      desc: "Tensão, corrente, potência e análise de circuitos DC com a Lei de Ohm.",
      cover: "⚡",
      lessons: [
        { id: "l1", title: "Tensão, Corrente e Resistência", type: "video", duration: "07:33", videoUrl: "" },
        { id: "l2", title: "Lei de Ohm e Associação de Resistores", type: "video", duration: "12:10", videoUrl: "" },
        { id: "l3", title: "Potência Elétrica", type: "video", duration: "08:20", videoUrl: "" },
        { id: "l4", title: "Exercícios", type: "article", content: sampleExercises("ohm") },
      ],
    },
    {
      id: "mat-geometria",
      title: "Geometria Analítica Essencial",
      subject: "matematica",
      level: "basico",
      tags: ["reta", "círculo", "distância"],
      desc: "Plano cartesiano, equação da reta, distância ponto-reta e circunferência.",
      cover: "📐",
      lessons: [
        { id: "l1", title: "Plano Cartesiano e Vetores", type: "video", duration: "09:02", videoUrl: "" },
        { id: "l2", title: "Equações de Retas", type: "video", duration: "12:30", videoUrl: "" },
        { id: "l3", title: "Circunferência", type: "video", duration: "11:12", videoUrl: "" },
        { id: "l4", title: "Distâncias", type: "article", content: sampleExercises("geometria") },
      ],
    },
  ],
  ebooks: [
    {
      id: "ebook-mec-newton",
      title: "Leis de Newton na Prática",
      subject: "fisica",
      level: "basico",
      tags: ["força", "massa", "aceleração"],
      desc: "E‑book introdutório sobre as três leis de Newton com exemplos cotidianos.",
      cover: "📘",
      chapters: [
        { id: "c1", title: "1. Inércia", content: sampleChapter("iner") },
        { id: "c2", title: "2. Dinâmica: F = m·a", content: sampleChapter("din") },
        { id: "c3", title: "3. Ação e Reação", content: sampleChapter("ar") },
      ]
    },
    {
      id: "ebook-calculo-int",
      title: "Integrais: Ideias e Técnicas",
      subject: "matematica",
      level: "intermediario",
      tags: ["área", "antiderivada", "substituição"],
      desc: "Do conceito de área até substituição, partes e aplicações.",
      cover: "📙",
      chapters: [
        { id: "c1", title: "1. Intuição de Integral", content: sampleChapter("int_intuicao") },
        { id: "c2", title: "2. Substituição", content: sampleChapter("sub") },
        { id: "c3", title: "3. Integração por Partes", content: sampleChapter("partes") },
      ]
    }
  ]
};

// ---------- Utilidades ----------
function $(sel, root=document){ return root.querySelector(sel); }
function $all(sel, root=document){ return [...root.querySelectorAll(sel)]; }
function save(){ localStorage.setItem("edulab_progress", JSON.stringify(state.progress)); localStorage.setItem("edulab_wishlist", JSON.stringify(state.wishlist)); }
function slug(s){ return s.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }
function pct(a,b){ return b? Math.round((a/b)*100):0; }
function nowYear(){ return new Date().getFullYear(); }

// ---------- Inicialização ----------
window.addEventListener("DOMContentLoaded", () => {
  $("#year").textContent = nowYear();
  bindGlobalUI();
  routeTo("home");
});

function bindGlobalUI(){
  // Nav
  $all(".nav__link").forEach(btn => {
    btn.addEventListener("click", () => routeTo(btn.dataset.route));
  });

  // Busca
  $("#searchInput").addEventListener("input", (e) => {
    state.query = e.target.value.trim().toLowerCase();
    refresh();
  });

  // // Tema
  // $("#btnDark").addEventListener("click", () => {
  //   const r = document.documentElement;
  //   const light = r.classList.toggle("light");
  //   localStorage.setItem("edulab_theme", light? "light":"dark");
  // });
  // const remembered = localStorage.getItem("edulab_theme");
  // if(remembered === "light"){ document.documentElement.classList.add("light"); }

  // // Login
  // $("#btnLogin").addEventListener("click", openLogin);
  // $("#doLogin").addEventListener("click", () => {
  //   const name = $("#loginName").value.trim();
  //   if(name){
  //     state.user = { name };
  //     localStorage.setItem("edulab_user", JSON.stringify(state.user));
  //     $("#loginDialog").close();
  //     notify(`Olá, ${name}!`);
  //     refresh();
  //   }
  // });
}

function openLogin(){
  $("#loginName").value = state.user?.name || "";
  $("#loginDialog").showModal();
}

function routeTo(route, params={}){
  state.route = route;
  state.params = params;
  $all(".nav__link").forEach(b => b.removeAttribute("aria-current"));
  const current = $(`.nav__link[data-route="${route}"]`);
  if(current) current.setAttribute("aria-current","page");
  refresh();
}

// ---------- Renderização ----------
function refresh(){
  const root = $("#app");
  root.innerHTML = "";

  const filteredCourses = db.courses.filter(c => {
    let okQ = !state.query || [c.title, c.desc, ...(c.tags||[])].join(" ").toLowerCase().includes(state.query);
    let okS = state.subject === "todas" || c.subject === state.subject;
    let okL = state.level === "todos" || c.level === state.level;
    return okQ && okS && okL;
  });
  const filteredEbooks = db.ebooks.filter(e => {
    let okQ = !state.query || [e.title, e.desc, ...(e.tags||[])].join(" ").toLowerCase().includes(state.query);
    let okS = state.subject === "todas" || e.subject === state.subject;
    let okL = state.level === "todos" || e.level === state.level;
    return okQ && okS && okL;
  });

  if(state.route === "home"){
    renderHome(root, filteredCourses, filteredEbooks);
  } else if(state.route === "courses"){
    renderCourses(root, filteredCourses);
  } else if(state.route === "ebooks"){
    renderEbooks(root, filteredEbooks);
  } else if(state.route === "my"){
    renderMy(root);
  } else if(state.route === "admin"){
    renderAdmin(root);
  } else if(state.route === "course-detail"){
    renderCourseDetail(root, state.params.id);
  } else if(state.route === "ebook-detail"){
    renderEbookDetail(root, state.params.id);
  }
}

function filterBar(){
  const wrapper = document.createElement("div");
  wrapper.className = "filters";
  wrapper.innerHTML = `
    <div class="chips" role="tablist" aria-label="Área">
      ${chip("todas","Todas", state.subject==="todas", () => {state.subject="todas"; refresh();})}
      ${chip("matematica","Matemática", state.subject==="matematica", () => {state.subject="matematica"; refresh();})}
      ${chip("fisica","Física", state.subject==="fisica", () => {state.subject="fisica"; refresh();})}
    </div>
    <div class="chips" role="tablist" aria-label="Nível">
      ${chip("todos","Todos", state.level==="todos", () => {state.level="todos"; refresh();})}
      ${chip("basico","Básico", state.level==="basico", () => {state.level="basico"; refresh();})}
      ${chip("intermediario","Intermediário", state.level==="intermediario", () => {state.level="intermediario"; refresh();})}
      ${chip("avancado","Avançado", state.level==="avancado", () => {state.level="avancado"; refresh();})}
    </div>
  `;
  return wrapper;
}

function chip(key, label, active, onClick){
  const id = `chip-${key}-${Math.random().toString(36).slice(2,7)}`;
  const html = `<button id="${id}" class="chip ${active?'active':''}" role="tab" aria-selected="${active}">${label}</button>`;
  setTimeout(() => { const el = document.getElementById(id); if(el) el.addEventListener("click", onClick); }, 0);
  return html;
}

function renderHome(root, courses, ebooks){
  const sec = el("section","section");
  sec.innerHTML = `
    <div class="hero card" style="padding:18px 18px 4px;">
      <div class="card__body">
        <h2 style="margin:.2rem 0 0;">Bem-vindo 👋</h2>
        <p class="card__desc">Estude Matemática e Física em cursos práticos e e‑books concisos. Progrida no seu ritmo, com seu avanço salvo no navegador.</p>
        <div class="chips" style="margin-top:6px">
          <span class="chip">HTML • CSS • JS puro</span>
          <span class="chip">LocalStorage</span>
          <span class="chip">Responsivo</span>
        </div>
      </div>
    </div>
  `;
  root.append(sec);

  // Trilhas em destaque
  const sec2 = el("section","section");
  const filters = filterBar();
  const grid = el("div","grid");

  courses.slice(0,6).forEach(c => grid.append(cardCourse(c)));
  ebooks.slice(0,6).forEach(e => grid.append(cardEbook(e)));

  sec2.append(head("Destaques"), filters, grid);
  root.append(sec2);
}

function renderCourses(root, courses){
  const sec = el("section","section");
  sec.append(head("Cursos"));
  sec.append(filterBar());
  const grid = el("div","grid");
  if(!courses.length) grid.append(empty("Nenhum curso encontrado."));
  else courses.forEach(c => grid.append(cardCourse(c)));
  sec.append(grid);
  root.append(sec);
}

function renderEbooks(root, ebooks){
  const sec = el("section","section");
  sec.append(head("E‑books"));
  sec.append(filterBar());
  const grid = el("div","grid");
  if(!ebooks.length) grid.append(empty("Nenhum e‑book encontrado."));
  else ebooks.forEach(e => grid.append(cardEbook(e)));
  sec.append(grid);
  root.append(sec);
}

function renderMy(root){
  const sec = el("section","section");
  sec.append(head("Meu Aprendizado"));

  // Progresso em cursos
  const gridC = el("div","grid");
  const myCourses = db.courses.filter(c => getCourseProgressPct(c.id) > 0 || state.wishlist.includes(c.id));
  if(!myCourses.length) gridC.append(empty("Você ainda não iniciou cursos. Explore a aba Cursos."));
  else myCourses.forEach(c => gridC.append(cardCourse(c)));
  sec.append(subtitle("Cursos"), gridC);

  // Progresso em ebooks
  const gridE = el("div","grid");
  const myEbooks = db.ebooks.filter(e => getEbookProgressPct(e.id) > 0 || state.wishlist.includes(e.id));
  if(!myEbooks.length) gridE.append(empty("Você ainda não abriu e‑books. Veja a aba E‑books."));
  else myEbooks.forEach(e => gridE.append(cardEbook(e)));
  sec.append(subtitle("E‑books"), gridE);

  root.append(sec);
}

function renderAdmin(root){
  const sec = el("section","section");
  sec.append(head("Admin • Novo conteúdo"));

  const form = el("form");
  form.innerHTML = `
    <div class="form-row">
      <label>Título <input id="admTitle" class="input" required /></label>
      <label>Tipo
        <select id="admType">
          <option value="course">Curso</option>
          <option value="ebook">E‑book</option>
        </select>
      </label>
    </div>
    <div class="form-row">
      <label>Área
        <select id="admSubject">
          <option value="matematica">Matemática</option>
          <option value="fisica">Física</option>
        </select>
      </label>
      <label>Nível
        <select id="admLevel">
          <option value="basico">Básico</option>
          <option value="intermediario">Intermediário</option>
          <option value="avancado">Avançado</option>
        </select>
      </label>
    </div>
    <label>Tags (separe por vírgula) <input id="admTags" class="input" placeholder="ex.: MRU, MRUV" /></label>
    <label>Descrição <textarea id="admDesc" class="input" rows="3"></textarea></label>
    <label>Capa (emoji ou texto curto) <input id="admCover" class="input" placeholder="📗, ⚡, ∑ ..." /></label>
    <div class="form-row">
      <label>IDs de aulas/capítulos (separe por vírgula) <input id="admParts" class="input" placeholder="l1,l2,l3..." /></label>
      <label>Títulos de aulas/capítulos (mesma quantidade) <input id="admPartsTitles" class="input" placeholder="Introdução, ..." /></label>
    </div>
    <label>Para vídeos: URLs (mesma quantidade) | Para e‑book: deixe vazio <input id="admVideoUrls" class="input" placeholder="https://...mp4, https://...mp4" /></label>
    <div class="form-row">
      <button class="btn" type="reset">Limpar</button>
      <button class="btn btn--primary" type="submit">Adicionar</button>
    </div>
  `;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const item = {
      id: slug($("#admTitle").value),
      title: $("#admTitle").value,
      subject: $("#admSubject").value,
      level: $("#admLevel").value,
      tags: $("#admTags").value.split(",").map(s=>s.trim()).filter(Boolean),
      desc: $("#admDesc").value || "",
      cover: $("#admCover").value || "📦",
    };
    const ids = $("#admParts").value.split(",").map(s=>s.trim()).filter(Boolean);
    const titles = $("#admPartsTitles").value.split(",").map(s=>s.trim()).filter(Boolean);
    const urls = $("#admVideoUrls").value.split(",").map(s=>s.trim()).filter(Boolean);
    if($("#admType").value === "course"){
      item.lessons = ids.map((id,i)=>({ id, title: titles[i]||`Aula ${i+1}`, type: "video", duration:"", videoUrl: urls[i]||"" }));
      db.courses.unshift(item);
    }else{
      item.chapters = ids.map((id,i)=>({ id, title: titles[i]||`Capítulo ${i+1}`, content: `<p>Conteúdo do capítulo ${i+1}.</p>` }));
      db.ebooks.unshift(item);
    }
    notify("Conteúdo adicionado com sucesso!");
    routeTo($("#admType").value === "course" ? "courses":"ebooks");
  });
  sec.append(form);
  root.append(sec);
}

function renderCourseDetail(root, id){
  const course = db.courses.find(c => c.id === id);
  if(!course){ root.append(empty("Curso não encontrado.")); return; }

  const sec = el("section","section");
  sec.append(breadcrumb([["Cursos","courses"], [course.title,null]]));

  const card = el("div","card");
  const body = el("div","card__body");
  body.innerHTML = `
    <h2 class="card__title">${course.cover} ${course.title}</h2>
    <p class="card__desc">${course.desc}</p>
    <div class="card__meta">
      <span>${badgeSubject(course.subject)}</span>
      <span>•</span>
      <span>Nível: ${labelLevel(course.level)}</span>
      <span>•</span>
      <span>${course.tags.map(t=>"#"+t).join(" ")}</span>
    </div>
  `;
  card.append(body);

  // Aulas
  const lessons = el("div","section");
  lessons.append(subtitle("Aulas"));
  course.lessons.forEach((l, i) => {
    const row = el("div","card");
    const body = el("div","card__body");
    const done = isLessonDone(course.id, l.id);
    body.innerHTML = `
      <div class="card__meta"><span class="badge">${l.type === "video" ? "Vídeo":"Conteúdo"}</span></div>
      <h3 class="card__title">${i+1}. ${l.title}</h3>
      ${l.duration? `<p class="card__desc">Duração: ${l.duration}</p>`:""}
    `;
    const actions = el("div","card__actions");
    const left = el("div");
    const btnOpen = button("Abrir", ()=> openLesson(course, l));
    const btnMark = button(done? "Concluída ✓":"Marcar como concluída", ()=> toggleLesson(course.id, l.id));
    left.append(btnOpen, btnMark);
    const pr = el("div","progress"); const bar = el("div","progress__bar");
    bar.style.width = getCourseProgressPct(course.id)+"%"; pr.append(bar);
    actions.append(left, pr);
    row.append(body, actions);
    lessons.append(row);
  });

  card.append(lessons);
  sec.append(card);
  root.append(sec);
}

function renderEbookDetail(root, id){
  const ebook = db.ebooks.find(e => e.id === id);
  if(!ebook){ root.append(empty("E‑book não encontrado.")); return; }

  const sec = el("section","section");
  sec.append(breadcrumb([["E‑books","ebooks"], [ebook.title,null]]));

  const card = el("div","card");
  const body = el("div","card__body");
  body.innerHTML = `
    <h2 class="card__title">${ebook.cover} ${ebook.title}</h2>
    <p class="card__desc">${ebook.desc}</p>
    <div class="card__meta">
      <span>${badgeSubject(ebook.subject)}</span>
      <span>•</span>
      <span>Nível: ${labelLevel(ebook.level)}</span>
      <span>•</span>
      <span>${ebook.tags.map(t=>"#"+t).join(" ")}</span>
    </div>
  `;
  card.append(body);

  // Capítulos
  const chapters = el("div","section");
  chapters.append(subtitle("Capítulos"));
  ebook.chapters.forEach((ch, i) => {
    const row = el("div","card");
    const body = el("div","card__body");
    const done = isChapterDone(ebook.id, ch.id);
    body.innerHTML = `
      <div class="card__meta"><span class="badge">Capítulo</span></div>
      <h3 class="card__title">${i+1}. ${ch.title}</h3>
    `;
    const actions = el("div","card__actions");
    const left = el("div");
    const btnOpen = button("Ler", ()=> openChapter(ebook, ch));
    const btnMark = button(done? "Concluído ✓":"Marcar como lido", ()=> toggleChapter(ebook.id, ch.id));
    left.append(btnOpen, btnMark);
    const pr = el("div","progress"); const bar = el("div","progress__bar");
    bar.style.width = getEbookProgressPct(ebook.id)+"%"; pr.append(bar);
    actions.append(left, pr);
    row.append(body, actions);
    chapters.append(row);
  });

  card.append(chapters);
  sec.append(card);
  root.append(sec);
}

// ---------- Cartões ----------
function cardCourse(c){
  const elc = el("article","card");
  const thumb = el("div","card__thumb");
  thumb.innerHTML = `<span style="font-size:38px">${c.cover||"🎥"}</span><span class="badge">${badgeSubject(c.subject)}</span>`;
  const body = el("div","card__body");
  body.innerHTML = `
    <h3 class="card__title">${c.title}</h3>
    <p class="card__desc">${c.desc}</p>
    <div class="card__meta">
      <span>Nível: ${labelLevel(c.level)}</span>
      <span>•</span>
      <span>${c.lessons.length} aulas</span>
    </div>
  `;
  const actions = el("div","card__actions");
  const left = el("div");
  const btnOpen = button("Ver curso", ()=> routeTo("course-detail", {id: c.id}));
  const wish = button(state.wishlist.includes(c.id) ? "Remover da lista" : "Salvar", ()=> toggleWish(c.id));
  left.append(btnOpen, wish);
  const pr = el("div","progress"); const bar = el("div","progress__bar");
  bar.style.width = getCourseProgressPct(c.id)+"%"; pr.append(bar);
  actions.append(left, pr);

  elc.append(thumb, body, actions);
  return elc;
}

function cardEbook(e){
  const elc = el("article","card");
  const thumb = el("div","card__thumb");
  thumb.innerHTML = `<span style="font-size:38px">${e.cover||"📗"}</span><span class="badge">${badgeSubject(e.subject)}</span>`;
  const body = el("div","card__body");
  body.innerHTML = `
    <h3 class="card__title">${e.title}</h3>
    <p class="card__desc">${e.desc}</p>
    <div class="card__meta">
      <span>Nível: ${labelLevel(e.level)}</span>
      <span>•</span>
      <span>${e.chapters.length} capítulos</span>
    </div>
  `;
  const actions = el("div","card__actions");
  const left = el("div");
  const btnOpen = button("Ver e‑book", ()=> routeTo("ebook-detail",{id: e.id}));
  const wish = button(state.wishlist.includes(e.id) ? "Remover da lista" : "Salvar", ()=> toggleWish(e.id));
  left.append(btnOpen, wish);
  const pr = el("div","progress"); const bar = el("div","progress__bar");
  bar.style.width = getEbookProgressPct(e.id)+"%"; pr.append(bar);
  actions.append(left, pr);

  elc.append(thumb, body, actions);
  return elc;
}

// ---------- Ações ----------
function toggleWish(id){
  const i = state.wishlist.indexOf(id);
  if(i>=0) state.wishlist.splice(i,1); else state.wishlist.push(id);
  save(); refresh();
}

function toggleLesson(courseId, lessonId){
  const key = `course:${courseId}`;
  state.progress[key] = state.progress[key] || {};
  state.progress[key][lessonId] = !state.progress[key][lessonId];
  save(); refresh();
}
function isLessonDone(courseId, lessonId){
  return !!(state.progress[`course:${courseId}`]?.[lessonId]);
}
function getCourseProgressPct(courseId){
  const c = db.courses.find(x=>x.id===courseId);
  if(!c) return 0;
  const prog = state.progress[`course:${courseId}`] || {};
  const done = c.lessons.filter(l => prog[l.id]).length;
  return pct(done, c.lessons.length);
}

function toggleChapter(ebookId, chapterId){
  const key = `ebook:${ebookId}`;
  state.progress[key] = state.progress[key] || {};
  state.progress[key][chapterId] = !state.progress[key][chapterId];
  save(); refresh();
}
function isChapterDone(ebookId, chapterId){
  return !!(state.progress[`ebook:${ebookId}`]?.[chapterId]);
}
function getEbookProgressPct(ebookId){
  const e = db.ebooks.find(x=>x.id===ebookId);
  if(!e) return 0;
  const prog = state.progress[`ebook:${ebookId}`] || {};
  const done = e.chapters.filter(ch => prog[ch.id]).length;
  return pct(done, e.chapters.length);
}

// ---------- Abrir conteúdo ----------
function openLesson(course, lesson){
  if(lesson.type === "video"){
    // Se você tiver um .mp4 local, defina lesson.videoUrl. Também funciona com links diretos.
    const src = lesson.videoUrl || "";
    if(!src){
      notify("Defina a URL do vídeo no Admin para reproduzir.");
    }
    $("#videoTitle").textContent = `${course.title} • ${lesson.title}`;
    $("#videoSrc").src = src;
    $("#videoPlayer").load();
    $("#videoDialog").showModal();
  }else{
    const html = `<article class="card" style="padding:16px">
      <div class="card__body">
        <h2>${course.title} • ${lesson.title}</h2>
        ${lesson.content || "<p>Conteúdo textual da aula.</p>"}
      </div>
    </article>`;
    const w = window.open();
    w.document.write(`<!DOCTYPE html><meta charset="utf-8"><title>${course.title}</title><link rel="stylesheet" href="styles.css"><body class="${document.documentElement.className}">${html}</body>`);
    w.document.close();
  }
}

function openChapter(ebook, chapter){
  const html = `<article class="card" style="padding:16px">
    <div class="card__body">
      <h2>${ebook.title} • ${chapter.title}</h2>
      ${chapter.content}
    </div>
  </article>`;
  const w = window.open();
  w.document.write(`<!DOCTYPE html><meta charset="utf-8"><title>${ebook.title}</title><link rel="stylesheet" href="styles.css"><body class="${document.documentElement.className}">${html}</body>`);
  w.document.close();
}

// ---------- Componentes ----------
function head(title){
  const h = el("div","section__head");
  h.innerHTML = `<h2 style="margin:0">${title}</h2>`;
  return h;
}
function subtitle(t){ const s = document.createElement("h3"); s.textContent = t; return s; }
function breadcrumb(items){
  const nav = el("nav","card");
  const inner = el("div","card__body");
  inner.innerHTML = `<div class="card__meta">${items.map(([label,route]) => route ? `<a href="#" data-route="${route}">${label}</a>` : `<span>${label}</span>`).join(" • ")}</div>`;
  nav.append(inner);
  // delega clicks
  setTimeout(()=>{
    $all('[data-route]', inner).forEach(a => a.addEventListener("click",(e)=>{e.preventDefault(); routeTo(a.dataset.route);}));
  },0);
  return nav;
}
function badgeSubject(s){ return s==="fisica" ? "Física" : "Matemática"; }
function labelLevel(l){ return l==="basico"?"Básico":l==="intermediario"?"Intermediário":"Avançado"; }
function button(label, onClick){
  const b = document.createElement("button");
  b.className = "btn btn--primary";
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}
function empty(text){
  const e = el("div","empty");
  e.textContent = text;
  return e;
}
function el(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }
function notify(msg){
  const n = document.createElement("div");
  n.setAttribute("role","status");
  n.style.position="fixed"; n.style.right="16px"; n.style.bottom="16px";
  n.style.padding="12px 14px"; n.style.border="1px solid var(--stroke)"; n.style.background="var(--bg-soft)"; n.style.borderRadius="10px"; n.style.boxShadow="var(--shadow)";
  n.textContent = msg;
  document.body.append(n);
  setTimeout(()=> n.remove(), 2000);
}

// ---------- Conteúdo de exemplo (Mat/Física) ----------
function sampleExercises(topic){
  if(topic==="cinematica"){
    return `
      <p><strong>Exercício 1.</strong> Um móvel em MRU tem v = 6 m/s. Qual o deslocamento em 8 s? <em>Resp.:</em> s = 48 m.</p>
      <p><strong>Exercício 2.</strong> Em MUV, a = 2 m/s², v₀ = 4 m/s. Velocidade após 5 s? <em>v = v₀ + a·t = 14 m/s.</em></p>
      <p><strong>Exercício 3.</strong> Lançamento vertical com v₀ = 20 m/s e g = 10 m/s². Altura máxima? <em>h = v₀²/(2g) = 20 m.</em></p>
    `;
  }
  if(topic==="derivadas"){
    return `
      <p><strong>1)</strong> Derive f(x)=x³ ⇒ f'(x)=3x².</p>
      <p><strong>2)</strong> f(x)=sen x ⇒ f'(x)=cos x.</p>
      <p><strong>3)</strong> f(x)=e^{2x} ⇒ f'(x)=2e^{2x}.</p>
      <p><strong>4)</strong> Aplique a regra do produto: (u·v)'=u'v+uv'.</p>
    `;
  }
  if(topic==="ohm"){
    return `
      <p><strong>1)</strong> Um resistor de 10 Ω com 12 V: I = V/R = 1,2 A.</p>
      <p><strong>2)</strong> Dois resistores de 4 Ω em série: Req = 8 Ω. Em paralelo: 2 Ω.</p>
      <p><strong>3)</strong> Potência: P = V·I. Para 12 V e 1,2 A, P = 14,4 W.</p>
    `;
  }
  if(topic==="geometria"){
    return `
      <p><strong>1)</strong> Distância entre A(1,2) e B(4,6): d = √[(3)²+(4)²] = 5.</p>
      <p><strong>2)</strong> Equação da reta por dois pontos: y - y₁ = m(x - x₁).</p>
      <p><strong>3)</strong> Circunferência: (x - a)² + (y - b)² = r².</p>
    `;
  }
  return "<p>Lista de exercícios.</p>";
}

function sampleArticle(kind){
  if(kind==="epsdelta"){
    return `
      <p>Para todo ε &gt; 0 existe δ &gt; 0 tal que se 0 &lt; |x-a| &lt; δ então |f(x)-L| &lt; ε.</p>
      <p>Essa definição formaliza a ideia de limite aproximando-se de L quando x aproxima-se de a.</p>
    `;
  }
  return "<p>Conteúdo textual.</p>";
}

function sampleChapter(ref){
  if(ref==="iner"){
    return `<p>A 1ª lei de Newton (Inércia) afirma que um corpo em repouso permanece em repouso e um corpo em movimento retilíneo uniforme tende a manter esse estado, salvo força resultante não nula.</p>`;
  }
  if(ref==="din"){
    return `<p>A 2ª lei relaciona a força resultante à variação do movimento: <strong>ΣF = m·a</strong>. Em unidades SI: N = kg·m/s².</p>`;
  }
  if(ref==="ar"){
    return `<p>A 3ª lei: a toda ação corresponde uma reação de mesma intensidade e direção, porém em sentidos opostos.</p>`;
  }
  if(ref==="int_intuicao"){
    return `<p>Integrais acumulam quantidades: área sob curvas, deslocamento a partir de velocidade, etc. A integral definida é o limite de somas de Riemann.</p>`;
  }
  if(ref==="sub"){
    return `<p>Substituição: escolha u=g(x) tal que du=g'(x)dx simplifique a integral. Ex.: ∫cos(x)·e^{sen(x)} dx, use u=sen(x).</p>`;
  }
  if(ref==="partes"){
    return `<p>Por partes: ∫u dv = u·v − ∫v du. Útil quando derivar u simplifica e integrar dv é viável.</p>`;
  }
  return "<p>Capítulo.</p>";
}
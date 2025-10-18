function getParam(name) {
  return new URLSearchParams(location.search).get(name);
}

function extractYouTubeId(url = "") {
  // Suporta youtu.be/ID, youtube.com/watch?v=ID, embed/ID e URLs com parâmetros
  // Lembrando que para a obtenção deste tipo de link formado pelo youtube, e necessário clicar em compartilhar e copiar a URL de compartilhamento
  // Também sendo necessário o canal que o vídeo foi publicado
  // Alguns vídeos possuem direitos autorais, por isso não são disponíveis para site de terceiros
  const re = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const m = url.match(re);
  return m ? m[1] : null;
}

/**
 * Insere uma lista de aulas (matemática ou física) em um container .lessons-list*.
 * @param {Object|Array} materias - objeto ou array com os dados das matérias
 * @param {HTMLElement} container - elemento onde colocar os itens
 * @param {Function} onClick - callback quando o item for clicado (recebe o objeto mat)
 */
function renderLessonsList(materias = {}, container, onClick) {
  if (!container) return;
  container.innerHTML = "";
  const frag = document.createDocumentFragment();

  // Object.values para funcionar tanto com array quanto com objeto com chaves
  Object.values(materias).forEach(mat => {
    const div = document.createElement("div");
    div.className = `lesson-item ${mat.idMat || ""}`.trim();
    // dados úteis em dataset para depuração / uso futuro
    div.dataset.idMat = mat.idMat ?? "";
    div.dataset.name = mat.name ?? "";

    div.innerHTML = `
      <svg class="play-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polygon points="5,3 19,12 5,21"/>
      </svg>
      <span class="lesson-name">${mat.name || "Sem título"}</span>
      <div class="completion-dot" aria-hidden="true"></div>
    `;

    div.addEventListener("click", () => onClick && onClick(mat, div));
    frag.appendChild(div);
  });

  container.appendChild(frag);
}

/**
 * Cria e adiciona blocos de texto (content-card) no container fornecido.
 * textObj é um objeto com chaves; cada valor pode conter "TÍTULO ||| CONTEÚDO [[[caminhoIMAGEM~~~AUTOR]]] CONTEÚDO".
 * o JSON desta parte pode conter imagem entre eles com os autores, os numeros de imagens depende do quanto você quer, e ele sempre irá seguir a sequência do JSON.
 */
function createText(textObj = {}, container = document.querySelector(".left-content")) {
  if (!container) return console.warn('createText: container .left-content não encontrado');

  const delimiter = '|||';
  const frag = document.createDocumentFragment();
  // captura o conteúdo entre [[[ ... ]]]
  const imgRegex = /\[\[\[([\s\S]*?)\]\]\]/g;

  // helper: anexa texto respeitando quebras de linha (transforma em nós text e <br>)
  function appendTextWithLineBreaks(parent, text) {
    const parts = text.split(/\r?\n/);
    parts.forEach((part, idx) => {
      if (part.length) parent.appendChild(document.createTextNode(part));
      if (idx < parts.length - 1) parent.appendChild(document.createElement('br'));
    });
  }

  Object.values(textObj).forEach(raw => {
    if (!raw) return;

    let title = "";
    let content = raw;

    // separa título ||| conteúdo (como antes)
    if (typeof raw === "string" && raw.includes(delimiter)) {
      const parts = raw.split(delimiter);
      title = parts[0].trim();
      content = parts.slice(1).join(delimiter).trim();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "content-card";

    // cria o h3 com o SVG
    const h3 = document.createElement("h3");
    h3.className = "transcript-title";
    h3.innerHTML = `
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2Z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    `;
    const titleNode = document.createElement('span');
    titleNode.textContent = title || "Texto";
    h3.appendChild(titleNode);

    // container do conteúdo (texto, figuras, imagens)
    const contentEl = document.createElement("p");
    contentEl.className = "transcript-text";

    let lastIndex = 0;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const fullInside = match[1].trim(); // o que estiver dentro dos [[[ ... ]]]
      // quebra interna: caminho da imagem e opcional fonte separado por '~~~'
      const [imgSrcPart, sourcePart] = fullInside.split('~~~').map(s => s ? s.trim() : '');

      const preText = content.substring(lastIndex, match.index);
      if (preText) appendTextWithLineBreaks(contentEl, preText);

      // se não houver src, pula (evita inserir tag vazia)
      if (imgSrcPart) {
        // cria figure para imagem + legenda
        const figure = document.createElement('figure');
        figure.className = 'transcript-figure';

        const img = document.createElement('img');
        img.src = imgSrcPart;
        // alt padrão com nome do arquivo
        try {
          const parts = imgSrcPart.split('/');
          img.alt = parts[parts.length - 1] || '';
        } catch (e) {
          img.alt = '';
        }
        img.className = 'transcript-image';
        figure.appendChild(img);

        // se tiver fonte (não vazia), cria figcaption
        if (sourcePart) {
          const figcap = document.createElement('figcaption');
          figcap.className = 'transcript-caption';
          figcap.textContent = `Fonte: ${sourcePart}`;
          figure.appendChild(figcap);
        }

        // se preferir que a imagem fique inline no parágrafo, coloque .transcript-figure { display:inline-block; }
        contentEl.appendChild(figure);
      }

      lastIndex = match.index + match[0].length;
    }

    // resto do texto após a última imagem
    const remaining = content.substring(lastIndex);
    if (remaining) appendTextWithLineBreaks(contentEl, remaining);

    wrapper.appendChild(h3);
    wrapper.appendChild(contentEl);
    frag.appendChild(wrapper);
  });

  container.appendChild(frag);
}



function createImage(params) {
  // Implementação futura — placeholder para manter API compatível
  // Ex: params poderia ser um objeto {src, alt, caption}
}

/**
 * Cria players de vídeo a partir de um objeto/array de strings.
 * Cada string pode ser "Autor ||| URL" ou apenas "URL".
 */
function createVideo(linksVideos = {}, container = document.querySelector(".right-content")) {
  if (!container) return console.warn('createVideo: container .right-content não encontrado');

  const delimiter = '|||';
  const frag = document.createDocumentFragment();

  Object.values(linksVideos).forEach(item => {
    if (!item) return;
    let autor = "";
    let url = item;

    if (typeof item === "string" && item.includes(delimiter)) {
      const parts = item.split(delimiter);
      autor = parts[0].trim();
      url = parts.slice(1).join(delimiter).trim();
    }

    const videoId = extractYouTubeId(url);
    if (!videoId) {
      console.warn("createVideo: ID do YouTube não encontrado para", url);
      return;
    }

    const embedLink = `https://www.youtube.com/embed/${videoId}`;

    const wrapper = document.createElement("div");
    wrapper.className = "video-block";

    wrapper.innerHTML = `
      <div class="video-player" aria-hidden="false"">
        <iframe src="${embedLink}" style="width: 100%; height: 100%;" title="YouTube video player" frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen loading="lazy"></iframe>
      </div>
      <p class="video-credit">Vídeo incorporado${autor ? ` do canal ${autor}` : ""} no YouTube. Todo o crédito é do autor original.</p>
    `;

    frag.appendChild(wrapper);
  });

  container.appendChild(frag);
}

/**
 * Função principal que carrega o JSON e popula a página.
 */
async function loadMaterials() {
  const id = getParam('id');
  if (!id) {
    console.log('Matéria não especificada');
    return;
  }

  try {
    const res = await fetch('assets/json/data.json');
    if (!res.ok) throw new Error('Falha ao carregar JSON');
    const contents = await res.json();

    const cont = contents.find(c => String(c.id) === String(id));
    const titleMaterial = document.querySelector('.title-matetial');
    if (!titleMaterial) console.warn('.title-matetial não encontrado no DOM');

    if (!cont) {
      if (titleMaterial) titleMaterial.textContent = 'Matéria não encontrada';
      return;
    } else {
      if (titleMaterial) titleMaterial.textContent = cont.name || 'Sem nome';
    }

    // elementos usados frequentemente
    const lessonsList = document.querySelector(".lessons-list");
    const lessonsListFisica = document.querySelector(".lessons-list-fisica");
    const leftContent = document.querySelector(".left-content");
    const rightContent = document.querySelector(".right-content");
    const bannerTitle = document.querySelector(".couse-banner-title");

    // Função que lida com clique em aula
    function handleLessonClick(mat, element) {
      // remove active de todos
      document.querySelectorAll(".lesson-item").forEach(item => item.classList.remove("active"));
      // ativa o clicado
      element.classList.add("active");

      // atualiza título do banner se existir
      if (bannerTitle) bannerTitle.textContent = mat.name || "";

      // limpa e cria conteúdo
      if (leftContent) leftContent.innerHTML = "";
      if (rightContent) rightContent.innerHTML = "";

      createText(mat.textos || {}, leftContent);
      createVideo(mat.videos || {}, rightContent);
    }

    // MATEMATICA
    const materiasMatematica = cont?.materials?.matematica || {};
    renderLessonsList(materiasMatematica, lessonsList, handleLessonClick);

    // FISICA
    const materiasFisica = cont?.materials?.fisica || {};
    renderLessonsList(materiasFisica, lessonsListFisica, handleLessonClick);

    // Função para relderizar com os itens dado JSON.
    function renderLessonsList(materias = {}, container, onClick) {
      if (!container) return;
      container.innerHTML = "";
      const frag = document.createDocumentFragment();

      // Object.values para funcionar tanto com array quanto com objeto com chaves
      Object.values(materias).forEach(mat => {
        const div = document.createElement("div");
        div.className = `lesson-item ${mat.idFis || ""}`.trim();
        // dados úteis em dataset para depuração / uso futuro
        div.dataset.idFis = mat.idFis ?? "";
        div.dataset.name = mat.name ?? "";

        div.innerHTML = `
          <svg class="play-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polygon points="5,3 19,12 5,21"/>
          </svg>
          <span class="lesson-name">${mat.name || "Sem título"}</span>
          <div class="completion-dot" aria-hidden="true"></div>
        `;

        div.addEventListener("click", () => onClick && onClick(mat, div));
        frag.appendChild(div);
      });

      container.appendChild(frag);
    }

  } catch (err) {
    console.error(err);
  }
}

// Inicializa
loadMaterials();

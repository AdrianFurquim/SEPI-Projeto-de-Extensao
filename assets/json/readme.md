# README — Modelo de JSON para o site

Este README descreve o formato JSON utilizado pelo site para armazenar matérias e seus conteúdos (vídeos e textos). Use este documento como referência ao criar ou editar arquivos JSON.

---

## Visão geral

O JSON organiza as **matérias** (por exemplo: Fisioterapia) e, dentro de cada matéria, agrupa os conteúdos por disciplina ("matematica" e "fisica"). Cada conteúdo possui um `idMat`, `name`, lista de `videos` e lista de `textos`.

Regras principais:

* Identificadores (`id`, chaves internas, `idMat`) **devem** ser em **letras minúsculas**, **sem espaços** e **sem pontuação** (apenas letras a–z). Ex: `geometriaeangulorarticurares`.
* Campos de exibição (`name`, títulos) podem ter espaços, acentos e pontuação.
* Formatos para `videos` e `textos` têm separadores obrigatórios `|||`.
* Imagens podem ser embutidas dentro dos textos usando a sintaxe: `[[[/assets/img/nome.ext~~~Autor / Fonte]]]`.

---

## Estrutura do JSON (explicada)

```json
{
  "id": "nome da matéria, sem pontuação, sem espaço, somente letras minúsculas",
  "name": "Nome da Matéria que irá aparecer no titulo",
  "image": "Imagem para a pagina home, ainda em observação se é necessário",
  "materials": {
    "matematica": {
      "<chaveDoConteudo>": {
        "idMat": "nome do componente (mesmo padrão: sem pontuação, sem espaço, letras minúsculas)",
        "name": "Nome do conteúdo",
        "videos": [
          "Canal|||https://youtu.be/XXXXXXXXXXX",
          "Canal|||https://www.youtube.com/watch?v=YYYYYYYYYYY"
        ],
        "textos": [
          "Título1|||Texto completo (pode conter quebras de linha) e imagens no formato [[[/assets/img/image.ext~~~Autor / Fonte]]]",
          "Título2|||Outro texto"
        ]
      }
    },
    "fisica": {
      "<chaveDoConteudo>": {
        "idMat": "...",
        "name": "...",
        "videos": [ ... ],
        "textos": [ ... ]
      }
    }
  }
}
```

### Campos explicados

* `id` — identificador da matéria (ex.: `fisioterapia`). Deve seguir a regra das **letras minúsculas e sem espaços**.
* `name` — nome legível da matéria (ex.: `Fisioterapia`). Aparece no título da página.
* `image` — caminho da imagem de capa (opcional; ainda em observação se será usado). Ex: `/assets/img/fisio-home.jpg`.
* `materials` — objeto com as categorias (normalmente `matematica` e `fisica`).

  * Cada chave dentro de `matematica`/`fisica` representa um bloco de conteúdo (ex.: `geometriaeangulorarticurares`).
  * `idMat` — id do componente que exibirá esse conteúdo (deve coincidir com o nome do componente no front-end quando aplicável).
  * `name` — título do conteúdo mostrado ao usuário.
  * `videos` — lista de strings no formato: `Canal|||URL`. **O separador `|||` é obrigatório.**

    * A URL deve ser o link direto do YouTube (copiado pelo botão "Compartilhar" do vídeo). Exemplos válidos: `https://youtu.be/VQVpG5qTRlk` ou `https://www.youtube.com/watch?v=VQVpG5qTRlk`.
  * `textos` — lista de strings no formato: `Título|||Corpo do texto`.

    * O corpo pode conter quebras de linha e a sintaxe para imagens.

---

## Sintaxe de imagens dentro de `textos`

Para inserir imagens dentro do corpo do texto use o formato:

```
[[[/assets/img/nome_da_imagem.ext~~~Autor / Fonte]]]
```

* `nome_da_imagem.ext` — caminho relativo ao diretório de assets (ex.: `/assets/img/geometriaangularjoelho.jpg`).
* `Autor / Fonte` — texto exibido como crédito da imagem. Pode conter barras, vírgulas, etc.
* Você pode inserir quantas imagens quiser ao longo do texto, inclusive em sequência com parágrafos.

Exemplo dentro de `textos`:

```
"Título|||Texto antes. [[[/assets/img/geometriaangularjoelho.jpg~~~Autor Fulano / Site X]]] Texto depois."
```

---

## Regras e boas práticas

1. **Consistência de IDs**: `id` da matéria e `idMat` do conteúdo devem seguir o mesmo padrão (letras minúsculas, sem espaços, sem pontuação) para facilitar busca e roteamento no front-end.
2. **Separadores obrigatórios**: Sempre use `|||` entre título e conteúdo em `textos` e entre nome do canal e URL em `videos`.
3. **URLs do YouTube**: Prefira usar a URL obtida no botão "Compartilhar" do YouTube (formato curto `youtu.be` ou `youtube.com/watch?v=`).
4. **Escape de caracteres**: Caso o texto precise conter literalmente `[[[`, `~~~` ou `|||`, utilize alguma convenção (por exemplo, substituir temporariamente por `[[[ESC]]]`) e depois converter no processo de build — mantenha o JSON legível; evite inserir esses padrões sem intenção.
5. **Ordenação**: A ordem dos itens em `videos` e `textos` é a ordem em que aparecerão na interface;
6. **Tamanho do texto**: Evite textos gigantescos em um único item — prefira dividir em seções/títulos distintos para melhor leitura.

---

## Exemplo completo (modelo preenchido)

```json
{
  "id": "fisioterapia",
  "name": "Fisioterapia",
  "image": "/assets/img/fisio-home.jpg",
  "materials": {
    "matematica": {
      "geometriaeangulorarticurares": {
        "idMat": "geometriaeangulorarticurares",
        "name": "Geometria e ângulos articulares",
        "videos": [
          "Youtube|||https://youtu.be/VQVpG5qTRlk?si=V806L2f3oUxg769Y",
          "Youtube|||https://youtu.be/OiiFQB82nkk?si=VY7qgz28CJZJBEsZ"
        ],
        "textos": [
          "Título1|||A Fotogrametria digital, segundo Atkinson (1996)... (texto completo...)",
          "Título|||Texto antes. [[[/assets/img/geometriaangularjoelho.jpg~~~Autor Fulano / Site X]]] Texto depois."
        ]
      }
    },
    "fisica": {
      "mecanica": {
        "idMat": "mecanica",
        "name": "Mecânica",
        "videos": [
          "Titulo|||https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          "Titulo|||https://www.youtube.com/watch?v=3JZ_D3ELwOQ"
        ],
        "textos": [
          "Movimentos|||Text example",
          "Força e atrito|||Text example"
        ]
      }
    }
  }
}
```

---

## Template JSON (vazio) — pronto para preenchimento

```json
{
  "id": "",
  "name": "",
  "image": "Imagem para a pagina home, ainda em observação se é necessário",
  "materials": {
    "matematica": {
      "<id_do_conteudo>": {
        "idMat": "",
        "name": "",
        "videos": [
          "Titulo|||https://youtu.be/example",
          "Titulo|||https://www.youtube.com/example"
        ],
        "textos": [
          "Titulo|||Text example",
          "Titulo|||Text example"
        ]
      }
    },
    "fisica": {
      "<id_do_conteudo>": {
        "idMat": "",
        "name": "",
        "videos": [
          "Titulo|||https://youtu.be/example",
          "Titulo|||https://www.youtube.com/example"
        ],
        "textos": [
          "Titulo|||Text example",
          "Titulo|||Text example"
        ]
      }
    }
  }
}
```

---

## Checklist de validação antes de subir o JSON

* [ ] `id` preenchido e em letras minúsculas, sem espaços.
* [ ] Todos os `idMat` seguem o padrão.
* [ ] Todas as entradas de `videos` contêm `|||` e uma URL válida do YouTube.
* [ ] Todas as entradas de `textos` contêm `|||` separando título e corpo.
* [ ] Imagens referenciadas em `textos` existem na pasta `/assets/img/` e o caminho está correto.
* [ ] Não há chaves duplicadas nem vírgulas finais extras no JSON.

---


# AVATAR MODULE — GUIA DE INTEGRAÇÃO

## Arquivos novos
```
js/avatar.js       ← Módulo Three.js + análise por IA
js/avatar-ui.js    ← Controller do formulário e UI
css/avatar.css     ← Estilos da página avatar
avatar-page.html   ← HTML da página (copiar para index.html)
```

---

## 1. index.html — adicionar no <head>

```html
<!-- Three.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<!-- Avatar CSS -->
<link rel="stylesheet" href="css/avatar.css" />
```

---

## 2. index.html — adicionar a seção da página

Dentro de `<main class="page-container">`, após `#page-character`:

```html
<!-- cole o conteúdo de avatar-page.html aqui (apenas a section#page-avatar) -->
```

---

## 3. index.html — substituir o nav

```html
<nav class="bottom-nav">
  <button class="nav-btn active" data-page="dashboard" onclick="App.nav('dashboard')">
    <span class="nav-icon">⬡</span><span class="nav-label">Reino</span>
  </button>
  <button class="nav-btn" data-page="missions" onclick="App.nav('missions')">
    <span class="nav-icon">◈</span><span class="nav-label">Missões</span>
  </button>
  <button class="nav-btn" data-page="avatar" onclick="App.nav('avatar')">
    <span class="nav-icon">◉</span><span class="nav-label">Avatar</span>
  </button>
  <button class="nav-btn" data-page="character" onclick="App.nav('character')">
    <span class="nav-icon">⚔</span><span class="nav-label">Self</span>
  </button>
  <button class="nav-btn" data-page="progress" onclick="App.nav('progress')">
    <span class="nav-icon">◎</span><span class="nav-label">Registro</span>
  </button>
</nav>
```

---

## 4. index.html — scripts (ordem importa)

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="js/theme.js"></script>
<script src="js/store.js"></script>
<script src="js/narrative.js"></script>
<script src="js/missions.js"></script>
<script src="js/charts.js"></script>
<script src="js/avatar.js"></script>      <!-- NOVO -->
<script src="js/avatar-ui.js"></script>   <!-- NOVO -->
<script src="js/app.js"></script>
```

---

## 5. app.js — adicionar avatar à navegação

No método `nav(page)`, adicionar:

```javascript
if (page === 'avatar') { AvatarUI.init(); AvatarUI._updateBadge(); }
```

---

## 6. missions.js — chamar evolução após completar missão

No método `complete(id)`, após `App.refreshDashboard()`, adicionar:

```javascript
// Avatar evolution
if (typeof AvatarUI !== 'undefined') {
  AvatarUI.onMissionComplete(m.type, m.stat);
}
```

---

## Como funciona a evolução

| Ação do usuário             | Mudança no avatar                           |
|-----------------------------|---------------------------------------------|
| Completar missão de força   | Braços e peito crescem gradualmente         |
| Completar missão de cardio  | Cintura afina, silhueta fica mais magra     |
| Completar treino misto      | Ambos ocorrem em menor intensidade          |
| Atualizar peso (menor)      | Fat morph diminui — avatar emagrece         |
| Atualizar peso (maior)      | Fat morph aumenta                           |
| A cada 5 missões completas  | Avatar é reconstruído com novos morphs      |
| Troca de arquétipo          | Cor da armadura, olhos e capa mudam         |

## Como funciona a análise por IA

1. Usuário faz upload da selfie
2. App envia imagem (base64) para `api.anthropic.com/v1/messages`
3. IA retorna JSON com: `skinTone`, `hairColor`, `hairStyle`, `eyeColor`, `faceShape`, `beardStyle`, `estimatedBodyType`
4. Avatar é reconstruído com esses valores aplicados ao modelo Three.js

## Dados que persistem (localStorage)
- `ascend_avatar_profile` — perfil físico + características da IA
- `ascend_avatar_evo` — log de evolução (até 20 entradas)

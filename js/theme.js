// ─── THEME SYSTEM ────────────────────────────────────────────────
// 8 neon archetypes — each with full visual identity

const THEMES = {
  Warrior: {
    glyph: '⚔',
    neon:       '#ff3c3c',
    neonDim:    '#cc1a1a',
    neonGlow:   '#ff3c3c40',
    neonSoft:   '#ff3c3c12',
    bg:         '#0e0606',
    bgCard:     '#150808',
    bgElev:     '#1c0a0a',
    border:     '#2e1010',
    borderHi:   '#4a1515',
    text:       '#f0dede',
    textDim:    '#9a7070',
    textMute:   '#4a2828',
    fontDisplay:'Cinzel, serif',
    starColor:  '#ff3c3c',
    statBonus:  { strength: 2, discipline: 1, focus: 0, energy: 0 },
    lore: 'O Guerreiro não trava batalhas apenas no mundo exterior. Seu verdadeiro combate é travado em silêncio — contra o conforto, contra o adiamento, contra a versão de si mesmo que aceita menos do que poderia se tornar.',
    opening: 'O Guerreiro desperta. A força chama para ser testada.',
    completions: [
      'Você resistiu ao chamado da facilidade. Sua disciplina forja sulcos mais profundos.',
      'Força não se constrói nos momentos de conforto. Você escolheu o caminho mais difícil.',
      'O Guerreiro dentro de você cresceu hoje. Ninguém pode tirar isso.',
      'Cada missão cumprida é uma vitória sobre a versão menor de si mesmo.',
    ],
  },

  Mago: {
    glyph: '✦',
    neon:       '#bf5fff',
    neonDim:    '#8a30cc',
    neonGlow:   '#bf5fff40',
    neonSoft:   '#bf5fff12',
    bg:         '#0a0614',
    bgCard:     '#100820',
    bgElev:     '#160a2c',
    border:     '#221040',
    borderHi:   '#361860',
    text:       '#e8d8f8',
    textDim:    '#907898',
    textMute:   '#402858',
    fontDisplay:'Cinzel, serif',
    starColor:  '#bf5fff',
    statBonus:  { strength: 0, discipline: 1, focus: 2, energy: 0 },
    lore: 'O Mago vê o que outros não podem ver — os padrões ocultos sob a superfície da realidade. Cada momento de clareza é uma pedra lançada no caminho em direção ao domínio do arcano.',
    opening: 'O Mago abre os olhos. Quais padrões serão revelados hoje?',
    completions: [
      'Conhecimento acumulado em silêncio. A mente expande.',
      'Você viu além do óbvio. Isso é o que separa o Mago dos demais.',
      'Cada ação deliberada afina sua percepção do mundo.',
      'O arcano registra sua disciplina. O poder cresce.',
    ],
  },

  Guardião: {
    glyph: '◈',
    neon:       '#00e87a',
    neonDim:    '#009950',
    neonGlow:   '#00e87a40',
    neonSoft:   '#00e87a12',
    bg:         '#030e07',
    bgCard:     '#05140a',
    bgElev:     '#071a0e',
    border:     '#0e2e18',
    borderHi:   '#154825',
    text:       '#d0f0de',
    textDim:    '#609878',
    textMute:   '#204832',
    fontDisplay:'Cinzel, serif',
    starColor:  '#00e87a',
    statBonus:  { strength: 1, discipline: 2, focus: 0, energy: 1 },
    lore: 'O Guardião mantém a linha. Num mundo projetado para a distração, ele escolheu permanecer firme. Sua disciplina não é rigidez — é o poder silencioso de quem sabe exatamente quem é.',
    opening: 'O Guardião assume sua posição. Outro ciclo, outra vigília.',
    completions: [
      'Você manteve a linha quando outros teriam cedido.',
      'Consistência é o superpoder mais raro. Você o está construindo.',
      'O Guardião não falha — e hoje você foi o Guardião.',
      'A sequência cresce. O reino lembra.',
    ],
  },

  Sombra: {
    glyph: '◆',
    neon:       '#7b8cff',
    neonDim:    '#4455cc',
    neonGlow:   '#7b8cff40',
    neonSoft:   '#7b8cff12',
    bg:         '#05050f',
    bgCard:     '#080818',
    bgElev:     '#0c0c22',
    border:     '#141430',
    borderHi:   '#202050',
    text:       '#d8dcf8',
    textDim:    '#6870a8',
    textMute:   '#252848',
    fontDisplay:'Cinzel, serif',
    starColor:  '#7b8cff',
    statBonus:  { strength: 0, discipline: 0, focus: 2, energy: 2 },
    lore: 'A Sombra entende que nem todo poder é visível. Ela opera nos espaços entre as certezas, encontrando oportunidade onde outros enxergam apenas obstáculos. Invisível quando quer, letal quando precisa.',
    opening: 'A Sombra se move. Ninguém percebe — mas o reino registra.',
    completions: [
      'Invisível para os outros, implacável para si mesmo.',
      'Você operou nas sombras da disciplina. Isso é poder real.',
      'A Sombra não anuncia suas vitórias. Elas simplesmente acontecem.',
      'Cada ação furtiva constrói a versão que outros não conseguem ver — ainda.',
    ],
  },

  Paladino: {
    glyph: '✙',
    neon:       '#ffd040',
    neonDim:    '#c09010',
    neonGlow:   '#ffd04040',
    neonSoft:   '#ffd04012',
    bg:         '#0e0c04',
    bgCard:     '#161008',
    bgElev:     '#1e160a',
    border:     '#2e2410',
    borderHi:   '#4a3a18',
    text:       '#f8f0d0',
    textDim:    '#a08840',
    textMute:   '#503c10',
    fontDisplay:'Cinzel, serif',
    starColor:  '#ffd040',
    statBonus:  { strength: 1, discipline: 2, focus: 0, energy: 1 },
    lore: 'O Paladino não busca glória — busca propósito. Cada ato de bondade é um ato de poder. Sua fé não é cega; é o resultado de testemunhar o que acontece quando alguém escolhe consistentemente o caminho mais nobre.',
    opening: 'O Paladino se levanta. A honra exige sua presença hoje.',
    completions: [
      'Você agiu com integridade quando ninguém estava olhando. Isso define o Paladino.',
      'A luz não precisa de aplausos. Ela simplesmente ilumina.',
      'Cada missão cumprida é uma prova de caráter forjada em ação.',
      'O propósito sustenta o que a motivação nunca poderia.',
    ],
  },

  Erudito: {
    glyph: '♟',
    neon:       '#00c8ff',
    neonDim:    '#007aaa',
    neonGlow:   '#00c8ff40',
    neonSoft:   '#00c8ff12',
    bg:         '#030c12',
    bgCard:     '#05121c',
    bgElev:     '#071826',
    border:     '#0e2436',
    borderHi:   '#143650',
    text:       '#d0ecf8',
    textDim:    '#5090b0',
    textMute:   '#183050',
    fontDisplay:'Cinzel, serif',
    starColor:  '#00c8ff',
    statBonus:  { strength: 0, discipline: 1, focus: 3, energy: 0 },
    lore: 'O Erudito enxerga mais longe que os outros porque treinou sua visão através do pensamento deliberado. Cada padrão reconhecido é uma vantagem silenciosa. Onde outros veem caos, ele vê a estrutura subjacente.',
    opening: 'O Erudito considera o tabuleiro. Os movimentos de hoje importam.',
    completions: [
      'Você jogou o longo jogo. A mente estratégica sempre vence.',
      'Cada ação deliberada afina sua percepção. O Erudito cresce.',
      'A vantagem invisível se acumula. Você a está construindo.',
      'Clareza não é sorte. É o resultado de ação consistente.',
    ],
  },

  Arauto: {
    glyph: '♪',
    neon:       '#ff4fa0',
    neonDim:    '#cc1a68',
    neonGlow:   '#ff4fa040',
    neonSoft:   '#ff4fa012',
    bg:         '#0e0408',
    bgCard:     '#160610',
    bgElev:     '#1e0818',
    border:     '#2e1020',
    borderHi:   '#4a1835',
    text:       '#f8d8e8',
    textDim:    '#a05878',
    textMute:   '#501830',
    fontDisplay:'Cinzel, serif',
    starColor:  '#ff4fa0',
    statBonus:  { strength: 0, discipline: 0, focus: 1, energy: 3 },
    lore: 'O Arauto compreende que o mundo é moldado pelas histórias que contamos sobre ele. Sua magia vem de conexões humanas, de palavras ditas no momento certo, de inspiração que se espalha como chamas.',
    opening: 'O Arauto abre a voz. Que história será escrita hoje?',
    completions: [
      'Você criou algo onde antes havia vazio. Isso é poder real.',
      'A energia do Arauto não se esgota — ela se multiplica com cada ação.',
      'Cada missão cumprida é uma linha na grande narrativa que você está escrevendo.',
      'Inspiração não é esperada. É gerada — e você a gerou hoje.',
    ],
  },

  Druida: {
    glyph: '☽',
    neon:       '#a0ff60',
    neonDim:    '#60b030',
    neonGlow:   '#a0ff6040',
    neonSoft:   '#a0ff6012',
    bg:         '#060e03',
    bgCard:     '#0a1405',
    bgElev:     '#0e1a07',
    border:     '#182e0c',
    borderHi:   '#254814',
    text:       '#e0f8d0',
    textDim:    '#709858',
    textMute:   '#284818',
    fontDisplay:'Cinzel, serif',
    starColor:  '#a0ff60',
    statBonus:  { strength: 0, discipline: 1, focus: 1, energy: 2 },
    lore: 'O Druida sabe que toda transformação segue um ritmo. As estações não se apressam, e ainda assim tudo se realiza. Ele não impõe sua vontade ao mundo — aprendeu a dançar com seus ciclos.',
    opening: 'O Druida respira. O ciclo continua — paciente, inevitável.',
    completions: [
      'Você seguiu o ritmo natural. A transformação acontece em camadas.',
      'Paciência é força. O Druida sabe disso — e você também.',
      'Cada ciclo completo é uma raiz mais profunda no solo do seu caráter.',
      'A natureza não apressou sua florescência. Você também não precisou — mas agiu assim mesmo.',
    ],
  },
};

const Theme = {
  current: null,

  apply(archetypeName) {
    const theme = THEMES[archetypeName];
    if (!theme) return;
    this.current = theme;

    const r = document.documentElement.style;
    r.setProperty('--neon',        theme.neon);
    r.setProperty('--neon-dim',    theme.neonDim);
    r.setProperty('--neon-glow',   theme.neonGlow);
    r.setProperty('--neon-soft',   theme.neonSoft);
    r.setProperty('--bg',          theme.bg);
    r.setProperty('--bg-card',     theme.bgCard);
    r.setProperty('--bg-elev',     theme.bgElev);
    r.setProperty('--border',      theme.border);
    r.setProperty('--border-hi',   theme.borderHi);
    r.setProperty('--text',        theme.text);
    r.setProperty('--text-dim',    theme.textDim);
    r.setProperty('--text-mute',   theme.textMute);
    r.setProperty('--font-display',theme.fontDisplay);

    // Legacy aliases (amber → neon) so existing CSS keeps working
    r.setProperty('--amber',       theme.neon);
    r.setProperty('--amber-dim',   theme.neonDim);
    r.setProperty('--amber-glow',  theme.neonGlow);
    r.setProperty('--amber-soft',  theme.neonSoft);

    // Update star particle color in onboarding bg
    this._updateStarStyle(theme.starColor);

    // Fade transition on body
    document.body.style.transition = 'background 0.6s ease';
    document.body.style.background = theme.bg;
  },

  _updateStarStyle(color) {
    let el = document.getElementById('_theme-stars');
    if (!el) {
      el = document.createElement('style');
      el.id = '_theme-stars';
      document.head.appendChild(el);
    }
    const c30 = color + '30';
    const c20 = color + '20';
    const c18 = color + '18';
    el.textContent = `.onboard-bg::before {
      background-image:
        radial-gradient(1px 1px at 20% 15%, ${c30} 0%, transparent 100%),
        radial-gradient(1px 1px at 80% 25%, ${c20} 0%, transparent 100%),
        radial-gradient(1px 1px at 50% 60%, ${c18} 0%, transparent 100%);
    }`;
  },

  get(archetypeName) {
    return THEMES[archetypeName] || THEMES.Warrior;
  },

  getCompletion(archetypeName) {
    const pool = (THEMES[archetypeName] || THEMES.Warrior).completions;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  getOpening(archetypeName) {
    return (THEMES[archetypeName] || THEMES.Warrior).opening;
  },

  // Live preview during onboarding archetype selection
  preview(archetypeName) {
    this.apply(archetypeName);
  },
};

// ─── APP CONTROLLER ──────────────────────────────────────────────

const App = {
  currentPage: 'dashboard',
  missions: Missions,

  // ── Init ──────────────────────────────────────
  init() {
    Store.load();
    const state = Store.get();

    if (state.onboarded) {
      Theme.apply(state.character.archetype);
      this.showApp();
    } else {
      document.getElementById('onboarding').classList.add('active');
    }
  },

  showApp() {
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('app').classList.add('active');
    this.refreshDashboard();
    this.updateHeader();
    this.updateCharacterPage();
    Missions.render('missions-list');
    this.setTodayDate();
    this.setNarrative();
    this.setReflection();
    this.updateProgress();
  },

  // ── Navigation ────────────────────────────────
  nav(page) {
    document.getElementById(`page-${this.currentPage}`)?.classList.remove('active');
    document.querySelector(`[data-page="${this.currentPage}"]`)?.classList.remove('active');

    this.currentPage = page;
    document.getElementById(`page-${page}`)?.classList.add('active');
    document.querySelector(`[data-page="${page}"]`)?.classList.add('active');

    if (page === 'character') this.updateCharacterPage();
    if (page === 'progress') { this.updateProgress(); Charts.refreshAll(); }
    if (page === 'missions') Missions.render('missions-list');
    if (page === 'dashboard') { this.refreshDashboard(); this.setNarrative(); }
    if (page === 'avatar') { AvatarUI.init(); AvatarUI._updateBadge(); }
  },

  // ── Dashboard ─────────────────────────────────
  refreshDashboard() {
    const state = Store.get();
    const char = state.character;
    const archData = Store.getArchetypeData(char.archetype);
    const theme = Theme.get(char.archetype);

    document.getElementById('dash-name').textContent = char.name || '—';
    document.getElementById('dash-level').textContent = `Level ${char.level}`;
    document.getElementById('dash-archetype').textContent = char.archetype;
    document.getElementById('avatar-glyph').textContent = theme.glyph || archData.glyph;
    document.getElementById('dash-xp-fill').style.width = `${Store.xpProgress() * 100}%`;
    document.getElementById('dash-xp-label').textContent = `${char.xp} / ${Store.xpToNextLevel()} XP`;

    document.getElementById('stat-str').textContent = char.stats.strength;
    document.getElementById('stat-dis').textContent = char.stats.discipline;
    document.getElementById('stat-foc').textContent = char.stats.focus;
    document.getElementById('stat-ene').textContent = char.stats.energy;

    const sd = state.streakData;
    document.getElementById('streak-count').textContent = sd.current;
    document.getElementById('streak-sub').textContent =
      sd.current > 0 ? `Best: ${sd.best} days` : 'Start your streak today';

    Missions.render('dash-missions', () => true);
  },

  setTodayDate() {
    const el = document.getElementById('today-date');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'short', day: 'numeric' });
  },

  setNarrative() {
    const char = Store.get().character;
    const el = document.getElementById('narrative-text');
    if (!el) return;
    el.textContent = Theme.getOpening(char.archetype);
  },

  setReflection() {
    const el = document.getElementById('daily-reflection');
    if (!el) return;
    el.innerHTML = `
      <div class="reflection-label">MUNDO INTERIOR · REFLEXÃO</div>
      <div class="reflection-text">${Narrative.getReflection()}</div>`;
  },

  // ── Header ────────────────────────────────────
  updateHeader() {
    const char = Store.get().character;
    document.getElementById('header-level').textContent = `Lv.${char.level}`;
    document.getElementById('xp-fill-mini').style.width = `${Store.xpProgress() * 100}%`;
  },

  // ── Character Page ────────────────────────────
  updateCharacterPage() {
    const state = Store.get();
    const char = state.character;
    const theme = Theme.get(char.archetype);

    document.getElementById('char-page-name').textContent = char.name || '—';
    document.getElementById('char-page-level').textContent = `Level ${char.level}`;
    document.getElementById('char-page-arch').textContent = char.archetype;
    document.getElementById('char-big-glyph').textContent = theme.glyph;

    document.getElementById('char-xp-fill').style.width = `${Store.xpProgress() * 100}%`;
    document.getElementById('char-xp-cur').textContent = `${char.xp} XP`;
    document.getElementById('char-xp-next').textContent = `${Store.xpToNextLevel() - char.xp} XP para Level ${char.level + 1}`;

    const statsContainer = document.getElementById('stats-full');
    const statDefs = [
      { key: 'strength',   label: 'STR', icon: '⚡', cls: 'stat-fill-str' },
      { key: 'discipline', label: 'DIS', icon: '🔱', cls: 'stat-fill-dis' },
      { key: 'focus',      label: 'FOC', icon: '◎',  cls: 'stat-fill-foc' },
      { key: 'energy',     label: 'ENE', icon: '✦',  cls: 'stat-fill-ene' },
    ];
    const maxStat = Math.max(10, ...Object.values(char.stats));
    statsContainer.innerHTML = statDefs.map(s => `
      <div class="stat-row">
        <span class="stat-row-icon">${s.icon}</span>
        <span class="stat-row-name">${s.label}</span>
        <div class="stat-row-bar">
          <div class="stat-row-fill ${s.cls}" style="width:${(char.stats[s.key] / maxStat * 100).toFixed(1)}%"></div>
        </div>
        <span class="stat-row-val">${char.stats[s.key]}</span>
      </div>`).join('');

    const traitsContainer = document.getElementById('traits-display');
    traitsContainer.innerHTML = char.traits?.length
      ? char.traits.map(t => `<span class="trait-tag">${t}</span>`).join('')
      : '<span class="sub-text">Nenhum traço definido</span>';

    document.getElementById('arch-lore').innerHTML = `
      <div class="lore-title">O CAMINHO D${char.archetype === 'Arauto' ? 'O' : 'O'} ${char.archetype.toUpperCase()}</div>
      <div class="lore-text">${theme.lore}</div>`;
  },

  // ── Progress ──────────────────────────────────
  updateProgress() {
    const state = Store.get();
    const char = state.character;
    document.getElementById('prog-total-xp').textContent = char.totalXp.toLocaleString();
    document.getElementById('prog-missions').textContent = state.completions.length;
    document.getElementById('prog-streak').textContent = state.streakData.best;
    document.getElementById('prog-days').textContent = Store.daysActive();
    document.getElementById('progress-sub').textContent = `A jornada de ${char.name || 'seu'}, registrada.`;
  },

  // ── Level Up ──────────────────────────────────
  showLevelUp(level) {
    const modal = document.getElementById('modal-levelup');
    document.getElementById('lu-level').textContent = `Level ${level}`;
    document.getElementById('lu-msg').textContent = Narrative.getLevelUp();
    modal.classList.remove('hidden');
  },

  closeLevelUp() {
    document.getElementById('modal-levelup').classList.add('hidden');
    this.updateHeader();
    this.updateCharacterPage();
    this.refreshDashboard();
  },

  // ── Toast ─────────────────────────────────────
  showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('hidden');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
  },

  // ── Onboarding ────────────────────────────────
  onboard: {
    step: 0,
    archetype: null,
    traits: [],

    next() {
      const step = App.onboard.step;
      if (step === 1) {
        const name = document.getElementById('char-name').value.trim();
        if (!name) {
          const el = document.getElementById('char-name');
          el.focus();
          el.style.borderColor = 'var(--neon)';
          setTimeout(() => el.style.borderColor = '', 1200);
          return;
        }
      }
      if (step === 2 && !App.onboard.archetype) return;
      App.onboard.goTo(step + 1);
    },

    goTo(step) {
      document.querySelector(`[data-step="${App.onboard.step}"]`)?.classList.remove('active');
      App.onboard.step = step;
      document.querySelector(`[data-step="${step}"]`)?.classList.add('active');
    },

    selectArchetype(btn) {
      document.querySelectorAll('.archetype-card').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      App.onboard.archetype = btn.dataset.arch;
      document.getElementById('arch-btn').disabled = false;
      // Live neon preview!
      Theme.preview(btn.dataset.arch);
    },

    toggleTrait(btn) {
      const trait = btn.dataset.trait;
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        App.onboard.traits = App.onboard.traits.filter(t => t !== trait);
      } else {
        if (App.onboard.traits.length >= 3) return;
        btn.classList.add('selected');
        App.onboard.traits.push(trait);
      }
    },

    finish() {
      const name = document.getElementById('char-name').value.trim();
      const archetype = App.onboard.archetype || 'Warrior';
      const traits = App.onboard.traits;

      Store.initCharacter(name, archetype, traits);
      Theme.apply(archetype);

      const theme = Theme.get(archetype);
      document.getElementById('awaken-name').textContent = `O ${archetype} Desperta`;
      document.getElementById('awaken-glyph').textContent = theme.glyph;
      App.onboard.goTo(4);

      setTimeout(() => App.showApp(), 2800);
    },
  },
};

// ─── BOOT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

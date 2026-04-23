// ─── AVATAR UI CONTROLLER ────────────────────────────────────────
// Handles form interactions, photo upload, evolution log
// Depends on: avatar.js, theme.js, store.js

const AvatarUI = {

  _debounceTimer: null,
  _avatarInitialized: false,
  _evolutionLog: [],

  // ── Init (called when avatar page opens) ──────
  init() {
    if (!this._avatarInitialized) {
      // Load Three.js dynamically if not yet loaded
      if (typeof THREE === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
        script.onload = () => {
          Avatar.init('avatar-canvas');
          this._avatarInitialized = true;
        };
        document.head.appendChild(script);
      } else {
        Avatar.init('avatar-canvas');
        this._avatarInitialized = true;
      }
    } else {
      // Re-apply theme on revisit (archetype might have changed)
      Avatar.updateLighting();
    }

    this._populateForm();
    this._updateBadge();
    this._renderDerivedStats();
    this._renderEvoLog();
  },

  // ── Populate form from saved profile ──────────
  _populateForm() {
    const p = Avatar.profile;
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el && val != null) el.value = val;
    };
    set('av-height', p.heightCm  || '');
    set('av-weight', p.weightKg  || '');
    set('av-goal',   p.goalWeightKg || '');
    set('av-train',  p.trainType || 'misto');
    set('av-waist',  p.waistCm   || '');
    set('av-arm',    p.armCm     || '');
    set('av-chest',  p.chestCm   || '');
  },

  // ── Field change (debounced live preview) ─────
  onFieldChange() {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this._applyFormToProfile();
      this._renderDerivedStats();
    }, 600);
  },

  _applyFormToProfile() {
    const num = (id) => {
      const v = parseFloat(document.getElementById(id)?.value);
      return isNaN(v) ? null : v;
    };
    const str = (id) => document.getElementById(id)?.value || null;

    Avatar.profile.heightCm    = num('av-height') || Avatar.profile.heightCm;
    Avatar.profile.weightKg    = num('av-weight') || Avatar.profile.weightKg;
    Avatar.profile.goalWeightKg = num('av-goal') || Avatar.profile.goalWeightKg;
    Avatar.profile.trainType   = str('av-train') || 'misto';
    Avatar.profile.waistCm     = num('av-waist');
    Avatar.profile.armCm       = num('av-arm');
    Avatar.profile.chestCm     = num('av-chest');
  },

  // ── Save & rebuild ────────────────────────────
  saveProfile() {
    this._applyFormToProfile();
    Avatar.saveProfile();
    Avatar.rebuildCharacter();
    this._renderDerivedStats();

    // Log the update
    this._logEvolution('Dados físicos atualizados');

    App.showToast('Avatar atualizado. ✦');
  },

  // ── Photo upload & AI analysis ────────────────
  handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview
    const preview = document.getElementById('avatar-photo-preview');
    const reader = new FileReader();

    reader.onload = async (e) => {
      const dataUrl = e.target.result;

      if (preview) {
        preview.src = dataUrl;
        preview.classList.remove('hidden');
      }

      // Extract base64 (strip data:image/...;base64, prefix)
      const [header, base64] = dataUrl.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';

      // AI analysis
      await Avatar.analyzePhoto(base64, mimeType);

      // Log
      this._logEvolution('Foto analisada pela IA — aparência atualizada');
      this._renderEvoLog();
    };

    reader.readAsDataURL(file);
  },

  // ── Badge update ──────────────────────────────
  _updateBadge() {
    const char = Store.get()?.character;
    if (!char) return;

    const badge = document.getElementById('avatar-arch-badge');
    const level = document.getElementById('avatar-level-glow');
    if (badge) badge.textContent = char.archetype;
    if (level) level.textContent = `Lv.${char.level}`;
  },

  // ── Derived stats display ─────────────────────
  _renderDerivedStats() {
    const container = document.getElementById('avatar-stats-derived');
    if (!container) return;

    const p = Avatar.profile;
    const m = Avatar.morph;
    const heightM = (p.heightCm || 175) / 100;
    const bmi = ((p.weightKg || 75) / (heightM * heightM)).toFixed(1);

    const weightDiff = p.goalWeightKg
      ? ((p.weightKg || 75) - p.goalWeightKg).toFixed(1)
      : null;

    const musclePercent = Math.round(m.muscle * 100);
    const fatPercent    = Math.round(m.fat    * 100);

    const completions = Store.get()?.completions?.length || 0;
    const strMissions = Store.get()?.completions?.filter(c => {
      const mission = Store.get()?.missions?.find(m => m.id === c.missionId);
      return mission?.stat === 'strength';
    }).length || 0;

    container.innerHTML = `
      <div class="av-stat-item">
        <span class="av-stat-label">IMC</span>
        <span class="av-stat-val">${bmi}</span>
      </div>
      <div class="av-stat-item">
        <span class="av-stat-label">Músculo</span>
        <span class="av-stat-val">${musclePercent}%</span>
      </div>
      <div class="av-stat-item">
        <span class="av-stat-label">Gordura</span>
        <span class="av-stat-val">${fatPercent}%</span>
      </div>
      ${weightDiff !== null ? `
      <div class="av-stat-item">
        <span class="av-stat-label">Para a meta</span>
        <span class="av-stat-val" style="color:${parseFloat(weightDiff) > 0 ? 'var(--str)' : 'var(--ene)'}">
          ${parseFloat(weightDiff) > 0 ? '-' : '+'}${Math.abs(weightDiff)} kg
        </span>
      </div>` : ''}
      <div class="av-stat-item">
        <span class="av-stat-label">Treinos força</span>
        <span class="av-stat-val">${strMissions}</span>
      </div>
      <div class="av-stat-item">
        <span class="av-stat-label">Total missões</span>
        <span class="av-stat-val">${completions}</span>
      </div>
    `;
  },

  // ── Evolution log ─────────────────────────────
  _logEvolution(msg) {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    this._evolutionLog.unshift({ date: today, msg });
    if (this._evolutionLog.length > 20) this._evolutionLog.length = 20;

    // Persist
    try { localStorage.setItem('ascend_avatar_evo', JSON.stringify(this._evolutionLog)); } catch(e) {}
  },

  _loadEvoLog() {
    try {
      const raw = localStorage.getItem('ascend_avatar_evo');
      if (raw) this._evolutionLog = JSON.parse(raw);
    } catch(e) {}
  },

  _renderEvoLog() {
    this._loadEvoLog();
    const container = document.getElementById('avatar-evolution-log');
    if (!container) return;

    if (this._evolutionLog.length === 0) {
      container.innerHTML = `<p style="color:var(--text-mute);font-size:13px;padding:8px 0">Complete missões para ver seu avatar evoluir aqui.</p>`;
      return;
    }

    container.innerHTML = this._evolutionLog.map(e => `
      <div class="av-evo-item">
        <div class="av-evo-dot"></div>
        <span class="av-evo-msg">${e.msg}</span>
        <span class="av-evo-date">${e.date}</span>
      </div>
    `).join('');
  },

  // Called by Missions.complete() after each mission
  onMissionComplete(missionType, stat) {
    Avatar.evolveFromCompletion(missionType, stat);

    const msgs = {
      strength: 'Treino de força — músculos crescendo',
      discipline: 'Disciplina reforçada — postura melhorando',
      focus: 'Foco apurado — mente e corpo em sincronia',
      energy: 'Energia elevada — resistência aumentando',
    };
    this._logEvolution(msgs[stat] || 'Missão completa — avatar evoluindo');

    this._renderEvoLog();
    this._renderDerivedStats();
  },
};

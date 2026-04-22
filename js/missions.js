// ─── MISSIONS MODULE ─────────────────────────────────────────────

const Missions = {
  currentFilter: 'all',
  newMission: { type: 'habit', difficulty: 1, stat: 'discipline' },

  // ── Render ────────────────────────────────────
  render(containerId, filterFn = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const state = Store.get();
    let missions = state.missions;
    if (filterFn) missions = missions.filter(filterFn);

    if (this.currentFilter !== 'all' && containerId === 'missions-list') {
      missions = missions.filter(m => m.type === this.currentFilter);
    }

    if (missions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">◈</div>
          <div class="empty-state-text">No quests yet</div>
          <div class="empty-state-sub">Create your first quest to begin the cycle</div>
        </div>`;
      return;
    }

    const today = Store.todayKey();

    // Sort: incomplete first
    const sorted = [...missions].sort((a, b) => {
      const aD = a.completedDates.includes(today);
      const bD = b.completedDates.includes(today);
      if (aD === bD) return 0;
      return aD ? 1 : -1;
    });

    container.innerHTML = sorted.map(m => this.renderItem(m)).join('');
  },

  renderItem(m) {
    const done = Store.isMissionCompletedToday(m.id);
    const typeLabel = m.type.charAt(0).toUpperCase() + m.type.slice(1);
    const diffLabel = m.difficulty === 3 ? 'Hard' : m.difficulty === 2 ? 'Medium' : 'Easy';
    const workoutExtra = (m.type === 'workout' && m.sets && m.reps)
      ? `<span class="mission-xp">${m.sets}×${m.reps}</span>` : '';

    return `
      <div class="mission-item ${done ? 'completed' : ''}" id="mission-${m.id}">
        <div class="mission-check" onclick="App.missions.complete('${m.id}')">${done ? '✓' : ''}</div>
        <div class="mission-body" onclick="App.missions.complete('${m.id}')">
          <div class="mission-name">${this.escHtml(m.name)}</div>
          <div class="mission-meta">
            <span class="mission-type type-${m.type}">${typeLabel}</span>
            ${workoutExtra}
            <span class="mission-xp">+${m.xpReward} XP</span>
            <span class="mission-xp" style="color:var(--text-mute)">${diffLabel}</span>
          </div>
        </div>
        <button class="mission-delete" onclick="App.missions.delete('${m.id}')">✕</button>
      </div>`;
  },

  // ── Actions ───────────────────────────────────
  complete(id) {
    const today = Store.todayKey();
    const m = Store.get().missions.find(m => m.id === id);
    if (!m) return;
    if (m.completedDates.includes(today)) return; // no un-completing

    const result = Store.completeMission(id);
    if (!result) return;

    // Flash animation
    const el = document.getElementById(`mission-${id}`);
    if (el) {
      const flash = document.createElement('div');
      flash.className = 'mission-complete-flash';
      el.appendChild(flash);
      setTimeout(() => flash.remove(), 700);
    }

    // Play chime
    this.playChime();

    // Narrative toast
    const msg = Narrative.getCompletion();
    App.showToast(`+${result.mission.xpReward} XP — ${msg.slice(0, 48)}${msg.length > 48 ? '...' : ''}`);

    // Refresh
    this.render('missions-list');
    this.render('dash-missions', m => {
      const state = Store.get();
      return !m.completedDates.includes(today) || m.completedDates.includes(today);
    });
    App.refreshDashboard();
    App.updateHeader();

    // Level up?
    if (result.xpResult.leveledUp) {
      setTimeout(() => App.showLevelUp(result.xpResult.newLevel), 800);
    }
  },

  delete(id) {
    Store.deleteMission(id);
    this.render('missions-list');
    this.render('dash-missions');
    App.refreshDashboard();
  },

  setFilter(filter, btn) {
    this.currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.render('missions-list');
  },

  // ── Add Modal ─────────────────────────────────
  openAdd() {
    this.newMission = { type: 'habit', difficulty: 1, stat: 'discipline' };
    document.getElementById('m-name').value = '';
    document.getElementById('m-sets').value = '';
    document.getElementById('m-reps').value = '';
    document.getElementById('m-notes').value = '';
    document.getElementById('workout-extras').classList.add('hidden');

    // Reset buttons
    document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-type="habit"]').classList.add('active');
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-diff="1"]').classList.add('active');
    document.querySelectorAll('[data-stat]').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-stat="discipline"]').classList.add('active');

    document.getElementById('modal-mission').classList.remove('hidden');
    setTimeout(() => document.getElementById('m-name').focus(), 400);
  },

  closeAdd(e) {
    if (!e || e.target === document.getElementById('modal-mission')) {
      document.getElementById('modal-mission').classList.add('hidden');
    }
  },

  setType(type, btn) {
    this.newMission.type = type;
    document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('workout-extras').classList.toggle('hidden', type !== 'workout');
  },

  setDiff(diff, btn) {
    this.newMission.difficulty = diff;
    document.querySelectorAll('[data-diff]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  setStat(stat, btn) {
    this.newMission.stat = stat;
    document.querySelectorAll('[data-stat]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  },

  save() {
    const name = document.getElementById('m-name').value.trim();
    if (!name) {
      document.getElementById('m-name').focus();
      document.getElementById('m-name').style.borderColor = 'var(--str)';
      setTimeout(() => document.getElementById('m-name').style.borderColor = '', 1200);
      return;
    }

    const mission = {
      ...this.newMission,
      name,
      sets: parseInt(document.getElementById('m-sets').value) || null,
      reps: parseInt(document.getElementById('m-reps').value) || null,
      notes: document.getElementById('m-notes').value.trim(),
    };

    Store.addMission(mission);
    this.closeAdd();
    this.render('missions-list');
    this.render('dash-missions');
    App.showToast('Quest forged. ✦');
  },

  // ── Audio ─────────────────────────────────────
  playChime() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.5);
      });
    } catch(e) { /* audio not available */ }
  },

  escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  },
};

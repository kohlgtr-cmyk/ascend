// ─── ASCEND STORE ────────────────────────────────────────────────
// Centralized state management with localStorage persistence

const STORE_KEY = 'ascend_v3';

const ARCHETYPES = {
  Warrior:  { glyph: '⚔',  statBonus: { strength: 2, discipline: 1, focus: 0, energy: 0 } },
  Mago:     { glyph: '✦',  statBonus: { strength: 0, discipline: 1, focus: 2, energy: 0 } },
  Guardião: { glyph: '◈',  statBonus: { strength: 1, discipline: 2, focus: 0, energy: 1 } },
  Sombra:   { glyph: '◆',  statBonus: { strength: 0, discipline: 0, focus: 2, energy: 2 } },
  Paladino: { glyph: '✙',  statBonus: { strength: 1, discipline: 2, focus: 0, energy: 1 } },
  Erudito:  { glyph: '♟',  statBonus: { strength: 0, discipline: 1, focus: 3, energy: 0 } },
  Arauto:   { glyph: '♪',  statBonus: { strength: 0, discipline: 0, focus: 1, energy: 3 } },
  Druida:   { glyph: '☽',  statBonus: { strength: 0, discipline: 1, focus: 1, energy: 2 } },
};

const XP_PER_LEVEL = (level) => Math.floor(100 * Math.pow(1.4, level - 1));

const DEFAULT_STATE = {
  onboarded: false,
  character: {
    name: '',
    archetype: 'Warrior',
    traits: [],
    level: 1,
    xp: 0,
    totalXp: 0,
    stats: { strength: 0, discipline: 0, focus: 0, energy: 0 },
    joinedDate: null,
  },
  missions: [],
  completions: [],
  streakData: { current: 0, best: 0, lastActiveDate: null },
  narrativeIndex: 0,
  dailyXpLog: {},
};

const Store = {
  state: null,

  load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      this.state = raw
        ? { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...JSON.parse(raw) }
        : JSON.parse(JSON.stringify(DEFAULT_STATE));
    } catch(e) {
      this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    }
    return this.state;
  },

  save() { localStorage.setItem(STORE_KEY, JSON.stringify(this.state)); },
  get()  { return this.state; },

  // ── Character ──────────────────────────────────
  initCharacter(name, archetype, traits) {
    const bonus = ARCHETYPES[archetype]?.statBonus || {};
    this.state.character = {
      name,
      archetype,
      traits,
      level: 1,
      xp: 0,
      totalXp: 0,
      stats: {
        strength:   bonus.strength   || 0,
        discipline: bonus.discipline || 0,
        focus:      bonus.focus      || 0,
        energy:     bonus.energy     || 0,
      },
      joinedDate: new Date().toISOString(),
    };
    this.state.onboarded = true;
    this.save();
  },

  // ── XP & Level ────────────────────────────────
  addXP(amount, stat) {
    const char = this.state.character;
    char.xp += amount;
    char.totalXp += amount;

    if (stat && char.stats[stat] !== undefined) {
      char.stats[stat] = Math.min(99, char.stats[stat] + 1);
    }

    const bonus = ARCHETYPES[char.archetype]?.statBonus || {};
    const bonusStats = Object.entries(bonus).filter(([,v]) => v > 0).map(([k]) => k);
    const bonusStat = bonusStats[Math.floor(Math.random() * bonusStats.length)];
    if (bonusStat && Math.random() < 0.3) {
      char.stats[bonusStat] = Math.min(99, char.stats[bonusStat] + 1);
    }

    let leveledUp = false;
    let needed = XP_PER_LEVEL(char.level);
    while (char.xp >= needed) {
      char.xp -= needed;
      char.level += 1;
      leveledUp = true;
      needed = XP_PER_LEVEL(char.level);
    }

    const today = this.todayKey();
    this.state.dailyXpLog[today] = (this.state.dailyXpLog[today] || 0) + amount;

    this.save();
    return { leveledUp, newLevel: char.level };
  },

  xpToNextLevel() { return XP_PER_LEVEL(this.state.character.level); },
  xpProgress() {
    const char = this.state.character;
    return Math.min(1, char.xp / XP_PER_LEVEL(char.level));
  },

  // ── Missions ──────────────────────────────────
  addMission(mission) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const m = {
      id,
      name: mission.name,
      type: mission.type || 'task',
      difficulty: mission.difficulty || 1,
      stat: mission.stat || 'discipline',
      xpReward: mission.difficulty === 3 ? 100 : mission.difficulty === 2 ? 50 : 20,
      sets: mission.sets || null,
      reps: mission.reps || null,
      notes: mission.notes || '',
      createdDate: this.todayKey(),
      completedDates: [],
    };
    this.state.missions.push(m);
    this.save();
    return m;
  },

  deleteMission(id) {
    this.state.missions = this.state.missions.filter(m => m.id !== id);
    this.save();
  },

  completeMission(id) {
    const today = this.todayKey();
    const m = this.state.missions.find(m => m.id === id);
    if (!m || m.completedDates.includes(today)) return null;

    m.completedDates.push(today);
    this.state.completions.unshift({ missionId: id, name: m.name, date: today, xp: m.xpReward });
    if (this.state.completions.length > 200) this.state.completions.length = 200;

    this.updateStreak();
    const xpResult = this.addXP(m.xpReward, m.stat);
    this.save();
    return { mission: m, xpResult };
  },

  isMissionCompletedToday(id) {
    const m = this.state.missions.find(m => m.id === id);
    return m ? m.completedDates.includes(this.todayKey()) : false;
  },

  // ── Streak ────────────────────────────────────
  updateStreak() {
    const today = this.todayKey();
    const sd = this.state.streakData;
    if (sd.lastActiveDate === today) return;
    const yesterday = this.offsetDateKey(-1);
    sd.current = sd.lastActiveDate === yesterday ? sd.current + 1 : 1;
    sd.best = Math.max(sd.best, sd.current);
    sd.lastActiveDate = today;
    this.save();
  },

  // ── Utils ─────────────────────────────────────
  todayKey()          { return new Date().toISOString().slice(0, 10); },
  offsetDateKey(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  },
  daysActive() {
    const joined = this.state.character.joinedDate;
    if (!joined) return 0;
    return Math.max(1, Math.floor((Date.now() - new Date(joined).getTime()) / 86400000) + 1);
  },
  xpHistory(days = 14) {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const key = this.offsetDateKey(-i);
      result.push({ date: key, xp: this.state.dailyXpLog[key] || 0 });
    }
    return result;
  },
  getArchetypeData(arch) {
    return ARCHETYPES[arch] || ARCHETYPES.Warrior;
  },
};

// ─── NARRATIVE SYSTEM ────────────────────────────────────────────
// Curated narrative messages for each context

const Narrative = {

  completions: [
    "You resisted the pull of ease. Your discipline carves deeper grooves.",
    "Another cycle closed. The realm within grows steadier.",
    "What you did today, most will not do. That distance is your edge.",
    "You kept your word to yourself. That is the rarest of victories.",
    "The inner world registers your action. A new layer forms.",
    "Discipline compounds silently. You may not see it today — but it is happening.",
    "You showed up when it was inconvenient. This is the work.",
    "The version of you that falters grew smaller today.",
    "Completion is not the reward. The becoming is.",
    "Every quest done is a vote for who you are choosing to be.",
    "The threshold was crossed. The realm expands.",
    "Your future self will remember this moment, even if your present self does not.",
    "You did not negotiate with resistance. You moved through it.",
    "Strength is not built in the moments of ease. You chose the harder road.",
    "The inner world does not lie. It records everything.",
  ],

  streaks: [
    "Consistency is the rarest superpower. You are building it.",
    "The streak is not the goal. The person it forges is.",
    "Each day added to the chain is a link that binds your future self to your intent.",
    "You have not missed a day. The realm remembers.",
  ],

  openings: [
    "A new cycle begins. The realm awaits your will.",
    "Dawn in the inner world. What will you forge today?",
    "The chapter opens. Your quests stand ready.",
    "Another day, another chance to move toward what you could become.",
    "The inner world stirs. The cycle turns.",
    "You return. The realm held steady while you rested.",
    "The path continues. One step at a time, the summit draws closer.",
  ],

  levelUp: [
    "Your inner world expands. The realm has taken notice.",
    "Growth cannot be undone. What you have built is yours.",
    "You cross a threshold that most never approach.",
    "The ascension is not an event. It is the visible proof of invisible work.",
    "A deeper layer of self is now accessible.",
    "The version of you that arrives here is not the same one that began.",
  ],

  reflections: [
    "The days you do not feel like it are the days that define you. Show up anyway.",
    "Your inner world reflects the state of your choices. Look clearly at both.",
    "There is no shortcut to becoming. There is only the accumulation of deliberate action.",
    "You are not trying to be perfect. You are trying to be consistent. These are different paths.",
    "The version of yourself you are building does not need motivation. They have something stronger: identity.",
    "Every system that works was built by someone who kept going when they did not feel like it.",
    "You do not need to be inspired. You need to be in motion.",
    "The gap between who you are and who you want to be is crossed not in leaps, but in daily small surrenders of comfort.",
  ],

  getRandom(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
  },

  getOpening() { return this.getRandom(this.openings); },
  getCompletion() { return this.getRandom(this.completions); },
  getLevelUp() { return this.getRandom(this.levelUp); },
  getReflection() { return this.getRandom(this.reflections); },

  // Narrative that adapts to archetype
  getArchetypeOpening(archetype) {
    const map = {
      Warrior: "The Warrior stirs. Strength calls to be tested.",
      Strategist: "The Strategist considers the board. Today's moves matter.",
      Creator: "The Creator opens their eyes. What will be made today?",
      Sentinel: "The Sentinel holds the line. Another cycle, another vigil.",
    };
    return map[archetype] || this.getOpening();
  },
};

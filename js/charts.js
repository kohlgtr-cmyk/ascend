// ─── CHARTS MODULE ───────────────────────────────────────────────

const Charts = {
  xpChart: null,
  radarChart: null,

  renderXP() {
    const ctx = document.getElementById('xp-chart');
    if (!ctx) return;

    const history = Store.xpHistory(14);
    const labels = history.map(h => {
      const d = new Date(h.date + 'T00:00:00');
      return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    });
    const data = history.map(h => h.xp);

    if (this.xpChart) { this.xpChart.destroy(); this.xpChart = null; }

    this.xpChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'XP',
          data,
          backgroundColor: data.map(v => v > 0 ? '#d4a84340' : '#1e1e2e'),
          borderColor: data.map(v => v > 0 ? '#d4a843' : '#2a2a3e'),
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: {
          backgroundColor: '#13131f',
          borderColor: '#2a2a3e',
          borderWidth: 1,
          titleColor: '#d4a843',
          bodyColor: '#8a8090',
          callbacks: { label: ctx => `${ctx.parsed.y} XP` }
        }},
        scales: {
          x: {
            ticks: { color: '#4a4458', font: { size: 10 }, maxRotation: 0 },
            grid: { color: '#1e1e2e' },
          },
          y: {
            ticks: { color: '#4a4458', font: { size: 10 } },
            grid: { color: '#1e1e2e' },
            beginAtZero: true,
          }
        }
      }
    });
  },

  renderRadar() {
    const ctx = document.getElementById('radar-chart');
    if (!ctx) return;

    const stats = Store.get().character.stats;
    const maxVal = Math.max(10, ...Object.values(stats));

    if (this.radarChart) { this.radarChart.destroy(); this.radarChart = null; }

    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Strength', 'Discipline', 'Focus', 'Energy'],
        datasets: [{
          label: 'Attributes',
          data: [stats.strength, stats.discipline, stats.focus, stats.energy],
          backgroundColor: '#d4a84320',
          borderColor: '#d4a843',
          borderWidth: 1.5,
          pointBackgroundColor: '#d4a843',
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0,
            max: maxVal,
            ticks: { display: false, stepSize: Math.max(1, Math.floor(maxVal / 5)) },
            grid: { color: '#1e1e2e' },
            angleLines: { color: '#1e1e2e' },
            pointLabels: { color: '#8a8090', font: { size: 11, family: 'Cinzel, serif' } },
          }
        }
      }
    });
  },

  renderHistory() {
    const container = document.getElementById('history-list');
    if (!container) return;

    const completions = Store.get().completions.slice(0, 20);
    if (completions.length === 0) {
      container.innerHTML = '<p style="color:var(--text-mute);font-size:13px;padding:12px 0">No completions yet. Begin your first quest.</p>';
      return;
    }

    container.innerHTML = completions.map(c => `
      <div class="history-item">
        <div class="history-dot"></div>
        <div class="history-name">${Missions.escHtml(c.name)}</div>
        <div class="history-xp">+${c.xp} XP</div>
        <div class="history-date">${Charts.formatDate(c.date)}</div>
      </div>`).join('');
  },

  formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  },

  refreshAll() {
    this.renderXP();
    this.renderRadar();
    this.renderHistory();
  },
};

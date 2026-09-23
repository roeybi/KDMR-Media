// Cloud Media Academy live quiz server.
// One process: Express serves the pages, Socket.io runs the game.
// Game state lives in memory and is saved to data/state.json every 2 seconds.

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const express = require('express');
const compression = require('compression');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const PORT = Number(process.env.PORT) || 3000;
const HOST_PASSWORD = process.env.HOST_PASSWORD || 'cloudmedia';
const TIME_SCALE = Number(process.env.TIME_SCALE) || 1; // only for bot tests: 0.05 = 20x faster
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');
const GAMES_FILE = process.env.GAMES_FILE || path.join(__dirname, 'games.json');

const ANSWER_GRACE_MS = 700; // accept answers that arrive just after the timer on slow WiFi
const MAX_NAME = 20;

// ---------------------------------------------------------------- games.json

function loadGames() {
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'));
  } catch (err) {
    fail(`games.json could not be read. Check for a missing comma or quote.\n${err.message}`);
  }
  const games = raw.games;
  if (!Array.isArray(games) || games.length === 0) fail('games.json has no "games" list.');
  const ids = new Set();
  games.forEach((g, gi) => {
    const where = `Game ${gi + 1} (${g.title || 'no title'})`;
    if (!g.id || ids.has(g.id)) fail(`${where}: every game needs a unique "id".`);
    ids.add(g.id);
    if (!g.title) fail(`${where}: missing "title".`);
    if (!Array.isArray(g.items) || g.items.length === 0) fail(`${where}: no items.`);
    g.items.forEach((it, qi) => {
      const w = `${where}, item ${qi + 1}`;
      const needTime = () => {
        if (!(it.time > 0)) fail(`${w}: "time" must be a number of seconds.`);
      };
      switch (it.type) {
        case 'quiz':
          needTime();
          if (!Array.isArray(it.options) || it.options.length < 2 || it.options.length > 6)
            fail(`${w}: a quiz needs 2 to 6 options.`);
          if (!it.options.includes(it.correct))
            fail(`${w}: "correct" must be copied exactly from one of the options. Got: ${it.correct}`);
          break;
        case 'truefalse':
          needTime();
          if (typeof it.correct !== 'boolean') fail(`${w}: "correct" must be true or false.`);
          break;
        case 'poll':
          needTime();
          if (!Array.isArray(it.options) || it.options.length < 2 || it.options.length > 6)
            fail(`${w}: a poll needs 2 to 6 options.`);
          break;
        case 'order':
          needTime();
          if (!Array.isArray(it.items) || it.items.length < 2 || it.items.length > 6)
            fail(`${w}: an order question needs 2 to 6 items.`);
          break;
        case 'content':
          if (!it.title && !it.text) fail(`${w}: a content slide needs a title or text.`);
          break;
        default:
          fail(`${w}: unknown type "${it.type}". Use quiz, truefalse, poll, order or content.`);
      }
    });
  });
  return games;
}

function fail(msg) {
  console.error('\n*** PROBLEM IN games.json ***\n' + msg + '\n');
  process.exit(1);
}

const GAMES = loadGames();
const gameById = (id) => GAMES.find((g) => g.id === id);

// ---------------------------------------------------------------- state

function newPin() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function freshState() {
  return {
    pin: newPin(),
    phase: 'idle', // idle | lobby | question | reveal | leaderboard | content | podium | champion
    players: {}, // id -> { id, name, key, score, last }
    dayTotals: {}, // name key -> { name, total }
    game: null,
    results: {}, // gameId -> finished game snapshot for CSV
    played: {}, // gameId -> true
  };
}

let S = loadState();

function loadState() {
  try {
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (s && s.pin && s.players) {
      console.log(`Restored saved game state (PIN ${s.pin}, ${Object.keys(s.players).length} players).`);
      return Object.assign(freshState(), s);
    }
  } catch (_) {
    /* no saved state yet */
  }
  return freshState();
}

let dirty = false;
function markDirty() {
  dirty = true;
}
function saveNow() {
  if (!dirty) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmp = STATE_FILE + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(S));
    fs.renameSync(tmp, STATE_FILE);
    dirty = false;
  } catch (err) {
    console.error('Could not save state:', err.message);
  }
}
setInterval(saveNow, 2000);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    saveNow();
    process.exit(0);
  });
}

// ---------------------------------------------------------------- helpers

const now = () => Date.now();

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cleanName(name) {
  return String(name || '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_NAME);
}
const nameKey = (n) => n.toLowerCase();

function isScored(item) {
  return item.type === 'quiz' || item.type === 'truefalse' || item.type === 'order';
}

// Build the list of items actually played, with answer order fixed per run.
function buildRunItem(src, srcIndex, n) {
  const it = { srcIndex, type: src.type, time: src.time || 0 };
  if (src.type === 'content') {
    it.title = src.title || '';
    it.text = src.text || '';
    it.timerMinutes = src.timerMinutes || 0;
    return it;
  }
  it.question = src.question;
  if (src.repeatable) {
    it.repeatable = true;
    it.n = n || 1;
    it.question = src.question.replace(/\{n\}/g, String(it.n));
  }
  if (src.type === 'quiz') {
    it.options = src.options.slice();
    it.correct = src.options.indexOf(src.correct);
    it.display = shuffle(it.options.map((_, i) => i)); // only quiz answers are shuffled
  } else if (src.type === 'truefalse') {
    it.options = ['True', 'False'];
    it.correct = src.correct ? 0 : 1;
    it.display = [0, 1];
  } else if (src.type === 'poll') {
    it.options = src.options.slice();
    it.display = it.options.map((_, i) => i);
  } else if (src.type === 'order') {
    it.options = src.items.slice(); // correct order as written
    let d;
    do d = shuffle(it.options.map((_, i) => i));
    while (d.every((v, i) => v === i));
    it.display = d; // how phones show them before tapping
  }
  return it;
}

function currentItem() {
  const g = S.game;
  return g ? g.items[g.index] : null;
}

function connectedPlayerIds() {
  return Object.keys(S.players).filter((id) => (liveSockets.get(id) || 0) > 0);
}

function rankedPlayers() {
  const list = Object.values(S.players).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  let rank = 0;
  let prev = null;
  list.forEach((p, i) => {
    if (p.score !== prev) rank = i + 1;
    prev = p.score;
    p._rank = rank;
  });
  return list;
}

function rankedDay() {
  return Object.values(S.dayTotals).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function points(ms, limitMs) {
  const frac = Math.min(1, Math.max(0, ms / limitMs));
  return Math.max(500, Math.min(1000, Math.round(1000 * (1 - frac / 2))));
}

// ---------------------------------------------------------------- game flow

let timer = null;
function armTimer() {
  clearTimeout(timer);
  timer = null;
  const g = S.game;
  if (S.phase === 'question' && g && g.endsAt) {
    const wait = Math.max(0, g.endsAt - now() + ANSWER_GRACE_MS);
    timer = setTimeout(() => {
      if (S.phase === 'question') reveal();
    }, wait);
  }
}

function startGame(gameId) {
  const src = gameById(gameId);
  if (!src) return;
  S.game = {
    id: src.id,
    title: src.title,
    showChampionAfter: !!src.showChampionAfter,
    items: src.items.map((it, i) => buildRunItem(it, i, 1)),
    index: -1,
    startedAt: null,
    endsAt: null,
    answers: {}, // playerId -> { choice, ms, correct, points }
    log: {}, // playerId -> { [itemIndex]: { answer, correct, points, ms } }
    lastPoints: {},
  };
  for (const p of Object.values(S.players)) {
    p.score = 0;
    p.last = null;
  }
  S.phase = 'lobby';
  changed(true);
}

function goToItem(index) {
  const g = S.game;
  if (!g) return;
  if (index >= g.items.length) return finishGame();
  g.index = index;
  g.answers = {};
  g.lastPoints = {};
  for (const p of Object.values(S.players)) p.last = null;
  const it = g.items[index];
  g.startedAt = now();
  if (it.type === 'content') {
    S.phase = 'content';
    g.endsAt = it.timerMinutes ? g.startedAt + it.timerMinutes * 60000 * TIME_SCALE : null;
  } else {
    S.phase = 'question';
    g.endsAt = g.startedAt + it.time * 1000 * TIME_SCALE;
  }
  changed(true);
}

function reveal() {
  const g = S.game;
  const it = currentItem();
  if (!g || !it || S.phase !== 'question') return;
  // Record everyone (including non-answerers) in the log for the CSV.
  for (const pid of Object.keys(S.players)) {
    const a = g.answers[pid];
    g.log[pid] = g.log[pid] || {};
    g.log[pid][g.index] = a
      ? { answer: answerText(it, a.choice), correct: a.correct, points: a.points, ms: a.ms }
      : { answer: '', correct: false, points: 0, ms: null };
    S.players[pid].last = a ? { correct: a.correct, points: a.points } : { correct: false, points: 0, none: true };
  }
  g.endsAt = null;
  S.phase = 'reveal';
  changed(true);
}

function answerText(it, choice) {
  if (it.type === 'order') return choice.map((i) => it.options[i]).join(' > ');
  return it.options[choice];
}

function advance() {
  const g = S.game;
  if (!g) return;
  goToItem(g.index + 1);
}

function finishGame() {
  const g = S.game;
  if (!g) return;
  clearTimeout(timer);
  g.endsAt = null;
  S.phase = 'podium';
  S.played[g.id] = true;
  S.results[g.id] = snapshotResults();
  changed(true);
}

function next() {
  switch (S.phase) {
    case 'lobby':
      return goToItem(0);
    case 'question':
      return reveal();
    case 'reveal':
      return isScored(currentItem()) ? showLeaderboard() : advance();
    case 'leaderboard':
    case 'content':
      return advance();
    case 'podium':
      if (S.game && S.game.showChampionAfter) {
        S.phase = 'champion';
        return changed(true);
      }
      return backToGames();
    case 'champion':
      return backToGames();
  }
}

function showLeaderboard() {
  S.phase = 'leaderboard';
  changed(true);
}

function skip() {
  if (S.phase === 'question') {
    // Skip means this question does not count for anyone.
    const g = S.game;
    for (const [pid, a] of Object.entries(g.answers)) {
      const p = S.players[pid];
      if (p && a.points) {
        p.score -= a.points;
        const d = S.dayTotals[p.key];
        if (d) d.total -= a.points;
      }
    }
    g.answers = {};
    return advance();
  }
  if (['reveal', 'leaderboard', 'content'].includes(S.phase)) return advance();
  if (S.phase === 'lobby') return goToItem(0);
}

function addTime() {
  const g = S.game;
  if (!g) return;
  if (S.phase === 'question' && g.endsAt) g.endsAt += 10000; // +10 seconds
  else if (S.phase === 'content') g.endsAt = Math.max(g.endsAt || 0, now()) + 60000; // +1 minute
  else return;
  changed(true);
}

function anotherPair() {
  const g = S.game;
  const it = currentItem();
  if (!g || !it || !it.repeatable) return;
  // Find the last consecutive repeat of this vote and add the next pair after it.
  let last = g.index;
  while (g.items[last + 1] && g.items[last + 1].repeatable && g.items[last + 1].srcIndex === it.srcIndex) last++;
  const src = gameById(g.id).items[it.srcIndex];
  const n = g.items[last].n + 1;
  g.items.splice(last + 1, 0, buildRunItem(src, it.srcIndex, n));
  if (last === g.index && (S.phase === 'reveal' || S.phase === 'leaderboard')) return goToItem(g.index + 1);
  changed(true);
}

function backToGames() {
  clearTimeout(timer);
  S.game = null;
  S.phase = 'idle';
  for (const p of Object.values(S.players)) {
    p.score = 0;
    p.last = null;
  }
  changed(true);
}

function submitAnswer(pid, choice) {
  const g = S.game;
  const it = currentItem();
  const p = S.players[pid];
  if (!p || !g || !it || S.phase !== 'question') return { ok: false, error: 'Too late, this question is closed.' };
  if (g.answers[pid]) return { ok: true, already: true };
  const t = now();
  if (t > g.endsAt + ANSWER_GRACE_MS) return { ok: false, error: 'Time is up.' };
  const n = it.options.length;
  let correct = false;
  if (it.type === 'order') {
    if (!Array.isArray(choice) || choice.length !== n) return { ok: false, error: 'Tap every item.' };
    const seen = new Set(choice);
    if (seen.size !== n || !choice.every((c) => Number.isInteger(c) && c >= 0 && c < n))
      return { ok: false, error: 'Tap every item.' };
    correct = choice.every((c, i) => c === i);
  } else {
    if (!Number.isInteger(choice) || choice < 0 || choice >= n) return { ok: false, error: 'Bad answer.' };
    correct = it.type === 'poll' ? false : choice === it.correct;
  }
  const ms = Math.max(0, t - g.startedAt);
  const pts = isScored(it) && correct ? points(ms, g.endsAt - g.startedAt) : 0;
  g.answers[pid] = { choice, ms, correct, points: pts };
  if (pts) {
    p.score += pts;
    const d = (S.dayTotals[p.key] = S.dayTotals[p.key] || { name: p.name, total: 0 });
    d.name = p.name;
    d.total += pts;
  }
  markDirty();
  // Everyone still connected has answered: reveal straight away, like Kahoot.
  const live = connectedPlayerIds();
  if (live.length > 0 && live.every((id) => g.answers[id])) {
    setTimeout(() => {
      if (S.phase === 'question' && S.game === g && g.items[g.index] === it) reveal();
    }, 400);
  }
  changed(false);
  return { ok: true };
}

// ---------------------------------------------------------------- players

function joinPlayer(pin, rawName) {
  if (String(pin).trim() !== S.pin) return { ok: false, error: 'Wrong PIN. Check the screen.' };
  const name = cleanName(rawName);
  if (name.length < 1) return { ok: false, error: 'Type a nickname.' };
  const key = nameKey(name);
  const existing = Object.values(S.players).find((p) => p.key === key);
  if (existing) {
    // Same nickname, nobody using it right now: treat it as that person coming back.
    if ((liveSockets.get(existing.id) || 0) > 0) return { ok: false, error: 'That nickname is taken. Try another.' };
    return { ok: true, player: existing };
  }
  const id = 'p' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const p = { id, name, key, score: 0, last: null };
  S.players[id] = p;
  if (!S.dayTotals[key]) S.dayTotals[key] = { name, total: 0 };
  return { ok: true, player: p };
}

function removePlayer(pid) {
  const p = S.players[pid];
  if (!p) return;
  delete S.players[pid];
  if (S.dayTotals[p.key] && S.dayTotals[p.key].total === 0) delete S.dayTotals[p.key];
  if (S.game) delete S.game.answers[pid];
  io.to('p:' + pid).emit('kicked');
  changed(true);
}

// ---------------------------------------------------------------- views

function publicItem(it, forHost) {
  if (!it) return null;
  if (it.type === 'content') return { type: 'content', title: it.title, text: it.text, timerMinutes: it.timerMinutes };
  const out = {
    type: it.type,
    question: it.question,
    repeatable: !!it.repeatable,
    options: it.display.map((i, pos) => ({ id: i, text: it.options[i], pos })),
  };
  if (forHost || S.phase === 'reveal' || S.phase === 'leaderboard') {
    if (it.type === 'order') out.correctOrder = it.options.slice();
    else if (it.correct !== undefined) out.correct = it.correct;
  }
  return out;
}

function counts(it) {
  const g = S.game;
  if (!it || it.type === 'content') return null;
  if (it.type === 'order') {
    let right = 0;
    let total = 0;
    for (const a of Object.values(g.answers)) {
      total++;
      if (a.correct) right++;
    }
    return { right, wrong: total - right, total };
  }
  const c = it.options.map(() => 0);
  for (const a of Object.values(g.answers)) c[a.choice]++;
  return c;
}

function hostView() {
  const g = S.game;
  const it = currentItem();
  const ranked = rankedPlayers();
  const view = {
    serverNow: now(),
    phase: S.phase,
    pin: S.pin,
    lanUrls: lanUrls(),
    games: GAMES.map((x) => ({
      id: x.id,
      title: x.title,
      count: x.items.length,
      played: !!S.played[x.id],
      hasResults: !!S.results[x.id],
    })),
    players: Object.values(S.players)
      .map((p) => ({ id: p.id, name: p.name, online: (liveSockets.get(p.id) || 0) > 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    online: connectedPlayerIds().length,
    dayTop: rankedDay().slice(0, 10),
  };
  if (g) {
    view.game = {
      id: g.id,
      title: g.title,
      index: g.index,
      total: g.items.length,
      startedAt: g.startedAt,
      endsAt: g.endsAt,
      showChampionAfter: g.showChampionAfter,
      item: publicItem(it, true),
      scored: it ? isScored(it) : false,
      time: it ? it.time * TIME_SCALE : 0,
      answered: Object.keys(g.answers).length,
      counts: S.phase === 'reveal' || S.phase === 'leaderboard' ? counts(it) : null,
      leaderboard: ranked.slice(0, 5).map((p) => ({ name: p.name, score: p.score, gained: p.last ? p.last.points : 0 })),
      podium: ranked.slice(0, 3).map((p) => ({ name: p.name, score: p.score })),
    };
  }
  return view;
}

function playerView(p) {
  const g = S.game;
  const it = currentItem();
  const view = { serverNow: now(), phase: S.phase, name: p.name, pin: S.pin };
  if (!g) return view;
  view.gameTitle = g.title;
  view.index = g.index;
  view.total = g.items.length;
  view.endsAt = g.endsAt;
  // Points are added when the answer arrives, but only shown after the reveal.
  const hidden = S.phase === 'question' && g.answers[p.id] ? g.answers[p.id].points : 0;
  view.score = p.score - hidden;
  if (S.phase === 'question' || S.phase === 'content' || S.phase === 'reveal' || S.phase === 'leaderboard') {
    view.item = publicItem(it, false);
    const mine = g.answers[p.id];
    view.answered = !!mine;
    if (mine && it.type !== 'order') view.myChoice = mine.choice;
  }
  if (S.phase === 'reveal' || S.phase === 'leaderboard' || S.phase === 'podium') {
    const ranked = rankedPlayers();
    const me = ranked.find((x) => x.id === p.id);
    view.rank = me ? me._rank : null;
    view.of = ranked.length;
    view.last = p.last;
    view.scored = it ? isScored(it) : false;
  }
  if (S.phase === 'champion') {
    const day = rankedDay();
    const i = day.findIndex((d) => d.name.toLowerCase() === p.key);
    view.dayRank = i >= 0 ? i + 1 : null;
    view.dayTotal = i >= 0 ? day[i].total : 0;
    view.of = day.length;
  }
  return view;
}

// ---------------------------------------------------------------- CSV

function snapshotResults() {
  const g = S.game;
  const src = gameById(g.id);
  const questions = g.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => it.type !== 'content')
    .map(({ it, i }) => ({ index: i, label: `Q${i + 1} ${it.question}`, type: it.type }));
  const rows = rankedPlayers().map((p) => ({
    rank: p._rank,
    name: p.name,
    score: p.score,
    log: g.log[p.id] || {},
  }));
  return { title: src.title, finishedAt: new Date().toISOString(), questions, rows };
}

function csvCell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = "'" + s; // stop Excel treating answers as formulas
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function resultsCsv(gameId) {
  let snap = S.results[gameId];
  if (!snap && S.game && S.game.id === gameId) snap = snapshotResults();
  if (!snap) return null;
  const head = ['Rank', 'Nickname', 'Game score', 'Day total'];
  for (const q of snap.questions) {
    head.push(`${q.label} | answer`, `Q${q.index + 1} | correct`, `Q${q.index + 1} | seconds`, `Q${q.index + 1} | points`);
  }
  const lines = [head.map(csvCell).join(',')];
  for (const r of snap.rows) {
    const day = S.dayTotals[nameKey(r.name)];
    const row = [r.rank, r.name, r.score, day ? day.total : ''];
    for (const q of snap.questions) {
      const a = r.log[q.index];
      row.push(
        a ? a.answer : '',
        a && q.type !== 'poll' && a.answer !== '' ? (a.correct ? 'yes' : 'no') : '',
        a && a.ms !== null && a.ms !== undefined ? (a.ms / 1000).toFixed(1) : '',
        a ? a.points : 0,
      );
    }
    lines.push(row.map(csvCell).join(','));
  }
  return { name: snap.title, csv: '﻿' + lines.join('\r\n') };
}

// ---------------------------------------------------------------- network info

function lanUrls() {
  const out = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      if (/^(docker|br-|veth|vmnet|vboxnet|utun|tun)/i.test(name)) continue;
      out.push(`http://${a.address}:${PORT}`);
    }
  }
  // Home and venue WiFi usually hand out 192.168.x.x or 10.x.x.x addresses.
  const score = (u) => (u.includes('//192.168.') ? 0 : u.includes('//10.') ? 1 : u.includes('//172.') ? 2 : 3);
  return out.sort((a, b) => score(a) - score(b));
}

// ---------------------------------------------------------------- web server

const app = express();
app.disable('x-powered-by');
app.use(compression());
const pub = path.join(__dirname, 'public');
app.get('/healthz', (_req, res) => res.type('text').send('ok'));
// The browser copy of Socket.io, served through Express so it gets gzipped.
const SIO_CLIENT = path.join(path.dirname(require.resolve('socket.io')), '..', 'client-dist', 'socket.io.min.js');
if (!fs.existsSync(SIO_CLIENT)) throw new Error('Socket.io browser file missing. Run npm install.');
app.get('/sio.js', (_req, res) => {
  res.set('Cache-Control', 'public, max-age=86400');
  res.sendFile(SIO_CLIENT);
});
app.get('/host', (_req, res) => res.sendFile(path.join(pub, 'host.html')));
app.get('/qr.svg', async (req, res) => {
  const data = String(req.query.data || '').slice(0, 300);
  if (!data) return res.status(400).end();
  try {
    const svg = await QRCode.toString(data, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
    res.set('Cache-Control', 'public, max-age=3600').type('image/svg+xml').send(svg);
  } catch (_) {
    res.status(500).end();
  }
});
app.get('/results.csv', (req, res) => {
  if (req.get('x-host-password') !== HOST_PASSWORD) return res.status(403).send('Wrong host password');
  const out = resultsCsv(String(req.query.game || ''));
  if (!out) return res.status(404).send('No results for that game yet');
  const file = out.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') + '.csv';
  res.set('Content-Disposition', `attachment; filename="${file}"`).type('text/csv').send(out.csv);
});
app.use(express.static(pub, { maxAge: '5m', index: 'index.html' }));

const server = http.createServer(app);
const io = new Server(server, {
  serveClient: false,
  pingInterval: 20000,
  pingTimeout: 25000,
  maxHttpBufferSize: 1e5,
  connectionStateRecovery: undefined,
});

const liveSockets = new Map(); // playerId -> number of open sockets

let hostTimer = null;
let playersTimer = null;
function changed(everyone) {
  markDirty();
  if (everyone) armTimer();
  // Coalesce bursts (for example 60 answers in one second) into one update.
  if (!hostTimer) {
    hostTimer = setTimeout(() => {
      hostTimer = null;
      io.to('host').emit('state', hostView());
    }, everyone ? 0 : 150);
  }
  if (everyone && !playersTimer) {
    playersTimer = setTimeout(() => {
      playersTimer = null;
      for (const p of Object.values(S.players)) {
        if ((liveSockets.get(p.id) || 0) > 0) io.to('p:' + p.id).emit('state', playerView(p));
      }
    }, 0);
  }
}

function attachPlayer(socket, p) {
  if (socket.data.pid === p.id) return;
  detachPlayer(socket);
  socket.data.pid = p.id;
  socket.join('p:' + p.id);
  liveSockets.set(p.id, (liveSockets.get(p.id) || 0) + 1);
  changed(false);
}
function detachPlayer(socket) {
  const pid = socket.data.pid;
  if (!pid) return;
  socket.leave('p:' + pid);
  socket.data.pid = null;
  const n = (liveSockets.get(pid) || 1) - 1;
  if (n <= 0) liveSockets.delete(pid);
  else liveSockets.set(pid, n);
  changed(false);
}

const ack = (cb) => (typeof cb === 'function' ? cb : () => {});

io.on('connection', (socket) => {
  // ---- players
  socket.on('join', (data, cb) => {
    cb = ack(cb);
    const r = joinPlayer(data && data.pin, data && data.name);
    if (!r.ok) return cb(r);
    attachPlayer(socket, r.player);
    markDirty();
    changed(false);
    cb({ ok: true, playerId: r.player.id, name: r.player.name, pin: S.pin, state: playerView(r.player) });
  });

  socket.on('rejoin', (data, cb) => {
    cb = ack(cb);
    const p = data && S.players[data.playerId];
    if (!p || String(data.pin) !== S.pin) return cb({ ok: false });
    attachPlayer(socket, p);
    cb({ ok: true, name: p.name, state: playerView(p) });
  });

  socket.on('sync', (_d, cb) => {
    cb = ack(cb);
    const p = S.players[socket.data.pid];
    cb(p ? { ok: true, state: playerView(p) } : { ok: false });
  });

  socket.on('answer', (data, cb) => {
    cb = ack(cb);
    const pid = socket.data.pid;
    if (!pid || !S.players[pid]) return cb({ ok: false, error: 'Please rejoin.' });
    const r = submitAnswer(pid, data && data.choice);
    cb(r);
  });

  socket.on('leave', () => detachPlayer(socket));

  // ---- host
  socket.on('host:auth', (data, cb) => {
    cb = ack(cb);
    if (!data || data.password !== HOST_PASSWORD) return cb({ ok: false });
    socket.data.isHost = true;
    socket.join('host');
    cb({ ok: true, state: hostView() });
  });

  const hostCmd = (name, fn) =>
    socket.on(name, (data, cb) => {
      cb = ack(cb);
      if (!socket.data.isHost) return cb({ ok: false, error: 'Not signed in as host' });
      try {
        fn(data || {});
        cb({ ok: true });
      } catch (err) {
        console.error(name, err);
        cb({ ok: false, error: err.message });
      }
    });

  hostCmd('host:start', (d) => startGame(d.gameId));
  hostCmd('host:next', () => next());
  hostCmd('host:skip', () => skip());
  hostCmd('host:addTime', () => addTime());
  hostCmd('host:end', () => (S.game ? finishGame() : null));
  hostCmd('host:pair', () => anotherPair());
  hostCmd('host:games', () => backToGames());
  hostCmd('host:champion', () => {
    clearTimeout(timer);
    if (S.game && S.phase !== 'podium') finishGame();
    S.phase = 'champion';
    changed(true);
  });
  hostCmd('host:resetDay', () => {
    S.dayTotals = {};
    for (const p of Object.values(S.players)) S.dayTotals[p.key] = { name: p.name, total: 0 };
    S.played = {};
    changed(true);
  });
  hostCmd('host:newPin', () => {
    S.pin = newPin();
    S.players = {};
    for (const s of io.of('/').sockets.values()) {
      if (s.data.pid) s.emit('kicked');
      detachPlayer(s);
    }
    liveSockets.clear();
    backToGames();
  });
  hostCmd('host:kick', (d) => removePlayer(d.playerId));

  socket.on('disconnect', () => detachPlayer(socket));
});

server.listen(PORT, () => {
  armTimer();
  console.log('');
  console.log('  Live quiz is running.');
  console.log(`  Host screen:  http://localhost:${PORT}/host`);
  for (const u of lanUrls()) console.log(`  Phones join:  ${u}`);
  console.log(`  PIN: ${S.pin}`);
  if (!process.env.HOST_PASSWORD) console.log('  Host password: cloudmedia (set HOST_PASSWORD to change it)');
  if (TIME_SCALE !== 1) console.log(`  TEST MODE: timers x${TIME_SCALE}`);
  console.log('');
});

module.exports = { server };

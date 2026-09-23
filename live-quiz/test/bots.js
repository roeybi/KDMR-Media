// Bot test: 40 fake players play all 6 games against a real server.
// Players answer at random speeds, drop out and rejoin mid-game, one forgets
// their session and rejoins by nickname, the host page "refreshes", and the
// server is restarted in the middle of game 3.
//
// Run with:  npm run test:bots
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { io } = require('socket.io-client');

const PORT = 3999;
const URL = `http://localhost:${PORT}`;
const PASSWORD = 'bot-test';
const N_PLAYERS = Number(process.env.BOTS) || 40;
const TIME_SCALE = 0.1; // a 20 second question lasts 2 seconds
const DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-bots-'));
const games = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'games.json'), 'utf8')).games;

const problems = [];
const stats = { answers: 0, drops: 0, rejoins: 0, nameRejoins: 0, restarts: 0, hostRefresh: 0, pairs: 0, addTime: 0, skips: 0 };
const problem = (msg) => {
  problems.push(msg);
  console.log('  PROBLEM: ' + msg);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.random() * (b - a);

// ------------------------------------------------------------ server process

let server = null;
let serverErr = '';
function startServer() {
  return new Promise((resolve, reject) => {
    server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
      env: { ...process.env, PORT: String(PORT), HOST_PASSWORD: PASSWORD, TIME_SCALE: String(TIME_SCALE), DATA_DIR },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    server.stderr.on('data', (d) => (serverErr += d));
    server.stdout.on('data', (d) => {
      if (String(d).includes('Live quiz is running')) resolve();
    });
    server.on('exit', (code) => {
      if (code && code !== 0) reject(new Error('server exited ' + code));
    });
  });
}
function stopServer() {
  return new Promise((resolve) => {
    server.once('exit', resolve);
    server.kill('SIGTERM');
  });
}

// ------------------------------------------------------------ players

class Bot {
  constructor(i) {
    this.name = 'Bot' + String(i).padStart(2, '0');
    this.session = null;
    this.state = null;
    this.lastScore = 0;
    this.answeredKey = null;
    this.away = false;
    this.connect();
  }
  connect() {
    this.socket = io(URL, { reconnectionDelay: 300, reconnectionDelayMax: 1500, forceNew: true });
    this.socket.on('connect', () => {
      if (this.session) this.rejoin();
    });
    this.socket.on('state', (s) => this.onState(s));
    this.socket.on('kicked', () => problem(this.name + ' was kicked unexpectedly'));
  }
  join(pin) {
    return new Promise((resolve) => {
      this.socket.timeout(5000).emit('join', { pin, name: this.name }, (err, res) => {
        if (err || !res.ok) {
          problem(`${this.name} could not join: ${err ? err.message : res.error}`);
          return resolve(false);
        }
        this.session = { pin: res.pin, playerId: res.playerId };
        this.onState(res.state);
        resolve(true);
      });
    });
  }
  rejoin() {
    const before = this.lastScore;
    const beforeGame = this.lastGame;
    this.socket.timeout(5000).emit('rejoin', this.session, (err, res) => {
      if (err) return; // will retry on the next connect
      if (!res.ok) return problem(`${this.name} rejoin refused`);
      stats.rejoins++;
      if (res.name !== this.name) problem(`${this.name} came back as ${res.name}`);
      // Scores reset per game, so only compare within the same game.
      if (res.state.score != null && res.state.gameTitle === beforeGame && res.state.phase !== 'lobby' && res.state.score < before)
        problem(`${this.name} score went down after rejoin: ${before} -> ${res.state.score}`);
      this.onState(res.state);
    });
  }
  // Simulate leaving for TikTok: the socket dies, then a new one rejoins.
  async dropAndReturn() {
    if (this.away || !this.session) return;
    this.away = true;
    stats.drops++;
    this.socket.disconnect();
    await sleep(rand(200, 2500));
    this.connect();
    this.away = false;
  }
  // Simulate a phone that lost its saved session: join again with the same nickname.
  async forgetAndRejoinByName() {
    if (this.away || !this.session) return;
    this.away = true;
    const oldId = this.session.playerId;
    const pin = this.session.pin;
    this.socket.disconnect();
    this.session = null;
    await sleep(300);
    this.connect();
    await new Promise((r) => this.socket.once('connect', r));
    await this.join(pin);
    if (this.session && this.session.playerId !== oldId) problem(`${this.name} got a new identity after joining by name`);
    else stats.nameRejoins++;
    this.away = false;
  }
  onState(s) {
    this.state = s;
    if (s.score != null && s.phase !== 'question') {
      this.lastScore = s.score;
      this.lastGame = s.gameTitle;
    }
    if (s.phase === 'question' && !s.answered) {
      const key = s.gameTitle + ':' + s.index + ':' + s.item.question;
      if (this.answeredKey === key) return;
      this.answeredKey = key;
      if (Math.random() < 0.08) return; // some people never answer
      const left = s.endsAt - s.serverNow;
      const delay = rand(50, Math.max(100, left * 0.95));
      setTimeout(() => this.answer(s, key), delay);
      // Some people leave the page right after answering, or before.
      if (Math.random() < 0.06) setTimeout(() => this.dropAndReturn(), rand(0, left));
    }
    if (s.phase === 'content' && s.endsAt && Math.random() < 0.5) this.dropAndReturn();
  }
  answer(s, key) {
    if (this.away || !this.socket.connected) return;
    const cur = this.state;
    if (!cur || cur.phase !== 'question' || cur.index !== s.index) return;
    const it = s.item;
    let choice;
    if (it.type === 'order') {
      choice = it.options.map((o) => o.id).sort(() => Math.random() - 0.5);
      if (Math.random() < 0.4) choice = choice.slice().sort((a, b) => a - b); // some get it right
    } else {
      choice = it.options[Math.floor(Math.random() * it.options.length)].id;
    }
    this.socket.timeout(5000).emit('answer', { choice }, (err, res) => {
      if (err) return;
      if (res.ok) stats.answers++;
      else if (!/Too late|Time is up/.test(res.error)) problem(`${this.name} answer rejected on ${key}: ${res.error}`);
    });
  }
}

// ------------------------------------------------------------ host

class Host {
  constructor() {
    this.state = null;
    this.waiters = [];
    this.connect();
  }
  connect() {
    this.socket = io(URL, { reconnectionDelay: 300, forceNew: true });
    this.socket.on('connect', () => {
      this.socket.emit('host:auth', { password: PASSWORD }, (res) => {
        if (!res.ok) return problem('host auth failed');
        this.onState(res.state);
      });
    });
    this.socket.on('state', (s) => this.onState(s));
  }
  refresh() {
    stats.hostRefresh++;
    const before = this.state && `${this.state.phase}:${this.state.game && this.state.game.index}`;
    this.socket.disconnect();
    this.connect();
    return this.waitFor(() => true).then((s) => {
      const after = `${s.phase}:${s.game && s.game.index}`;
      if (before !== after) problem(`host refresh changed the screen: ${before} -> ${after}`);
    });
  }
  onState(s) {
    this.state = s;
    this.waiters = this.waiters.filter((w) => {
      if (w.pred(s)) {
        w.resolve(s);
        return false;
      }
      return true;
    });
  }
  waitFor(pred, ms = 60000) {
    if (this.state && pred(this.state) && pred !== ALWAYS_NEW) return Promise.resolve(this.state);
    return new Promise((resolve, reject) => {
      const w = { pred, resolve };
      this.waiters.push(w);
      setTimeout(() => {
        if (this.waiters.includes(w)) reject(new Error('timed out waiting for host state'));
      }, ms);
    });
  }
  cmd(name, data) {
    return new Promise((resolve) => {
      this.socket.timeout(5000).emit(name, data || {}, (err, res) => {
        if (err || !res.ok) problem(`host ${name} failed: ${err ? err.message : res.error}`);
        resolve();
      });
    });
  }
}
const ALWAYS_NEW = () => true;

// ------------------------------------------------------------ CSV check

async function checkCsv(gameId, expectedRows) {
  const r = await fetch(`${URL}/results.csv?game=${gameId}`, { headers: { 'x-host-password': PASSWORD } });
  if (!r.ok) return problem(`CSV for ${gameId} failed: ${r.status}`);
  const text = (await r.text()).replace(/^﻿/, '');
  const rows = parseCsv(text);
  const head = rows.shift();
  if (rows.length !== expectedRows) problem(`CSV ${gameId}: ${rows.length} rows, expected ${expectedRows}`);
  const pointCols = head.map((h, i) => (/\| points$/.test(h) ? i : -1)).filter((i) => i >= 0);
  for (const row of rows) {
    const sum = pointCols.reduce((a, i) => a + Number(row[i] || 0), 0);
    if (sum !== Number(row[2])) problem(`CSV ${gameId}: ${row[1]} points add up to ${sum} but score is ${row[2]}`);
    for (const i of pointCols) {
      const p = Number(row[i] || 0);
      if (p !== 0 && (p < 500 || p > 1000)) problem(`CSV ${gameId}: ${row[1]} got ${p} points on one question`);
    }
  }
  const scores = {};
  for (const row of rows) scores[row[1]] = Number(row[2]);
  return scores;
}
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') row.push(cell), (cell = '');
    else if (c === '\n') row.push(cell.replace(/\r$/, '')), rows.push(row), (row = []), (cell = '');
    else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows;
}

// ------------------------------------------------------------ main

async function main() {
  console.log(`Starting server (timers x${TIME_SCALE}), data in ${DATA_DIR}`);
  await startServer();
  const host = new Host();
  let s = await host.waitFor((x) => x.phase === 'idle');
  const pin = s.pin;

  console.log(`Joining ${N_PLAYERS} bots with PIN ${pin}`);
  const bots = [];
  for (let i = 1; i <= N_PLAYERS; i++) bots.push(new Bot(i));
  await Promise.all(bots.map((b) => new Promise((r) => (b.socket.connected ? r() : b.socket.once('connect', r)))));
  await Promise.all(bots.map((b) => b.join(pin)));

  // Name clash check: a second phone trying a nickname already in use.
  const intruder = io(URL, { forceNew: true });
  await new Promise((r) => intruder.once('connect', r));
  const clash = await new Promise((r) => intruder.emit('join', { pin, name: 'bot01' }, r));
  if (clash.ok) problem('duplicate nickname was allowed while the owner was online');
  const badPin = await new Promise((r) => intruder.emit('join', { pin: '000000', name: 'X' }, r));
  if (badPin.ok) problem('wrong PIN was accepted');
  intruder.close();

  const dayExpected = {};
  for (let gi = 0; gi < games.length; gi++) {
    const game = games[gi];
    console.log(`\nGame ${gi + 1}: ${game.title}`);
    await host.cmd('host:start', { gameId: game.id });
    s = await host.waitFor((x) => x.phase === 'lobby' && x.game.id === game.id);
    if (s.players.length !== N_PLAYERS) problem(`lobby shows ${s.players.length} players`);
    await host.cmd('host:next');

    let steps = 0;
    let didAddTime = false;
    let didSkip = false;
    let pairsAdded = 0;
    let restarted = false;
    let refreshed = false;
    let forgot = false;
    let lastKey = '';
    while (true) {
      s = await host.waitFor((x) => `${x.phase}:${x.game && x.game.index}:${x.game && x.game.total}` !== lastKey);
      const g = s.game;
      lastKey = `${s.phase}:${g && g.index}:${g && g.total}`;
      if (++steps > 200) {
        problem('game did not finish');
        break;
      }
      if (s.phase === 'podium') break;
      const it = g.item;

      if (s.phase === 'question') {
        // Exercise the host controls once per game.
        if (!didAddTime && gi === 0 && g.index === 1) {
          const before = g.endsAt;
          await host.cmd('host:addTime');
          const after = await host.waitFor((x) => x.game && x.game.endsAt !== before);
          if (after.game.endsAt - before !== 10000) problem('+10 sec did not add 10 seconds');
          didAddTime = true;
          stats.addTime++;
        }
        if (!didSkip && gi === 1 && g.index === 5) {
          await sleep(300);
          await host.cmd('host:skip');
          didSkip = true;
          stats.skips++;
          continue;
        }
        if (!restarted && gi === 2 && g.index === 3) {
          await sleep(400);
          console.log('  Restarting the server mid-question...');
          const phaseBefore = `${s.phase}:${g.index}`;
          await stopServer();
          await sleep(500);
          await startServer();
          stats.restarts++;
          restarted = true;
          const back = await host.waitFor((x) => x.serverNow > s.serverNow + 400);
          const phaseAfter = `${back.phase}:${back.game && back.game.index}`;
          if (phaseAfter !== phaseBefore && phaseAfter !== `reveal:${g.index}`)
            problem(`after restart the game moved from ${phaseBefore} to ${phaseAfter}`);
          // Give phones up to 8 seconds to find the server again.
          let online = 0;
          for (let t = 0; t < 40; t++) {
            await sleep(200);
            online = host.state.online;
            if (online >= N_PLAYERS - bots.filter((b) => b.away).length) break;
          }
          if (online < N_PLAYERS - bots.filter((b) => b.away).length)
            problem(`only ${online} players reconnected after the restart`);
          console.log(`  Server back. ${online} players reconnected on their own.`);
          lastKey = '';
          continue;
        }
        if (!refreshed && gi === 1 && g.index === 1) {
          await host.refresh();
          refreshed = true;
        }
        if (!forgot && gi === 3 && g.index === 2) {
          await bots[7].forgetAndRejoinByName();
          forgot = true;
        }
        // Wait for everyone to answer (auto reveal) or the timer.
        continue;
      }

      if (s.phase === 'reveal') {
        const total = Array.isArray(g.counts) ? g.counts.reduce((a, b) => a + b, 0) : g.counts ? g.counts.total : 0;
        if (total > N_PLAYERS) problem(`more answers (${total}) than players`);
        if (total !== g.answered) problem(`bar totals ${total} do not match answered ${g.answered}`);
        if (it.repeatable && pairsAdded < 2) {
          pairsAdded++;
          stats.pairs++;
          await host.cmd('host:pair');
          continue; // jumps straight into the next pair vote
        }
        await sleep(rand(50, 200));
        await host.cmd('host:next');
        continue;
      }
      if (s.phase === 'leaderboard') {
        const lb = g.leaderboard;
        for (let i = 1; i < lb.length; i++) if (lb[i].score > lb[i - 1].score) problem('leaderboard not sorted');
        await host.cmd('host:next');
        continue;
      }
      if (s.phase === 'content') {
        if (g.endsAt && gi === 0) {
          const before = g.endsAt;
          await host.cmd('host:addTime');
          const after = await host.waitFor((x) => x.game && x.game.endsAt !== before);
          if (after.game.endsAt - before !== 60000) problem('+1 min did not add a minute');
          stats.addTime++;
        }
        await sleep(g.endsAt ? 1500 : 100); // give the "phone task" bots time to leave and come back
        await host.cmd('host:next');
        continue;
      }
    }

    if (game.items.some((x) => x.repeatable)) {
      const pairItems = host.state.game.total - game.items.length;
      if (pairItems !== 2) problem(`expected 2 extra pair votes, got ${pairItems}`);
    }
    const pod = host.state.game.podium;
    console.log(`  Podium: ${pod.map((p) => `${p.name} ${p.score}`).join(', ')}`);
    await sleep(300);
    const scores = await checkCsv(game.id, N_PLAYERS);
    for (const [n, v] of Object.entries(scores || {})) dayExpected[n] = (dayExpected[n] || 0) + v;
    const phonesOnPodium = bots.filter((b) => b.state && b.state.phase === 'podium').length;
    if (phonesOnPodium < N_PLAYERS - 2) problem(`only ${phonesOnPodium} phones show the podium`);

    await host.cmd('host:next');
    if (game.showChampionAfter) {
      s = await host.waitFor((x) => x.phase === 'champion');
      console.log(`  Champion of the day: ${s.dayTop.slice(0, 3).map((d) => `${d.name} ${d.total}`).join(', ')}`);
      for (const d of s.dayTop) {
        if (dayExpected[d.name] !== d.total) problem(`day total for ${d.name} is ${d.total}, expected ${dayExpected[d.name]}`);
      }
      await sleep(500);
      const champ = bots.find((b) => b.name === s.dayTop[0].name);
      if (!champ || champ.state.phase !== 'champion' || champ.state.dayRank !== 1) problem("the champion's phone did not show rank 1");
      await host.cmd('host:next');
    }
    await host.waitFor((x) => x.phase === 'idle');
  }

  // Reset the whole day leaderboard.
  await host.cmd('host:resetDay');
  s = await host.waitFor((x) => x.dayTop.every((d) => d.total === 0));

  console.log('\nResults');
  console.log(`  Answers accepted: ${stats.answers}`);
  console.log(`  Drops and silent rejoins: ${stats.drops} drops, ${stats.rejoins} rejoins`);
  console.log(`  Rejoined by nickname after losing session: ${stats.nameRejoins}`);
  console.log(`  Server restarts survived: ${stats.restarts}, host refreshes: ${stats.hostRefresh}`);
  console.log(`  +Another pair: ${stats.pairs}, +time: ${stats.addTime}, skips: ${stats.skips}`);
  if (serverErr.trim()) problem('server printed errors:\n' + serverErr);
  bots.forEach((b) => b.socket.close());
  host.socket.close();
  await stopServer();
  fs.rmSync(DATA_DIR, { recursive: true, force: true });
  if (problems.length) {
    console.log(`\nFAILED with ${problems.length} problem(s).`);
    process.exit(1);
  }
  console.log('\nALL GOOD. 6 games played with no problems.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  if (server) server.kill('SIGKILL');
  process.exit(1);
});

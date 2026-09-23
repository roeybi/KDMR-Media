// Host screen. Everything shown here comes from the server, so a refresh
// picks up exactly where the game was.
(function () {
  var PW_KEY = 'cmq-host';
  var LAN_KEY = 'cmq-lan';
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage');

  var h = null; // latest state from server
  var offset = 0;
  var screenKey = '';
  var password = Q.store(PW_KEY) || '';
  var signedIn = false;

  var socket = io({ reconnectionDelay: 500, reconnectionDelayMax: 3000 });

  // ------------------------------------------------------------ sign in

  function auth() {
    socket.timeout(8000).emit('host:auth', { password: password }, function (err, res) {
      if (err) return;
      if (!res || !res.ok) {
        signedIn = false;
        showLogin(password ? 'Wrong password.' : '');
        return;
      }
      signedIn = true;
      Q.store(PW_KEY, password);
      $('login').hidden = true;
      $('shell').hidden = false;
      apply(res.state);
    });
  }
  function showLogin(msg) {
    $('shell').hidden = true;
    $('login').hidden = false;
    $('loginErr').textContent = msg || '';
    $('pw').focus();
  }
  $('loginForm').onsubmit = function (e) {
    e.preventDefault();
    password = $('pw').value;
    auth();
  };

  socket.on('connect', function () {
    setConn(true);
    if (password) auth();
    else showLogin('');
  });
  socket.on('disconnect', function () { setConn(false); });
  socket.on('state', function (s) { if (signedIn) apply(s); });

  function setConn(ok) {
    var c = $('conn');
    c.className = 'conn ' + (ok ? 'ok' : 'bad');
    c.textContent = ok ? 'Live' : 'Reconnecting';
  }

  // Keep a free Render server awake while the host screen is open.
  setInterval(function () { fetch('/healthz', { cache: 'no-store' }).catch(function () {}); }, 4 * 60 * 1000);

  // ------------------------------------------------------------ commands

  var lastNext = 0;
  function cmd(name, data) {
    socket.timeout(8000).emit(name, data || {}, function (err, res) {
      if (err) return toast('No connection to the server. Try again.');
      if (res && !res.ok) toast(res.error || 'That did not work.');
    });
  }
  function next() {
    // A projector clicker can double fire. Ignore presses closer than 0.6s.
    if (!h || h.phase === 'idle' || Date.now() - lastNext < 600) return;
    lastNext = Date.now();
    cmd('host:next');
  }

  $('cNext').onclick = next;
  $('cSkip').onclick = function () { cmd('host:skip'); };
  $('cTime10').onclick = function () { cmd('host:addTime'); };
  $('cTime60').onclick = function () { cmd('host:addTime'); };
  $('cPair').onclick = function () { cmd('host:pair'); };
  $('cEnd').onclick = function () {
    if (confirm('End this game now and show the podium?')) cmd('host:end');
  };
  $('cCsv').onclick = function () { if (h && h.game) downloadCsv(h.game.id); };
  $('bGames').onclick = function () {
    if (!h || h.phase === 'idle') return;
    var running = h.game && ['podium', 'champion'].indexOf(h.phase) < 0;
    if (!running || confirm('Leave this game and go back to the game list? Scores already earned stay in the day total.')) cmd('host:games');
  };
  $('bChamp').onclick = function () {
    var running = h && h.game && ['podium', 'champion', 'lobby'].indexOf(h.phase) < 0;
    if (!running || confirm('End the current game and show the Champion of the day?')) cmd('host:champion');
  };
  $('bFull').onclick = function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(function () {});
  };

  document.addEventListener('keydown', function (e) {
    if (!signedIn || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      next();
    }
  });

  function downloadCsv(gameId) {
    fetch('/results.csv?game=' + encodeURIComponent(gameId), { headers: { 'x-host-password': password } })
      .then(function (r) {
        if (!r.ok) throw new Error('No results yet');
        var cd = r.headers.get('Content-Disposition') || '';
        var m = /filename="([^"]+)"/.exec(cd);
        return r.blob().then(function (b) { return { blob: b, name: m ? m[1] : 'results.csv' }; });
      })
      .then(function (f) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(f.blob);
        a.download = f.name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
      })
      .catch(function (e) { toast(e.message); });
  }

  // ------------------------------------------------------------ helpers

  function isLocalHost() {
    return /^(localhost|127\.|\[?::1\]?$)/.test(location.hostname);
  }
  function joinBase() {
    if (!isLocalHost()) return location.origin;
    var pick = Q.store(LAN_KEY);
    if (pick && h.lanUrls.indexOf(pick) >= 0) return pick;
    return h.lanUrls[0] || location.origin;
  }
  function joinUrl() { return joinBase() + '/?pin=' + h.pin; }
  function shortUrl(u) { return u.replace(/^https?:\/\//, ''); }
  function qrSrc() { return '/qr.svg?data=' + encodeURIComponent(joinUrl()); }
  function remaining() { return h.game && h.game.endsAt ? h.game.endsAt - (Date.now() + offset) : 0; }

  // ------------------------------------------------------------ render

  function apply(s) {
    offset = s.serverNow - Date.now();
    h = s;
    var g = h.game;
    var key = [h.phase, h.pin, g ? g.id : '', g ? g.index : '', g ? g.total : '', g && g.item ? g.item.question : '', h.phase === 'idle' ? JSON.stringify(h.games) + h.lanUrls.join() : '', h.phase === 'champion' ? JSON.stringify(h.dayTop) : ''].join('|');
    if (key !== screenKey) {
      screenKey = key;
      renderStage();
    }
    updateDynamic();
    renderControls();
  }

  function renderStage() {
    var g = h.game;
    var where = '';
    if (g) where = Q.esc(g.title) + (g.index >= 0 && ['podium', 'champion'].indexOf(h.phase) < 0 ? ' <span class="muted">· ' + (g.index + 1) + ' of ' + g.total + '</span>' : '');
    $('where').innerHTML = where;
    stage.className = 'stage ph-' + h.phase;
    switch (h.phase) {
      case 'idle': return idleScreen();
      case 'lobby': return lobbyScreen();
      case 'question': return questionScreen(false);
      case 'reveal': return questionScreen(true);
      case 'leaderboard': return leaderboardScreen();
      case 'content': return contentScreen();
      case 'podium': return podiumScreen(g.podium, g.title, 'Game over');
      case 'champion': return podiumScreen(h.dayTop.map(function (d) { return { name: d.name, score: d.total }; }), 'Whole day leaderboard', 'Champion of the day');
    }
  }

  function idleScreen() {
    var html = '<div class="idle"><section><h1 class="stitle">Pick a game</h1><div class="games">';
    h.games.forEach(function (x, i) {
      html +=
        '<div class="gcard">' +
        '<div class="gnum">Game ' + (i + 1) + (x.played ? ' <span class="badge">Played</span>' : '') + '</div>' +
        '<div class="gtitle">' + Q.esc(x.title) + '</div>' +
        '<div class="muted">' + x.count + ' slides</div>' +
        '<div class="gbtns"><button class="btn" data-start="' + x.id + '">Start</button>' +
        (x.hasResults ? '<button class="btn ghost" data-csv="' + x.id + '">CSV</button>' : '') +
        '</div></div>';
    });
    html += '</div></section><aside class="side card">' +
      '<div class="muted">Game PIN</div><div class="pinsm">' + h.pin + '</div>' +
      '<img class="qrsm" alt="QR code to join" src="' + qrSrc() + '">' +
      '<div class="url">' + Q.esc(shortUrl(joinBase())) + '</div>';
    if (isLocalHost() && h.lanUrls.length > 1) {
      html += '<label class="muted small">Wrong address? Pick your WiFi one:<select id="lanPick">' +
        h.lanUrls.map(function (u) { return '<option' + (u === joinBase() ? ' selected' : '') + '>' + Q.esc(u) + '</option>'; }).join('') +
        '</select></label>';
    }
    if (isLocalHost() && !h.lanUrls.length) html += '<p class="err small">No WiFi address found. Connect this laptop to the venue WiFi.</p>';
    html += '<p><b id="idleCount"></b></p>' +
      '<div class="stack">' +
      '<button class="btn ghost" id="iChamp">Champion of the day</button>' +
      '<button class="btn ghost" id="iReset">Reset day totals</button>' +
      '<button class="btn ghost" id="iPin">New PIN (removes all players)</button>' +
      '</div></aside></div>';
    stage.innerHTML = html;
    stage.querySelectorAll('[data-start]').forEach(function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-start');
        var game = h.games.filter(function (x) { return x.id === id; })[0];
        if (game.played && !confirm('You already played this game. Playing it again adds more points to the day totals. Continue?')) return;
        cmd('host:start', { gameId: id });
      };
    });
    stage.querySelectorAll('[data-csv]').forEach(function (b) {
      b.onclick = function () { downloadCsv(b.getAttribute('data-csv')); };
    });
    var lp = $('lanPick');
    if (lp) lp.onchange = function () { Q.store(LAN_KEY, lp.value); screenKey = ''; apply(h); };
    $('iChamp').onclick = function () { cmd('host:champion'); };
    $('iReset').onclick = function () {
      if (confirm('Reset the whole-day leaderboard to zero for everyone?')) cmd('host:resetDay');
    };
    $('iPin').onclick = function () {
      if (confirm('Make a new PIN? Everyone will have to join again. Day totals are kept by nickname.')) cmd('host:newPin');
    };
  }

  function lobbyScreen() {
    stage.innerHTML =
      '<div class="lobby">' +
      '<div class="joinbox">' +
      '<div class="jl">Join on your phone</div>' +
      '<div class="jurl">' + Q.esc(shortUrl(joinBase())) + '</div>' +
      '<div class="jl">Game PIN</div>' +
      '<div class="pin">' + h.pin.slice(0, 3) + ' ' + h.pin.slice(3) + '</div>' +
      '</div>' +
      '<img class="qr" alt="QR code to join" src="' + qrSrc() + '">' +
      '</div>' +
      '<div class="plist"><div class="pcount"><b id="pcount">0</b> players</div><div id="chips" class="chips"></div></div>';
  }

  function optionsHtml(it, revealed) {
    if (it.type === 'order') {
      var list = revealed ? it.correctOrder.map(function (t, i) { return { text: t, n: i + 1 }; }) : it.options.map(function (o) { return { text: o.text }; });
      return '<div class="horder' + (revealed ? ' rev' : '') + '">' + list.map(function (o) {
        return '<div class="hoitem">' + (o.n ? '<span class="hon">' + o.n + '</span>' : '') + Q.esc(o.text) + '</div>';
      }).join('') + '</div>';
    }
    var html = '<div class="hopts n' + it.options.length + '">';
    it.options.forEach(function (o) {
      var c = Q.colorFor(it.type, o.pos);
      var dim = revealed && it.type !== 'poll' && o.id !== it.correct;
      var ok = revealed && it.type !== 'poll' && o.id === it.correct;
      html += '<div class="hopt' + (dim ? ' dim' : '') + (ok ? ' ok' : '') + '" style="background:' + c.bg + ';color:' + c.fg + '">' +
        Q.shapeSvg(c.shape) + '<span>' + Q.esc(o.text) + '</span>' + (ok ? '<span class="check">&#10003;</span>' : '') + '</div>';
    });
    return html + '</div>';
  }

  function barsHtml(it, counts) {
    if (!counts) return '';
    if (it.type === 'order') {
      var pct = counts.total ? Math.round((counts.right / counts.total) * 100) : 0;
      return '<div class="orderstat"><b>' + counts.right + '</b> of ' + counts.total + ' got the order right <span class="muted">(' + pct + '%)</span></div>';
    }
    var max = Math.max.apply(null, counts.concat([1]));
    var html = '<div class="bars">';
    it.options.forEach(function (o) {
      var c = Q.colorFor(it.type, o.pos);
      var n = counts[o.id] || 0;
      var dim = it.type !== 'poll' && o.id !== it.correct;
      html += '<div class="bar' + (dim ? ' dim' : '') + '"><div class="bn">' + n + '</div>' +
        '<div class="bfill" style="height:' + Math.max(4, (n / max) * 100) + '%;background:' + c.bg + '"></div>' +
        '<div class="bs" style="color:' + c.bg + '">' + Q.shapeSvg(c.shape) + (it.type !== 'poll' && o.id === it.correct ? '<span class="bcheck">&#10003;</span>' : '') + '</div></div>';
    });
    return html + '</div>';
  }

  function questionScreen(revealed) {
    var g = h.game;
    var it = g.item;
    var tag = it.type === 'poll' ? 'Poll' : it.type === 'order' ? 'Put in order' : it.type === 'truefalse' ? 'True or false' : 'Quiz';
    stage.innerHTML =
      '<div class="qhead"><span class="qtag">' + tag + '</span><div class="qtext">' + Q.esc(it.question) + '</div></div>' +
      '<div class="qmid">' +
      (revealed ? barsHtml(it, g.counts) :
        '<div class="ring"><svg viewBox="0 0 100 100"><circle class="rbg" cx="50" cy="50" r="44"/><circle id="rfg" class="rfg" cx="50" cy="50" r="44"/></svg><span id="secs"></span></div>' +
        '<div class="answered"><b id="ansN">0</b><span>of <span id="ansY">0</span> answered</span></div>') +
      '</div>' +
      optionsHtml(it, revealed);
  }

  function leaderboardScreen() {
    var rows = h.game.leaderboard;
    stage.innerHTML = '<h1 class="stitle center">Leaderboard</h1><div class="lb">' +
      rows.map(function (r, i) {
        return '<div class="lbrow"><span class="lbn">' + (i + 1) + '</span><span class="lbname">' + Q.esc(r.name) + '</span>' +
          (r.gained ? '<span class="lbg">+' + Q.fmtNum(r.gained) + '</span>' : '<span></span>') +
          '<span class="lbs">' + Q.fmtNum(r.score) + '</span></div>';
      }).join('') + (rows.length ? '' : '<p class="muted center">No players yet.</p>') + '</div>';
  }

  function contentScreen() {
    var it = h.game.item;
    var timed = !!h.game.endsAt;
    stage.innerHTML = '<div class="content-slide' + (timed ? ' timed' : '') + '">' +
      '<h1>' + Q.esc(it.title) + '</h1>' +
      '<p>' + Q.esc(it.text) + '</p>' +
      (timed ? '<div class="hclock" id="hclock"></div>' : '') +
      '</div>';
  }

  function podiumScreen(list, sub, title) {
    var top = list.slice(0, 3);
    var order = [1, 0, 2];
    var html = '<div class="podwrap"><div class="muted psub">' + Q.esc(sub) + '</div><h1 class="stitle">' + title + '</h1><div class="podium">';
    order.forEach(function (i) {
      var p = top[i];
      html += '<div class="pcol p' + (i + 1) + '">' +
        (p ? '<div class="pname">' + Q.esc(p.name) + '</div><div class="pscore">' + Q.fmtNum(p.score) + '</div>' : '<div class="pname muted">&nbsp;</div>') +
        '<div class="pblock">' + (i + 1) + '</div></div>';
    });
    html += '</div>';
    if (h.phase === 'champion' && list.length > 3) {
      html += '<div class="rest">' + list.slice(3, 10).map(function (p, i) {
        return '<span>' + (i + 4) + '. ' + Q.esc(p.name) + ' <b>' + Q.fmtNum(p.score) + '</b></span>';
      }).join('') + '</div>';
    }
    stage.innerHTML = html + '</div>';
  }

  // Parts that change often (answer counter, players joining) update in place.
  function updateDynamic() {
    var g = h.game;
    var el;
    if ((el = $('ansN'))) el.textContent = g.answered;
    if ((el = $('ansY'))) el.textContent = Math.max(h.online, g.answered);
    if ((el = $('idleCount'))) el.textContent = h.online + ' players connected';
    if ((el = $('pcount'))) el.textContent = h.players.length;
    if ((el = $('chips'))) {
      var names = h.players.map(function (p) { return p.id + p.online; }).join();
      if (el.getAttribute('data-k') !== names) {
        el.setAttribute('data-k', names);
        el.innerHTML = h.players.length
          ? h.players.map(function (p) {
              return '<button class="chip' + (p.online ? '' : ' off') + '" data-kick="' + p.id + '" title="Click to remove">' + Q.esc(p.name) + '</button>';
            }).join('')
          : '<p class="muted">Waiting for players...</p>';
        el.querySelectorAll('[data-kick]').forEach(function (b) {
          b.onclick = function () {
            if (confirm('Remove "' + b.textContent + '" from the game?')) cmd('host:kick', { playerId: b.getAttribute('data-kick') });
          };
        });
      }
    }
    tick();
  }

  function renderControls() {
    var ph = h.phase;
    var g = h.game;
    var it = g && g.item;
    var show = function (id, on) { $(id).hidden = !on; };
    var inGame = g && ['lobby', 'question', 'reveal', 'leaderboard', 'content'].indexOf(ph) >= 0;
    show('cEnd', inGame && ph !== 'lobby');
    show('cCsv', ph === 'podium' || (ph === 'champion' && !!g));
    show('cPair', !!(it && it.repeatable && (ph === 'question' || ph === 'reveal')));
    show('cTime10', ph === 'question');
    show('cTime60', ph === 'content');
    show('cSkip', ph === 'question' || ph === 'content');
    show('cNext', ph !== 'idle');
    var label = 'Next';
    var last = g && g.index >= g.total - 1;
    if (ph === 'lobby') label = 'Start game';
    else if (ph === 'question') label = 'Reveal';
    else if (ph === 'reveal') label = g.scored ? 'Leaderboard' : last ? 'Finish' : 'Next';
    else if ((ph === 'leaderboard' || ph === 'content') && last) label = 'Finish';
    else if (ph === 'podium') label = g.showChampionAfter ? 'Champion of the day' : 'Back to games';
    else if (ph === 'champion') label = 'Back to games';
    $('cNext').textContent = label;
  }

  function tick() {
    if (!h || !h.game) return;
    var g = h.game;
    var left = remaining();
    var secs = $('secs');
    if (secs) {
      secs.textContent = Math.max(0, Math.ceil(left / 1000));
      var total = Math.max(1, g.endsAt - g.startedAt);
      var frac = Math.max(0, Math.min(1, left / total));
      var rfg = $('rfg');
      if (rfg) {
        rfg.style.strokeDashoffset = String(276.5 * (1 - frac));
        rfg.classList.toggle('low', left < 5000);
      }
    }
    var c = $('hclock');
    if (c) {
      c.textContent = left > 0 ? Q.fmtClock(left) : "Time's up!";
      c.classList.toggle('done', left <= 0);
    }
  }
  setInterval(tick, 200);

  var toastEl = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 3000);
  }
})();

// Player page. Keeps the session in localStorage and silently rejoins
// whenever the phone comes back (for example after switching to TikTok).
(function () {
  var app = document.getElementById('app');
  var meEl = document.getElementById('me');
  var netEl = document.getElementById('net');
  var SESSION_KEY = 'cmq-player';

  var urlPin = (new URLSearchParams(location.search).get('pin') || '').replace(/\D/g, '').slice(0, 6);
  var session = Q.store(SESSION_KEY); // { pin, playerId, name }
  if (session && urlPin && session.pin !== urlPin) session = null; // scanned a new game's QR

  var state = null;
  var offset = 0; // server clock minus phone clock
  var pending = null; // answer we are sending: { index, choice }
  var orderPick = { key: null, list: [] }; // taps so far on an order question
  var joinError = '';
  var joining = false;

  var socket = io({ reconnectionDelay: 500, reconnectionDelayMax: 3000, timeout: 10000 });

  // ------------------------------------------------------------ connection

  socket.on('connect', function () {
    netEl.hidden = true;
    if (session) rejoin();
    else if (!state) render();
  });
  socket.on('disconnect', function () {
    netEl.hidden = false;
  });
  socket.io.on('reconnect_attempt', function () {
    netEl.hidden = false;
  });

  function rejoin() {
    socket.timeout(8000).emit('rejoin', { pin: session.pin, playerId: session.playerId }, function (err, res) {
      if (err) return; // socket.io will reconnect and we try again
      if (!res || !res.ok) {
        // The game was reset or the PIN changed: ask for a nickname again.
        var oldName = session.name;
        var oldPin = session.pin;
        session = null;
        Q.store(SESSION_KEY, null);
        state = null;
        joinError = '';
        renderJoin(urlPin || oldPin, oldName);
        return;
      }
      applyState(res.state);
    });
  }

  socket.on('state', applyState);
  socket.on('kicked', function () {
    session = null;
    state = null;
    Q.store(SESSION_KEY, null);
    joinError = 'You were removed from the game. Join again with a different nickname.';
    renderJoin(urlPin, '');
  });

  // Phones pause pages in the background. When the page is visible again,
  // check the connection straight away instead of waiting for a timeout.
  function wake() {
    if (!session) return;
    if (!socket.connected) {
      socket.connect();
      return;
    }
    socket.timeout(2500).emit('sync', null, function (err, res) {
      if (err) {
        socket.disconnect();
        socket.connect();
        return;
      }
      if (res && res.ok) applyState(res.state);
      else rejoin();
    });
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) wake();
  });
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) wake();
  });
  window.addEventListener('online', wake);

  // ------------------------------------------------------------ state

  function applyState(s) {
    if (!s) return;
    offset = s.serverNow - Date.now();
    var prev = state;
    state = s;
    if (pending && (s.phase !== 'question' || s.index !== pending.index)) pending = null;
    if (s.phase !== 'question') orderPick = { key: null, list: [] };
    // Avoid rebuilding the screen when nothing the player sees has changed.
    if (prev && sameScreen(prev, s)) {
      updateTimer();
      return;
    }
    render();
  }

  function sameScreen(a, b) {
    return (
      a.phase === b.phase &&
      a.index === b.index &&
      a.answered === b.answered &&
      a.rank === b.rank &&
      a.score === b.score &&
      a.name === b.name &&
      a.endsAt === b.endsAt
    );
  }

  // ------------------------------------------------------------ join

  function renderJoin(pin, name) {
    meEl.textContent = '';
    var pinKnown = /^\d{6}$/.test(pin || '');
    app.innerHTML =
      '<form id="join" class="card join" autocomplete="off">' +
      '<h1>Join the quiz</h1>' +
      '<label class="' + (pinKnown ? 'hidden' : '') + '">Game PIN' +
      '<input id="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="6 digits" value="' + Q.esc(pin || '') + '"></label>' +
      (pinKnown ? '<p class="pinline">PIN <b>' + Q.esc(pin) + '</b> <button type="button" class="link" id="chg">change</button></p>' : '') +
      '<label>Nickname<input id="name" maxlength="20" placeholder="Your name" value="' + Q.esc(name || '') + '" autocapitalize="words"></label>' +
      '<p class="err" id="err">' + Q.esc(joinError) + '</p>' +
      '<button class="btn big" id="go">Join</button>' +
      '</form>';
    var form = document.getElementById('join');
    var pinIn = document.getElementById('pin');
    var nameIn = document.getElementById('name');
    var chg = document.getElementById('chg');
    if (chg)
      chg.onclick = function () {
        joinError = '';
        renderJoin('', nameIn.value);
      };
    (pinKnown ? nameIn : pinIn).focus();
    form.onsubmit = function (e) {
      e.preventDefault();
      if (joining) return;
      var p = pinIn.value.replace(/\D/g, '');
      var n = nameIn.value.trim();
      var err = document.getElementById('err');
      if (p.length !== 6) return (err.textContent = 'The PIN has 6 digits.');
      if (!n) return (err.textContent = 'Type a nickname.');
      joining = true;
      document.getElementById('go').textContent = 'Joining...';
      socket.timeout(8000).emit('join', { pin: p, name: n }, function (e2, res) {
        joining = false;
        if (e2) {
          joinError = 'No connection. Check your WiFi and try again.';
          return renderJoin(p, n);
        }
        if (!res.ok) {
          joinError = res.error || 'Could not join.';
          return renderJoin(res.error && res.error.indexOf('PIN') >= 0 ? '' : p, n);
        }
        joinError = '';
        session = { pin: res.pin, playerId: res.playerId, name: res.name };
        Q.store(SESSION_KEY, session);
        // Drop the PIN from the address bar so a refresh keeps the saved session.
        if (location.search) history.replaceState(null, '', location.pathname);
        applyState(res.state);
      });
    };
  }

  // ------------------------------------------------------------ screens

  function render() {
    if (!session) return renderJoin(urlPin, '');
    if (!state) {
      app.innerHTML = '<div class="center"><div class="spinner"></div><p class="muted">Reconnecting you...</p></div>';
      return;
    }
    meEl.innerHTML = Q.esc(state.name) + (state.score != null && state.phase !== 'champion' ? ' · <b>' + Q.fmtNum(state.score) + '</b>' : '');
    var s = state;
    switch (s.phase) {
      case 'idle':
        return waitScreen("You're in!", 'Look at the big screen. The next game starts soon.');
      case 'lobby':
        return waitScreen("You're in!", 'Get ready for: ' + s.gameTitle);
      case 'content':
        return contentScreen(s);
      case 'question':
        if (s.answered || (pending && pending.index === s.index)) return lockedScreen(s);
        return questionScreen(s);
      case 'reveal':
      case 'leaderboard':
        return resultScreen(s);
      case 'podium':
        return podiumScreen(s);
      case 'champion':
        return championScreen(s);
    }
  }

  function waitScreen(title, sub) {
    app.innerHTML =
      '<div class="center">' +
      '<div class="bigtick">&#10003;</div>' +
      '<h1>' + Q.esc(title) + '</h1>' +
      '<p class="lead">' + Q.esc(state.name) + '</p>' +
      '<p class="muted">' + Q.esc(sub) + '</p></div>';
  }

  function counter(s) {
    return '<div class="qbar"><span>' + (s.index + 1) + ' of ' + s.total + '</span><span class="timer" id="timer"></span></div>';
  }

  function contentScreen(s) {
    var it = s.item;
    var task = !!s.endsAt;
    app.innerHTML =
      counter(s) +
      '<div class="card content">' +
      '<h1>' + Q.esc(it.title) + '</h1>' +
      '<p>' + Q.esc(it.text) + '</p>' +
      (task ? '<div class="bigclock" id="clock"></div><p class="muted small">Go do the task now. When you come back to this page you will be back in the game automatically.</p>' : '') +
      '</div>';
    updateTimer();
  }

  function questionScreen(s) {
    var it = s.item;
    var html = counter(s) + '<h2 class="q">' + Q.esc(it.question) + '</h2>';
    if (it.type === 'order') {
      if (orderPick.key !== s.index) orderPick = { key: s.index, list: [] };
      html += '<p class="muted small">Tap the items in the right order.</p><div class="order">';
      it.options.forEach(function (o) {
        var n = orderPick.list.indexOf(o.id);
        html +=
          '<button class="obtn' + (n >= 0 ? ' picked' : '') + '" data-id="' + o.id + '">' +
          '<span class="num">' + (n >= 0 ? n + 1 : '') + '</span><span>' + Q.esc(o.text) + '</span></button>';
      });
      html +=
        '</div><div class="row"><button class="btn ghost" id="undo">Undo</button>' +
        '<button class="btn" id="lock"' + (orderPick.list.length === it.options.length ? '' : ' disabled') + '>Lock it in</button></div>';
      app.innerHTML = html;
      app.querySelectorAll('.obtn').forEach(function (b) {
        b.onclick = function () {
          var id = Number(b.getAttribute('data-id'));
          if (orderPick.list.indexOf(id) >= 0) return;
          orderPick.list.push(id);
          render();
        };
      });
      document.getElementById('undo').onclick = function () {
        orderPick.list.pop();
        render();
      };
      document.getElementById('lock').onclick = function () {
        if (orderPick.list.length === it.options.length) send(orderPick.list.slice());
      };
    } else {
      html += '<div class="answers n' + it.options.length + (it.type === 'truefalse' ? ' tf' : '') + '">';
      it.options.forEach(function (o) {
        var c = Q.colorFor(it.type, o.pos);
        html +=
          '<button class="ans" data-id="' + o.id + '" style="background:' + c.bg + ';color:' + c.fg + '">' +
          Q.shapeSvg(c.shape) + '<span>' + Q.esc(o.text) + '</span></button>';
      });
      html += '</div>';
      app.innerHTML = html;
      app.querySelectorAll('.ans').forEach(function (b) {
        b.onclick = function () {
          send(Number(b.getAttribute('data-id')));
        };
      });
    }
    updateTimer();
  }

  function send(choice) {
    var s = state;
    pending = { index: s.index, choice: choice };
    if (navigator.vibrate) navigator.vibrate(30);
    render();
    socket.timeout(6000).emit('answer', { choice: choice }, function (err, res) {
      if (!state || state.index !== s.index || state.phase !== 'question') return;
      if (err) {
        pending = null;
        render();
        toast('Not sent. Check WiFi and tap again.');
        return;
      }
      if (!res.ok) {
        pending = null;
        toast(res.error || 'Not accepted.');
        render();
        return;
      }
      state.answered = true;
      if (typeof choice === 'number') state.myChoice = choice;
      render();
    });
  }

  function lockedScreen(s) {
    var it = s.item;
    var mine = pending && pending.index === s.index ? pending.choice : s.myChoice;
    var chosen = '';
    if (typeof mine === 'number') {
      var o = it.options.filter(function (x) {
        return x.id === mine;
      })[0];
      if (o) {
        var c = Q.colorFor(it.type, o.pos);
        chosen = '<div class="chosen" style="background:' + c.bg + ';color:' + c.fg + '">' + Q.shapeSvg(c.shape) + '<span>' + Q.esc(o.text) + '</span></div>';
      }
    }
    var sending = pending && !s.answered;
    app.innerHTML =
      counter(s) +
      '<div class="center">' +
      (sending ? '<div class="spinner"></div><h1>Sending...</h1>' : '<div class="bigtick">&#10003;</div><h1>Answer locked in</h1>') +
      chosen +
      '<p class="muted">Wait for the reveal on the big screen.</p></div>';
    updateTimer();
  }

  function resultScreen(s) {
    var it = s.item;
    var last = s.last || { none: true };
    var head;
    var cls;
    if (it.type === 'poll') {
      cls = 'neutral';
      head = s.answered ? '<h1>Thanks for voting</h1><p>Look at the big screen for the results.</p>' : "<h1>Time's up</h1><p>You didn't vote this time.</p>";
    } else if (last.none && !s.answered) {
      cls = 'bad';
      head = "<h1>Time's up</h1><p>No answer, 0 points.</p>";
    } else if (last.correct) {
      cls = 'good';
      head = '<h1>Correct!</h1><p class="pts">+' + Q.fmtNum(last.points) + '</p>';
    } else {
      cls = 'bad';
      head = '<h1>Wrong</h1><p>0 points. Next one!</p>';
    }
    var right = '';
    if (it.type !== 'poll') {
      if (it.type === 'order' && it.correctOrder) {
        right = '<p class="small">Correct order: ' + it.correctOrder.map(Q.esc).join(' &gt; ') + '</p>';
      } else if (it.correct != null) {
        right = '<p class="small">Answer: <b>' + Q.esc(it.options.filter(function (o) { return o.id === it.correct; })[0].text) + '</b></p>';
      }
    }
    app.innerHTML =
      '<div class="result ' + cls + '">' + head + right + '</div>' +
      (s.rank ? '<div class="card stats"><div><span class="muted">Score</span><b>' + Q.fmtNum(s.score) + '</b></div><div><span class="muted">Rank</span><b>' + Q.ordinal(s.rank) + '</b><span class="muted small">of ' + s.of + '</span></div></div>' : '');
  }

  function podiumScreen(s) {
    var top = s.rank && s.rank <= 3;
    app.innerHTML =
      '<div class="center">' +
      '<p class="muted">' + Q.esc(s.gameTitle) + '</p>' +
      '<h1>' + (top ? 'You made the podium!' : 'Game over') + '</h1>' +
      (s.rank ? '<div class="rankbig">' + Q.ordinal(s.rank) + '</div><p class="lead">of ' + s.of + ' players</p><p>' + Q.fmtNum(s.score) + ' points</p>' : '') +
      '<p class="muted small">Stay on this page. The next game starts from here.</p></div>';
  }

  function championScreen(s) {
    app.innerHTML =
      '<div class="center">' +
      '<p class="muted">Whole day leaderboard</p>' +
      '<h1>' + (s.dayRank === 1 ? 'Champion of the day!' : 'Thanks for playing!') + '</h1>' +
      (s.dayRank ? '<div class="rankbig">' + Q.ordinal(s.dayRank) + '</div><p class="lead">of ' + s.of + '</p>' : '') +
      '<p>Day total: <b>' + Q.fmtNum(s.dayTotal) + '</b> points</p></div>';
  }

  // ------------------------------------------------------------ timer + toast

  function updateTimer() {
    if (!state || !state.endsAt) {
      var t0 = document.getElementById('timer');
      if (t0) t0.textContent = '';
      return;
    }
    var left = state.endsAt - (Date.now() + offset);
    var t = document.getElementById('timer');
    if (t) t.textContent = state.phase === 'question' ? Math.max(0, Math.ceil(left / 1000)) + 's' : '';
    var c = document.getElementById('clock');
    if (c) {
      c.textContent = left > 0 ? Q.fmtClock(left) : "Time's up! Come back";
      c.classList.toggle('done', left <= 0);
    }
  }
  setInterval(updateTimer, 250);

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
    toastEl._t = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 3000);
  }

  render();
})();

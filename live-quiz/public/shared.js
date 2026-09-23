// Shared by the host and player pages: answer colours, shapes and small helpers.
(function () {
  // Four core colours are Kahoot-like and very different from each other on a projector.
  var COLORS = [
    { name: 'red', bg: '#E21B3C', fg: '#fff', shape: 'triangle' },
    { name: 'blue', bg: '#1368CE', fg: '#fff', shape: 'diamond' },
    { name: 'yellow', bg: '#FFB300', fg: '#111', shape: 'circle' },
    { name: 'green', bg: '#26890C', fg: '#fff', shape: 'square' },
    { name: 'purple', bg: '#7B3FBF', fg: '#fff', shape: 'star' },
    { name: 'teal', bg: '#0B7A86', fg: '#fff', shape: 'hexagon' },
  ];
  var SHAPES = {
    triangle: '<path d="M12 3 22 21H2z"/>',
    diamond: '<path d="M12 2 22 12 12 22 2 12z"/>',
    circle: '<circle cx="12" cy="12" r="10"/>',
    square: '<rect x="3" y="3" width="18" height="18" rx="1.5"/>',
    star: '<path d="m12 2 2.9 6.9 7.1.6-5.4 4.7 1.7 7L12 17.4l-6.3 3.8 1.7-7L2 9.5l7.1-.6z"/>',
    hexagon: '<path d="M7 3h10l5 9-5 9H7l-5-9z"/>',
  };

  // True/False uses blue for True and red for False.
  function colorFor(type, pos) {
    if (type === 'truefalse') return COLORS[pos === 0 ? 1 : 0];
    return COLORS[pos % COLORS.length];
  }

  function shapeSvg(shape, fill) {
    return (
      '<svg class="shape" viewBox="0 0 24 24" aria-hidden="true" fill="' + (fill || 'currentColor') + '">' +
      SHAPES[shape] + '</svg>'
    );
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function fmtNum(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function fmtClock(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      if (val === null) localStorage.removeItem(key);
      else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      return null;
    }
  }

  window.Q = {
    COLORS: COLORS,
    colorFor: colorFor,
    shapeSvg: shapeSvg,
    esc: esc,
    fmtNum: fmtNum,
    ordinal: ordinal,
    fmtClock: fmtClock,
    store: store,
  };
})();

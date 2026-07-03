(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highscoreEl = document.getElementById('highscore');

  const CELL = 10;
  const COLS = canvas.width / CELL;
  const ROWS = canvas.height / CELL;
  const TICK_MS = 130;
  const SWIPE_THRESHOLD = 20;
  const HIGHSCORE_KEY = 'nokia-snake-highscore';

  const COLOR_BG = '#0fbd91';
  const COLOR_INK = '#05392c';

  let snake, direction, nextDirection, food, score, highscore, state, lastTick;

  function loadHighscore() {
    return parseInt(localStorage.getItem(HIGHSCORE_KEY), 10) || 0;
  }

  function saveHighscore(value) {
    localStorage.setItem(HIGHSCORE_KEY, String(value));
  }

  function updateScoreDisplay() {
    scoreEl.textContent = 'Score: ' + score;
    highscoreEl.textContent = 'Hi: ' + highscore;
  }

  function placeFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === pos.x && s.y === pos.y));
    food = pos;
  }

  function resetGame() {
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS * 0.75);
    snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    direction = { x: 1, y: 0 };
    nextDirection = direction;
    score = 0;
    placeFood();
    updateScoreDisplay();
    state = 'idle';
  }

  function isOpposite(a, b) {
    return a.x === -b.x && a.y === -b.y;
  }

  function setDirection(dx, dy) {
    const candidate = { x: dx, y: dy };
    if (isOpposite(candidate, direction)) return;
    nextDirection = candidate;
    if (state === 'idle') {
      state = 'running';
      lastTick = performance.now();
    }
  }

  function update() {
    direction = nextDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 1;
      updateScoreDisplay();
      placeFood();
    } else {
      snake.pop();
    }
  }

  function gameOver() {
    state = 'gameover';
    if (score > highscore) {
      highscore = score;
      saveHighscore(highscore);
      updateScoreDisplay();
    }
  }

  function drawCenteredText(text, y) {
    ctx.fillStyle = COLOR_INK;
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, canvas.width / 2, y);
  }

  function drawSnakeAndFood() {
    ctx.fillStyle = COLOR_INK;
    ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);

    snake.forEach((seg) => {
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
    });
  }

  function draw() {
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawSnakeAndFood();

    if (state === 'idle') {
      drawCenteredText('PRESS ARROW', canvas.height / 2 - 8);
      drawCenteredText('OR SWIPE', canvas.height / 2 + 10);
    } else if (state === 'gameover') {
      drawCenteredText('GAME OVER', canvas.height / 2 - 8);
      drawCenteredText('TAP TO RESTART', canvas.height / 2 + 10);
    }
  }

  function loop(timestamp) {
    if (state === 'running' && timestamp - lastTick >= TICK_MS) {
      lastTick = timestamp;
      update();
    }
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        setDirection(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        setDirection(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        setDirection(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        setDirection(1, 0);
        break;
      case 'Enter':
      case ' ':
        if (state === 'gameover') resetGame();
        break;
    }
  });

  let touchStart = null;

  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (state === 'gameover') {
      resetGame();
      touchStart = null;
      return;
    }
    if (!touchStart) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 1 : -1, 0);
    } else {
      setDirection(0, dy > 0 ? 1 : -1);
    }
  }, { passive: true });

  canvas.addEventListener('click', () => {
    if (state === 'gameover') resetGame();
  });

  highscore = loadHighscore();
  resetGame();
  requestAnimationFrame(loop);
})();

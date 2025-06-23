const boardElement = document.getElementById("board");
const turnElement = document.getElementById("turn");
const SIZE = 8;

const POSITION_SCORE = [
  [100, -20, 10,  5,  5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10,  -2,  0,  0,  0,  0,  -2,  10],
  [5,   -2,  0,  0,  0,  0,  -2,   5],
  [5,   -2,  0,  0,  0,  0,  -2,   5],
  [10,  -2,  0,  0,  0,  0,  -2,  10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10,  5,  5, 10, -20, 100]
];

let board = []; // 盤面の状態（0:空, 1:黒, 2:白）
let currentTurn = 1; // 1:黒, 2:白（CPU）

// 初期化
function initBoard() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));

  // 初期配置
  board[3][3] = 2;
  board[3][4] = 1;
  board[4][3] = 1;
  board[4][4] = 2;

  drawBoard();
}

// 描画処理（スコアも更新）
function drawBoard() {
  boardElement.innerHTML = "";
  let black = 0, white = 0;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (board[y][x] === 1) {
        cell.classList.add("black");
        black++;
      }
      if (board[y][x] === 2) {
        cell.classList.add("white");
        white++;
      }

      // プレイヤーのターンのみクリック許可
      if (currentTurn === 1) {
        cell.addEventListener("click", () => handleClick(x, y));
      }

      boardElement.appendChild(cell);
    }
  }

  turnElement.textContent = `現在のターン: ${currentTurn === 1 ? "黒（あなた）" : "白（CPU）"}`;
  document.getElementById("score").textContent = `黒: ${black} - 白: ${white}`;
}

// 有効な手の取得
function getValidMoves(player) {
  const moves = [];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] === 0) {
        const flipped = getFlippableStones(x, y, player);
        if (flipped.length > 0) {
          moves.push([x, y]);
        }
      }
    }
  }
  return moves;
}

// 裏返せる石を調べる
function getFlippableStones(x, y, player) {
  const opponent = 3 - player;
  const directions = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  let result = [];

  for (const [dx, dy] of directions) {
    let nx = x + dx;
    let ny = y + dy;
    let line = [];

    while (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
      if (board[ny][nx] === opponent) {
        line.push([nx, ny]);
      } else if (board[ny][nx] === player) {
        result = result.concat(line);
        break;
      } else {
        break;
      }
      nx += dx;
      ny += dy;
    }
  }

  return result;
}

// クリック時の処理（CPUもここから処理再利用）
function handleClick(x, y) {
  if (board[y][x] !== 0) return;

  const flipped = getFlippableStones(x, y, currentTurn);
  if (flipped.length === 0) return;

  board[y][x] = currentTurn;
  for (const [fx, fy] of flipped) {
    board[fy][fx] = currentTurn;
  }

  const nextTurn = 3 - currentTurn;

  if (getValidMoves(nextTurn).length > 0) {
    currentTurn = nextTurn;
    drawBoard();
  if (currentTurn === 2) {
    setTimeout(cpuMove, 500); // 少し待ってからCPUの手を打つ
  }

  } else if (getValidMoves(currentTurn).length > 0) {
    alert(`${nextTurn === 1 ? "黒" : "白"}は置ける場所がないのでパス！`);
    drawBoard();
  } else {
    endGame();
  }
}

// CPUの手（ランダム）
function cpuMove() {
  const moves = getValidMoves(2);
  if (moves.length === 0) return;

  const level = getCpuLevel();
  let move;

  if (level === 1) {
    // 弱い（ランダム）
    move = moves[Math.floor(Math.random() * moves.length)];

  } else if (level === 2) {
    // 強い（裏返し数最大）
    let maxFlips = -1;
    for (const [x, y] of moves) {
      const flipped = getFlippableStones(x, y, 2);
      if (flipped.length > maxFlips) {
        maxFlips = flipped.length;
        move = [x, y];
      }
    }

  } else if (level === 3) {
    // すごく強い（位置評価 + 裏返し数）
    let bestScore = -Infinity;
    for (const [x, y] of moves) {
      const flipCount = getFlippableStones(x, y, 2).length;
      const positionScore = POSITION_SCORE[y][x];
      const totalScore = positionScore + flipCount * 2;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        move = [x, y];
      }
    }
  }

  const [x, y] = move;
  handleClick(x, y);
}

// ゲーム終了
function endGame() {
  let black = 0, white = 0;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (board[y][x] === 1) black++;
      if (board[y][x] === 2) white++;
    }
  }

  let result;
  if (black > white) result = "黒の勝ち！";
  else if (white > black) result = "白の勝ち！";
  else result = "引き分け！";

  alert(`ゲーム終了\n黒: ${black} - 白: ${white}\n${result}`);
}

// スタート！
initBoard();

function getCpuLevel() {
  return parseInt(document.getElementById("cpu-level").value);
}

document.getElementById("reset-btn").addEventListener("click", () => {
  currentTurn = 1; // プレイヤーから再開
  initBoard();     // 盤面を初期化
});

function drawBoard() {
  boardElement.innerHTML = "";
  let black = 0, white = 0;

const highlightEnabled = document.getElementById("highlight-toggle").checked;
// ハイライトはプレイヤー（黒）の番だけに限定
const validMoves = (highlightEnabled && currentTurn === 1) ? getValidMoves(1) : [];


  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (board[y][x] === 1) {
        cell.classList.add("black");
        black++;
      }
      if (board[y][x] === 2) {
        cell.classList.add("white");
        white++;
      }

      // ハイライト対象なら装飾
      if (
        highlightEnabled &&
        board[y][x] === 0 &&
        validMoves.some(([vx, vy]) => vx === x && vy === y)
      ) {
        cell.classList.add("highlight");
      }

      if (currentTurn === 1) {
        cell.addEventListener("click", () => handleClick(x, y));
      }

      boardElement.appendChild(cell);
    }
  }

  turnElement.textContent = `現在のターン: ${currentTurn === 1 ? "黒（あなた）" : "白（CPU）"}`;
  document.getElementById("score").textContent = `黒: ${black} - 白: ${white}`;
}

document.getElementById("highlight-toggle").addEventListener("change", () => {
  drawBoard();
});
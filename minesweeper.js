var icons = {
  blank: 'http://i.imgur.com/HM1e3Tbb.jpg',
  pressed: 'http://i.imgur.com/bGT8xGEb.jpg',
  exposedBomb: 'http://i.imgur.com/pTJ8Swhb.jpg',
  explodedBomb: 'http://i.imgur.com/UFmXprFb.jpg',
  flag: 'http://i.imgur.com/nLPvW15b.jpg',
  // Index is # of adjacent bombs
  bombs: [
    'http://i.imgur.com/Flqdqi1b.jpg', // 0
    'http://i.imgur.com/bM8oExob.jpg', // 1
    'http://i.imgur.com/bQKSbqYb.jpg', // 2
    'http://i.imgur.com/5jNcEeVb.jpg', // 3
    'http://i.imgur.com/BnxjHgHb.jpg', // 4
    'http://i.imgur.com/RaFrMYcb.jpg', // 5
    'http://i.imgur.com/GlwQOy0b.jpg', // 6
    'http://i.imgur.com/8ngsVa8b.jpg', // 7
    'http://i.imgur.com/lJ8P1wab.jpg'  // 8
  ]
};

var board = {};     // index to number of surrounding mines or -1 if mine
var displayed = {}; // visited cells
var mines = [];     // indexes of mines
var timer;          // timer that counts seconds
var time = 0;       // number of seconds for current game
var clicks = 0;     // number of clicks for current game
var solver;         // board solver
var beenFlagged = {};
var highScore = 0;
var minClicks = Number.MAX_SAFE_INTEGER;
var minTime = Number.MAX_SAFE_INTEGER;

// creates board for game, called when "Play" button is clicked
function createBoard() {
  var numMines = document.getElementById('mines').value;
  var N = document.getElementById('N').value;
  var table = document.getElementById('board');
  if(numMines > Math.pow(N, 2)) {
    alert('You must have at least as many squares as mines.');
  } else {
    resetBoard();
    for(var i = 0; i < N; i++) {
      var row = table.insertRow(i);
      for(var j = 0; j < N; j++) {
        var cell = row.insertCell(j);
        var id = N * i + j;
        cell.id = id;
        cell.innerHTML = "<input type='button' style='background: url(" + icons.blank + 
                         ") no-repeat; width: 30px; height: 30px; background-size: 100%;' onclick='updateBoard(" + 
                         id + ", " + N + ")' oncontextmenu=\"flag(" + id + ", " + N + "); return false;\"/>";
      }
    }
    placeMines(N, numMines);
    storeBoard(N, numMines);
    timer = setInterval(countSeconds, 1000);
  }
};

function flag(id, N) {
  document.getElementById(id).innerHTML = "<input type='button' style='background: url(" + icons.flag + 
                                          ") no-repeat; width: 30px; height: 30px; background-size: 100%;' onclick='updateBoard(" + 
                                          id + ", " + N + ")' oncontextmenu=\"unFlag(" + id + ", " + N + "); return false;\"/>";
  beenFlagged[id] = true;
};

function unFlag(id, N) {
  document.getElementById(id).innerHTML = "<input type='button' style='background: url(" + icons.blank + 
                                          ") no-repeat; width: 30px; height: 30px; background-size: 100%;' onclick='updateBoard(" + 
                                          id + ", " + N + ")' oncontextmenu=\"flag(" + id + ", " + N + "); return false;\"/>";
  beenFlagged[id] = false;
};

function solve() {
  solver = setInterval(solveHelper, 1000);
};

function solveHelper() {
  var N = document.getElementById('N').value;
  var flagged = foundFlag(N);
  // add 1 sec pause
  var clicked = foundClick(N);
  if(!flagged && !clicked) clickRandom(N);
};

function foundFlag(N) {
  var flagged = false;
  for(var id in board) {
    if(displayed[id] && board[id] > 0) {
      var numSurroundingMines = board[id];
      var surroundingUnexposed = [];
      var neighbors = getNeighbors(id, N);
      for(var i in neighbors) {
        var neighborID = neighbors[i];
        if(!displayed[neighborID]) surroundingUnexposed.push(neighborID);
      }
      if(surroundingUnexposed.length <= numSurroundingMines && surroundingUnexposed.length > 0) {
        for(var i in surroundingUnexposed) {
          if(!beenFlagged[surroundingUnexposed[i]]) {
            flag(surroundingUnexposed[i], N);
            flagged = true;
          }
        }
      }
    }
  }
  return flagged;
};

function foundClick(N) {
  var clicked = false;
  for(var id in board) {
    if(displayed[id] && board[id] > 0) {
      var numSurroundingMines = board[id];
      var surroundingUnexposed = [];
      var surroundingFlags = [];
      var neighbors = getNeighbors(id, N);
      for(var i in neighbors) {
        var neighborID = neighbors[i];
        if(!displayed[neighborID] && !beenFlagged[neighborID]) surroundingUnexposed.push(neighborID);
        else if(beenFlagged[neighborID]) surroundingFlags.push(neighborID);
      }
      if(numSurroundingMines == surroundingFlags.length && surroundingUnexposed.length > 0) {
        clicked = true;
        for(var i in surroundingUnexposed) updateBoard(surroundingUnexposed[i], N);
      }
    }
  }
  return clicked;
};

function clickRandom(N) {
  var id = Math.floor(Math.random() * Math.pow(N, 2));
  while(displayed[id] || beenFlagged[id]) id = Math.floor(Math.random() * Math.pow(N, 2));
  updateBoard(id, N)
};

// increments timer
function countSeconds() {
  time++;
  document.getElementById("time").innerHTML = time + ' Seconds';
};

// resets board by reinitializing variables
function resetBoard() {
  board = {};
  displayed = {};
  beenFlagged = {};
  mines = [];
  time = 0;
  clicks = 0;
  clearInterval(timer);
  clearInterval(solver);
  document.getElementById('board').innerHTML = "";
  document.getElementById('play').innerHTML = "New Game!";
  document.getElementById('end').style.display = "inline";
  document.getElementById('solve').style.display = "inline";
  document.getElementById('time').style.display = "inline";
  document.getElementById('clicks').style.display = "inline";
  document.getElementById('time').style.visibility = "visible";
  document.getElementById('clicks').style.visibility = "visible";
  document.getElementById("time").innerHTML = time + ' Seconds';
  document.getElementById("clicks").innerHTML = clicks + ' Clicks &nbsp;&nbsp;&nbsp;';
  document.getElementById("banner").innerHTML = "";
};

// stores the board in an object, mapping index to # of surrounding mines
function storeBoard(N, numMines) {
  for(var i = 0; i < N; i++) {
    for(var j = 0; j < N; j++) {
      var id = N * i + j;
      var neighbors = getNeighbors(id, N);
      var numMines = getSurroundingMines(neighbors);
      if(mines.indexOf(id) < 0) board[id] = numMines;
      else board[id] = -1;
      displayed[id] = false;
    }
  }
};

// randomly places mines in board
function placeMines(N, numMines) {
  for(var i = 0; i < numMines; i++) {
    var index = Math.floor(Math.random() * Math.pow(N, 2));
    while(mines.indexOf(index) >= 0) index = Math.floor(Math.random() * Math.pow(N, 2));
    mines.push(index);
  }
};

// called each time the player clicks a square, updates the board depending on their click
function updateBoard(id, N) {
  displayed[id] = true;
  addClick();
  var cell = document.getElementById(id);
  if(board[id] == -1) {
    cell.innerHTML = "<img src='" + icons.explodedBomb + "' width='27px' height='27px'/>";
    showBoard(true);
  } else {
    cell.innerHTML = "<img src='" + icons.bombs[board[id]] + "' width='27px' height='27px'/>";
    if(board[id] == 0) {
      var neighbors = getNeighbors(id, N);
      branch(neighbors, N);
    }
    if(wonGame()) showBoard(false);
  }
};

// increments number of clicks
function addClick() {
  clicks++;
  document.getElementById('clicks').innerHTML = clicks + " Clicks &#09;";
};

// returns true when player wins game by checking that all uncovered squares contain mines
function wonGame() {
  for(var id in board) if(!displayed[id] && board[id] != -1) return false;
  return true;
};

// called when game is finished, displays entire board
function showBoard(lost) {
  clearInterval(timer);
  clearInterval(solver);
  for(var id in board) if(!displayed[id]) display(id, lost);
  showResults(lost);
};

// updates banner once game is finished to show results
function showResults(lost) {
  var result = lost ? "lost" : "won";
  document.getElementById("banner").innerHTML = "You " + result + " after " + clicks + " clicks and " + time + " seconds! Want to play again?";
  if(!lost) {
    if(clicks < minClicks) minClicks = clicks;
    if(time < minTime) minTime = time;
    document.getElementById("results").innerHTML = "Best Time: " + minTime + " Seconds<br>Fewest Clicks: " +  minClicks;
  }
  document.getElementById('time').style.display = "none";
  document.getElementById('clicks').style.display = "none";
  document.getElementById('play').innerHTML = "Play Again!";
  document.getElementById('end').style.display = "none";
  document.getElementById('solve').style.display = "none";
}

// called when player clicks a square with zero surrounding mines
// branches out until all similar surrounding squares and their neighbors are uncovered
function branch(neighbors, N) {
  var blanks = getSurroundingBlanks(neighbors);
  // update score
  for(var i = 0; i < neighbors.length; i++) display(neighbors[i], true);
  while(blanks.length > 0) {
    var id = blanks.pop();
    var newNeighbors = getNeighbors(id, N);
    var newBlanks = getSurroundingBlanks(newNeighbors);
    for(var i = 0; i < newNeighbors.length; i++) if(!displayed[newNeighbors[i]]) display(newNeighbors[i], true);
    for(var i = 0; i < newBlanks.length; i++) if(blanks.indexOf(newBlanks[i]) < 0) blanks.push(newBlanks[i]);
  }
};

// displays one square based on what lies underneath
function display(id, lost) {
  var cell = document.getElementById(id);
  if(board[id] >= 0) {
    cell.innerHTML = "<img src='" + icons.bombs[board[id]] + "' width='27px' height='27px'/>";
  } else {
    if(lost) cell.innerHTML = "<img src='" + icons.exposedBomb + "' width='27px' height='27px'/>";
    else cell.innerHTML = "<img src='" + icons.flag + "' width='27px' height='27px'/>";
  }
  displayed[id] = true;
};

// returns an array of ids of surrounding blank squares (squares with zero surrounding mines)
function getSurroundingBlanks(neighbors) {
  var blanks = [];
  for(var i = 0; i < neighbors.length; i++) if(board[neighbors[i]] == 0 && !displayed[neighbors[i]]) blanks.push(neighbors[i]);
  return blanks;
};

// returns the number of surrounding mines
function getSurroundingMines(neighbors) {
  var numMines = 0;
  for(var i = 0; i < neighbors.length; i++) if(mines.indexOf(neighbors[i]) >= 0) numMines++;
  return numMines;
};

// returns an array of ids of the neighbors of any square
function getNeighbors(id, n) {
  var neighbors = [];
  var center = parseInt(id);
  var N = parseInt(n);

  var top = center < N;
  var bottom = center >= (N * (N - 1));
  var left = (center % N) == 0;
  var right = ((center % N) == (N - 1));

  var upperLeft = center - N - 1;
  var upper = center - N;
  var upperRight = center - N + 1;
  var sideLeft = center - 1;
  var sideRight = center + 1;
  var lowerLeft = center + N - 1;
  var lower = center + N;
  var lowerRight = center + N + 1;

  if(!bottom) {
    neighbors.push(lower);
    if(!left) neighbors.push(lowerLeft);
    if(!right) neighbors.push(lowerRight);
  }

  if(!top) {
    neighbors.push(upper);
    if(!left) neighbors.push(upperLeft);
    if(!right) neighbors.push(upperRight);
  }

  if(!right) neighbors.push(sideRight);
  if(!left) neighbors.push(sideLeft);

  return neighbors;
};
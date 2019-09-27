// 大幅に書き換え
// stackに入れるのを候補すべてにする。で、確定済みとか、周囲に2マス以上1確定があるのはパス。
// そう、0を通行不能、1を通行可能、-1を未確定、にする。（変更）
// cellValueは今まで通りスタートからの最短距離。

// あと、フレームごとに（10フレームに1回くらいで）迷路が出来ていくシミュレーションとかやりたい。
// あと、playerの基底クラスを作って敵の動きやオブジェクト（攻撃）とかそういうのの動きに使いたい。んー・・

let myMap;
let myMover;
const dx = [1, 0, -1, 0, 1];
const dy = [0, 1, 0, -1, 0];

function setup(){
	createCanvas(640, 480);
	noStroke();
	myMap = new stageMap(20, 15, 32);
	myMap.createMaze(3, 3); // とりあえず(3, 3)を始点にしてみる。
  myMap.completion();
  myMover = new mover(3, 3, 0.08, myMap);
}

function draw(){
	background(220);
  myMover.move();
	myMap.render();
  myMover.render();
}

class stageMap{
	constructor(w, h, grid){
		this.w = w;
		this.h = h;
		this.start = {x:0, y:0}; // 迷路を作るときの始点
		this.goal = {x:0, y:0};  // cellValueが最大となる点で、ゴールに設定する
		this.grid = grid
		this.board = getInitialMatrix(w, h, -1);
		this.cellValue = getInitialMatrix(w, h, -1);
    // 外周を0で埋める
		for(let x = 0; x < w; x++){ this.board[x][0] = 0; this.board[x][h - 1] = 0; }
		for(let y = 0; y < h; y++){ this.board[0][y] = 0; this.board[w - 1][y] = 0; }
	}
  reset(w, h, grid){
    // 横w, 縦h, マスの大きさgridで初期化する。
    this.grid = grid;
    this.board = getInitialMatrix(w, h, -1);
    this.cellValue = getInitialMatrix(w, h, -1);
  }
	createMaze(x, y){
    // (x, y)を起点とした迷路を作成する
    this.start = {x:x, y:y};
    let stack = [{x:x, y:y}];
    for(let i = 0; i < this.w * this.h; i++){
      if(stack.length === 0){ console.log("探索回数" + i + "回"); break; }
      let cur = stack.pop();
      let a = cur.x;
      let b = cur.y;
      if(this.board[a][b] !== -1){ continue; }
      this.setFlag(a, b, 1);
      this.setValue(a, b);
      let nArray = shuffle([0, 1, 2, 3]);
      for(let k = 0; k < 4; k++){
        let l = nArray[k];
        if(this.check(a + dx[l], b + dy[l])){
          stack.push({x:a + dx[l], y:b + dy[l]});
        }
      }
    }
	}
  check(x, y){
    // 確定済みならfalseを返す。未確定でも、上下左右に2つ以上1確定があればここは0確定にしてfalseを返す。
    // それ以外の時trueを返す。
    if(this.board[x][y] !== -1){ return false; }
    let isOne = 0;
    for(let k = 0; k < 4; k++){
      if(this.checkFlag(x + dx[k], y + dy[k], 1)){ isOne++; }
    }
    if(isOne > 1){
      this.setFlag(x, y, 0);
      return false;
    }
    return true;
  }
  completion(){
    // 完了処理（ゴールの設定、value-1のマスを0確定にする、の2つ。）
    let value = 0;
    let a, b;
    for(let x = 0; x < this.w; x++){
      for(let y = 0; y < this.h; y++){
        if(value < this.cellValue[x][y]){ value = this.cellValue[x][y]; a = x; b = y; }
        if(this.checkFlag(x, y, -1)){ this.setFlag(x, y, 0); }
      }
    }
    this.goal = {x:a, y:b};
    console.log("start:(" + this.start.x + ", " + this.start.y + ")");
		console.log("goal:(" + this.goal.x + ", " + this.goal.y + ")");
		console.log("mazeValue:" + this.cellValue[this.goal.x][this.goal.y]);
  }
	setFlag(x, y, flag){
		this.board[x][y] = flag;
	}
  checkFlag(x, y, flag){
    return this.board[x][y] === flag;
  }
  setValue(x, y){
    let value = -2;
    for(let k = 0; k < 4; k++){
      let p = x + dx[k];
      let q = y + dy[k];
      if(value < this.cellValue[p][q]){ value = this.cellValue[p][q]; }
    }
    this.cellValue[x][y] = value + 1; // たとえばすべて-1なら0が設定される。
  }
	render(){
    // 0か
		let g = this.grid;
		for(let x = 0; x < this.w; x++){
			for(let y = 0; y < this.h; y++){
				let v = this.cellValue[x][y];
        if(this.checkFlag(x, y, -1)){ fill(200, 200, 255); }
				else if(this.checkFlag(x, y, 0)){ fill(0); }
				else{ fill(255, 255 - 2 * v, 255 - 2 * v); }
				rect(x * g, y * g, g, g);
			}
		}
		fill(0, 0, 255);
		rect(this.start.x * g, this.start.y * g, g, g);
		fill(34, 177, 76);
		rect(this.goal.x * g, this.goal.y * g, g, g);
	}
}

// 横w,縦hの行列をvで初期化したものを取得する。
function getInitialMatrix(w, h, v){
	let array = [];
	for(let x = 0; x < w; x++){
		let column = [];
		for(let y = 0; y < h; y++){
			column.push(v);
		}
		array.push(column);
	}
	return array;
}

// ダンジョンをうごめくもの
class mover{
	constructor(x, y, speed, mapData){
		this.from = {x:x, y:y};
		this.to = {x:x, y:y};
		this.dir = 0;
		this.diff = 0;
		this.myMap = mapData;
		this.speed = speed;
	}
  update(){
    // なにもしない
  }
	move(){
    // updateだと他にもやることあるのにぃってなるからmoveにした
		let keyId = this.getId();
		if(keyId < 0){ return; }
    // diffが0の場合にキー入力が行われると状況に応じてfrom, to, dirが設定される
		if(this.diff === 0 && this.from.x === this.to.x && this.from.y === this.to.y){ this.setting(keyId); }
		// settingしてもtoが変わらない＝その方向には行けない（dirは変化している）
		if(this.from.x === this.to.x && this.from.y === this.to.y){ return; } // 行けない
		// diff補正パート
		if(keyId === this.dir){ this.diff += this.speed; }
		else if(keyId === (this.dir + 2) % 4){
			this.turn();
			this.diff += this.speed;
		}else{
			if(this.diff <= 0.25 && this.getFromAround(keyId) === 1){
				this.turn();
				this.diff += this.speed;
			}else if(this.diff >= 0.75 && this.getToAround(keyId) === 1){
				this.diff += this.speed;
			}else{ return; } // これ以外のケースでは滑りが発生しない
		}
		// diff修正パート
		if(this.diff < 1){ return; } // 1より小：何も起こらない
		this.diff = 0;
    // console.log("わふー" + this.to.x + ", " + this.to.y);
    // マスに到達した時のイベントとかここに書くといいかも？(to.x, to.yが該当マスになる)
    // たとえばゴールに着いたとき「CLEAR!」って表示されて次の階、とかそんなような。
		this.dir = keyId;
		this.from = {x:this.to.x, y:this.to.y};
	}
	getFromAround(id){
		// fromのid方向にあるマスのボード値を返す
		return this.myMap.board[this.from.x + dx[id]][this.from.y + dy[id]];
	}
	getToAround(id){
		// toのid方向にあるマスのボード値を返す
		return this.myMap.board[this.to.x + dx[id]][this.to.y + dy[id]];
	}
	turn(){
		// 反転
		this.dir = (this.dir + 2) % 4;
		this.diff = 1 - this.diff;
		let tmp = {a:this.from.x, b:this.from.y};
		this.from = {x:this.to.x, y:this.to.y};
		this.to = {x:tmp.a, y:tmp.b};
	}
	setting(id){
    // diffが0の場合に入力を受け取ったとして次にどこに行くのか、どこにも行かないのかを判断し実行するパート。
    // たとえば敵の場合はdirの情報を元にして方向転換とかするんだろうなと。
    // 敵の場合getIdでdirを取得してるから、実質自分のdirを元にいろいろ決める事になりそう。
		let flag = this.getFromAround(id);
		if(flag === 1){ // 1で動けるフラグ
			// キー入力方向に進める場合はそっちにtoを設定する
			this.to = {x:this.from.x + dx[id], y:this.from.y + dy[id]};
			this.dir = id;
		}
    // 0の場合は何も起こらない・・敵の動きとかの場合、dir情報を元にここでいろいろ設定する感じかな。
	}
	getId(){
    // moveに必要な方向指示を取得する。プレイヤーならキー入力で受け取る。
    // 敵の場合とか、getIdはそのままdirでしょ・・場合によっては違うかもだけど。
    if(keyIsDown(RIGHT_ARROW)){ return 0; }
		if(keyIsDown(DOWN_ARROW)){ return 1; }
		if(keyIsDown(LEFT_ARROW)){ return 2; }
		if(keyIsDown(UP_ARROW)){ return 3; }
		return -1;
    return -1;
	}
	render(){
		let g = this.myMap.grid;
		let cellX = map(this.diff, 0, 1, this.from.x, this.to.x);
		let cellY = map(this.diff, 0, 1, this.from.y, this.to.y);
		fill(255, 201, 14);
		rect(cellX * g, cellY * g, g, g);
	}
}

class player extends mover{
  constructor(x, y, speed, mapData){
    super(x, y, speed, mapData);
    // なにもありません（？）
  }
  getId(){
    // 方向をキー入力で取得
    if(keyIsDown(RIGHT_ARROW)){ return 0; }
		if(keyIsDown(DOWN_ARROW)){ return 1; }
		if(keyIsDown(LEFT_ARROW)){ return 2; }
		if(keyIsDown(UP_ARROW)){ return 3; }
		return -1;
  }
  setting(id){
    // プレイヤーの場合、キー入力方向に行けるなら然るべくtoとかdirを設定する。
  }
}

// 手順
// 起点(x, y)を定めてここをstartにする。
// stack = []を用意し、{x:x, y:y}を放り込む。
// forループを回す。上限はthis.w * this.hでいい。
// 最初に「stackが空ならbreak」
// 次に「stackの先頭をpopしてcurに入れる」
// curが確定ならcontinue（最初に戻る）
// 未確定なら1確定にしてvalueを設定する（周囲の値のMAXに1を足せばいい）
// curの上下左右のうち条件を満たすマスをstackに放り込んでループ終了（ランダム化忘れずに）
// 条件とは、1:未確定で、2:上下左右に1確定のマスが高々1つ。
// そこでcreateMazeは終了、仕上げは別メソッド。
// 別メソッドで、cellValueがMAXとなるいずれかのマスを取得してそこをゴールに設定する。

// moverの継承でplayer, キー入力をキーボードから、
// 敵は？とりあえず〇が動くのでいい。あっちみたく直進し続ける感じの。（fromのcenterとtoのcenterでmapのdiff取る）
// あと、中心座標の情報とか要るかな・・
// もともとのdirに対して、±1の方向のどれかに行く、すべてダメなら後ろに行く感じ。
// またはプレイヤーが近いとそれに応じた向き変更するとか？

// 大幅に書き換え
// stackに入れるのを候補すべてにする。で、確定済みとか、周囲に2マス以上1確定があるのはパス。
// そう、0を通行不能、1を通行可能、-1を未確定、にする。（変更）
// cellValueは今まで通りスタートからの最短距離。

// あと、フレームごとに（10フレームに1回くらいで）迷路が出来ていくシミュレーションとかやりたい。
// あと、playerの基底クラスを作って敵の動きやオブジェクト（攻撃）とかそういうのの動きに使いたい。んー・・
"use strict";

let entity;
//let myMap;
//let myPlayer;
//let myWanderer;
const dx = [1, 0, -1, 0, 1]; // 4番目を用意しておくのが地味に大事
const dy = [0, 1, 0, -1, 0];

function setup(){
	createCanvas(640, 480);
	noStroke();
	entity = new master(1, 1);
}

function draw(){
	background(220);
	entity.update();
	entity.move();
	entity.render();
	entity.eject();
	entity.check();
}

class stageMap{
	constructor(w, h, grid){
		this.w = w;
		this.h = h;
		this.start = {x:0, y:0}; // 迷路を作るときの始点
		this.goal = {x:0, y:0};  // cellValueが最大となる点で、ゴールに設定する
		this.grid = grid;
		this.board = getInitialMatrix(w, h, -1);
		this.cellValue = getInitialMatrix(w, h, -1);
    // 外周を0で埋める
		for(let x = 0; x < w; x++){ this.board[x][0] = 0; this.board[x][h - 1] = 0; }
		for(let y = 0; y < h; y++){ this.board[0][y] = 0; this.board[w - 1][y] = 0; }
	}
	reconstruction(x, y, param){
		// 再構築～
		this.reset(param.w, param.h, param.g);
		this.createMaze(x, y);
		//console.log(x + " " + y);
		this.completion();
	}
  reset(w, h, grid){
    // 横w, 縦h, マスの大きさgridで初期化する。
		this.w = w;
		this.h = h;
    this.grid = grid;
    this.board = getInitialMatrix(w, h, -1);
    this.cellValue = getInitialMatrix(w, h, -1);
		this.goal = {x:0, y:0};
		for(let x = 0; x < w; x++){ this.board[x][0] = 0; this.board[x][h - 1] = 0; }
		for(let y = 0; y < h; y++){ this.board[0][y] = 0; this.board[w - 1][y] = 0; }
  }
	createMaze(x, y){
    // (x, y)を起点とした迷路を作成する
    this.start = {x:x, y:y};
    let stack = [{x:x, y:y}];
    for(let i = 0; i < this.w * this.h; i++){
      if(stack.length === 0){
				//console.log("探索回数" + i + "回");
				break;
			}
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
		this.setFlag(a, b, 3); // goalのフラグを1から3に変更する
    //console.log("start:(" + this.start.x + ", " + this.start.y + ")");
		//console.log("goal:(" + this.goal.x + ", " + this.goal.y + ")");
		//console.log("mazeValue:" + this.cellValue[this.goal.x][this.goal.y]);
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
		fill(114);
		rect(this.start.x * g, this.start.y * g, g, g);
		fill(215, 186, 53);
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
	constructor(speed){
		this.from = {};
		this.dir = 0;
		this.diff = 0;
		this.myMap = undefined;
		this.speed = speed;
		this.alive = true; // 排除用（ショットとか）
	}
	setPosData(x, y, mapData){
		this.from = {x:x, y:y};
		this.myMap = mapData;
	}
  update(){
    // なんか更新
  }
	move(){
    // updateだと他にもやることあるのにぃってなるからmoveにした。いろんな挙動。
	}
	getFromAround(id){
		// fromのid方向にあるマスのボード値を返す
		return this.myMap.board[this.from.x + dx[id]][this.from.y + dy[id]];
	}
	getToAround(id){
		// toのid方向にあるマスのボード値を返す
		return this.myMap.board[this.from.x + dx[this.dir] + dx[id]][this.from.y + dy[this.dir] + dy[id]];
	}
	getFlag(){
		// fromのboard値を返す感じ
		return this.myMap.board[this.from.x][this.from.y];
	}
	turn(){
		// 反転
		this.from = {x:this.from.x + dx[this.dir], y:this.from.y + dy[this.dir]};
		this.dir = (this.dir + 2) % 4;
		this.diff = 1 - this.diff;
	}
	setting(id){
    // diffが0の場合に入力を受け取ったとして次にどこに行くのか、どこにも行かないのかを判断し実行するパート。
    // たとえば敵の場合はdirの情報を元にして方向転換とかするんだろうなと。
    // 敵の場合getIdでdirを取得してるから、実質自分のdirを元にいろいろ決める事になりそう。
		this.dir = id;
	}
	getId(){
    // moveに必要な方向指示を取得する。プレイヤーならキー入力で受け取る。
    // 敵の場合とか、getIdはそのままdirでしょ・・場合によっては違うかもだけど。
    return -1;
	}
	render(){
		let g = this.myMap.grid;
		let cellX = this.from.x + this.diff * dx[this.dir];
		let cellY = this.from.y + this.diff * dy[this.dir];
		fill(255, 201, 14);
		rect(cellX * g, cellY * g, g, g);
	}
}

// プレイヤー。キー入力で移動します。
class player extends mover{
  constructor(speed){
    super(speed);
    // hp, pow, etc...
  }
  move(){
    // updateだと他にもやることあるのにぃってなるからmoveにした
		let keyId = this.getId();
		if(keyId < 0){ return; }
    // diffが0の場合にキー入力が行われると状況に応じてfrom, to, dirが設定される
		if(this.diff === 0){
			this.dir = keyId; // 移動できずともdirは変える
			if(this.getFromAround(keyId) === 0){ return; } // その方向に進めない場合はreturn.
		}
		// diff補正パート
		if(keyId === this.dir){ this.diff += this.speed; }
		else if(keyId === (this.dir + 2) % 4){
			this.turn();
			this.diff += this.speed;
		}else{
			if(this.diff <= 0.25 && (this.getFromAround(keyId) & 1)){
				this.turn();
				this.diff += this.speed;
			}else if(this.diff >= 0.75 && (this.getToAround(keyId) & 1)){
				this.diff += this.speed;
			}else{ return; } // これ以外のケースでは滑りが発生しない
		}
		// diff修正パート
		if(this.diff < 1){ return; } // 1より小：何も起こらない
		this.diff = 0;
    // マスに到達した時のイベントとかここに書くといいかも？(to.x, to.yが該当マスになる)
    // たとえばゴールに着いたとき「CLEAR!」って表示されて次の階、とかそんなような。
		this.from = {x:this.from.x + dx[this.dir], y:this.from.y + dy[this.dir]};
		this.dir = keyId;
	}
  getId(){
    // 方向をキー入力で取得
    if(keyIsDown(RIGHT_ARROW)){ return 0; }
		if(keyIsDown(DOWN_ARROW)){ return 1; }
		if(keyIsDown(LEFT_ARROW)){ return 2; }
		if(keyIsDown(UP_ARROW)){ return 3; }
		return -1;
  }
}

// 徘徊し続ける、だけ
// 近付いたら動き始めるとか、一定の範囲を行ったり来たりするだけとか（円とか矩形で制限する）のも面白そう。
class wanderer extends mover{
  constructor(speed, r, g, b){
    super(speed);
    this.color = color(r, g, b);
  }
  move(){
    // updateだと他にもやることあるのにぃってなるからmoveにした
		let id = this.dir;
    // diffが0の場合にキー入力が行われると状況に応じてfrom, to, dirが設定される
		if(this.diff === 0){ this.setting(id); }
		// diff補正パート
	  this.diff += this.speed;
		// diff修正パート
		if(this.diff < 1){ return; } // 1より小：何も起こらない
		this.diff = 0;
    // マスに到達した時のイベントとかここに書くといいかも？(to.x, to.yが該当マスになる)
    // たとえばゴールに着いたとき「CLEAR!」って表示されて次の階、とかそんなような。
		this.from = {x:this.from.x + dx[this.dir], y:this.from.y + dy[this.dir]};
	}
  getId(){ return this.dir; }
  setting(id){
    // idを元にして、次の行先を決める。getFromAroundのid, id-1, id+1を見てこのうちtrueなのを放り込み、
    // ランダムでチョイス（要するに引き返さない）。すべてダメのときは行き止まり。引き返す。
    let choices = [];
    for(let c = 3; c <= 5; c++){
      if(this.getFromAround((id + c) % 4) & 1){ choices.push((id + c) % 4); }
    }
    let newDir = -1;
    if(choices.length > 0){
      newDir = random(choices);
    }else{
      // 行き止まりで引き返す感じ
      newDir = (id + 2) % 4;
    }
    this.dir = newDir;
  }
  render(){
		let g = this.myMap.grid;
		let cellX = this.from.x + this.diff * dx[this.dir];
		let cellY = this.from.y + this.diff * dy[this.dir];
		fill(this.color);
		rect(cellX * g, cellY * g, g, g);
	}
}

class effect{
	constructor(life){
		this.life = life;
		this.alive = true;
	}
	update(){
	  this.life--;
		if(this.life === 0){ this.alive = false; }
	}
}

class stopMessageEffect extends effect{
	constructor(life, typeStr, alpha, messageArray){
		super(life);
		//this.quitOther = true;
		this.typeStr = typeStr;
		this.alpha = alpha;
		this.messageArray = messageArray;
	}
	render(){
		fill(0, 0, 0, this.alpha);
		rect(0, 0, width, height);
		this.messageArray.forEach((mes) => {
			fill(255);
			textSize(mes.size);
			text(mes.str, mes.x, mes.y);
		})
	}
}

class message{
	constructor(){
		this.id = -1;
		this.x = 0;
		this.y = 0;
		this._str = "";
		this.life = 0;
		this.active = false;
	}
	setting(id, x, y, _str, life){
		this.id = id; // 0:stage x, 1:clear
		this.x = x;
		this.y = y;
		this._str = _str;
		this.life = life;
		this.active = true;
	}
	inActivate(){
		this.active = false;
	}
	update(){
		if(!this.active){ return; }
		//console.log(this.life);
		this.life--;
		if(this.life === 0){ this.inActivate(); }
	}
	render(){
		if(!this.active){ return; }
		fill(0, 0, 0, 80);
		rect(0, 0, width, height);
		fill(255);
		textSize(30);
		text(this._str, this.x, this.y);
	}
}

// 統括者
// 敵はプレイヤーの位置と離れたところにしか出したくない。
class master{
	constructor(x, y){
		this.stageArray = [new stage(1, 1, 120, [0], [{id:0, ratio:100}], {w:10, h:10, g:32}),
		                   new stage(2, 2, 120, [1], [{id:0, ratio:50}, {id:1, ratio:50}], {w:10, h:10, g:32}),
                       new stage(3, 3, 120, [2], [{id:0, ratio:30}, {id:1, ratio:30}, {id:2, ratio:40}], {w:10, h:10, g:32})
											 ];
		this.stageIndex = 0;
		//this.stage = this.stageArray[0];
		this.stage = undefined;
		//let param = this.stage.sizeParam;
		//this.w = param.w; // 0.
		//this.h = param.h; // 1.
		this.w = 1;
		this.h = 1;
		this.stageMap = new stageMap(1, 1, 1); // 2.
		//this.stageMap.createMaze(x, y); // 3.
		//this.stageMap.completion(); // 4.
		this.enemyArray = []; // 5.
		this.shotArray = []; // 6.
		this.effectArray = []; // エフェクト。おわったらはじく。 7.
		this.message = new message(); // スタートとかクリアとかの画面暗くなるやつ。effectとは別。
		//this.createStartMessage(); // 8.
		//this.createEnemyMulti(this.stage.initialEnemyIdArray); // 初期配置 9.
		this.player = new player(0.08);
		this.setStage(x, y);
		//this.setPlayer(x, y, 0.08);
	}
	setStage(x, y){
		this.stage = this.stageArray[this.stageIndex];
		this.stage.createEnemyBox();
		let param = this.stage.sizeParam;
		this.stageMap.reconstruction(x, y, param);
		this.w = param.w;
		this.h = param.h;
		//this.stageMap.reset(this.w, this.h, param.g);
		//this.stageMap.createMaze(x, y);
		//this.stageMap.completion();
		this.enemyArray = [];
		this.shotArray = [];
		this.effectArray = [];
		this.setStartMessage();
		this.setPlayer(x, y);
		this.createEnemyMulti(this.stage.initialEnemyIdArray);
	}
	setStartMessage(){
		this.message.setting(0, 50, 50, 'STAGE ' + this.stage.id, 60);
	}
	setClearMessage(){
		this.message.setting(1, 50, 50, 'STAGE CLEAR!', 60);
	}
	setPlayer(x, y){
		//this.player = new player(speed);
		this.player.setPosData(x, y, this.stageMap);
	}
	createEnemy(id){
		// とりあえず1匹
		if(this.stage.full){ return false; } // ステージの存在可能敵数がMAX
		let pos = this.getEnemyPos(5);
		//console.log(pos);
		if(pos.x < 0){ return false; } // 取得に失敗
		let enemy = getEnemy(id);
		enemy.setPosData(pos.x, pos.y, this.stageMap); // 位置情報を登録。
		this.enemyArray.push(enemy);
		this.stage.increaseEnemyVolume();
		return true;
	}
	createEnemyMulti(idArray){
		// 複数版。ただしすべて配置できるとは限らない。
    idArray.forEach((id) => {this.createEnemy(id);})
	}
	getEnemyPos(size){
		// ランダムにしか選べない。うまく行かなかったら(-1, -1)を返す。
		// マップを5x5ずつに区切って、プレイヤーの位置と隣接しない区画を取り出し、その中からランダムで選ぶ感じ。
		let bd = this.stageMap.board;
		let p_xFlag = Math.floor(this.player.from.x / size);
		let p_yFlag = Math.floor(this.player.from.y / size);
		let choices = [];
		for(let x = 0; x < this.w; x++){
			for(let y = 0; y < this.h; y++){
				if(!(bd[x][y] & 1)){ continue; }
				let xFlag = Math.floor(x / size);
				let yFlag = Math.floor(y / size);
				if(abs(xFlag - p_xFlag) <= 1 && yFlag === p_yFlag){ continue; } // 隣接を排除
				if(abs(yFlag - p_yFlag) <= 1 && xFlag === p_xFlag){ continue; }
				choices.push({x:x, y:y});
			}
		}
		//console.log(choices);
		if(choices.length === 0){ return {x:-1, y:-1}; }
		return random(choices);
	}
	update(){
		// ...
	  if(this.message.active){ return; }
    this.effectArray.forEach((ef) => {ef.update();})
		this.stage.update();
		if(this.stage.generateSign){
      this.createEnemy(this.stage.getNextEnemyId()); // 敵を1匹出す
			this.stage.signOff(); // 必ずOffにする
		}
	}
	move(){
    if(this.message.active){ return; }
		this.player.move();
		this.enemyArray.forEach((e) => {e.move();})
	}
	render(){
		this.stageMap.render();
		this.player.render();
		this.enemyArray.forEach((e) => {e.render();})
		this.effectArray.forEach((ef) => {ef.render();})
		this.message.render();
	}
	eject(){
		// いなくなったenemy、終了したeffectの排除（こういうのは役割を分離したほうがいい）
		if(this.stopEffect !== undefined){
		  if(!this.stopEffect.alive){ this.stopEffect = undefined; }
		}
	  for(let i = 0; i < this.effectArray.length; i++){
			if(!this.effectArray[i].alive){ this.effectArray.splice(i, 1); }
		}
		for(let i = 0; i < this.enemyArray.length; i++){
			if(!this.enemyArray[i].alive){ this.enemyArray.splice(i, 1); }
		}
	}
  gameOverCheck(){
		// playerがやられたかどうか
		return false;
	}
	clearCheck(){
		// playerがクリアしたかどうか
		if(this.player.getFlag() === 3){
			//console.log("clear");
			return true;
		}
		return false;
	}
	check(){
		// 各種チェック(gameover, clear, message, etc)
		if(this.gameOverCheck() && !(this.message.active)){
		  /* 処理 */
	  }
		if(this.clearCheck() && !(this.message.active)){
			this.setClearMessage();
		}
		if(this.message.active){
			this.message.update();
			//console.log(this.message.id);
			if(!this.message.active){
				//console.log("non active");
				switch(this.message.id){
					case 1:
					  this.stageIndex = (this.stageIndex + 1) % this.stageArray.length;
						let goal = this.stageMap.goal;
						this.setStage(goal.x, goal.y);
						break;
				}
			}
		}
	}
}

class stage{
	constructor(n, vol, interval, initial, enemyData, sizeParam){
		this.id = n;
		this.currentEnemyVolume = 0; // volとは限らないので
		this.maxEnemyVolume = vol;
		this.enemySetCounter = 0;
		this.enemySetInterval = interval;
		this.initialEnemyIdArray = initial; // 最初の時点で設置されている敵のid列（位置は改めて）
		this.enemyData = enemyData; // どんな敵をどのくらい出すか。その割合を示すもの。idとratioの辞書の配列。
		this.sizeParam = sizeParam;
		this.enemyBox = []; // 長さ100のidが書かれたデータ列
		this.empty = true;
		this.full = false;
		this.generateSign = false; // 敵を出すときtrueにする
	}
	reset(){
		this.currentEnemyVolume = 0;
		this.enemySetCounter = 0;
	}
	update(){
		if(this.full){ return; } // fullのときはupdateしない
		this.enemySetCounter++;
		if(this.enemySetCounter === this.enemySetInterval){
			this.generateSign = true;
			if(!this.full){ this.enemySetCounter = 0; } // fullの場合は敵が倒れたときにカウンター発動。
		}
	}
	enemyReset(){
		this.enemyBox = [];
		this.full = false;
		this.empty = true;
		this.generateSign = false;
		this.enemySetCounter = 0;
		this.currentEnemyVolume = 0;
	}
	createEnemyBox(){
		this.enemyReset();
		// ratioの数だけidを放り込んで長さ100の配列を作る。とりあえず0が100個並びますね。
		for(let i = 0; i < this.enemyData.length; i++){
		  let data = this.enemyData[i]; // ここlengthになってた。信じられない。
			let id = data.id;
			for(let k = 0; k < data.ratio; k++){
				this.enemyBox.push(id);
			}
		}
	}
  increaseEnemyVolume(){
		if(this.full){ return; }
		this.currentEnemyVolume++;
		this.empty = false;
		if(this.currentEnemyVolume === this.maxEnemyVolume){ this.full = true; }
	}
	decreaseEnemyVolume(){
		if(this.empty){ return; }
		this.currentEnemyVolume--;
		if(this.full){ this.enemySetCounter = 0; } // fullで1匹でも倒れたらカウンター発動
		this.full = false;
		if(this.currentEnemyVolume === 0){ this.empty = true; }
	}
	getNextEnemyId(){
		return random(this.enemyBox); // 次に出現する敵のidを取得する
	}
	signOff(){
		this.generateSign = false; // 敵の作成の成功、失敗に依らずフラグは消す。
	}
}

function getEnemy(id){
  switch(id){
		case 0:
		  return new wanderer(0.04, 255, 0, 0);
		case 1:
			return new wanderer(0.08, 0, 255, 0);
		case 2:
		  return new wanderer(0.12, 0, 0, 255);
	}
}

// 接触判定の為にも座標は必要かもね。

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

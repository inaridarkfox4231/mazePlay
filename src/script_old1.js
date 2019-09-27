// バグが起きる前の安全なコード
// isZero > 1を=== 2にしたせいでバグってしまったらしい。はぁ・・

let myMaze;
let myPlayer;
const dx = [1, 0, -1, 0];
const dy = [0, 1, 0, -1];

function setup(){
	createCanvas(640, 480);
	noStroke();
	myMaze = new maze(20, 15, 32);
	myMaze.createMaze(17, 12); // とりあえず(3, 3)を始点にしてみる。
	myPlayer = new player(17, 12, myMaze);
}

function draw(){
	background(220);
	myPlayer.update();
	myMaze.render();
	myPlayer.render();
}

class maze{
	constructor(w, h, grid){
		this.w = w;
		this.h = h;
		this.start = {x:0, y:0}; // 迷路を作るときの始点
		this.goal = {x:0, y:0};  // cellValueが最大となる点で、ゴールに設定する
		this.grid = grid
		this.board = getInitialMatrix(w, h, -1);
		this.cellValue = getInitialMatrix(w, h, -1);
		for(let x = 0; x < w; x++){ this.board[x][0] = 1; this.board[x][h - 1] = 1; }
		for(let y = 0; y < h; y++){ this.board[0][y] = 1; this.board[w - 1][y] = 1; }
	}
	createMaze(x, y){
		this.start = {x:x, y:y} // スタート地点に設定
		this.createPath(x, y, 0); // この時点では-1が残っている可能性がある
		// -1のマスをすべて取得する関数を作ろう。
		// よくわかんないけど横着したら失敗したのでこれで行きます（毎ターンrestを取得する方向で）。
		for(let i = 0; i < this.h * this.w; i++){
			let rest = this.getRestCells();
			if(rest.length === 0){ break; } // restをなくすのが目的。
		  // 詳細は下記
			let searched = false; // サーチしたかどうか。最後にここを見て、サーチできなかったなら全部1にして終了。
			for(let m = 0; m < rest.length; m++){
				let r = rest[m];
				if(this.check_2(r.x, r.y)){
					// vを2回設定してるの手間だな・・いいけど。よくないか。
					this.createPath(r.x, r.y, this.cellValue[r.x][r.y]);
					searched = true;
					break; // 1つでも切り崩せればbreakしちゃえ
				}
			}
			if(searched){ continue; } // 次のループへ
			rest.forEach((r) => {
				this.setFlag(r.x, r.y, 1);
				//this.board[r.x][r.y] = 1; // すべて1にして終了。
			})
			break;
		}
		let v = 0;
		for(let z = 0; z < this.w * this.h; z++){
			let new_v = this.cellValue[z % this.w][Math.floor(z / this.w)];
			if(v < new_v){ v = new_v; this.goal.x = z % this.w; this.goal.y = Math.floor(z / this.w); }
		}
		console.log("start:(" + this.start.x + ", " + this.start.y + ")");
		console.log("goal:(" + this.goal.x + ", " + this.goal.y + ")");
		console.log("mazeValue:" + this.cellValue[this.goal.x][this.goal.y]);
	}
	getRestCells(){
		// 残った未確定マスをすべて取得する
		let rest = [];
		for(let z = 0; z < this.w * this.h; z++){
			let x = z % this.w;
			let y = Math.floor(z / this.w);
			if(this.board[x][y] === -1){
				rest.push({x:x, y:y});
			}
		}
		return rest;
	}
	createPath(x, y, v){
		if(x === 0 || y === 0 || x === this.w - 1 || y === this.h - 1){ return; } // fool proof.
		let current;
		let stuck = [{x:x, y:y}];
		this.cellValue[x][y] = v; // 起点をvにする。最初の一手ではここを0にする。
		this.setFlag(x, y, 0);
		//this.board[x][y] = 0;
		for(let i = 0; i < this.w * this.h; i++){
			if(stuck.length === 0){ console.log("探索回数" + i + "回"); break; }
			current = stuck.pop(); // 先頭を出す
			this.charge(stuck, current);
		}
		// とりあえず、残ったマスは1にしてしまう。しなくていいや。また考える。
	}
	charge(array, current){
		let choices = [];
		for(let k = 0; k < 4; k++){
      let p = current.x + dx[k];
			let q = current.y + dy[k];
			// (p, q)の値が-1で、かつ上下左右のうち0確定がひとつだけの場合にtrueを返す。
			if(this.check_1(p, q)){
				choices.push({x:p, y:q});
			}
		}
		if(choices.length === 0){ return; } // 全方向確定済み
		// たとえば3つなら000から110まで7通りあるので、0～6の乱数を出して2で割って配列を作る。
		let seed = Math.floor(random((1 << choices.length) - 1));
		// 0のところを0にする感じ。
		for(let k = 0; k < choices.length; k++){
			let flag = seed % 2;
      this.board[choices[k].x][choices[k].y] = flag;
			if(flag === 0){
				this.calcCellValue(choices[k].x, choices[k].y); // CellValueを計算する。
				array.push(choices[k]);
			} // 0のものだけチャージする
			seed >>= 1;
		}
	}
	check_1(x, y){
		// そのマスが未確定で、かつ上下左右のうち0確定マスが高々1つしかないときにtrueを返す。
		// そうでなければfalseを返す。というか必然的にひとつは0確定なのでそこ以外ないってことね。
		// なお、0確定が2つ以上あるときは1確定にしてからfalseにしているので注意する。
		// んー、isZero > 1でいいみたいです。
		if(this.board[x][y] !== -1){ return false; }
		// 戻すか。
		let isZero = 0;
		for(let k = 0; k < 4; k++){
			if(this.board[x + dx[k]][y + dy[k]] === 0){ isZero++; }
		}
		if(isZero > 1){ // やっぱisZero > 1だけにする。
			this.setFlag(x, y, 1);
			//this.board[x][y] = 1;
			return false;
		}
		return true;
	}
	check_2(x, y){
		if(this.board[x][y] !== -1){ return false; } // 意思表示
		// (x, y)は未確定マスである。上下左右の1確定マスがあればそれを見る。なければfalseを返す。
		// 1確定マスがあるとして、その上下左右で0確定マスが丁度1つであればその時点で、
		// その0確定マスのvalue=:vを取得し、1確定マスを0に変更してvalueをv+1に設定、そして、
		// (x, y)を0確定にしてvalueをv+2にする。そのうえでtrueを返す。以上。
		// みつかったものについてそれを行いそのままreturn trueで離脱する。なければforループを終了しreturn false.
		for(let k = 0; k < 4; k++){
			let p1 = x + dx[k];
			let q1 = y + dy[k];
			if(this.board[p1][q1] !== 1){ continue; } // 1確定マスに用があるので
			let isZero = 0;
			let entrance = {a:0, b:0};
			for(let m = 0; m < 4; m++){
				let p2 = p1 + dx[m];
				let q2 = q1 + dy[m];
        if(p2 < 0 || p2 >= this.w || q2 < 0 || q2 >= this.h){ continue; } // はみ出す場合を忘れてた
				if(this.board[p2][q2] === 0){ isZero++; entrance.a = p2; entrance.b = q2; }
			}
			if(isZero !== 1){ continue; } // 0確定が丁度1つでなければ次のマスへ
			let v = this.cellValue[entrance.a][entrance.b];
			//this.board[p1][q1] = 0; // 1を0に変更
			this.setFlag(p1, q1, 0);
			this.cellValue[p1][q1] = v + 1; // valueをv+1に設定
			this.setFlag(x, y, 0);
			//this.board[x][y] = 0; // 該当マスを0で確定させる
			this.cellValue[x][y] = v + 2; // valueをv + 2に設定
			return true; // 離脱
		}
		return false;
	}
	setFlag(x, y, flag){
		this.board[x][y] = flag;
	}
	calcCellValue(x, y){
		// posのマスの上下左右のうち0のマスだけを見てvalueの最大値を取り+1したものを設定する。
		let v = -1;
		for(let k = 0; k < 4; k++){
			let p = x + dx[k];
			let q = y + dy[k];
			if(this.board[p][q] !== 0){ continue; }
			if(this.cellValue[p][q] > v){ v = this.cellValue[p][q]; }
		}
		this.cellValue[x][y] = v + 1; // だよね・・最大値+1をposに設定するならこうでしょ。
	}
	render(){
		let g = this.grid;
		for(let x = 0; x < this.w; x++){
			for(let y = 0; y < this.h; y++){
				let v = this.cellValue[x][y];
        if(this.board[x][y] === -1){ fill(200, 200, 255); }
				else if(this.board[x][y] === 1){ fill(0); }
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

class player{
	constructor(x, y, mapData){
		this.from = {x:x, y:y};
		this.to = {x:x, y:y};
		this.dir = 0;
		this.diff = 0;
		this.myMap = mapData;
		this.speed = 0.08;
	}
	update(){
		let keyId = this.getId();
		if(keyId < 0){ return; }
		//console.log(this.from);
		//console.log(this.to);
		//console.log(this.diff);
		if(this.diff === 0 && this.from.x === this.to.x && this.from.y === this.to.y){ this.setting(keyId); }
		// settingしてもtoが変わらない＝その方向には行けない（dirは変化している）
		if(this.from.x === this.to.x && this.from.y === this.to.y){ return; } // 行けない
		// diff補正パート
		if(keyId === this.dir){ this.diff += this.speed; }
		else if(keyId === (this.dir + 2) % 4){
			this.turn();
			this.diff += this.speed;
		}else{
			if(this.diff <= 0.25 && this.getFromAround(keyId) === 0){
				this.turn();
				this.diff += this.speed;
			}else if(this.diff >= 0.75 && this.getToAround(keyId) === 0){
				this.diff += this.speed;
			}else{ return; } // これ以外のケースでは滑りが発生しない
		}
		// diff修正パート
		if(this.diff < 1){ return; } // 1より小：何も起こらない
		this.diff = 0;
		this.dir = keyId;
		this.from = {x:this.to.x, y:this.to.y};
	}
	getFromAround(id){
		// fromの周囲を調べる
		return this.myMap.board[this.from.x + dx[id]][this.from.y + dy[id]];
	}
	getToAround(id){
		// toの周囲を調べる
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
		let flag = this.getFromAround(id);
		//console.log(flag);
		if(flag === 0){
			// キー入力方向に進める場合はそっちにtoを設定する
			this.to = {x:this.from.x + dx[id], y:this.from.y + dy[id]};
			this.dir = id;
		}
	}
	getId(){
		if(keyIsDown(RIGHT_ARROW)){ return 0; }
		if(keyIsDown(DOWN_ARROW)){ return 1; }
		if(keyIsDown(LEFT_ARROW)){ return 2; }
		if(keyIsDown(UP_ARROW)){ return 3; }
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

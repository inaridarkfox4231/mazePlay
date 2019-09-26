// バグが起きる前の安全なコード
// isZero > 1を=== 2にしたせいでバグってしまったらしい。はぁ・・

let myMaze;
const dx = [1, 0, -1, 0];
const dy = [0, 1, 0, -1];

function setup(){
	createCanvas(320, 480);
	noStroke();
	myMaze = new maze(16, 24, 20);
	myMaze.createMaze(14, 22); // とりあえず(3, 3)を始点にしてみる。
}

function draw(){
	background(220);
	myMaze.render();
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
		// 毎度毎度-1のマスをすべて取得するのはしんどいから
		// 最初に一回だけまとめて取得、あとは毎回確定マスを排除しよう。
		let rest = this.getRestCells();
		if(rest.length === 0){ return; } // restが空ならやることはない
		for(let i = 0; i < 5; i++){
			if(rest.length === 0){ break; } // 周回でrestが空になればそこでおわり
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
			// 該当マスが1つでもあった場合は確定マスが増えるので、そこをrestからすべて排除する。
			if(searched){
				for(let m = 0; m < rest; m++){
					if(this.board[rest[m].x][rest[m].y] !== -1){
						rest.splice(m, 1);
					}
				}
				continue;
			}
			// 該当マスがなかった場合はrestのマスをすべて1確定にして終了
			rest.forEach((r) => {
				this.board[r.x][r.y] = 1;
			})
			break;
		}
		let v = 0;
		for(let z = 0; z < this.w * this.h; z++){
			let new_v = this.cellValue[z % this.w][Math.floor(z / this.w)];
			if(v < new_v){ v = new_v; this.goal.x = z % this.w; this.goal.y = Math.floor(z / this.w); }
		}
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
		this.board[x][y] = 0;
		for(let i = 0; i < 220; i++){
			if(stuck.length === 0){ break; }
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
				this.calcCellValue(choices[k]); // CellValueを計算する。
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
		if(isZero > 1){ // isZero > 1じゃないとだめみたいですね・・ごめん。
			this.board[x][y] = 1;
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
			this.board[p1][q1] = 0; // 1を0に変更
			this.cellValue[p1][q1] = v + 1; // valueをv+1に設定
			this.board[x][y] = 0; // 該当マスを0で確定させる
			this.cellValue[x][y] = v + 2; // valueをv + 2に設定
			return true; // 離脱
		}
		return false;
	}
	calcCellValue(pos){
		// posのマスの上下左右のうち0のマスだけを見てvalueの最大値を取り+1したものを設定する。
		let v = -1;
		for(let k = 0; k < 4; k++){
			let p = pos.x + dx[k];
			let q = pos.y + dy[k];
			if(this.board[p][q] !== 0){ continue; }
			if(this.cellValue[p][q] > v){ v = this.cellValue[p][q]; }
		}
		this.cellValue[pos.x][pos.y] = v + 1; // だよね・・最大値+1をposに設定するならこうでしょ。
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

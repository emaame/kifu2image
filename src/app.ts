

import * as Goita from "./goita_kifu";

//import styles from './scss/style.scss';

let komaTypes = [0,1,2];
let komaNames = [0,1,2,3,4,5,6,7,8,9];
type imageList = {[key: number]: HTMLImageElement};

const PLACE     = 30;
const HIGHLIGHT = 31;

var images : imageList = {};

var loadedCount = 0;
var assetsCount = 0;
var imageReady = false;
function image_onloaded(e:Event) {
    loadedCount++;
    imageReady = (loadedCount >= assetsCount);
}

for(let t of komaTypes) {
    for(let n of komaNames) {
        let img = new Image();
        img.src = require(`./img/${t}${n}.png`); assetsCount++;
        img.onload = image_onloaded;
        images[t*10 + n] = img;
    }
}

{ // hide temp vars
    let placeImg = new Image();
    placeImg.src = require("./img/place.png"); assetsCount++;
    placeImg.onload = image_onloaded;
    images[PLACE] = placeImg;
    

    let highlightImg = new Image();
    highlightImg.src = require("./img/highlight.png"); assetsCount++;
    highlightImg.onload = image_onloaded;
    images[HIGHLIGHT] = highlightImg;

}

{   // wait to images loaded
    var count = 0;
    while(!imageReady && count < 500) {
        setTimeout(100);
        count++;
    }
}



class KifuViewer {
    roundIndex: number;
    stepIndex: number;
    openHand: boolean;
    kifu: Goita.Kifu;

    render(state: Goita.State) {
        // 描画のパラメータ
        let kw = 40, kh = 47;
        
        let m1 = kw/4, m2 = kw/2, m3 = kw/4;
        let pad = 3;

        let w = m1 + kh + m2 + kh*2 + m2 + kw * 4 + m2 + kh*2 + m2 + kh + m1;
        let h = w;
        
        let bw = kh*2 + m2 + kw*4 + m2 + kh*2 + m2/2*2;
        let bh = bw;
		let bx = m1 + kh + m2/2;
		let by = m1 + kh + m2/2;

        let cx = w/2.0, cy = h/2.0;
        //
        //      .     .     .     .
        // kh  / ¥   / ¥   / ¥   / ¥ 
        //    |___| |___| |___| |___|
        // --------
        // m2       -- here is play_y
        // --------
        //      .     .     .     .
        // kh  / ¥   / ¥   / ¥   / ¥ 
        //    |___| |___| |___| |___|
        // --------
        // m2
        // --------
        //      .
        // kh  / ¥   -- here is hand_y 
        //    |___|
        //----------
        // m1
        //------------------------
        let hand_x = cx, hand_y = h - m1 - kh/2.0;
        let play_x = cx, play_y = h - m1 - kh - m2 - kh - m2/2.0;
        let sw = 140, sh = 60;
        let sx = cx-sw/2.0, sy = cy-sh/2.0;
        
        var can = <HTMLCanvasElement>document.getElementById("canvas");
        var ctx : CanvasRenderingContext2D = can.getContext("2d")!;

        //clear
        ctx.clearRect(0, 0, w, h);

        // draw board
        ctx.fillStyle = '#cccc99';
        ctx.fillRect(bx, by, bw, bh);

        // draw score board
        ctx.fillStyle = '#6699cc';
        ctx.fillRect(sx, sy, sw, sh);
        for(let i of [0,1]) {
            ctx.fillStyle = '#000000';
            ctx.font = "14px 'ＭＳ Ｐゴシック'";
            let x = sx + 10;
            let y = sy + 24 + 25*i;
            ctx.fillText(`Player ${i+1}&${i+3}: ${state.scores[i]}`, x, y);
        }
        // draw players
        state.players.forEach( (player, playerIndex) => {
            ctx.save();

            // rotate to personal board
            ctx.translate(cx,cy);
            ctx.rotate(-2.0*Math.PI*playerIndex/4.0); // counter-clock-wise from bottom
            ctx.translate(-cx,-cy);

            // draw hands
            for(var i=0; i<8; ++i) {
                // 0 1 2 3 |here is (hx,hy)| 4 5 6 7
                let x = hand_x+(i-4)*(kw+pad) - m3/2;
                let y = hand_y-(kh+pad)/2.0;
                let koma = player.hand.get(i);
                var dir  : Goita.KomaDirection = Goita.KomaDirection.Back;
                var name : Goita.KomaName      = Goita.KomaName.Blank;
                if (playerIndex==0 || this.openHand) {
                    dir  = Goita.KomaDirection.Fore;
                    name = koma.name;
                }
                var n = PLACE;
                if (koma.dir != Goita.KomaDirection.Other) {
                    n = dir * 10 + name;
                }
                ctx.drawImage(images[n], x, y);
            }

            // draw plays
            for(var i=0; i<8; ++i) {
                // 0 2                  4 8
                //    |here is (px,py)|
                // 1 3                  5 7
                let x = play_x + Math.floor(i/2)*(kw+pad) - 2*(kw+pad);
                let y = play_y + (i%2-1)*(kh+pad);
                let koma = player.play.get(i);
                var dir  : Goita.KomaDirection = koma.dir;
                var name : Goita.KomaName      = koma.name;
                if (koma.dir == Goita.KomaDirection.Back) {
                    if ((playerIndex==0 || this.openHand)) {
                        name = koma.name;
                    } else {
                        name = Goita.KomaName.Blank;
                    }
                }
                var n = PLACE;
                if (koma.dir != Goita.KomaDirection.Other) {
                    n = dir * 10 + name;
                }
                ctx.drawImage(images[n], x, y);
            }
            // highlight
            if (playerIndex == state.uchidashi) {
                let step = (player.play.count <= 0) ? 0 : player.play.count - 1;
                let x = play_x + Math.floor(step/2)*(kw+pad) - 2*(kw+pad)
                let y = play_y + (step%2-1)*(kh+pad);
                ctx.drawImage(images[HIGHLIGHT], x, y);
            }
            
            //player name
            {
                ctx.fillStyle = '#000000';
                ctx.font = "14px 'ＭＳ Ｐゴシック'";
                let x = play_x - kw*2;
                let y = play_y + kh + pad + 10 + pad;

                ctx.fillText(player.name, x, y);
            }
            ctx.restore();
        });
    }

    draw() {
        this.render( this.kifu.rounds[this.roundIndex].states[this.stepIndex] );
    }

    reset(kifu : Goita.Kifu) {
        this.kifu = kifu;
        this.resetNav(kifu);
        this.draw();
    }

    private createButton(text:string) {
        let button = <HTMLButtonElement>document.createElement("button");
        button.textContent = text;
        return button;
    }

    setOpenHand(openHand: boolean) {
        this.openHand = openHand;
        this.draw();
    }

    roundButtons: Array<HTMLButtonElement> = [];
    stepButtons: Array<HTMLButtonElement> = [];

    setRoundIndex(roundIndex: number) {
        // update view state
        if (this.roundButtons[this.roundIndex]) {
            this.roundButtons[this.roundIndex].classList.remove("pressed");
        }
        this.roundIndex = roundIndex;
        this.roundButtons[this.roundIndex].classList.add("pressed");

        //clear
        let stepButtonParent = <HTMLElement>document.getElementById( "step-buttons");
        stepButtonParent.innerHTML = "";
        this.stepButtons = this.kifu.rounds[this.roundIndex].states.map( (state:Goita.State, stepIndex:number) => {
            let button = this.createButton(`${stepIndex}`);
            button.onclick = (e) => {
                this.setStepIndex(stepIndex);
            };
            stepButtonParent.appendChild(button);

            return button;
        } );
        
        this.setStepIndex(0);
    }
    setStepIndex(stepIndex: number) {
        // update view state
        if (this.stepButtons[this.stepIndex]) {
            this.stepButtons[this.stepIndex].classList.remove("pressed");
        }
        this.stepIndex = stepIndex;
        this.stepButtons[this.stepIndex].classList.add("pressed");
        this.draw();
    }

    resetNav(kifu : Goita.Kifu) {
        let openHandElement = <HTMLInputElement>document.getElementById("open-hand");
        openHandElement.onchange = (e) => {
            this.setOpenHand( openHandElement.checked );
        };
        this.openHand = openHandElement.checked;

        let roundButtonParent = <HTMLElement>document.getElementById("round-buttons");
        //clear
        roundButtonParent.innerHTML = "";
        this.roundButtons = kifu.rounds.map( (round:Goita.Round, roundIndex:number) => {
            let button = this.createButton(`${roundIndex}`);
            button.onclick = (e) => { this.setRoundIndex(roundIndex); };
            roundButtonParent.appendChild(button);
            return button;
        } );

        this.setRoundIndex(0);
    }
}
/*
let textarea = <HTMLTextAreaElement>document.getElementById("kifuText");
kifu.load( textarea.textContent! );
*/

let kifuUpload = <HTMLInputElement>document.getElementById("kifuFile");
kifuUpload.onchange = (e:Event) => {
    let file = kifuUpload.files![0];
    if (!file.name.match(/.yaml$/)) {
        alert("棋譜ファイルは YAML 形式です");
        return;
    }

    var reader = new FileReader();
    reader.onload = () => {
        let kifu = new Goita.Kifu;
        kifu.load( reader.result );

        let viewer = new KifuViewer();
        viewer.reset(kifu);
    }
    reader.readAsText(file);
}
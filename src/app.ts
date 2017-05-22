import * as Goita from "./goita_kifu";
import * as JSZip from "jszip";
import * as Hammer from "hammerjs";
import * as download from 'downloadjs';
import { Settings, SettingsDefinition } from './settings';

let ua = navigator.userAgent;
let isChromeIOS = ua.match(/crios/i);
var isIOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);


type imageList = {[key: number]: HTMLImageElement};

const PLACE     = 30;
const HIGHLIGHT = 31;

/* load images */
var images : imageList = {};
for(let t of [0,1,2]) {
    for(let n of [0,1,2,3,4,5,6,7,8,9]) {
        let d = t*10 + n;
        images[d] = <HTMLImageElement>document.getElementById(`img${d}`);
    }
}
images[PLACE] = <HTMLImageElement>document.getElementById(`img${PLACE}`);
images[HIGHLIGHT] = <HTMLImageElement>document.getElementById(`img${HIGHLIGHT}`);

class KifuViewer {
    playerIndex: number;
    roundIndex: number;
    stepIndex: number;
    
    openHand: boolean;
    reverse: boolean;

    basename: string;
    kifuText: string;

    kifu: Goita.Kifu;
    canvas: HTMLCanvasElement;
    kw: number;
    kh: number;

    constructor() {
        this.canvas = <HTMLCanvasElement>document.getElementById("canvas");
        this.makePlayerButtons(["P1","P2","P3","P4"]);
    }

    pageDirection() {
        return this.reverse ? -1 : 1;
    }

    render(state: Goita.State) {
        if (!state) {return; }
        // 描画のパラメータ
        let kw = this.kw, kh = this.kh;
        
        let m1 = kw/4, m2 = kw/2, m3 = kw/8;
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
        // m2       -- play_y
        // --------
        //      .     .     .     .
        // kh  / ¥   / ¥   / ¥   / ¥ 
        //    |___| |___| |___| |___|
        // --------
        // m2
        // --------
        //      .
        // kh  / ¥   -- hand_y 
        //    |___|
        //----------
        // m1
        //------------------------
        let hand_x = cx, hand_y = h - m1 - kh/2.0;
        let play_x = cx, play_y = h - m1 - kh - m2 - kh - m2/2.0;
        let sw = kw*3.5, sh = 50;
        let sx = cx-sw/2.0, sy = cy-sh/2.0;
        
        let ctx : CanvasRenderingContext2D = this.canvas.getContext("2d")!;

        // for Retina
        if (window.devicePixelRatio == 2) {
            this.canvas.width  = w;
            this.canvas.height = h;
            this.canvas.style.width  = `${w/2.0}px`;
            this.canvas.style.height = `${h/2.0}px`;
        } else {
            this.canvas.width  = w;
            this.canvas.height = h;
        }

        //clear
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

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
            let y = sy + 18 + 22*i;
            ctx.fillText(`Player ${i+1}&${i+3}: ${state.scores[i]}`, x, y);
        }
        // draw players
        state.players.forEach( (player, playerIndex) => {
            ctx.save();

            // rotate to personal board
            ctx.translate(cx,cy);
            ctx.rotate(-2.0*Math.PI*(playerIndex - this.playerIndex)/4.0); // counter-clock-wise from bottom
            ctx.translate(-cx,-cy);

            // draw hands
            for(var i=0; i<8; ++i) {
                // 0 1 2 3 |here is (hx,hy)| 4 5 6 7
                let x = hand_x+(i-4)*(kw+pad) - m3/2;
                let y = hand_y-(kh+pad)/2.0;
                let koma = player.hand.get(i);
                var dir  : Goita.KomaDirection = Goita.KomaDirection.Back;
                var name : Goita.KomaName      = Goita.KomaName.Blank;
                if (playerIndex==this.playerIndex || this.openHand) {
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
                // 0 2         4 8
                //    |(px,py)|
                // 1 3         5 7
                let x = play_x + Math.floor(i/2)*(kw+pad) - 2*(kw+pad);
                let y = play_y + (i%2-1)*(kh+pad);
                let koma = player.play.get(i);
                var dir  : Goita.KomaDirection = koma.dir;
                var name : Goita.KomaName      = koma.name;
                if (koma.dir == Goita.KomaDirection.Back) {
                    if (playerIndex==this.playerIndex || this.openHand || state.ended) {
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
            
            // player name
            {
                ctx.fillStyle = '#000000';
                ctx.font = "14px 'Alial'";
                let x = play_x - kw*2;
                let y = play_y + kh + pad + 9 + pad;

                ctx.fillText(player.name, x, y);
            }
            ctx.restore();
        });
    }

    draw() {
        if (!this.kifu) {return; }

        this.kw = images[0].width;
        this.kh = images[0].height;
        this.render( this.kifu.rounds[this.roundIndex].states[this.stepIndex] );
    }

    setKifuText(kifuText:string) {
        this.kifuText = kifuText;
        this.kifu = new Goita.Kifu();
        this.kifu.load(kifuText);
        this.resetNav(this.kifu);
        this.draw();
    }

    statusText() {
        return `${this.basename}_round${viewer.roundIndex}_step${viewer.stepIndex}_player${viewer.playerIndex+1}`
    }

    setFilename(filename:string) {
        this.basename = filename.replace(/.yaml$/, '');
    }


    setOpenHand(openHand: boolean) {
        this.openHand = openHand;
        this.draw();
    }
    setReverse(reverse: boolean) {
        this.reverse = reverse;
        this.draw();
    }

    private createButton(text:string) {
        let button = <HTMLButtonElement>document.createElement("button");
        button.textContent = text;
        return button;
    }

    roundButtons: Array<HTMLButtonElement> = [];
    stepButtons: Array<HTMLButtonElement> = [];
    playerButtons: Array<HTMLButtonElement> = [];

    makePlayerButtons(names:Array<string>) {
        // player buttons
        let playerButtonParent = <HTMLElement>document.getElementById("player-buttons");
        //clear
        playerButtonParent.innerHTML = "";
        this.playerButtons = names.map( (name:string, playerIndex:number) => {
            let button = this.createButton(name);
            button.onclick = (e) => { this.setPlayerIndex(playerIndex); };
            playerButtonParent.appendChild(button);
            return button;
        } );
    }

    makeRoundButtons() {
        let roundButtonParent = <HTMLElement>document.getElementById("round-buttons");
        //clear
        roundButtonParent.innerHTML = "";
        this.roundButtons = this.kifu.rounds.map( (round:Goita.Round, roundIndex:number) => {
            let button = this.createButton(`${roundIndex+1}`);
            button.onclick = (e) => { this.setRoundIndex(roundIndex); };
            roundButtonParent.appendChild(button);
            return button;
        } );
    }
    makeStepButtons() {
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
    }

    setRoundIndex(roundIndex: number) {
        // update view state
        if (this.roundButtons[this.roundIndex]) {
            this.roundButtons[this.roundIndex].classList.remove("pressed");
        }
        // check range
        if (roundIndex < 0) { roundIndex = 0; }
        if (roundIndex >= this.roundButtons.length) { roundIndex = this.roundButtons.length-1; }

        this.roundIndex = roundIndex;
        this.roundButtons[this.roundIndex].classList.add("pressed");

        this.makeStepButtons();
        
        this.setStepIndex(0);
    }
    setStepIndex(stepIndex: number) {
        // update view state
        if (this.stepButtons[this.stepIndex]) {
            this.stepButtons[this.stepIndex].classList.remove("pressed");
        }
        // check range
        if (stepIndex < 0) { stepIndex = 0; }
        if (stepIndex >= this.stepButtons.length) { stepIndex = this.stepButtons.length-1; }

        this.stepIndex = stepIndex;
        this.stepButtons[this.stepIndex].classList.add("pressed");
        this.draw();
    }
    setPlayerIndex(playerIndex: number) {
        // update view state
        if (this.playerButtons[this.playerIndex]) {
            this.playerButtons[this.playerIndex].classList.remove("pressed");
        }
        // check range
        if (playerIndex < 0) { playerIndex = 0; }
        if (playerIndex >= this.playerButtons.length) { playerIndex = this.playerButtons.length-1; }

        this.playerIndex = playerIndex;
        this.playerButtons[this.playerIndex].classList.add("pressed");
        this.draw();
    }

    resetNav(kifu : Goita.Kifu) {
        this.makeRoundButtons();

        this.setRoundIndex(0);
        this.setPlayerIndex(0);
    }
}


let viewer = new KifuViewer();

function time2str() {
    let date = new Date();
    return `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
}

let saveSingle = <HTMLInputElement>document.getElementById("save-single");
let saveZip = <HTMLInputElement>document.getElementById("save-zip");

if (isChromeIOS) {
    saveSingle.style.display = 'none';
    saveZip.style.display = 'none';
    document.getElementById("download-label")!.innerHTML += "Safari を使ってください";
}

saveSingle.onclick = (e) => {
    let filename = `${viewer.basename}_${viewer.statusText()}_${time2str()}.png`

    if (isIOS) {
        let image = new Image();
        image.src = viewer.canvas.toDataURL("image/png");
        let anchor = <HTMLAnchorElement>document.createElement('a');
        anchor.setAttribute('href', image.src);
        anchor.setAttribute('target', '_blank');
        anchor.setAttribute('download', filename);
        anchor.click();
    } else {
        let blob = viewer.canvas.toBlob( (blob) => {
            download(blob!, filename, "image/png");
        } );
    }
}
saveZip.onclick = (e) => {
    let zip = new JSZip();
    let savable = new Image();

    saveZip.disabled = true;
    viewer.canvas.style.display = 'none';

    viewer.kifu.rounds.forEach((round, roundIndex) => {
        viewer.setRoundIndex(roundIndex);
        round.states.forEach((state, stepIndex) => {
            viewer.setStepIndex(stepIndex);
            let path = viewer.statusText() + ".png";
            savable.src = viewer.canvas.toDataURL();
            let blob = savable.src.substr(savable.src.indexOf(',')+1);
            zip.file(path, blob, {base64:true});
        });
    });

    zip.file(`${viewer.basename}_${time2str()}.yaml`, viewer.kifuText);

    saveZip.disabled = false;
    viewer.canvas.style.display = 'block';

    zip.generateAsync({"type":"blob"})
    .then( (blob) => {
        download(blob, `${viewer.basename}_${time2str()}.zip`, "application/zip");}
    );
};


/* ページ移動操作 */
let funcL = ()=>{ viewer.setStepIndex( viewer.stepIndex + (-1)*viewer.pageDirection() ); }
let funcR = ()=>{ viewer.setStepIndex( viewer.stepIndex + ( 1)*viewer.pageDirection() ); }

// for swipe
let hammer = new Hammer(viewer.canvas);
hammer.on("swipeleft" , funcL);
hammer.on("swiperight", funcR);

// for keyboard
document.onkeypress = (e:KeyboardEvent) => {
    switch(e.key) {
        case "ArrowLeft" : return funcL();
        case "ArrowRight": return funcR();
    }
    // keyCode is deprecated
    switch(e.keyCode) {
        case 37: return funcL();
        case 39: return funcR();
    }
};

/* 設定の読み込みと反映 */
let SettingList : SettingsDefinition = {
    openHand: [true , viewer.setOpenHand.bind(viewer)],
    reverse:  [false, viewer.setReverse .bind(viewer)],
    filename: ["goita.yaml", viewer.setFilename.bind(viewer)],
    kifuText: [document.getElementById('kifuText')!.textContent!,viewer.setKifuText.bind(viewer)]
};
const settings = new Settings(SettingList);


let kifuUpload = <HTMLInputElement>document.getElementById("kifuFile");
kifuUpload.onchange = (e:Event) => {
    let file = kifuUpload.files![0];
    if (!file.name.match(/.yaml$/)) {
        alert("棋譜ファイルは YAML 形式です");
        return;
    }
    settings.set('filename', file.name);

    var reader = new FileReader();
    reader.onload = () => { settings.set('kifuText', reader.result); }
    reader.readAsText(file);
}

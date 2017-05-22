import * as jsyaml from "js-yaml";

export enum KomaName {
    Shi = 0, Gon = 1, Uma = 2, Gin = 3, Kin = 4, Hi = 5, Kaku = 6, Ou = 7, Dama = 8, Blank = 9
}
export enum KomaDirection {
    Back = 0, Fore = 1, Rest = 2, Other = 3
}
export const stringToKomaName : {[key:string]:KomaName} = {"_":KomaName.Blank,
    "し":KomaName.Shi, "香":KomaName.Gon, "馬":KomaName.Uma, "銀":KomaName.Gin, "金":KomaName.Kin,
    "飛":KomaName.Hi, "角":KomaName.Kaku, "王":KomaName.Ou, "玉":KomaName.Ou
};

export const komaNameToString : {[key:number]:string} = {[KomaName.Blank]:"＿",
    [KomaName.Shi]: "し", [KomaName.Gon]:"香", [KomaName.Uma]:"馬", [KomaName.Gin]:"銀", [KomaName.Kin]:"金",
    [KomaName.Hi]: "飛", [KomaName.Kaku]:"角", [KomaName.Ou]:"王", [KomaName.Dama]:"王"
};

export const komaNameToScore : {[key:number]:number} = {[KomaName.Blank]:0,
    [KomaName.Shi]: 10, [KomaName.Gon]:20, [KomaName.Uma]:20, [KomaName.Gin]:30, [KomaName.Kin]:30,
    [KomaName.Hi]: 40, [KomaName.Kaku]:40, [KomaName.Ou]:50, [KomaName.Ou]:50
};


export class Koma {
    name: KomaName;
    dir: KomaDirection;
    constructor(name:KomaName, dir:KomaDirection) {
        this.name = name;
        this.dir  = dir;
    }
    clone() {
        return new Koma(this.name, this.dir);
    }
    to_s() {
        return komaNameToString[this.name];
    }
    static Blank = new Koma(KomaName.Blank, KomaDirection.Other);
}
export class KomaCollection {
    list: Array<Koma>;
    count: number; // koma count exclude Blank
    constructor() {
        this.count = 0;
        this.list = [
            Koma.Blank, Koma.Blank, Koma.Blank, Koma.Blank,
            Koma.Blank, Koma.Blank, Koma.Blank, Koma.Blank
        ];
    }
    get(index:number) {
        return this.list[index];
    }
    put(name:KomaName, dir:KomaDirection) {
        this.list[this.count] = new Koma(name, dir);
        this.count++;
    }
    // 頭からn駒取り出す
    take(n:number) {
        let taken = this.list.splice(0, n);
        this.count -= n;
        for(var i=this.count; i<8; ++i) {
            this.list[i] = Koma.Blank;
        }
        return taken;
    }
    // nameと一致する駒を一つ取り除く
    remove(name:KomaName) {
        for(var i=0; i<this.list.length; ++i) {
            if (this.list[i].name != name) continue;
            this.list[i] = Koma.Blank;
            this.count--;
            break;
        }
    }
    sortSelf() {
        this.list = this.list.sort((lhs:Koma, rhs:Koma) => {
            if (lhs.name < rhs.name) { return -1; }
            if (lhs.name > rhs.name) { return 1; }
            return 0;
        });
    }
    clone() {
        let newList = new KomaCollection;
        newList.list = this.list.map((k:Koma)=>{return k.clone()});
        newList.count = this.count;
        return newList;
    }
    to_s() {
        return this.list.map((k:Koma) => k!.to_s()).join("");
    }
    static buildFromHandString = (handString:string) => {
        if (handString.length > 8) {
            throw new RangeError();
        }
        
        let newList = new KomaCollection;
        var count = 0;
        newList.list = handString.split('').map((t:string) => {
            let name = stringToKomaName[t];
            if (name != KomaName.Blank) { count++; }
            return new Koma(name, KomaDirection.Fore);
        });
        newList.count = count;
        return newList;
    }
}

export class Player {
    hand: KomaCollection;
    play: KomaCollection;
    name: string;

    constructor(name:string, hand:string="") {
        if (hand == "") {
            this.hand = new KomaCollection;
        } else {
            this.hand = KomaCollection.buildFromHandString(hand);
        }
        this.play = new KomaCollection;
        this.name = name;
    }
    clone() {
        let newPlayer = new Player(this.name);
        newPlayer.hand = this.hand.clone();
        newPlayer.play = this.play.clone();
        return newPlayer;
    }
    put(defence:KomaName, attack:KomaName, fuse:boolean) {
        this.hand.remove(defence);
        this.hand.remove(attack);
        this.hand.sortSelf();
        this.play.put(defence, fuse ? KomaDirection.Back : KomaDirection.Fore);
        this.play.put(attack, KomaDirection.Fore);

    }
    to_s() {
        return `name: ${this.name}, hand: ${this.hand.to_s()}, play: ${this.play.to_s()}`;
    }
}
export class State {
    players: Array<Player> = [];
    scores: Array<number> = [0,0];
    uchidashi: number;

    clone() {
        let newState = new State;
        newState.players[0] = this.players[0].clone();
        newState.players[1] = this.players[1].clone();
        newState.players[2] = this.players[2].clone();
        newState.players[3] = this.players[3].clone();
        newState.scores = this.scores.slice();
        newState.uchidashi = this.uchidashi;
        newState.ended = this.ended;
        return newState;
    }
    to_s() {
        return `Score: ${this.scores}¥nuchidashi:${this.uchidashi}¥n` +
        `${this.players[0].to_s()}¥n` + 
        `${this.players[1].to_s()}¥n` + 
        `${this.players[2].to_s()}¥n` + 
        `${this.players[3].to_s()}¥n`;
    }

    ended: boolean;

    put(who:number, defence:KomaName, attack:KomaName) {
        let fuse = (this.uchidashi == who);
        let p = this.players[who];
        p.put(defence, attack, fuse);
        this.ended = (p.hand.count == 0);
        if (this.ended) {
            var score = komaNameToScore[attack];
            if (fuse && defence==attack) {
                score = score * 2;
            }
            let side = who % 2;
            this.scores[side] += score;
        }
        this.uchidashi = who;
    }
}
export class Round {
    states: Array<State> = [];
}
export class Kifu {
    version: string;
    rounds: Array<Round> = [];

    load(yamlText:string) {
        this.rounds = [];
        var kifuData = jsyaml.safeLoad(yamlText);
        
        this.version = kifuData.version;
        for(let log of kifuData.log) {
            var round = new Round;
            var state = new State;
            state.players[0] = new Player( kifuData.p0, log.hand.p0 );
            state.players[1] = new Player( kifuData.p1, log.hand.p1 );
            state.players[2] = new Player( kifuData.p2, log.hand.p2 );
            state.players[3] = new Player( kifuData.p3, log.hand.p3 );
            state.scores[0] = log.score[0];
            state.scores[1] = log.score[1];
            state.uchidashi = log.uchidashi;
            round.states.push(state.clone());
            for(let step of log.game) {
                let who     = parseInt(step[0]); // toInt
                let defence = stringToKomaName[step[1]];
                let attack  = stringToKomaName[step[2]];
                state.put(who, defence, attack);
                // 終了時には全員の手を開く
                if (state.ended) {
                    // 余った手駒を場に並べる
                    for(let player of state.players) {
                        let rest = player.hand.take(player.hand.count);
                        for(let koma of rest) {
                            player.play.put( koma.name, KomaDirection.Rest );
                        }
                    }
                }
                round.states.push(state.clone());

            }
            this.rounds.push(round);
        }
        return this;
    }
}
import * as assert from "power-assert";
import * as mocha from "mocha";
import * as Goita from '../src/goita_kifu';


describe("Koma", ()=>{
    context("clone()", ()=>{
        let koma = new Goita.Koma(Goita.KomaName.Shi, Goita.KomaDirection.Back);
        let clone = koma.clone();
        it("should be same koma and clone", ()=>{
            assert.deepEqual(koma, clone);
        });
        let mod = clone.clone();
        mod.name = Goita.KomaName.Ou;
        it("clone is written, so they are difference", ()=>{
            assert.notDeepEqual(koma, mod);
        });
    });
    context("to_s()", ()=>{
        it("should be matched (koma name)", ()=>{
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Shi  , Goita.KomaDirection.Back).to_s(), "し");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Gon  , Goita.KomaDirection.Back).to_s(), "香");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Uma  , Goita.KomaDirection.Back).to_s(), "馬");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Kin  , Goita.KomaDirection.Back).to_s(), "金");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Gin  , Goita.KomaDirection.Back).to_s(), "銀");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Kaku , Goita.KomaDirection.Back).to_s(), "角");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Hi   , Goita.KomaDirection.Back).to_s(), "飛");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Ou   , Goita.KomaDirection.Back).to_s(), "王");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Dama , Goita.KomaDirection.Back).to_s(), "王");
            assert.deepEqual(new Goita.Koma(Goita.KomaName.Blank, Goita.KomaDirection.Back).to_s(), "＿");
        });
    });
});

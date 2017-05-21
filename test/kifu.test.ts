import * as assert from "power-assert";
import * as mocha from "mocha";
import * as Goita from '../src/goita_kifu';
import * as fs from 'fs'

describe("Kifu", ()=>{
    context("load()", ()=>{
        let kifu = new Goita.Kifu();
        for(var i=0; i<123; ++i) {
            let filename = `test/kifu/${ ('00'+i).slice(-3) }.yaml`;

            fs.readFile(filename, 'utf8', (err, text) => {
                it("should be loadable", ()=>{
                    kifu.load(text);
                    assert.notEqual(kifu.rounds.length, 0)
                });
            });
        }
    });
});

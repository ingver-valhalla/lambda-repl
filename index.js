import { tokenize, parse } from './lib/parser';
import { evalAst } from './lib/eval';
import readline from 'readline';
import { print } from './lib/utils'
import { SyntaxError, RuntimeError } from './lib/errors';
import Env from './lib/env'


const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
    prompt: ' λ > '
} );

let globalEnv = new Env();

rl.on('line', (input) => {
    if (input !== '') {
        try {
            const result = evalAst(parse(tokenize(input)), globalEnv);
            if (result instanceof SyntaxError) {
                console.log('SyntaxError:', result.msg);
            }
            else if (result instanceof RuntimeError) {
                console.log('RuntimeError:', result.msg);
            }
            else {
                console.log('=>', print(result));
            }
            //console.log('=> globalEnv', print(globalEnv));
        }
        catch (e) {
            console.log(e.name + ":" + e.msg);
            console.log(e.stack);
        }
    }
    console.log();
    rl.prompt();
});

rl.on('close', () => {
    console.log("\n\nSee you soon!");
});

rl.prompt();

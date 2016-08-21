import { tokenize, parse } from './lib/parser';
import { evalAst } from './lib/eval';
import readline from 'readline';
import { print } from './lib/utils'


const rl = readline.createInterface( {
    input: process.stdin,
    output: process.stdout,
    prompt: ' λ > '
} );

let globalEnv = {};

rl.on('line', (input) => {
    if (input !== '') {
        const result = evalAst(parse(tokenize(input)), globalEnv);
        console.log('=>', print(result));
        console.log('=> globalEnv', print(globalEnv));
    }
    console.log();
    rl.prompt();
});

rl.on('close', () => {
    console.log("\n\nSee you soon!");
});

rl.prompt();

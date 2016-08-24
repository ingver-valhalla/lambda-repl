# Lambda REPL

REPL for playing with [λ-calculus](https://en.wikipedia.org/wiki/Lambda_calculus)

## Installation
You must have [node.js](https://nodejs.org) with [npm](https://www.npmjs.com/) installed in your system.

Clone this repository:
```
git clone https://github.com/ingver/lambda-repl
cd lambda-repl
```

Install depencencies via:
```
npm install
```

Launch the REPL:
```
npm start
```

You should see a prompt:
```
λ > 
```

To exit from REPL press `Ctrl-C`.

Run tests with:
```
npm test
```

---
## Syntax
The syntax is very similar to classic notation in λ-calculus.

### λ-abstraction
```haskell
λ > \x.x
=> λx.x
```
λ symbol can be entered like `\` (backslash) or directly `λ` (U+03BB in Unicode).

For naming variables you can use any count of any characters except specials: `λ`, `.`, `=`, `(` and `)`.

### Application
```haskell
 λ > (\x.\y.x y) (\x.x) (\y.y) 
=> λy'.y'
```
REPL will rename variables to avoid accidental capturing (by adding `'`'s).

Lambda being applied must be parenthesized, otherwise it captures everything it can reach:
```haskell
 λ > \x.\y.x y (\x.x) (\y.y)
=> λx.λy.x y (λx'.x') (λy'.y')
```

### Associativity

Application is left-associative, so
```haskell
 λ > (\x.\y.x y) (\x.x) (\y.y)
=> λy'.y'
```
is equivalent to
```haskell
 λ > ((\x.\y.x y) (\x.x)) (\y.y)
=> λy'.y'
```

### Defining globals
You can define a global variable and assign result of expression to it:
```haskell
 λ > let id = \x.x
=> λx.x

 λ > id
=> λx.x

 λ > let id2 = id
=> λx.x
```
---
## Examples:

### Church Encoding
Let's have look at the REPL in action with [Church Encoding](https://en.wikipedia.org/wiki/Church_encoding).

The main idea of the Churh Encoding is that numerals are functions that act like natural numers.

```haskell
 λ > let 0 = \s.\z.z
=> λs.λz.z

 λ > let 1 = \s.\z.s z
=> λs.λz.s z

 λ > let 2 = \s.\z.s (s z)
=> λs.λz.s (s z)
```

In last line you see that you can specify an order of evaluation by grouping expressions with parenthesis.

```haskell
 λ > let succ = \n.\s.\z.s (n s z)
=> λn.λs.λz.s (n s z)

 λ > let 3 = succ 2
=> λs.λz.s (s (s z))
```

Having just `succ` and `0` we can get *any* natural number like that:
```haskell
 λ > succ 0
=> λs.λz.s z

 λ > succ (succ 0)
=> λs'.λz'.s' (s' z')

 λ > succ (succ (succ 0))
=> λs'.λz'.s' (s' (s' z'))

...
```

We can define simple operations like *addition*:
```haskell
 λ > let plus = \m.\n.\s.\z.m s (n s z)
=> λm.λn.λs.λz.m s (n s z)

 λ > let 5 = plus 3 2
=> λs'.λz'.s' (s' (s' (s' (s' z'))))
```
and *multiplication*:
```haskell
 λ > let mult = \m.\n.\s.\z.m (n s) z
=> λm.λn.λs.λz.m (n s) z

 λ > let 6 = mult 2 3
=> λs'.λz'.s' (s' (s' (s' (s' (s' z')))))
```

### Logic
Let's define boolean constants like that:
```haskell
 λ > let true = \a.\b.a
=> λa.λb.a

 λ > let false = \a.\b.b
=> λa.λb.b

 λ > let if = \p.\t.\e.p t e
=> λp.λt.λe.p t e

 λ > if true 2 1
=> λs.λz.s (s z)              // == 2

 λ > if false 1 3
=> λs.λz.s (s (s z))          // == 3
```

And then boolean operations:
```haskell
 λ > let and = \n.\m.if n m false
=> λn.λm.n m (λa.λb.b)

 λ > let or = \n.\m.if n true m
=> λn.λm.n (λa.λb.a) m

 λ > let not = \b. if b false true
=> λb.b (λa.λb'.b') (λa.λb.a)

 λ > and true false
=> λa.λb.b                   // == false

 λ > or true false
=> λa'.λb''.a'               // == true

 λ > or (and true false) (and true true)
=> λa.λb.a                   // == false

 λ > not false
=> λa'.λb'.a'                // == true
```
That's it.

Also we can define a simple predicate:
```haskell
 λ > let isZero = \n.n (\c. false) true
=> λn.n (λc.λa.λb.b) (λa.λb.a)

 λ > isZero 0
=> λa'.λb'.a' // == true

 λ > isZero 1
=> λa'.λb'.b'
```

Putting things together:
```haskell
 λ > let param = 1
=> λs.λz.s z

 λ > let 4 = succ 3
=> λs.λz.s (s (s (s z)))

 λ > if (isZero param) (mult 3 3) (plus 2 4)
=> λs''.λz''.s'' (s'' (s'' (s'' (s'' (s'' z'')))))   // == 6
```

Looks like a simple programming language, isn't it!

### Have fun!

---

## TODO
- add support of primitive type such as *integers* and *strings*
- extend default set of functions
- add step-by-step evaluation option
- add different evaluation strategies

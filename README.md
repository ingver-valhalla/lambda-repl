# Lambda REPL

REPL for playing with [λ-calculus](https://en.wikipedia.org/wiki/Lambda_calculus)

## Installation
You must have [node.js](https://nodejs.org) with [npm](https://www.npmjs.com/) installed in your system.

Clone this repository:
```sh
git clone https://github.com/ingver/lambda-repl
cd lambda-repl
```

Install depencencies via:
```sh
npm install
```

Launch the REPL:
```sh
npm start
```

You should see a prompt:
```
λ > 
```

To exit from REPL press `Ctrl-C`.

Run tests with:
```sh
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
In this case parenthesis are unnecessary.

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

### Integers
REPL supports usual integer numbers. Integers evaluate to themselves.
```haskell
 λ > 42
=> 42

 λ > 7
=> 7
```
Some predefined functions for integers are available, sum operator `+` and increment `1+`:
```haskell
 λ > + 1 2 3 4   // takes two or more integers
=> 10

 λ > 1+ 5        // takes one integer
=> 6
```
You can pass numbers to lambdas:
```haskell
 λ > let sumOfTwo = \x.\y.+ x y
=> λx.λy.+ x y

 λ > sumOfTwo 42 7
=> 49

 λ > let add10 = sumOfTwo 10
=> λy.+ 10 y

 λ > add10 5
=> 15
```
---
## Examples:

### Church Encoding
Let's have look at the REPL in action with [Church Encoding](https://en.wikipedia.org/wiki/Church_encoding).

The main idea of the Churh Encoding is that numerals are functions that act like natural numers.

```haskell
 λ > let zero = \s.\z.z
=> λs.λz.z

 λ > let one = \s.\z.s z
=> λs.λz.s z

 λ > let two = \s.\z.s (s z)
=> λs.λz.s (s z)
```
In last line you see that you can specify an order of evaluation by grouping expressions with parenthesis.

We can convert Church numerals to regular natural numbers like that:
```haskell
 λ > one 1+ 0
=> 1

 λ > two 1+ 0
=> 2
```
To clarify the evaluation process, let's step back a little:
```haskell
 λ > two 1+
=> λz.1+ (1+ z)
```
As you can see `s` in initial `λs.λz.s (s z)` is substituted by `1+`, so it's applied to `z` *two* times. When `0` is passed we get the final result. So basically a Church numeral `n` is just a function which takes two arguments and applies first to second *n* times. Easy!

Moving on:
```haskell
 λ > let succ = \n.\s.\z.s (n s z)
=> λn.λs.λz.s (n s z)
```
`succ` gets a Church numeral and returns *next* by it.
```haskell
 λ > let three = succ two
=> λs.λz.s (s (s z))

 λ > three 1+ 0
=> 3
```

Having just `succ` and `zero` we can get *any* natural number like that:
```haskell
 λ > succ zero
=> λs.λz.s z

 λ > succ (succ zero)
=> λs.λz.s (s z)

 λ > succ (succ (succ zero))
=> λs.λz.s (s (s z))

...
```

We can define simple operations like *addition*:
```haskell
 λ > let plus = \m.\n.\s.\z.m s (n s z)
=> λm.λn.λs.λz.m s (n s z)

 λ > let five = plus three two
=> λs.λz.s (s (s (s (s z))))

 λ > five 1+ 0
=> 5
```
and *multiplication*:
```haskell
 λ > let mult = \m.\n.\s.\z.m (n s) z
=> λm.λn.λs.λz.m (n s) z

 λ > let six = mult two three
=> λs.λz.s (s (s (s (s (s z)))))

 λ > six 1+ 0
=> 6
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
=> 2

 λ > if false 1 3
=> 3
```

... and boolean operations:
```haskell
 λ > let and = \n.\m.if n m false
=> λn.λm.n m (λa.λb.b)

 λ > let or = \n.\m.if n true m
=> λn.λm.n (λa.λb.a) m

 λ > let not = \b. if b false true
=> λb.b (λa.λb'.b') (λa.λb'.a)

 λ > and true false
=> λa.λb.b                   // == false

 λ > or true false
=> λa'.λb'.a'                // == true

 λ > or (and true false) (and true true)
=> λa.λb.a                   // == true

 λ > not false
=> λa.λb''.a                 // == true
```
OK.

Now we can define a simple predicate:
```haskell
 λ > let isZero = \n.n (\c. false) true
=> λn.n (λc.λa.λb.b) (λa.λb.a)

 λ > isZero zero
=> λa.λb.a     // == true

 λ > isZero one
=> λa.λb.b     // == false
```

Putting things together:
```haskell
 λ > let param = one
=> λs.λz.s z

 λ > let four = succ three
=> λs.λz.s (s (s (s z)))

 λ > if (isZero param) (mult three three) (plus two four)
=> λs.λz.s (s (s (s (s (s z)))))   // == 6
```

Looks like a simple programming language, isn't it!

### Have fun!

---

## TODO
- add support of *strings*
- extend default set of functions
- add step-by-step evaluation option
- add different evaluation strategies

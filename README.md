# erlang-etf

This library lets you convert erlang terms encoded with the [External Term Format](https://www.erlang.org/docs/27/apps/erts/erl_ext_dist)
into their reasonably respective Javascript types. This library is created with the goal of enabling communication between erlang
backends and javascript frontends, replacing something like JSON.

This library is specially adapted to be used with the [Gleam programming language](https://gleam.run), and thus it some gleam-specific
features like bindings and conversion to gleam-equivalent types. However, it may be used in other projects too.

Some Erlang types that are not supported by this library (as of now) are:

- Pids
- Ports
- References
- Funs

(Please open an issue or PR if you want these!)

# Example

- Convert an erlang term to binary:

```erl
% erlang shell

1> rp(term_to_binary({tuples, [lists], "strings", 1, 2, #{'and' => 'more!'}})).
<<131,104,6,119,6,116,117,112,108,101,115,108,0,0,0,1,119,
  5,108,105,115,116,115,106,107,0,7,115,116,114,105,110,
  103,115,97,1,97,2,116,0,0,0,1,119,3,97,110,100,119,5,
  109,111,114,101,33>>
ok
```

- Get that binary to javascript somehow.
- And:

```js
import {convert} from "erlang-etf"
import { Tuple, List, Atom } from "erlang-etf/objects"

const bin = new Uint8Array([
  131,104,6,119,6,116,117,112,108,101,115,108,0,0,0,1,119,
  5,108,105,115,116,115,106,107,0,7,115,116,114,105,110,
  103,115,97,1,97,2,116,0,0,0,1,119,3,97,110,100,119,5,
  109,111,114,101,33
])

expect(await convert(bin))
.toEqual(
  new Tuple([
    new Atom("tuples"),
    // the second element in list's the constructor is the tail
    new List([new Atom("lists")], []), 
    new Uint8Array([ 115, 116, 114, 105, 110, 103, 115 ]),
    1, 2,
    new Map([[new Atom("and"), new Atom("more!")]])
  ])
)
```

## Compression support

The library can convert compressed erlang binaries too. For that, it requires
a compatible zlib deflate implementation. The supported ones are:

- `DecompressionStream` -- available in Baseline, Deno, and Node
- `node:zlib` -- available in Deno, Node, and Bun
- `pako` -- which must be installed from npm.

(in that priority order).

An example:

```erl
% create an array of a thousand ones
1> gen(Acc, N) when N > 0 -> gen([1|Acc], N-1);
   gen(Acc, 0) -> Acc.
ok
2> term_to_binary(gen([], 1000), [compressed]).
<<131,80,0,0,3,235,120,156,203,102,126,193,56,10,70,193,
  40,24,246,0,0,225,210,5,63>>
```

And in JavaScript:

```js
const bin = new Uint8Array([
  131,80,0,0,3,235,120,156,203,102,126,193,56,10,70,193,
  40,24,246,0,0,225,210,5,63
])

expect(await convert(bin)).toEqual(new Uint8Array(1000).fill(1))
```

# Things of Note

Error handling is pretty lenient. For example, if more than required bytes are provided, there is no error. The library just uses as
much as it needs.

## Integers

JS numbers are implemented as IEEE-754 double precision floating point, with its largest and smallest integral values being ±(2^53 - 1) (denoted by
[`Number.MIN_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER)
and [`Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER))
respectively, which is far from the range of integers representable in Erlang. Thus, numbers larger/smaller than these limits will be
returned as [`BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt)s

## Charlists

Erlang charlists are returned as `Charlist`s, which are an extension of `Uint8Arrays`, not strings. This is done since
all lists with uint8 elements are converted to `STRING_EXT` by the ETF. Hence, only the lists that are *certain* to be
strings should actually be converted to a string.
This library leaves that decision to the user. Lists with non-uint8 elements are represented with `LIST_EXT` by the ETF.

If you want the list to be forcefully converted to a string, you should use
[`String.fromCodePoint`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint) on
the list (spread the list args like so: `String.fromCodePoint(...myList)`).

## Binaries

Byte-aligned binaries are converted to `Uint8Array`s. Non-byte aligned binaries are represented with the `NonByteAlignedBinary`
class, an extension of a `Uint8Array`, with a property called `bitsInLastByte` that denotes the number of bits
(counted from the right -- least to most significant) of the last `uint8` in the array to be considered.

## Floats

The Erlang floating point implementation does not support `±Inf` or `NaN`. However, this library does not handle that (for conversion to JS).

## Atoms

Atoms are returned as an object of the `Atom` class. The `ATOM_EXT` and `SMALL_ATOM_EXT` parsers don't actually check if the
atom encoding is `latin-1` or not. The (codepoint) length of the atom is checked, however (max = 255).

The atoms `true` and `false` are returned as equivalent JS booleans.

## Lists

Lists are returned as an object of the `List` class. All list elements should be of a supported type, including the tail. 

An empty Erlang list is returned as an empty array. It may be worth considering returning it as `undefined` or `null` instead.

## Tuples

Tuples are returned as an object of the `Tuple` class. All tuple elements should be of a supported type.

## Maps

Maps are returned as JavaScript [`Map`s](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map).

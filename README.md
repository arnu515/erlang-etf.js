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

Erlang charlists are returned as `Uint8Array`s, not strings. This is done since all lists with uint8 elements are converted to
`STRING_EXT` by the ETF. Hence, only the lists that are *certain* to be strings should actually be converted to a string.
This library leaves that decision to the user. Lists with non-uint8 elements are represented with `LIST_EXT` by the ETF.

If you want the list to be forcefully converted to a string, you should use
[`String.fromCodePoint`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint) on
the list (spread the list args like so: `String.fromCodePoint(...myList)`).

## Floats

The Erlang floating point implementation does not support `±Inf` or `NaN`. However, this library does not handle that (for conversion to JS).

Also, the older `FLOAT_EXT` format is implemented for version `131`, but this may change.

## Atoms

Atoms are returned as an object of the `Atom` class. The `ATOM_EXT` and `SMALL_ATOM_EXT` parsers don't actually check if the
atom encoding is `latin-1` or not. The (codepoint) length of the atom is checked, however (max = 255).

## Lists

Lists are returned as an object of the `List` class. All list elements should be of a supported type, including the tail. 

## Tuples

Tuples are returned as an object of the `Tuple` class. All tuple elements should be of a supported type.

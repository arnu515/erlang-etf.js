# etf_js

Gleam bindings for `erlang-etf.js`. This library lets you convert erlang ETF encoded
terms into (reasonable) JavaScript equivalents.

## Installation

For compression support, promises are required. If compression will not be
used, then you don't need `gleam_javascript`.

```bash
gleam add etf_js gleam_javascript
```

Furthermore, the NPM package `pako` must be installed if `DecompressionStream`
or `node:zlib` is not available in the JS runtime.

## Examples

Please see the `tests/` directory for usage examples.

A simple example would be:

```gleam
import etf_js
import etf_js/decode as etf_decode
import gleam/decode
import gleam/javascript/promise

pub fn main() {
  // to get this binary, write this in the Erlang shell:
  // `term_to_binary(<<"Hello, world!"/utf8>>).`
  let bits = <<131,109,0,0,0,13,72,101,108,108,111,44,32,119,111,114,
  108,100,33>>

  // since ETF binaries can be compressed, promises are required
  // to decode them. However, if you know for a fact that a certain
  // binary isn't compressed (hint: the second byte must *not* be 80),
  // then you can call this method, which is synchronous
  let assert Ok(term) = etf_js.to_dynamic_no_compression(bits)

  // term is a dynamic, so we need to decode it
  // Gleam's Erlang target represents strings as UTF-8 bitarrays, since
  // Erlang does not have a standalone string type, but JS does, so we
  // can't use decode.string here, since that only checks for JS strings,
  // and not UTF-8 bitarrays. The `lossy_string` decoder checks for both.
  let assert Ok("Hello, world!") = decode.run(etf_decode.lossy_string())

  // Compression! This is a list of a thousand ones!
  // to get this binary, run:
  // `term_to_binary([1 || _ <- lists:seq(1, 1000)], [compressed])`
  // in the Erlang shell.
  let bits = <<131,80,0,0,3,235,120,156,203,102,126,193,56,10,70,193,
  40,24,246,0,0,225,210,5,63>>
  use res <- promise.await(etf_js.to_dynamic(bits))
  let assert Ok(term) = res
  let assert Ok(list) = decode.run(res, decode.list(decode.string))
  // list will have one thousand ones!
  promise.resolve(Nil)
}
```

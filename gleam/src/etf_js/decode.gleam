import gleam/bit_array
import gleam/dynamic/decode.{type Decoder}
import gleam/result

/// Decodes both JS strings and utf-8 `BitArray`s.
///
/// This is required because in Gleam's Erlang target, strings are represented as
/// `BitArray`s, but in the JavaScript target, they are regular JS strings.
///
/// Since charlists are also returned as bit arrays, this will also convert
/// charlists to strings (if they are valid strings).
///
pub fn loose_string() -> Decoder(String) {
  decode.new_primitive_decoder("String", fn(data) {
    let res =
      decode.run(data, decode.string)
      |> result.replace_error("")
    use <- result.lazy_or(res)
    case decode.run(data, decode.bit_array) {
      Ok(ba) ->
        case bit_array.to_string(ba) {
          Ok(x) -> Ok(x)
          Error(_) -> Error("")
        }
      Error(_) -> Error("")
    }
  })
}

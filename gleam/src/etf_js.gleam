import gleam/dynamic.{type Dynamic}
import gleam/dynamic/decode
import gleam/javascript/promise.{type Promise}
import gleam/result

/// An error that occured while decoding the ETF encoded binary 
pub type EtfDecodeError {
  /// The given binary is not an ETF binary
  NotEtf
  /// The given ETF binary has some invalidity
  Invalid
  /// An atom parsed from the binary has an invalid length (>255)
  AtomLengthInvalid
  /// Binary is compressed but the no_compression method was called
  Compressed
  /// The `pako` library is not installed (from npm).
  /// This error occurs if both DecompressionStream and node:zlib
  /// are not available, usually in older browsers (<May 2023).
  PakoNotInstalled
  /// An unknown error occured while parsing the binary.
  /// The enum argument is the error passed.
  Unknown(Dynamic)
  /// Only raised by the `decode*` functions -- an error occured while
  /// decoding the returned object.
  DecoderError(List(decode.DecodeError))
}

type Ret =
  Result(Dynamic, EtfDecodeError)

/// Converts an erlang ETF encoded bitarray into a JS object returned as a Dynamic.
///
@external(javascript, "./etf_ffi.mjs", "toDynamic")
pub fn to_dynamic(bits: BitArray) -> Promise(Ret)

/// Converts an erlang ETF encoded bitarray into a JS object returned as a Dynamic.
///
/// This method is synchronous and does not support compressed ETF binaries.
///
@external(javascript, "./etf_ffi.mjs", "toDynamicNoCompression")
pub fn to_dynamic_no_compression(bits: BitArray) -> Ret

/// Converts an erlang ETF encoded bitarray and decodes it using `decoder`.
///
/// This function can also convert compressed bitarrays, and hence is asynchronous.
///
pub fn decode(
  bits: BitArray,
  decoder: decode.Decoder(a),
) -> Promise(Result(a, EtfDecodeError)) {
  use res <- promise.await(to_dynamic(bits))
  promise.resolve({
    use res <- result.try(res)
    decode.run(res, decoder)
    |> result.map_error(DecoderError)
  })
}

/// Converts an erlang ETF encoded bitarray and decodes it using `decoder`.
///
/// This function does not convert compressed bitarrays, and hence is synchronous.
///
pub fn decode_non_compressed(
  bits: BitArray,
  decoder: decode.Decoder(a),
) -> Result(a, EtfDecodeError) {
  to_dynamic_no_compression(bits)
  |> result.try(fn(data) {
    decode.run(data, decoder)
    |> result.map_error(DecoderError)
  })
}

import etf_js
import etf_js/decode as etf_decode
import gleam/dynamic/decode
import gleam/javascript/promise
import gleam/list
import gleam/string
import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

pub type BigInt

@external(javascript, "./test_ffi.js", "newBigInt")
fn bigint(a1: a) -> BigInt

fn runner(in: BitArray, decoder: decode.Decoder(a), out: a) {
  use res <- promise.await(etf_js.decode(in, decoder))
  should.be_ok(res)
  |> should.equal(out)

  promise.resolve(Nil)
}

@external(javascript, "./test_ffi.js", "parseBigInt")
fn parse_bigint(data: decode.Dynamic) -> Result(BigInt, BigInt)

pub fn int_test() {
  let ints = [
    #(<<131, 97, 1>>, 1),
    #(<<131, 98, 255, 255, 255, 255>>, -1),
    #(<<131, 97, 0>>, 0),
    #(<<131, 98, 0, 16, 158, 207>>, 1_089_231),
    #(<<131, 98, 255, 239, 97, 49>>, -1_089_231),
  ]
  let bigints = [
    #(
      <<131, 110, 7, 0, 147, 247, 106, 13, 170, 252, 43>>,
      bigint("12381231298312083"),
    ),
    #(
      <<131, 110, 7, 1, 147, 247, 106, 13, 170, 252, 43>>,
      bigint("-12381231298312083"),
    ),
    #(
      <<
        131, 80, 0, 0, 0, 128, 120, 156, 203, 171, 101, 56, 94, 40, 67, 24, 49,
        154, 74, 59, 245, 59, 56, 47, 159, 250, 253, 91, 217, 134, 214, 116, 30,
        111, 227, 115, 239, 147, 108, 23, 61, 250, 96, 88, 149, 115, 215, 120,
        91, 87, 200, 183, 111, 234, 175, 126, 238, 109, 117, 18, 227, 41, 22,
        252, 154, 26, 234, 55, 77, 45, 134, 223, 143, 35, 100, 138, 9, 167, 106,
        190, 132, 230, 18, 155, 83, 143, 138, 174, 158, 123, 125, 169, 243, 155,
        248, 156, 243, 93, 79, 190, 124, 221, 189, 125, 213, 167, 41, 203, 153,
        0, 188, 115, 62, 45,
      >>,
      bigint(string.repeat("1", 300)),
    ),
  ]

  use _ <- promise.await(
    list.map(ints, fn(i) { runner(i.0, decode.int, i.1) })
    |> promise.await_list,
  )

  use _ <- promise.await(
    list.map(bigints, fn(i) {
      runner(i.0, decode.new_primitive_decoder("BigInt", parse_bigint), i.1)
    })
    |> promise.await_list,
  )

  promise.resolve(Nil)
}

pub fn floats_test() {
  let matrix = [
    #(<<131, 70, 63, 240, 0, 0, 0, 0, 0, 0>>, 1.0),
    #(<<131, 70, 191, 240, 0, 0, 0, 0, 0, 0>>, -1.0),
    #(<<131, 70, 0, 0, 0, 0, 0, 0, 0, 0>>, 0.0),
    #(<<131, 70, 64, 9, 30, 184, 81, 235, 133, 31>>, 3.14),
    #(<<131, 70, 192, 254, 15, 49, 248, 79, 245, 140>>, -123_123.12312313),
    #(<<131, 70, 64, 254, 15, 49, 248, 79, 245, 140>>, 123_123.12312313),
  ]
  use _ <- promise.await(
    list.map(matrix, fn(i) { runner(i.0, decode.float, i.1) })
    |> promise.await_list,
  )
  promise.resolve(Nil)
}

@external(javascript, "./test_ffi.js", "parseNil")
fn parse_nil(data: decode.Dynamic) -> Result(Nil, Nil)

pub fn primitive_atoms_test() {
  use _ <- promise.await(runner(
    <<131, 119, 4, 116, 114, 117, 101>>,
    decode.bool,
    True,
  ))
  use _ <- promise.await(runner(
    <<131, 119, 5, 102, 97, 108, 115, 101>>,
    decode.bool,
    False,
  ))
  use _ <- promise.await(runner(
    <<131, 119, 3, 110, 105, 108>>,
    decode.new_primitive_decoder("Nil", parse_nil),
    Nil,
  ))
  promise.resolve(Nil)
}

pub fn lists_test() {
  // empty list
  use _ <- promise.await(runner(<<131, 106>>, decode.list(decode.int), []))

  // charlist -- returned as BitArray
  use _ <- promise.await(
    runner(<<131, 107, 0, 5, 104, 101, 108, 108, 111>>, decode.bit_array, <<
      104, 101, 108, 108, 111,
    >>),
  )
  use _ <- promise.await(
    runner(<<131, 107, 0, 5, 1, 2, 3, 4, 5>>, decode.bit_array, <<
      1, 2, 3, 4, 5,
    >>),
  )

  // non-char lists
  use _ <- promise.await(
    runner(
      <<
        131, 108, 0, 0, 0, 2, 109, 0, 0, 0, 2, 104, 105, 109, 0, 0, 0, 3, 98,
        121, 101, 106,
      >>,
      decode.list(etf_decode.loose_string()),
      ["hi", "bye"],
    ),
  )
  use _ <- promise.await(
    runner(
      <<
        131, 108, 0, 0, 0, 2, 70, 64, 5, 153, 153, 153, 153, 153, 154, 70, 64, 9,
        30, 184, 81, 235, 133, 31, 106,
      >>,
      decode.list(decode.float),
      [2.7, 3.14],
    ),
  )
  use _ <- promise.await(
    runner(
      <<
        131, 108, 0, 0, 0, 2, 119, 4, 116, 114, 117, 101, 119, 5, 102, 97, 108,
        115, 101, 106,
      >>,
      decode.list(decode.bool),
      [True, False],
    ),
  )

  promise.resolve(Nil)
}

pub fn sans_promises_test() {
  let ints = [
    #(<<131, 97, 1>>, Ok(1)),
    #(<<131, 98, 255, 255, 255, 255>>, Ok(-1)),
    #(<<131, 97, 0>>, Ok(0)),
    #(<<131, 98, 0, 16, 158, 207>>, Ok(1_089_231)),
    #(<<131, 98, 255, 239, 97, 49>>, Ok(-1_089_231)),
  ]
  let bigints = [
    #(
      <<131, 110, 7, 0, 147, 247, 106, 13, 170, 252, 43>>,
      Ok(bigint("12381231298312083")),
    ),
    #(
      <<131, 110, 7, 1, 147, 247, 106, 13, 170, 252, 43>>,
      Ok(bigint("-12381231298312083")),
    ),
  ]

  list.map(ints, fn(i) {
    etf_js.decode_non_compressed(i.0, decode.int)
    |> should.equal(i.1)
  })
  list.map(bigints, fn(i) {
    decode.new_primitive_decoder("BigInt", parse_bigint)
    |> etf_js.decode_non_compressed(i.0, _)
    |> should.equal(i.1)
  })

  etf_js.to_dynamic_no_compression(<<
    131, 80, 0, 0, 0, 128, 120, 156, 203, 171, 101, 56, 94, 40, 67, 24, 49, 154,
    74, 59, 245, 59, 56, 47, 159, 250, 253, 91, 217, 134, 214, 116, 30, 111, 227,
    115, 239, 147, 108, 23, 61, 250, 96, 88, 149, 115, 215, 120, 91, 87, 200,
    183, 111, 234, 175, 126, 238, 109, 117, 18, 227, 41, 22, 252, 154, 26, 234,
    55, 77, 45, 134, 223, 143, 35, 100, 138, 9, 167, 106, 190, 132, 230, 18, 155,
    83, 143, 138, 174, 158, 123, 125, 169, 243, 155, 248, 156, 243, 93, 79, 190,
    124, 221, 189, 125, 213, 167, 41, 203, 153, 0, 188, 115, 62, 45,
  >>)
  |> should.be_error
  |> should.equal(etf_js.Compressed)
}

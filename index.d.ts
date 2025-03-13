declare module "erlang-etf" {
  export class Atom {
    inner: string
    constructor(inner: string)
    get length(): number
    toString(): string
  }
  export class Charlist extends Uint8Array { }
  export class List<T, U> {
    inner: T
    proper: boolean
    tail: U
    constructor(inner: T[], tail: U)
  }
  export class Tuple<T> {
    inner: T[]
    constructor(inner: T[])
    get length(): number
  }
  export class NonByteAlignedBinary extends Uint8Array {
    bitsInLastByte: number
  }

  type InflateOpts = {
    using: "DecompressionStream" | "node:zlib" | "pako" | undefined
  }
  export function inflate(bin: Uint8Array, opts?: InflateOpts): Promise<Uint8Array>

  export const ERROR_PAKO_NOT_INSTALLED: string
  export const ERROR_NOTETF: string
  export const ERROR_COMPRESSED: string
  export const ERROR_INVALID: string
  export const ERROR_ATOM_LENGTH_INVALID: string

  /** The supported ETF version */
  export const ETF: number
  /** Compression tag. */
  export const COMPRESSED: number
  /** Unsigned 8-bit integer. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_integer_ext */
  export const SMALL_INTEGER_EXT: number
  /** Signed 32-bit integer (be). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#integer_ext */
  export const INTEGER_EXT: number
  /** Bigint upto 255 bytes (le). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_big_ext */
  export const SMALL_BIG_EXT: number
  /** Bigint upto 255 bytes (le). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#large_big_ext */
  export const LARGE_BIG_EXT: number
  /** Minor version 0 floating point repr. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#float_ext */
  export const FLOAT_EXT: number
  /** 64-bit finite floating point (be). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#new_float_ext */
  export const NEW_FLOAT_EXT: number
  /** Small Atom (latin-1). Deprecated but still in use. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_atom_ext */
  export const SMALL_ATOM_EXT: number
  /** Atom (latin-1). Deprecated but still in use. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#atom_ext */
  export const ATOM_EXT: number
  /** Small Atom (utf-8) (<256 bytes). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_atom_utf8_ext */
  export const SMALL_ATOM_UTF8_EXT: number
  /** Atom (utf-8). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#atom_utf8_ext */
  export const ATOM_UTF8_EXT: number
  /** Empty list. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#nil_ext */
  export const NIL_EXT: number
  /** Charlists. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#string_ext */
  export const STRING_EXT: number
  /** Lists. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#list_ext */
  export const LIST_EXT: number
  /** Small Tuples (<256 el). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_tuple_ext */
  export const SMALL_TUPLE_EXT: number
  /** Tuples. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#large_tuple_ext */
  export const LARGE_TUPLE_EXT: number
  /** Maps. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#map_ext */
  export const MAP_EXT: number
  /** Binaries. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#binary_ext */
  export const BINARY_EXT: number
  /** Non-byte aligned binaries. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#bit_binary_ext */
  export const BIT_BINARY_EXT: number

  /**
   * Uncompresses a compressed ETF binary
   *
   * Returns a valid ETF binary
   */
  export function uncompress(etfBin: Uint8Array): Promise<Uint8Array>
  /**
   * This function attepts to convert an ETF encoded binary into a javascript
   * object. Please see the library README for more details on how to conversion
   * happens.
   * 
   * It returns the decoded object, and position at which it stopped (exclusive).
   */
  export function convert<T>(etfBin: Uint8Array): Promise<[T, number]>
  /**
   * This function converts a non-compressed ETF binary into a JS object. If the
   * given binary is compressed, ERROR_COMPRESSED will be thrown.
   *
   * @param {Uint8Array} etfBin 
   */
  export function convertNoCompression<T>(etfBin: Uint8Array): [T, number]
}

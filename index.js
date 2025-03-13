// @ts-check

import { Atom, Charlist, List, NonByteAlignedBinary, Tuple } from "./objects.js"
import { inflate, ERROR_PAKO_NOT_INSTALLED } from "./zlib.js"

export * from "./objects.js"
export { ERROR_PAKO_NOT_INSTALLED }
export const ERROR_NOTETF = "ERROR_NOTETF"
export const ERROR_COMPRESSED = "ERROR_COMPRESSED"
export const ERROR_INVALID = "ERROR_INVALID"
export const ERROR_ATOM_LENGTH_INVALID = "ERROR_ATOM_LENGTH_INVALID"

/** The supported ETF version */
export const ETF = 131
/** Compression tag. */
export const COMPRESSED = 80
/** Unsigned 8-bit integer. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_integer_ext */
export const SMALL_INTEGER_EXT = 97
/** Signed 32-bit integer (be). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#integer_ext */
export const INTEGER_EXT = 98
/** Bigint upto 255 bytes (le). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_big_ext */
export const SMALL_BIG_EXT = 110
/** Bigint upto 255 bytes (le). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#large_big_ext */
export const LARGE_BIG_EXT = 111
/** Minor version 0 floating point repr. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#float_ext */
export const FLOAT_EXT = 99
/** 64-bit finite floating point (be). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#new_float_ext */
export const NEW_FLOAT_EXT = 70
/** Small Atom (latin-1). Deprecated but still in use. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_atom_ext */
export const SMALL_ATOM_EXT = 115
/** Atom (latin-1). Deprecated but still in use. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#atom_ext */
export const ATOM_EXT = 100
/** Small Atom (utf-8) (<256 bytes). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_atom_utf8_ext */
export const SMALL_ATOM_UTF8_EXT = 119
/** Atom (utf-8). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#atom_utf8_ext */
export const ATOM_UTF8_EXT = 118
/** Empty list. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#nil_ext */
export const NIL_EXT = 106
/** Charlists. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#string_ext */
export const STRING_EXT = 107
/** Lists. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#list_ext */
export const LIST_EXT = 108
/** Small Tuples (<256 el). https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#small_tuple_ext */
export const SMALL_TUPLE_EXT = 104
/** Tuples. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#large_tuple_ext */
export const LARGE_TUPLE_EXT = 105
/** Maps. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#map_ext */
export const MAP_EXT = 116
/** Binaries. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#binary_ext */
export const BINARY_EXT = 109
/** Non-byte aligned binaries. https://www.erlang.org/docs/28/apps/erts/erl_ext_dist#bit_binary_ext */
export const BIT_BINARY_EXT = 77

/**
 * Uncompresses a compressed ETF binary
 * 
 * @param {Uint8Array} etfBin The array to convert 
 */
export async function uncompress(etfBin, opts) {
  if (!(etfBin instanceof Uint8Array))
    throw new TypeError("Expected first argument to be a Uint8Array.")
  if (etfBin[0] !== ETF || etfBin[1] !== COMPRESSED) {
    const e = new Error("The binary is not ETF encoded and/or compressed.")
    e.name = ERROR_NOTETF
    throw e
  }
  const uncompressedSize = new DataView(etfBin.buffer, 2, 4).getUint32(0, false)
  const buf = await inflate(etfBin.slice(6), opts)
  if (buf.byteLength !== uncompressedSize) {
    const e = new Error("The uncompressed binary's size does not match the expected size")
    e.name = ERROR_INVALID
    throw e
  }
  const ret = new Uint8Array(1 + uncompressedSize)
  ret[0] = ETF
  ret.set(buf, 1)
  return ret
}

/**
 * This function attepts to convert an ETF encoded binary into a javascript
 * object. Please see the library README for more details on how to conversion
 * happens.
 * 
 * @param {Uint8Array} etfBin The array to convert 
 */
export async function convert(etfBin, opts) {
  if (!(etfBin instanceof Uint8Array))
    throw new TypeError("Expected first argument to be a Uint8Array.")
  if (etfBin[0] !== ETF) {
    const e = new Error("The binary is not ETF encoded.")
    e.name = ERROR_NOTETF
    throw e
  }
  if (etfBin[1] === COMPRESSED) {
    // compressed
    etfBin = await uncompress(etfBin, opts)
  }
  return parse(etfBin.slice(1), 0)[0]
}

/**
 * This function converts a non-compressed ETF binary into a JS object. If the
 * given binary is compressed, ERROR_COMPRESSED will be thrown.
 *
 * @param {Uint8Array} etfBin 
 */
export function convertNoCompression(etfBin) {
  if (!(etfBin instanceof Uint8Array))
    throw new TypeError("Expected first argument to be a Uint8Array.")
  if (etfBin[0] !== ETF) {
    const e = new Error("The binary is not ETF encoded.")
    e.name = ERROR_NOTETF
    throw e
  }
  if (etfBin[1] === COMPRESSED) {
    const e = new Error("The binary is compressed.")
    e.name = ERROR_COMPRESSED
    throw e
  }
  return parse(etfBin.slice(1), 0)[0]
}

/**
 * Parses a tagged term.
 *
 * @param {Uint8Array} etfBin
 * @param {number} i
 * @returns {[any, number]}
*/
function parse(etfBin, i) {
  switch (etfBin[i]) {
    case SMALL_INTEGER_EXT:
      i++
      return [etfBin[i++], i]
    case INTEGER_EXT:
      i += 5
      return [new DataView(etfBin.buffer, i - 4, 4).getInt32(0, false), i]
    // this probably shouldn't exist
    case FLOAT_EXT:
      i += 32
      // i and not i+1 because the last byte is the null terminator ('\0')
      return [Number(String.fromCharCode(...etfBin.slice(i - 31, i))), i]
    case NEW_FLOAT_EXT: {
      i += 9
      return [new DataView(etfBin.buffer, i - 8, 8).getFloat64(0, false), i]
    }
    case SMALL_BIG_EXT: {
      let num = 0n
      const len = etfBin[++i]
      etfBin.slice(i + 2, i + 2 + len).forEach((v, j) => {
        num |= BigInt(v) << 8n * BigInt(j)
      })
      if (etfBin[i + 1]) num = -num
      i += 1 + len
      return [(num >= BigInt(Number.MIN_SAFE_INTEGER) && num <= BigInt(Number.MAX_SAFE_INTEGER))
        ? Number(num)
        : num, i]
    }
    case LARGE_BIG_EXT: {
      let num = 0n
      const len = new DataView(etfBin.buffer, i + 1, 4).getUint32(0, false)
      etfBin.slice(i + 6, i + 6 + len).forEach((v, j) => {
        num |= BigInt(v) << 8n * BigInt(j)
      })
      if (etfBin[i + 5]) num = -num
      i += 5 + len
      return [(num >= BigInt(Number.MIN_SAFE_INTEGER) && num <= BigInt(Number.MAX_SAFE_INTEGER))
        ? Number(num)
        : num, i]
    }
    case SMALL_ATOM_EXT:
    case SMALL_ATOM_UTF8_EXT: {
      const len = etfBin[i + 1];
      const atom = new Atom(new TextDecoder().decode(etfBin.slice(i + 2, i + 2 + len)))
      i += 2 + len;
      if (atom.length >= 256) {
        const e = new Error("Invalid atom length")
        e.name = ERROR_ATOM_LENGTH_INVALID
        throw e
      }
      if (atom.inner === 'true') return [true, i];
      if (atom.inner === 'false') return [false, i];
      return [atom, i];
    }
    case ATOM_EXT:
    case ATOM_UTF8_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 2).getUint16(0, false);
      const atom = new Atom(new TextDecoder().decode(etfBin.slice(i + 3, i + 3 + len)))
      i += 3 + len;
      if (atom.length >= 256) {
        const e = new Error("Invalid atom length")
        e.name = ERROR_ATOM_LENGTH_INVALID
        throw e
      }
      // technically the following two cases are impossible, since `true`
      // and `false` will be encoded as short atoms, but oh well
      if (atom.inner === 'true') return [true, i];
      if (atom.inner === 'false') return [false, i];
      return [atom, i];
    }
    case NIL_EXT:
      i++;
      return [[], i];
    case STRING_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 2).getUint16(0, false);
      i += 3 + len;
      return [new Charlist(etfBin.buffer.slice(i - len, i)), i]
    }
    case LIST_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 4).getUint32(0, false);
      i += 5;
      const arr = new Array(len)
      for (let j = 0; j < len; j++) {
        const [el, di] = parse(etfBin.slice(i), 0)
        i += di
        arr[j] = el
      }
      const [tail, di] = parse(etfBin.slice(i), 0)
      i += di
      return [new List(arr, tail), i]
    }
    case SMALL_TUPLE_EXT: {
      const len = etfBin[i + 1];
      i += 2;
      const arr = new Array(len)
      for (let j = 0; j < len; j++) {
        const [el, di] = parse(etfBin.slice(i), 0)
        i += di
        arr[j] = el
      }
      return [new Tuple(arr), i]
    }
    case LARGE_TUPLE_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 4).getUint32(0, false);
      i += 5;
      const arr = new Array(len)
      for (let j = 0; j < len; j++) {
        const [el, di] = parse(etfBin.slice(i), 0)
        i += di
        arr[j] = el
      }
      return [new Tuple(arr), i]
    }
    case MAP_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 4).getUint32(0, false);
      i += 5;
      const map = new Map()
      for (let j = 0; j < len; j++) {
        const [k, di] = parse(etfBin.slice(i), 0)
        i += di
        const [v, di2] = parse(etfBin.slice(i), 0)
        i += di2
        map.set(k, v)
      }
      return [map, i]
    }
    case BINARY_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 4).getUint32(0, false);
      i += 5 + len;
      return [new Uint8Array(etfBin.buffer, i - len, len), i]
    }
    case BIT_BINARY_EXT: {
      const len = new DataView(etfBin.buffer, i + 1, 4).getUint32(0, false);
      const bits = etfBin[i + 5];
      i += 6 + len;
      const binb = etfBin[i - 1];
      const nbab = new NonByteAlignedBinary(binb, len)
      nbab.set(etfBin.slice(i - len, i - 1), 0)
      nbab[len - 1] = binb >> (8 - bits)
      return [nbab, i]
    }
    default: {
      const e = new Error("The binary is not ETF encoded.")
      e.name = ERROR_INVALID
      throw e
    }
  }
}


import { Atom, List, Tuple, NonByteAlignedBinary, convert, ERROR_ATOM_LENGTH_INVALID, ERROR_INVALID, ERROR_NOTETF, ERROR_PAKO_NOT_INSTALLED, convertNoCompression, ERROR_COMPRESSED } from "."
import { NotEtf, Invalid, AtomLengthInvalid, Unknown, PakoNotInstalled, Compressed } from "./etf_js.mjs"
import { Ok, Error as GlError, toList, CustomType as $CustomType, BitArray, Empty, NonEmpty } from "./gleam.mjs"
import { to_string as bitArrayToString } from "../gleam_stdlib/gleam/bit_array.mjs"

function normaliseData(data) {
  // Nil
  if (data instanceof Atom && data.inner === 'nil') return new Ok(undefined)
  // Lists
  if (data instanceof List) return new Ok(toList(data.inner, Array.isArray(data.tail) && data.tail.length === 0 ? undefined : data.tail))

  return new Ok(data)
}

function normaliseError(e) {
  if (e instanceof Error)
    switch (e.name) {
      case ERROR_NOTETF:
        return new GlError(new NotEtf())
      case ERROR_INVALID:
        return new GlError(new Invalid())
      case ERROR_ATOM_LENGTH_INVALID:
        return new GlError(new AtomLengthInvalid())
      case ERROR_PAKO_NOT_INSTALLED:
        return new GlError(new PakoNotInstalled())
      case ERROR_COMPRESSED:
        return new GlError(new Compressed())
      default:
        return new GlError(new Unknown(e))
    }
  return new GlError(new Unknown(e))
}

export async function toDynamic(bits) {
  try {
    return normaliseData(await convert(bits.rawBuffer))
  } catch (e) {
    return normaliseError(e)
  }
}

export function toDynamicNoCompression(bits) {
  try {
    return normaliseData(convertNoCompression(bits.rawBuffer))
  } catch (e) {
    return normaliseError(e)
  }
}

/** attemps to convert an erlang tagged tuple into
 an instance of the class which `val` is an object of. */
export function inferTaggedTuple(data, val) {
  if (!(data instanceof Tuple)) return new GlError("Not a tuple")  
  const keys = Reflect.ownKeys(val)
  if (data.length !== keys.length + 1) return new GlError("Invalid length")
  if (!(data.inner[0] instanceof Atom)) return new GlError("Not a tagged tuple")
  for (const [i, k] of keys.entries()) {
    const v = data.inner[i+1];
    console.log(i, k, val[k], v, typeof val[k], typeof v, v.constructor.name)
    if (typeof val[k] === 'undefined' || val[k] === null) {
      if (v instanceof Atom && v.inner === 'nil' || typeof v === 'undefined' || v === null) val[k] = v;
      else return new GlError(`Index ${i+1} should be Nil but is ${typeof v}`)
    } else if (typeof val[k] === 'string') {
      if (typeof v === 'string') val[k] = v;
      else if (v instanceof Uint8Array) {
        const s = bitArrayToString(new BitArray(v))
        console.log('decoding', k, s)
        if (s.isOk()) val[k] = s[0]
        else return new GlError(`Index ${i+1} should be String but is BitArray`)
      }
      else return new GlError(`Index ${i+1} should be String but is ${typeof v}`)
    } else if (typeof val[k] !== 'object') {
      if (typeof val[k] === typeof v) val[k] = v;
      else return new GlError(`Index ${i+1} should be ${typeof val[k]} but is ${typeof v}`)
    } else if (val[k] instanceof $CustomType ){
      // val[k] is a custom gleam type
      if (val[k].constructor.length === 0) {
        // val[k] has no fields -- it is an erlang atom
        // FIXME: whitelist of allowed atoms
        if (v instanceof Atom) val[k] = v
        else return new GlError(`Index ${i+1} should be Atom but is ${v.constructor.name}`)
      } else {
        // val[k] is a record type -- recursion time
        const res = inferTaggedTuple(v, val[k])
        if (!res.isOk()) return res
      }
    } else {
      switch (val[k].constructor.name) {
        case "BitArray":
          if (v instanceof Uint8Array) val[k] = new BitArray(v)
          else if (v instanceof NonByteAlignedBinary) val[k] = new BitArray(v, undefined, v.bitsInLastByte)
          else return new GlError(`Index ${i+1} should be BitArray but is ${v.constructor.name}`)
        case "List":
          // TODO:
          if (v instanceof List) {
            if (val[k] instanceof Empty) return new GlError("Lists should have atleast one element in them for reflection")
            const el = val[k].head
            val[k] = new Empty()
            if (val[k] instanceof $CustomType)
            for (const i of v) 
              val[k] = new NonEmpty(structuredClone(inferTaggedTuple(i, el)), val[k]) 
          } else return new GlError(`Index ${i+1} should be List but is ${v.constructor.name}`)
        default:
          return new GlError(`Unsupported type ${val[k].constructor.name}`)
      }
    }
    console.log("a", val[k], v)
  }
  console.log(val)
  return new Ok(val)
}

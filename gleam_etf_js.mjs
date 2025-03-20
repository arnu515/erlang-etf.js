import { Atom, List, Tuple, convert, ERROR_ATOM_LENGTH_INVALID, ERROR_INVALID, ERROR_NOTETF, ERROR_PAKO_NOT_INSTALLED, convertNoCompression, ERROR_COMPRESSED } from "."
import { NotEtf, Invalid, AtomLengthInvalid, Unknown, PakoNotInstalled, Compressed } from "./etf_js.mjs"
import { Ok, Error as GlError, toList } from "./gleam.mjs"

function normaliseData(data) {
  // Nil
  if (data instanceof Atom && data.inner === 'nil') return new Ok(undefined)
  // Lists
  if (data instanceof List) return new Ok(toList(data.inner, Array.isArray(data.tail) && data.tail.length === 0 ? undefined : data.tail))
  // Tuples
  if (data instanceof Tuple) return new Ok(data.inner)

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


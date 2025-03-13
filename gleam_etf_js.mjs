import { Atom, List, convert, ERROR_ATOM_LENGTH_INVALID, ERROR_INVALID, ERROR_NOTETF, ERROR_PAKO_NOT_INSTALLED, Charlist } from "."
import { NotEtf, Invalid, AtomLengthInvalid, Unknown, PakoNotInstalled } from "./etf_js.mjs"
import { Ok, Error, toList } from "./gleam.mjs"

export async function toDynamic(bits) {
  try {
    const data = await convert(bits.rawBuffer)
    // Nil
    if (data instanceof Atom && data.inner === 'nil') return new Ok(undefined)
    // Lists
    if (data instanceof List) return new Ok(toList(data.inner, Array.isArray(data.tail) && data.tail.length === 0 ? undefined : data.tail))

    return new Ok(data)
  } catch (e) {
    if (e instanceof Error)
      switch (e.name) {
        case ERROR_NOTETF:
          return new Error(new NotEtf())
        case ERROR_INVALID:
          return new Error(new Invalid())
        case ERROR_ATOM_LENGTH_INVALID:
          return new Error(new AtomLengthInvalid())
        case ERROR_PAKO_NOT_INSTALLED:
          return new Error(new PakoNotInstalled())
        default:
          return new Error(new Unknown(e))
      }
    return new Error(new Unknown(e))
  }
}

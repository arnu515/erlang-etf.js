import {Ok, Error} from "./gleam.mjs"

export function newBigInt(...args) {
  return BigInt(args)
}

export function parseBigInt(num) {
  if (typeof num === "bigint") return new Ok(num)
  else return new Error(BigInt(0))
}

export function parseNil(v) {
  if (v === null || v === undefined) return new Ok(undefined)
  else return new Error(undefined)
}

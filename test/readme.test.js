// @ts-check

import { convert } from ".."
import { expect, test } from "bun:test"
import { Tuple, List, Atom, Charlist } from "../objects"

test("first example", async () => {
  const bin = new Uint8Array([
    131, 104, 6, 119, 6, 116, 117, 112, 108, 101, 115, 108, 0, 0, 0, 1, 119,
    5, 108, 105, 115, 116, 115, 106, 107, 0, 7, 115, 116, 114, 105, 110,
    103, 115, 97, 1, 97, 2, 116, 0, 0, 0, 1, 119, 3, 97, 110, 100, 119, 5,
    109, 111, 114, 101, 33
  ])

  expect(await convert(bin))
    .toEqual(
      new Tuple([
        new Atom("tuples"),
        // the second element in list's the constructor is the tail
        new List([new Atom("lists")], []),
        new Charlist(new Uint8Array([115, 116, 114, 105, 110, 103, 115])),
        1, 2,
        new Map([[new Atom("and"), new Atom("more!")]])
      ])
    )
})

test("compression example", async () => {
  const bin = new Uint8Array([ 131,80,0,0,3,235,120,156,203,102,126,193,56,10,70,193, 40,24,246,0,0,225,210,5,63 ])

  expect(await convert(bin))
    .toEqual(new Charlist(new Uint8Array(1000).fill(1)))
})

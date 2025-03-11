// @ts-check

import {test, expect} from "bun:test"
import { convert } from ".."
import { Atom, List } from "../objects"

test("Basic", async () => {
  expect(await convert(new Uint8Array([131, 108, 0, 0, 0, 1, 119, 1, 97, 106])))
    .toEqual(new List([new Atom('a')], []))
  expect(await convert(new Uint8Array([131, 108, 0, 0, 0, 1, 108, 0, 0, 0, 1, 119, 1, 97, 106, 106])))
    .toEqual(new List([new List([new Atom('a')], [])], []))
  expect(await convert(new Uint8Array([131, 108, 0, 0, 0, 1, 97, 1, 97, 2])))
    .toEqual(new List([1], 2))
  expect(await convert(new Uint8Array([131, 108, 0, 0, 0, 4, 97, 1, 97, 2, 97, 3, 97, 4, 97, 5])))
    .toEqual(new List([1, 2, 3, 4], 5))
})

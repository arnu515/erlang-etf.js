// @ts-check

import { test, expect } from "bun:test"
import { convert } from ".."
import { Charlist, List, Tuple } from "../objects"

test("Basic", async () => {
  expect(await convert(new Uint8Array([131, 116, 0, 0, 0, 0]))).toEqual(new Map())
  expect(await convert(new Uint8Array([131, 116, 0, 0, 0, 2, 97, 1, 97, 2, 97, 3, 97, 4])))
    .toEqual(new Map([[1, 2], [3, 4]]))
  expect(await convert(new Uint8Array([
    131, 116, 0, 0, 0, 3, 97, 1, 104, 3, 97, 1, 97, 2, 97, 3, 97, 4, 107, 0, 3, 5, 6, 7, 97, 8, 108, 0, 0, 0, 1, 97, 9, 97, 10
    // @ts-ignore
  ]))).toEqual(new Map([
    [1, new Tuple([1, 2, 3])],
    [4, new Charlist(new Uint8Array([5, 6, 7]))],
    [8, new List([9], 10)]
  ]))
})

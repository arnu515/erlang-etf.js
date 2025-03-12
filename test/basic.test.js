// @ts-check

import {test, expect} from "bun:test"
import {convert} from ".."
import { Atom, NonByteAlignedBinary } from "../objects"

test("integers", async () => {
  const arr = new Array(255).fill(255)
  arr.push(1)
  let num = 0n
  arr.forEach((v, i) => {
    num |= BigInt(v) << 8n*BigInt(i)
  })

  expect(await convert(new Uint8Array([131,97, 255]))).toBe(255)
  expect(await convert(new Uint8Array([131, 98, 255, 255, 255, 255]))).toBe(-1)
  expect(await convert(new Uint8Array([131, 98, 127, 255, 255, 255]))).toBe(2**31-1)
  expect(await convert(new Uint8Array([131, 110, 4, 0, 0, 0, 0, 128]))).toBe(2**31)
  expect(await convert(new Uint8Array([131, 110, 4, 1, 0, 0, 0, 128]))).toBe(-(2**31))
  expect(await convert(new Uint8Array([131, 98, 128, 0, 0, 0]))).toBe(-(2**31))
  expect(await convert(new Uint8Array([131, 111, 0, 0, 1, 0, 0, ...arr]))).toBe(num)
  expect(await convert(new Uint8Array([131, 111, 0, 0, 1, 0, 1, ...arr]))).toBe(-num)
})

test("floats", async () => {
  expect(await convert(new Uint8Array([131, 99, 48, 48, 48, 48, 48, 51, 46, 49, 52, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 49, 50, 52, 51, 52, 101, 43, 48, 48, 0]))).toBe(3.14)
  expect(await convert(new Uint8Array([131, 70, 64, 9, 30, 184, 81, 235, 133, 31]))).toBe(3.14)
  expect(await convert(new Uint8Array([131, 70, 64, 254, 15, 49, 247, 206, 217, 23]))).toBe(123123.123)
  expect(await convert(new Uint8Array([131, 70, 192, 94, 199, 223, 59, 100, 90, 29]))).toBe(-123.123)
})

test("atoms", async () => {
  expect(await convert(new Uint8Array([131, 115, 3, 97, 98, 99]))).toEqual(new Atom("abc"))
  expect(await convert(new Uint8Array([131, 100, 0, 3, 97, 98, 99]))).toEqual(new Atom("abc"))
  expect(await convert(new Uint8Array([131, 119, 3, 97, 98, 99]))).toEqual(new Atom("abc"))
  expect(await convert(new Uint8Array([131, 118, 0, 3, 97, 98, 99]))).toEqual(new Atom("abc"))
  expect(await convert(new Uint8Array([131, 119, 2, 194, 177]))).toEqual(new Atom("±"))
  expect(await convert(new Uint8Array([131, 118, 0, 2, 194, 177]))).toEqual(new Atom("±"))
  expect(await convert(new Uint8Array([131, 119, 4, 240, 159, 165, 186]))).toEqual(new Atom("🥺"))
})

test("charlists", async () => {
  expect(await convert(new Uint8Array([131, 106]))).toEqual([])  
  expect(await convert(new Uint8Array([131, 107, 0, 3, 1, 2, 3]))).toEqual(new Uint8Array([1, 2, 3])) 
})

test("binaries", async () => {
  expect(await convert(new Uint8Array([131,109,0,0,0,3,1,2,3]))).toEqual(new Uint8Array([1,2,3]))
  expect(await convert(new Uint8Array([131,109,0,0,0,0]))).toEqual(new Uint8Array([]))
})

test("non-byte aligned binaries", async () => {
  // <<1:1, 2:2, 3:3, 4:4>>
  expect(await convert(new Uint8Array([131,77,0,0,0,2,2,205,0]))).toEqual(new NonByteAlignedBinary(2, [205, 0]))
  // <<1:1, 2:2, 3:3, 4:4, 5:5>>
  expect(await convert(new Uint8Array([131,77,0,0,0,2,7,205,10]))).toEqual(new NonByteAlignedBinary(7, [205, 5]))
  // <<1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8>>
  expect(await convert(new Uint8Array([131,77,0,0,0,5,4,205,10,48,112,128]))).toEqual(new NonByteAlignedBinary(4, [205, 10, 48, 112, 8]))
})

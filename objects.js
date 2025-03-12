export class Atom {
  /** @type string */
  inner

  /** @param {string} inner */
  constructor(inner) {
    this.inner = inner
  }

  get length() {
    // count the number of codepoints
    return Array.from(this.inner).length 
  }

  toString() {
    return this.inner
  }
}

export class List {
  /** @type Array */
  inner
  /** @type boolean */
  proper
  /** @type any */
  tail

  constructor(inner, tail) {
    this.inner = inner
    this.tail = tail
    this.proper = Array.isArray(tail) && tail.length === 0
  }
}

export class Tuple {
  /** @type Array */
  inner

  get length() {
    return this.inner.length
  }

  constructor(inner) {
    this.inner = inner
  }
}

export class NonByteAlignedBinary extends Uint8Array {
  /** @type number */
  bitsInLastByte
  
  constructor(binb, ...args) {
    super(...args)
    this.bitsInLastByte = binb
  }
}

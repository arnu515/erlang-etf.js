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

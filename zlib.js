// @ts-check

/***
  Zlib driver for uncompression (inflation).

  Uses [DecompressionStream](https://developer.mozilla.org/en-US/docs/Web/API/DecompressionStream/DecompressionStream)
  if available. It is a web standard that is present in Baseline.
  Then uses node:zlib (available on Node, Deno, and Bun).
  Then uses pako (must be installed)
*/

/** pako is not installed -- only happens if the first two implementations
of zlib do not exist */
export const ERROR_PAKO_NOT_INSTALLED = "ERROR_PAKO_NOT_INSTALLED"

/**
  @typedef InflateOpts
  @property {'DecompressionStream' | 'node:zlib' | 'pako' | undefined} using
*/

/**
  Uncompresses a zlib binary.
  @param {Uint8Array} bin 
  @param {InflateOpts} opts
*/
export async function inflate(bin, opts = { using: undefined }) {
  let using = opts.using;
  if (typeof using === 'undefined') {
    if (typeof DecompressionStream !== 'undefined') using = 'DecompressionStream'
    else {
      let e = false
      try {
        await import('node:zlib')
        using = 'node:zlib'
      } catch(er) {
        try {
          await import('pako')
          using = 'pako'
        } catch {
          e = true
        }
      }
      if (e) {
        const e = new Error("`pako` must be installed for zlib support")
        e.name = ERROR_PAKO_NOT_INSTALLED
        throw e
      }
    }
  }
  switch (using) {
    case "DecompressionStream":
      return new Uint8Array(
        await new Response(
          new Blob([bin])
            .stream()
            .pipeThrough(new DecompressionStream('deflate'))
        ).arrayBuffer()
      )
    case "node:zlib": {
      const { inflate: nodeInflate } = await import('node:zlib')
      const { promisify } = await import('node:util')
      const inflate = promisify(nodeInflate)
      return new Uint8Array(await inflate(bin))
    }
    case "pako": {
      const { inflate } = await import('pako')
      return inflate(bin)
    }
    default:
      const e = new Error("`pako` must be installed for zlib support")
      e.name = ERROR_PAKO_NOT_INSTALLED
      throw e
  }
}

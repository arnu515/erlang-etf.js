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
  Uncompresses a zlib binary.
  @param {Uint8Array} bin 
*/
export async function inflate(bin) {
  if (typeof DecompressionStream !== 'undefined') {
    console.log('using decstm')
    return new Uint8Array(
      await new Response(
        new Blob([bin])
          .stream()
          .pipeThrough(new DecompressionStream('deflate'))
      ).arrayBuffer()
    )
  }
  try {
    console.log('using zlib')
    const {inflate: nodeInflate} = await import('node:zlib')
    const {promisify} = await import('node:util')
    const inflate = promisify(nodeInflate)
    return new Uint8Array(await inflate(bin))
  } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e
  }
  try {
    console.log('using pako')
    const {inflate} = await import('pako')
    return inflate(bin)
  } catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') throw e
  }
  const e = new Error("`pako` must be installed for zlib support")
  e.name = ERROR_PAKO_NOT_INSTALLED
  throw e
}

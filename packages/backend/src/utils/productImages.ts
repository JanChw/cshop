import { db } from '../db'
import { productImages } from '../db/schema'
import { eq, inArray, asc } from 'drizzle-orm'

// Fetch images for a batch of products in one indexed query. Returns a Map of
// productId -> ordered path list. Replaces per-row JSON.parse of
// products.images.
export function imagesForProducts(productIds: number[]): Map<number, string[]> {
  const result = new Map<number, string[]>()
  if (productIds.length === 0) return result
  const rows = db.select({ productId: productImages.productId, path: productImages.path })
    .from(productImages)
    .where(inArray(productImages.productId, productIds))
    .orderBy(asc(productImages.sort), asc(productImages.id))
    .all()
  for (const r of rows) {
    const list = result.get(r.productId)
    if (list) list.push(r.path)
    else result.set(r.productId, [r.path])
  }
  return result
}

export function imagesForProduct(productId: number): string[] {
  return imagesForProducts([productId]).get(productId) ?? []
}

// Replace a product's images in one tx-friendly call. Caller is responsible
// for wrapping in a transaction if atomicity with other writes is required.
export function setProductImages(productId: number, paths: string[]): void {
  db.delete(productImages).where(eq(productImages.productId, productId)).run()
  if (paths.length === 0) return
  db.insert(productImages).values(
    paths.map((p, i) => ({ productId, path: p, sort: i }))
  ).run()
}

'use client'

import { useState, useEffect } from 'react'
import type { SampleCategory, MaterialType, Product } from '@/types'

interface Props {
  categories: SampleCategory[]
  categoryId: string
  materialTypeId: string
  productId: string
  onCategoryChange: (id: string, code: string) => void
  onMaterialChange: (id: string, code: string) => void
  onProductChange: (id: string, code: string) => void
  errors: Record<string, string>
}

export default function SampleSelector({
  categories, categoryId, materialTypeId, productId,
  onCategoryChange, onMaterialChange, onProductChange, errors,
}: Props) {
  const [materials, setMaterials] = useState<MaterialType[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingMat, setLoadingMat] = useState(false)
  const [loadingProd, setLoadingProd] = useState(false)

  useEffect(() => {
    if (!categoryId) { setMaterials([]); return }
    setLoadingMat(true)
    fetch(`/api/materials?category_id=${categoryId}`)
      .then((r) => r.json())
      .then((data) => setMaterials(data))
      .finally(() => setLoadingMat(false))
  }, [categoryId])

  useEffect(() => {
    if (!materialTypeId) { setProducts([]); return }
    setLoadingProd(true)
    fetch(`/api/products?material_type_id=${materialTypeId}`)
      .then((r) => r.json())
      .then((data) => setProducts(data))
      .finally(() => setLoadingProd(false))
  }, [materialTypeId])

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div className="section-header" style={{ margin: 0, flex: 1 }}>
          <div className="section-number">1</div>
          <h2>Sample information</h2>
        </div>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Category */}
          <div className="form-group">
            <label>
              Category of sample <span className="required">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value)
                onCategoryChange(e.target.value, cat?.code ?? '')
              }}
              className={errors['_category'] ? 'error' : ''}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
            {errors['_category'] && (
              <span style={{ color: 'var(--c-danger)', fontSize: '0.8125rem' }}>{errors['_category']}</span>
            )}
          </div>

          {/* Material type */}
          {categoryId && (
            <div className="form-group">
              <label>
                Material type <span className="required">*</span>
              </label>
              <select
                value={materialTypeId}
                onChange={(e) => {
                  const mat = materials.find((m) => m.id === e.target.value)
                  onMaterialChange(e.target.value, mat?.code ?? '')
                }}
                disabled={loadingMat}
                className={errors['_material'] ? 'error' : ''}
              >
                <option value="">{loadingMat ? 'Loading…' : 'Select type…'}</option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
              {errors['_material'] && (
                <span style={{ color: 'var(--c-danger)', fontSize: '0.8125rem' }}>{errors['_material']}</span>
              )}
            </div>
          )}

          {/* Product — only if products exist for this material type */}
          {materialTypeId && products.length > 0 && (
            <div className="form-group">
              <label>Specific product / grade</label>
              <select
                value={productId}
                onChange={(e) => {
                  const prod = products.find((p) => p.id === e.target.value)
                  onProductChange(e.target.value, prod?.code ?? '')
                }}
                disabled={loadingProd}
              >
                <option value="">{loadingProd ? 'Loading…' : 'Select product…'}</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

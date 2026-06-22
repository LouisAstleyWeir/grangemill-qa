import { NextRequest, NextResponse } from 'next/server'
import { getProducts } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const materialTypeId = request.nextUrl.searchParams.get('material_type_id')
  if (!materialTypeId) return NextResponse.json([], { status: 400 })

  try {
    const data = await getProducts(materialTypeId)
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

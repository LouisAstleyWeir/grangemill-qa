import { NextRequest, NextResponse } from 'next/server'
import { getMaterialTypes } from '@/lib/queries'

export async function GET(request: NextRequest) {
  const categoryId = request.nextUrl.searchParams.get('category_id')
  if (!categoryId) return NextResponse.json([], { status: 400 })

  try {
    const data = await getMaterialTypes(categoryId)
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch material types' }, { status: 500 })
  }
}

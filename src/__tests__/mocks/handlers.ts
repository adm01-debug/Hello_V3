import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/calls', () => {
    return HttpResponse.json([
      {
        id: '1',
        caller_name: 'João Silva',
        caller_phone: '+5562999999999',
        status: 'active',
      },
    ])
  }),

  http.post('/api/calls', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: '2',
      ...body,
      created_at: new Date().toISOString(),
    }, { status: 201 })
  }),
]

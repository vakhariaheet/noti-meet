import { Hono } from 'hono'
import { handle } from 'hono/vercel'

export const config = {
  runtime: 'edge'
}

const app = new Hono().basePath('/api')

app.get('/', async (c) => {
  await fetch('https://ntfy.sh/occasion-martial-finite-awoken', {
    method: 'POST', // PUT works too
    body: 'Penguin is inviting you to a meet! 🐧🎉',
    headers: {
      Title: 'Penguin Meet',
      Priority: 'urgent',
      Tags: 'computer',
    },
  });
  return c.redirect('https://meet.google.com/mre-oats-wgd?pli=1');
})

export default handle(app)

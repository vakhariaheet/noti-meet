import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { UAParser } from 'ua-parser-js';
export const config = {
  runtime: 'edge'
}

const MEET_URLS = [
  'https://meet.google.com/qur-xzqr-mxf',
  'https://meet.google.com/mre-oats-wgd',
  'https://meet.google.com/jon-ygga-quw',
  'https://meet.google.com/azw-zjey-qpq'
]

function seededRandom(seed: number): number {
  // Linear Congruential Generator for deterministic randomness
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  
  return Math.abs((a * seed + c) % m);
}

function getDailyMeetUrlSecure(secrets:string[]): string {
  const today = new Date();
  const dateString = today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
  
  // Multi-round hashing for better security
  const seed = createSecureSeed(dateString,secrets);
  const index = seededRandom(seed) % MEET_URLS.length;
  
  return MEET_URLS[index];
}

function createSecureSeed(dateString: string,secrets:string[]): number {
  
  
  let hash = 0;
  
  // Multiple rounds of hashing with different salts
  for (const secret of secrets) {
    const combined = dateString + secret + hash.toString();
    
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 7) - hash) + char;
      hash = hash & hash;
    }
    
    // Additional mathematical operations
    hash = Math.abs(hash);
    hash = (hash * 16807) % 2147483647;
  }
  
  return hash;
}


const app = new Hono().basePath('/')
interface IPResponse {
  status: string;
  country: string;
  countryCode: string;
  
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}


app.get('/', async (c) => {
  const platform = new UAParser(c.req.header('User-Agent')).getResult();
  const { ip } = await fetch("https://api.ipify.org?format=json").then(res => res.json())
  const ipInfo = await fetch(`http://ip-api.com/json/${ip}`).then(res => res.json()) as IPResponse;
  const meetUrl = getDailyMeetUrlSecure([process.env.SECRET_1 || '', process.env.SECRET_2 || "", process.env.SECRET_3 || "", process.env.SECRET_4 || "", process.env.SECRET_5 || ""]);
  await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    body: JSON.stringify({
      token: process.env.PUSHOVER_TOKEN,
      user: process.env.PUSHOVER_USER,
      title: `Penguin is inviting you to a meet! 🐧🎉 ${ipInfo.isp.includes('GTPL') ? '' : '(Not GTPL)'}`,
      message: `
  📱 Device Info
  • Browser: ${platform.browser.name} ${platform.browser.version}
  • OS: ${platform.os.name} ${platform.os.version}
  • Device: ${platform.device.vendor || 'Unknown'} ${platform.device.model || 'Device'}
  
  📍 Location Info
  • City: ${ipInfo.city}, ${ipInfo.regionName}
  • Country: ${ipInfo.country}
  • ISP: ${ipInfo.isp}
  • Timezone: ${ipInfo.timezone}
  
  🔗 Join the meeting by clicking the link below!
${meetUrl}
      `,
      url:meetUrl,
      url_title:"Join the meeting!"
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  // return c.text('https://meet.google.com/mre-oats-wgd?pli=1');
  return c.redirect(meetUrl);
})

app.get('/meet', async (c) => {
  const meetUrl = getDailyMeetUrlSecure([process.env.SECRET_1 || '', process.env.SECRET_2 || "", process.env.SECRET_3 || "", process.env.SECRET_4 || "", process.env.SECRET_5 || ""]);
  return c.redirect(meetUrl);
})
export default handle(app)

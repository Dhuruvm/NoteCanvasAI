import express from 'express';
import { registerRoutes } from "./routes";

// Create Express app for Workers compatibility
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Initialize the app
async function initializeApp() {
  const server = await registerRoutes(app);
  return app;
}

// Serve static files and SPA routes
app.get('*', (req, res) => {
  // Serve index.html for all non-API routes (SPA)
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NoteGPT</title>
    <script type="module" crossorigin src="/assets/index-CKCd9JjH.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-BFnmP4Ek.css">
</head>
<body>
    <div id="root"></div>
</body>
</html>`;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// Export default handler for Cloudflare Workers
const handler = {
  async fetch(request: Request, env: any, ctx: any) {
    const app = await initializeApp();
    
    // Convert Cloudflare Workers Request to Node.js request format
    const url = new URL(request.url);
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    
    return new Promise((resolve) => {
      // Create mock Node.js request/response objects for Express
      const req = {
        method,
        url: url.pathname + url.search,
        headers,
        body: request.body,
        get: (name: string) => headers[name.toLowerCase()],
      } as any;
      
      const res = {
        statusCode: 200,
        headers: {} as any,
        body: '',
        status: (code: number) => { res.statusCode = code; return res; },
        json: (data: any) => { 
          res.headers['content-type'] = 'application/json';
          res.body = JSON.stringify(data);
          resolve(new Response(res.body, { status: res.statusCode, headers: res.headers }));
          return res;
        },
        send: (data: any) => {
          res.body = data;
          resolve(new Response(res.body, { status: res.statusCode, headers: res.headers }));
          return res;
        },
        setHeader: (name: string, value: string) => { res.headers[name.toLowerCase()] = value; },
        header: (name: string, value: string) => { res.headers[name.toLowerCase()] = value; },
        end: () => {
          resolve(new Response(res.body, { status: res.statusCode, headers: res.headers }));
        }
      } as any;
      
      // Call Express app
      app(req, res, () => {
        resolve(new Response('Not Found', { status: 404 }));
      });
    });
  },
};

export default handler;
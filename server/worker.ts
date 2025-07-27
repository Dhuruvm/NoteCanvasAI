import { handleRequest } from "./workers-simple";

// Export default handler for Cloudflare Workers
export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    try {
      return await handleRequest(request);
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  },
};
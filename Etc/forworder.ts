import { serve } from "https://deno.land/std@0.114.0/http/server.ts";

async function handler(req: Request): Promise<Response> {
// console.log(req.headers);
// console.log(req.method, req.url);
const url = req.url;
const path = url.substring(url.indexOf('.dev') + 4);
return await fetch(`http://59.46.86.120:9002${path}`);
}

console.log("Listening on http://59.46.86.120:9002");
serve(handler);

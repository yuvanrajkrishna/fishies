import {checkRequest} from '@/lib/tinyfish';
import {saveCreatureRequest} from '@/lib/request-store';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 4096;
const noStore = {'Cache-Control':'no-store'};

export async function POST(request: Request) {
  try {
    checkRequest(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request could not be accepted.';
    const rateLimited = message.includes('Too many requests');
    return Response.json({error:message}, {status:rateLimited ? 429 : 403, headers:{...noStore, ...(rateLimited ? {'Retry-After':'60'} : {})}});
  }

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    return Response.json({error:'Please send a JSON creature request.'}, {status:415, headers:noStore});
  }

  let body: unknown;
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new Error('Missing body');
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return Response.json({error:'Please keep your suggestion short.'}, {status:413, headers:noStore});
      }
      chunks.push(value);
    }
    body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return Response.json({error:'Your request could not be read. Please try again.'}, {status:400, headers:noStore});
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({error:'Please enter a creature name.'}, {status:400, headers:noStore});
  }
  const {species, why = ''} = body as Record<string, unknown>;
  if (typeof species !== 'string' || species.trim().length < 2 || species.length > 100 || typeof why !== 'string' || why.length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(species + why)) {
    return Response.json({error:'Use a creature name of 2–100 characters and a note of up to 500 characters.'}, {status:400, headers:noStore});
  }

  if (process.env.VERCEL) {
    return Response.json({saved:false, storage:'browser', error:'Requests aren’t sent to the creator yet. Save this suggestion in your browser instead.'}, {status:501, headers:noStore});
  }

  try {
    const id = await saveCreatureRequest(species.trim().replace(/\s+/g, ' '), why.trim());
    return Response.json({saved:true, id, message:'Saved to this demo’s request list.'}, {status:201, headers:noStore});
  } catch {
    return Response.json({error:'This demo could not save your suggestion right now. Please try again later.'}, {status:503, headers:noStore});
  }
}

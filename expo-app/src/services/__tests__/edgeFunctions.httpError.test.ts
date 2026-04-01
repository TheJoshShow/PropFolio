import { FunctionsHttpError } from '@supabase/functions-js';
import { tryReadFunctionsHttpErrorBody } from '../edgeFunctions';

describe('tryReadFunctionsHttpErrorBody', () => {
  it('extracts error string from JSON body', async () => {
    const res = new Response(
      JSON.stringify({ error: 'GOOGLE_MAPS_API_KEY not configured' }),
      { status: 503 }
    );
    const err = new FunctionsHttpError(res);
    await expect(tryReadFunctionsHttpErrorBody(err)).resolves.toBe('GOOGLE_MAPS_API_KEY not configured');
  });

  it('falls back to message key', async () => {
    const res = new Response(JSON.stringify({ message: 'Upstream timeout' }), { status: 502 });
    const err = new FunctionsHttpError(res);
    await expect(tryReadFunctionsHttpErrorBody(err)).resolves.toBe('Upstream timeout');
  });

  it('returns truncated plain text when body is not JSON', async () => {
    const res = new Response('Service unavailable', { status: 503 });
    const err = new FunctionsHttpError(res);
    await expect(tryReadFunctionsHttpErrorBody(err)).resolves.toBe('Service unavailable');
  });

  it('returns null for non-FunctionsHttpError', async () => {
    await expect(tryReadFunctionsHttpErrorBody(new Error('x'))).resolves.toBeNull();
  });
});

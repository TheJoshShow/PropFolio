import { serveAutocompleteAddress } from '../_shared/autocompleteAddressHttp.ts';

Deno.serve(serveAutocompleteAddress);

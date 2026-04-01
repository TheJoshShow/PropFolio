import { mapAutocompleteEdgeError, mapGeocodeErrorForDisplay } from '../importPipelineErrors';

describe('mapGeocodeErrorForDisplay', () => {
  it('maps missing API key copy', () => {
    const s = mapGeocodeErrorForDisplay('GOOGLE_MAPS_API_KEY not configured');
    expect(s).toContain('GOOGLE_MAPS_API_KEY');
    expect(s.toLowerCase()).toContain('admin');
  });

  it('maps generic non-2xx', () => {
    const s = mapGeocodeErrorForDisplay('Edge Function returned a non-2xx status code');
    expect(s.toLowerCase()).toContain('edge');
  });

  it('handles empty', () => {
    expect(mapGeocodeErrorForDisplay(null)).toContain('coordinates');
  });
});

describe('mapAutocompleteEdgeError', () => {
  it('maps non-2xx invoke message', () => {
    const r = mapAutocompleteEdgeError('Edge Function returned a non-2xx status code');
    expect(r.kind).toBe('autocomplete_network');
    expect(r.userMessage.toLowerCase()).toContain('server');
  });
});

import {
  validateAuthEnv,
  getAuthConfigurationUserMessage,
  getSupabaseAuthEnvPublicDiagnostics,
} from '../env';

const ORIGINAL = { ...process.env };

function setEnv(overrides: Record<string, string | undefined>) {
  process.env = { ...ORIGINAL, ...overrides };
}

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe('validateAuthEnv', () => {
  it('passes for plausible Supabase URL and JWT anon key', () => {
    const url = 'https://abcdefgh.supabase.co';
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    const r = validateAuthEnv();
    expect(r.isValid).toBe(true);
    expect(r.missing).toHaveLength(0);
    expect(r.invalidReasons).toHaveLength(0);
  });

  it('fails when vars missing', () => {
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: '',
    });
    const r = validateAuthEnv();
    expect(r.isValid).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('fails for template hostname your-project', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTU1NjM2MDAwfQ.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://your-project.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    const r = validateAuthEnv();
    expect(r.isValid).toBe(false);
    expect(r.invalidReasons.some((x) => x.includes('template'))).toBe(true);
  });

  it('does not reject real project URL that happens to contain no template substrings', () => {
    const url = 'https://imdwzvmcwzccikboppdu.supabase.co';
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltZHd6dm1jd3pjY2lrYm9wcGR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    expect(validateAuthEnv().isValid).toBe(true);
  });

  it('fails JWT anon key that is too short', () => {
    const url = 'https://abcdefgh.supabase.co';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: url,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'eyJshort',
    });
    const r = validateAuthEnv();
    expect(r.isValid).toBe(false);
    expect(r.invalidReasons.some((x) => x.toLowerCase().includes('anon'))).toBe(true);
  });

  it('fails when EAS never substituted EXPO_PUBLIC_SUPABASE_URL (literal ${...})', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: '${EXPO_PUBLIC_SUPABASE_URL}',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    const r = validateAuthEnv();
    expect(r.isValid).toBe(false);
    expect(r.invalidReasons.some((x) => x.toLowerCase().includes('not replaced'))).toBe(true);
  });

  it('allows localhost Supabase in development (__DEV__)', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvY2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    expect(validateAuthEnv().isValid).toBe(true);
  });
});

describe('validateAuthEnv (release / __DEV__ === false)', () => {
  const g = globalThis as { __DEV__?: boolean };
  let prev: boolean | undefined;

  beforeAll(() => {
    prev = g.__DEV__;
    g.__DEV__ = false;
  });

  afterAll(() => {
    g.__DEV__ = prev;
  });

  it('requires https and .supabase.co hostname', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    process.env = {
      ...ORIGINAL,
      EXPO_PUBLIC_SUPABASE_URL: 'https://abcdefgh.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    };
    expect(validateAuthEnv().isValid).toBe(true);
  });

  it('rejects non-supabase hostname in release', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    process.env = {
      ...ORIGINAL,
      EXPO_PUBLIC_SUPABASE_URL: 'https://api.example.com',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    };
    const r = validateAuthEnv();
    expect(r.isValid).toBe(false);
    expect(r.invalidReasons.some((x) => x.includes('.supabase.co'))).toBe(true);
  });

  it('rejects http for supabase.co in release', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    process.env = {
      ...ORIGINAL,
      EXPO_PUBLIC_SUPABASE_URL: 'http://abcdefgh.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    };
    const r = validateAuthEnv();
    expect(r.isValid).toBe(false);
    expect(r.invalidReasons.some((x) => x.toLowerCase().includes('https'))).toBe(true);
  });
});

describe('getSupabaseAuthEnvPublicDiagnostics', () => {
  it('reports presence and validation flags without exposing secrets', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://abcdefgh.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    const d = getSupabaseAuthEnvPublicDiagnostics();
    expect(d.expoPublicSupabaseUrlPresent).toBe(true);
    expect(d.expoPublicSupabaseAnonKeyPresent).toBe(true);
    expect(d.supabaseUrlSyntaxValid).toBe(true);
    expect(d.validationOk).toBe(true);
    expect(d.developerSummaryLines.some((l) => l.includes('characters'))).toBe(true);
    expect(d.developerSummaryLines.join('\n').includes(key)).toBe(false);
  });
});

describe('getAuthConfigurationUserMessage', () => {
  it('returns null when valid', () => {
    const key =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDAwMDAwMDAsImV4cCI6MTk1NTYzNjAwMH0.' +
      'abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnop';
    setEnv({
      EXPO_PUBLIC_SUPABASE_URL: 'https://abcdefgh.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: key,
    });
    expect(getAuthConfigurationUserMessage()).toBeNull();
  });

  it('mentions EAS when missing', () => {
    setEnv({ EXPO_PUBLIC_SUPABASE_URL: '', EXPO_PUBLIC_SUPABASE_ANON_KEY: '' });
    const msg = getAuthConfigurationUserMessage();
    expect(msg).toBeTruthy();
    expect(msg!.toLowerCase()).toContain('eas');
  });
});

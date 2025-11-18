export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const randomDelay = () => 150 + Math.floor(Math.random() * 300);

export const waitRandom = () => wait(randomDelay());

export const maskSecret = (secret: string) =>
  secret
    .split('')
    .map((char, index) => (index < secret.length - 4 ? '*' : char))
    .join('');

export const createDeviceId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `device-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

export const createToken = () =>
  `mock-token-${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

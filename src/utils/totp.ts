const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export interface OtpAuthOptions {
  accountName: string;
  issuer?: string;
  secret: string;
  period?: number;
  digits?: number;
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
}

export const generateBase32Secret = (length = 20): string => {
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined;
  const randomValues = cryptoObj
    ? cryptoObj.getRandomValues(new Uint8Array(length))
    : Array.from({ length }, () => Math.floor(Math.random() * 256));

  let secret = '';
  for (let i = 0; i < length; i += 1) {
    secret += BASE32_ALPHABET.charAt(randomValues[i] % BASE32_ALPHABET.length);
  }
  return secret;
};

export const createOtpAuthUrl = ({
  accountName,
  issuer = 'Open2FA',
  secret,
  period = 30,
  digits = 6,
  algorithm = 'SHA1'
}: OtpAuthOptions): string => {
  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    period: String(period),
    digits: String(digits),
    algorithm
  });

  return `otpauth://totp/${label}?${params.toString()}`;
};

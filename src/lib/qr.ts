export type BuildQrUrlOptions = {
  data: string;
  size?: number;
  fg?: string;
  bg?: string;
};

export function buildQrUrl({
  data,
  size = 300,
  fg = '0A0A0A',
  bg = 'FFFFFF',
}: BuildQrUrlOptions) {
  const params = new URLSearchParams({
    data,
    size: String(size),
    fg,
    bg,
  });

  return `/api/qr?${params.toString()}`;
}

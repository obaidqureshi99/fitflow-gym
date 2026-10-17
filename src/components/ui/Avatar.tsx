export default function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  // eslint-disable-next-line @next/next/no-img-element
  if (src) return <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return <span style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-brand/20 text-xs font-bold text-brand">{initials}</span>;
}

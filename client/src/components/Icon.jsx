// Minimal inline icon set (stroke icons, 20px grid). No icon font needed.
const PATHS = {
  copy: 'M8 8h9v11H8zM5 15V4h9',
  check: 'M4 11l4 4 8-9',
  undo: 'M8 5L4 9l4 4M4 9h9a4 4 0 010 8h-3',
  refresh: 'M16 6a7 7 0 10 1 6M16 2v4h-4',
  send: 'M3 10l14-6-6 14-2-6-6-2z',
  stop: 'M6 6h8v8H6z',
  user: 'M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3.5 17.5c1-3 3.5-4.5 6.5-4.5s5.5 1.5 6.5 4.5',
  gear: 'M10 13a3 3 0 100-6 3 3 0 000 6zM10 1.5v2.2M10 16.3v2.2M18.5 10h-2.2M3.7 10H1.5M16 4l-1.6 1.6M5.6 14.4L4 16M16 16l-1.6-1.6M5.6 5.6L4 4',
  list: 'M7 5h10M7 10h10M7 15h10M3 5h.01M3 10h.01M3 15h.01',
  close: 'M5 5l10 10M15 5L5 15',
  plus: 'M10 4v12M4 10h12',
  trash: 'M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11',
  download: 'M10 3v10M6 9l4 4 4-4M4 17h12',
  spark: 'M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8z',
  doc: 'M5 2h7l3 3v13H5zM12 2v3h3',
  chat: 'M3 4h14v9H8l-4 3v-3H3z',
  edit: 'M13 3l4 4-9 9H4v-4z',
  eye: 'M1.5 10S5 4 10 4s8.5 6 8.5 6-3.5 6-8.5 6S1.5 10 1.5 10zM10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  upload: 'M10 13V3M6 7l4-4 4 4M4 17h12',
  moon: 'M16 12.5A7 7 0 017.5 4 7 7 0 1016 12.5z',
};

export default function Icon({ name, size = 18, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <path d={PATHS[name]} />
    </svg>
  );
}

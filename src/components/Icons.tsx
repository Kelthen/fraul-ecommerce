// Icônes au trait, décoratives (le texte à côté porte le sens).
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

export const IconHome = () => (<svg {...base}><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z" /></svg>);
export const IconBrands = () => (<svg {...base}><path d="M4 7h16M4 12h16M4 17h10" /></svg>);
export const IconWalk = () => (<svg {...base}><path d="M3 21V9l9-5 9 5v12" /><path d="M9 21v-6h6v6" /></svg>);
export const IconOutfit = () => (<svg {...base}><path d="M8 3l4 2 4-2 5 4-3 4-2-1v11H8V10l-2 1-3-4z" /></svg>);
export const IconHeart = () => (<svg {...base}><path d="M12 20.5s-7.5-4.6-9.2-9.3C1.6 7.8 3.8 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.9 1.4-1.8 2.8-2.9 4.8-2.9 3.4 0 5.6 3.3 4.4 6.7-1.7 4.7-9.2 9.3-9.2 9.3z" /></svg>);
export const IconBag = () => (<svg {...base}><path d="M5 8h14l-1 13H6z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>);
export const IconSearch = () => (<svg {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>);
export const IconTruck = () => (<svg {...base}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>);
export const IconLock = () => (<svg {...base}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>);
export const IconSpark = () => (<svg {...base}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" /></svg>);
export const IconPin = () => (<svg {...base}><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>);
export const IconCheck = () => (<svg {...base}><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>);
export const IconArrow = () => (<svg {...base} width={16} height={16}><path d="M5 12h14M13 6l6 6-6 6" /></svg>);

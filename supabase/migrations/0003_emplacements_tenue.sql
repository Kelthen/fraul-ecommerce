-- 0003 — Emplacements de tenue alignés sur src/lib/catalog/types.ts.
-- Validé par Serge le 18 oct. 2026 ; appliqué sur le projet Supabase `fraul` le 18 oct. 2026 (nom : emplacements_tenue).
alter type public.outfit_slot add value if not exists 'cap'     before 'top';
alter type public.outfit_slot add value if not exists 'glasses' after 'cap';
alter type public.outfit_slot add value if not exists 'neck'    after 'glasses';
alter type public.outfit_slot add value if not exists 'watch'   after 'neck';
alter type public.outfit_slot add value if not exists 'layer'   after 'top';
alter type public.outfit_slot add value if not exists 'socks'   after 'bottom';

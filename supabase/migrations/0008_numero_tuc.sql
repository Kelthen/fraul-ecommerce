-- 0008 — Nouveau nom du site : TakeUrClothes (décision de Rhamone, 1er nov. 2026).
-- Les nouvelles commandes sont numérotées « TUC-2026-000123 » ; celles d'avant gardent « FRL-… »
-- (le bot les lit encore, src/models/relay/codes.ts). Même compteur : aucun numéro ne se répète.
alter table orders
  alter column number set default 'TUC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('order_number_seq')::text, 6, '0');

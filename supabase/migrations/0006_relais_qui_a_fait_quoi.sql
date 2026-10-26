-- 0006 — Relais : qui a touché quel bouton (groupe Telegram de l'équipe).
-- Demandé par Serge le 21 oct. 2026 : voir dans chaque message ce qui est déjà transféré, par qui, et ce qui reste.
-- Prénom Telegram seulement (pas d'identifiant), affiché dans le message de commande et sur la carte de suivi.

alter table order_parcels add column if not exists forwarded_by text check (char_length(forwarded_by) <= 40);
alter table order_parcels add column if not exists received_by  text check (char_length(received_by) <= 40);
alter table tracking_submissions add column if not exists decided_by text check (char_length(decided_by) <= 40);

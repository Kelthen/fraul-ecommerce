-- 0007 — Relais : boutons « ↩️ Corriger » qui disparaissent seuls, « reçu » coché par l'expéditeur.
-- Demandé par Serge le 22 oct. 2026 : aucun bouton ne doit rester après une validation (risque de mauvaise
-- manipulation). On note jusqu'à quand le bouton « Corriger » est affiché pour l'effacer ensuite.

alter table order_parcels add column if not exists undo_until timestamptz;
alter table tracking_submissions add column if not exists undo_until timestamptz;
create index if not exists order_parcels_undo_until on order_parcels (undo_until) where undo_until is not null;
create index if not exists tracking_submissions_undo_until on tracking_submissions (undo_until) where undo_until is not null;

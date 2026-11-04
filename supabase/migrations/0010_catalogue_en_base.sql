-- 0010 — Le catalogue passe dans la base (Rhamone, 4 nov. 2026) : Jean Paul pourra ajouter, modifier
-- et retirer des articles depuis l'admin, sans passer par le code.
-- Le site lit les articles « actifs » ET « sur le site ». Les produits créés par une commande
-- (src/lib/server/catalog-db.ts) restent hors du site tant que personne ne les y met.
alter table products
  add column cost      integer check (cost >= 0),         -- coût fournisseur de référence, en fen (1 ¥ = 100)
  add column weight_g  integer check (weight_g > 0),      -- poids moyen, pour la livraison au kilo
  add column colors    text[] not null default '{}',      -- teintes (#RRGGBB), la première est la principale
  add column sizes     text[],                            -- null = tailles de la catégorie
  add column on_site   boolean not null default false,    -- visible sur le site (retirer = false, jamais effacer)
  add column position  integer not null default 0;        -- ordre d'affichage (plus petit = plus haut)

create index on products (on_site, status, position);

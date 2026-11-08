-- Photos par couleur (Rhamone, 8 nov. 2026) : une photo peut appartenir à une couleur de l'article (#RRGGBB).
-- Sans couleur : photo principale (celle de la première couleur), comme avant.
alter table product_images add column if not exists color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$');

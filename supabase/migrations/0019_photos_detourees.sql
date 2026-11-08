-- Photos détourées automatiquement (Rhamone, 8 nov. 2026) : .github/workflows/detourage.yml les fabrique
-- (fond transparent, WebP) dans le stockage « produits/detoure/ ».
-- null : pas encore traitée ; '' : détourage impossible (on garde la photo d'origine) ; sinon l'adresse publique.
alter table product_images add column if not exists cutout text;

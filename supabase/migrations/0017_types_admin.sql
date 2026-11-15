-- Types de vêtement créés depuis l'admin (Rhamone, 8 nov. 2026) : poids moyen proposé dans la fiche article.
-- Les 12 types du code restent ; un nouveau type n'a pas encore de portant dans le Walk (visible sur le site seulement).
alter table categories add column if not exists weight_g integer check (weight_g between 10 and 30000);

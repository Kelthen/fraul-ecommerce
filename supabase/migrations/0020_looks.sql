-- Looks de l'accueil ajoutés depuis l'admin (/admin/looks) par Jean Paul (Rhamone, 8 nov. 2026).
-- photo : photo du look porté ; cutout : version détourée (détourage automatique, .github/workflows/detourage.yml) ;
-- items : adresses (slug) des articles portés. Lu et écrit côté serveur seulement (clé service) : pas de règle publique.
create table if not exists looks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 60),
  photo text not null,
  cutout text,
  items text[] not null default '{}' check (cardinality(items) between 2 and 6),
  position integer not null default 0,
  on_site boolean not null default true,
  created_at timestamptz not null default now()
);
alter table looks enable row level security;

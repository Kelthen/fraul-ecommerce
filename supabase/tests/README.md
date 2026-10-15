# Tests du schéma

Vérifie la migration et la sécurité ligne par ligne (RLS) sur un Postgres local, sans Supabase.

```bash
createdb fraul_test
psql -d fraul_test -f supabase/tests/00_supabase_stub.sql        # imite auth.users, auth.uid(), rôles anon/authenticated
psql -d fraul_test -f supabase/migrations/0001_initial_schema.sql
psql -d fraul_test -f supabase/migrations/0002_securite_fonctions.sql
psql -d fraul_test -tAq -f supabase/tests/01_rls_test.sql         # chaque ligne dit ce qui est attendu
```

Résultat attendu : visiteur = produits publiés seulement ; client = ses propres commandes, sans pouvoir créer
de commande, toucher aux prix ou changer son groupe ; admin = tout. Le suivi public passe par `public_tracking(jeton)`.

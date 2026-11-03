# Tests du schéma

Vérifie la migration et la sécurité ligne par ligne (RLS) sur un Postgres local, sans Supabase.

```bash
createdb fraul_test
psql -d fraul_test -f supabase/tests/00_supabase_stub.sql        # imite auth.users, auth.uid(), rôles anon/authenticated
for m in supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -d fraul_test -f "$m"; done
psql -d fraul_test -tAq -f supabase/tests/01_rls_test.sql         # chaque ligne dit ce qui est attendu
```

Résultat attendu : visiteur = produits publiés seulement ; client = ses propres commandes, sans pouvoir créer
de commande, toucher aux prix ou changer son groupe ; admin = tout. Le suivi public passe par `public_tracking(jeton)`.
Les lignes `OK:` / `ECHEC:` s'affichent en NOTICE : **aucune ligne `ECHEC:` ne doit apparaître**.

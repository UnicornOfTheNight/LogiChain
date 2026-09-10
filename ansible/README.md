# Ansible — Provisionnement & déploiement LogiChain

Provisionne intégralement le serveur (sécurité système, MongoDB, Nginx,
runtime applicatif) et déploie l'API LogiChain, de façon idempotente :
le playbook peut être rejoué autant de fois que nécessaire sans effet de
bord.

Ce VPS héberge aussi le projet **Dromozic** : tous les rôles sont conçus en
mode additif (voir la section "Cohabitation avec Dromozic" plus bas).

## Structure

```
ansible/
├── ansible.cfg
├── requirements.yml
├── site.yml                          # playbook maître
├── inventory/production.ini
├── group_vars/production/
│   ├── vars.yml                      # variables non sensibles
│   └── vault.yml.example             # modèle des secrets (le vrai vault.yml n'est jamais commité)
└── roles/
    ├── system_security/              # apt, utilisateur de service, UFW, SSH, Fail2Ban
    ├── database/                     # utilisateur + base + index MongoDB
    ├── web_proxy/                    # Nginx (+ Let's Encrypt si domaine configuré)
    └── app_runtime/                  # Node.js, PM2 (pm2-runtime), déploiement du code, systemd
```

`bootstrap.yml` + `inventory/bootstrap.ini` : playbook séparé, à lancer une
seule fois en root/mot de passe pour créer l'utilisateur sudo (voir
ci-dessous). `site.yml` ne s'utilise ensuite plus qu'avec cet utilisateur.

## Étape 0 — Bootstrap (une seule fois : accès actuel = root + mot de passe)

Le VPS n'a aujourd'hui qu'un accès root par mot de passe, pas encore
d'utilisateur sudo avec clé SSH. On le crée avant toute chose.

1. Générer une paire de clés SSH dédiée à ce déploiement (ne réutilise pas
   une clé personnelle) :
   ```bash
   ssh-keygen -t ed25519 -C "logichain-deploy" -f ~/.ssh/logichain_deploy_ed25519
   ```
   (passphrase recommandée ; laisse vide si tu veux que l'automatisation
   CI/CD future puisse s'en servir sans interaction).

2. Installer les collections Ansible requises :
   ```bash
   ansible-galaxy collection install -r requirements.yml
   ```

3. Lancer le bootstrap (mot de passe root demandé de façon interactive,
   jamais stocké dans un fichier) :
   ```bash
   ansible-playbook bootstrap.yml -i inventory/bootstrap.ini --ask-pass \
     -e deploy_user=deploy \
     -e deploy_public_key_path=~/.ssh/logichain_deploy_ed25519.pub
   ```

4. **Vérifier impérativement, dans un NOUVEAU terminal**, avant de continuer :
   ```bash
   ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96
   sudo whoami   # doit répondre "root", sans redemander de mot de passe
   ```
   Si ça échoue, **ne ferme pas ta session root existante** et corrige avant
   d'aller plus loin.

5. `inventory/production.ini` est déjà pré-rempli pour l'utilisateur `deploy`
   et cette clé. Si tu as choisi un autre nom d'utilisateur (étape 3) ou un
   autre chemin de clé (étape 1), mets à jour `ansible_user` et
   `ansible_ssh_private_key_file` dans ce fichier en conséquence.

C'est seulement une fois cette étape validée que `site.yml` (qui désactive
`PermitRootLogin` et `PasswordAuthentication`) peut être lancé sans risque
de te bloquer hors du serveur.

## Pré-requis avant `site.yml`

1. Vérifier qu'aucun des ports choisis (`nginx_listen_port: 8081`,
   `logichain_api_port: 4000`) n'est déjà utilisé par Dromozic :
   ```bash
   ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96 "sudo ss -tlnp"
   ```
   Si conflit, ajuste les valeurs dans `group_vars/production/vars.yml`.
2. Créer le fichier de secrets chiffré (copier le contenu de
   `vault.yml.example`, remplacer les `CHANGE_ME`) :
   ```bash
   ansible-vault create group_vars/production/vault.yml
   ```
   `vault_mongodb_admin_user`/`vault_mongodb_admin_password` sont les
   identifiants admin **à créer** pour la nouvelle instance MongoDB dédiée
   à LogiChain (le rôle `database` l'installe, aucune instance n'existait
   sur ce VPS). Choisis-les toi-même, et génère des mots de passe/secrets
   forts pour le reste, par exemple :
   ```bash
   openssl rand -hex 32
   ```

## Lancer le provisionnement complet (une seule commande)

> Note WSL : quand le dépôt est ouvert depuis `/mnt/d/...` (un disque Windows
> monté dans WSL), Ansible ignore `ansible.cfg` ("world writable directory")
> — on passe donc `-i` explicitement à chaque commande ci-dessous.

```bash
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass
```

Recommandé avant le premier run réel, pour voir ce qui va changer sans rien
appliquer :

```bash
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass --check --diff
```

**Sécurité SSH** : le rôle `system_security` désactive `PasswordAuthentication`
et `PermitRootLogin`. Garde une deuxième session SSH ouverte en parallèle
lors du premier lancement, pour pouvoir corriger si besoin.

## Vérifier l'idempotence

Relancer immédiatement le même playbook doit afficher `changed=0` sur (quasi)
toutes les tâches :

```bash
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass
```

## Cohabitation avec Dromozic

- **UFW** : jamais de `ufw reset`, uniquement des règles `allow`/`limit`
  ajoutées aux règles existantes.
- **apt** : `upgrade: safe` (pas `dist-upgrade`), pour ne pas risquer de
  casser une dépendance dont Dromozic a besoin.
- **MongoDB** : aucune instance sur ce VPS (Dromozic utilise PostgreSQL,
  port 5432) — `mongodb_manage_installation: true` installe une instance
  MongoDB dédiée, liée à `127.0.0.1` uniquement (non exposée sur le réseau,
  ne touche pas au port 5432 de Dromozic), avec authentification activée et
  un utilisateur `logichain_app` scopé en lecture/écriture sur la seule
  base `logichain` (principe du moindre privilège).
- **Nginx** : un vhost dédié (`sites-available/logichain.conf`) sur un port
  distinct (`8081`) tant qu'aucun sous-domaine n'est pointé — n'écrase ni ne
  modifie le(s) vhost(s) de Dromozic.
- **PM2/Node** : processus dédié (`logichain-api`, utilisateur système
  `logichain` non-root), isolé du reste.

## Rollback rapide

```bash
# Revenir à une version antérieure du code et redéployer
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass -e logichain_version=<tag_ou_commit_precedent> --tags app_runtime
```

(Détail complet du rollback et des sauvegardes MongoDB : voir le Runbook à
la racine du dépôt, chantier suivant.)

## Déploiement continu (GitHub Actions)

Le workflow `.github/workflows/cd.yml` exécute ce même `site.yml` depuis
GitHub Actions à chaque push sur `main` touchant `logichain-api/**` ou
`ansible/**` — mais reste **en attente d'une validation manuelle** grâce à
un environnement GitHub protégé, avant de s'exécuter réellement.

### 1. Créer l'environnement protégé `production`

*Settings → Environments → New environment* → nom : `production` →
*Required reviewers* : toi-même (et toute personne qui rejoindra le projet).

### 2. Ajouter les secrets du dépôt

*Settings → Secrets and variables → Actions → New repository secret* :

| Secret                    | Valeur                                                        |
|----------------------------|------------------------------------------------------------------|
| `DEPLOY_SSH_PRIVATE_KEY`   | Contenu complet de `~/.ssh/logichain_deploy_ed25519` (la clé **privée**, jamais la `.pub`) |
| `ANSIBLE_VAULT_PASSWORD`   | Le mot de passe choisi lors de `ansible-vault create group_vars/production/vault.yml` |

Pour récupérer le contenu de la clé privée (dans WSL) :

```bash
cat ~/.ssh/logichain_deploy_ed25519
```

Copie tout, y compris les lignes `-----BEGIN OPENSSH PRIVATE KEY-----` et
`-----END OPENSSH PRIVATE KEY-----`.

### 3. Déclencher un déploiement

- Automatiquement : merge une PR sur `main` touchant `logichain-api/` ou
  `ansible/` → le job apparaît en attente dans l'onglet *Actions* →
  *Review deployments* → *Approve and deploy*.
- Manuellement : onglet *Actions* → *CD - Deploiement production* →
  *Run workflow*.

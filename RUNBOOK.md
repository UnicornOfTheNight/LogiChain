# Runbook — LogiChain

Document opérationnel : déploiement, rollback, sauvegardes, incidents
connus. Destiné à l'équipe qui reprend l'exploitation du projet.

## 1. Vue d'ensemble de l'infrastructure

- **VPS** : `187.127.84.96` (Ubuntu 22.04), partagé avec le projet Dromozic.
- **API** : Node.js, supervisée par `pm2-runtime` sous systemd
  (`logichain-api.service`), écoute sur `127.0.0.1:4000`.
- **Reverse proxy** : Nginx, expose l'API sur le port `8081` (pas de domaine
  pour l'instant — voir `ansible/README.md` pour basculer sur 443/TLS).
- **Base de données** : MongoDB dédié, authentifié, lié à `127.0.0.1`.
- **Accès SSH** : utilisateur `deploy` (clé `logichain_deploy_ed25519`),
  root et mot de passe désactivés.
- **CI/CD** : GitHub Actions, runner self-hébergé sur le VPS lui-même (voir
  `ansible/README.md` section "Déploiement continu").

## 2. Procédure de déploiement

### Normale (recommandée)

1. Merge une PR sur `main` touchant `logichain-api/` ou `ansible/`.
2. Le workflow `CD - Deploiement production` se déclenche automatiquement
   mais reste en attente.
3. GitHub → onglet *Actions* → run en attente → *Review deployments* →
   *Approve and deploy*.
4. Le playbook `site.yml` complet s'exécute (idempotent — ne touche que ce
   qui a changé).

### Manuelle (si la CI est indisponible)

Depuis un poste avec Ansible installé (WSL recommandé sous Windows, voir
`ansible/README.md`) :

```bash
cd ansible
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass
```

## 3. Rollback

### Rollback applicatif (code de l'API)

Redéployer une version antérieure du code sans toucher au reste de
l'infrastructure (base de données, Nginx, sécurité) :

```bash
cd ansible
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass \
  -e logichain_version=<tag_ou_commit_sha> \
  --tags app_runtime
```

`logichain_version` accepte n'importe quelle référence Git (tag, commit,
branche). Vérifier ensuite :

```bash
ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96 \
  "systemctl status logichain-api --no-pager"
curl http://187.127.84.96:8081/
```

### Rollback complet (reconstruction du serveur)

Le principe d'idempotence garantit qu'on peut reconstruire l'intégralité du
serveur depuis une machine vierge :

```bash
ansible-playbook bootstrap.yml -i inventory/bootstrap.ini --ask-pass \
  -e deploy_user=deploy -e deploy_public_key_path=~/.ssh/<cle>.pub
ansible-playbook site.yml -i inventory/production.ini --ask-vault-pass
```

(Sur un nouveau serveur : les données MongoDB doivent être restaurées
séparément — voir section 4.)

## 4. Sauvegardes MongoDB

### Automatique

Le rôle `database` déploie un script de sauvegarde (`mongodump`, compressé)
exécuté **quotidiennement** via un timer systemd :

- Script : `/usr/local/bin/logichain-mongodb-backup.sh`
- Fichiers : `/var/backups/logichain-mongodb/logichain-<timestamp>.archive.gz`
- Rétention : 7 jours (purge automatique des archives plus anciennes,
  ajustable via `mongodb_backup_retention_days` dans
  `ansible/group_vars/production/vars.yml`)

Vérifier l'état du timer :

```bash
ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96 \
  "systemctl status logichain-mongodb-backup.timer && systemctl list-timers logichain-mongodb-backup.timer"
```

### Déclencher une sauvegarde manuelle

```bash
ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96 \
  "sudo systemctl start logichain-mongodb-backup.service && \
   sudo ls -lh /var/backups/logichain-mongodb/"
```

### Restaurer une sauvegarde

**Attention** : `--drop` supprime les collections existantes avant de
restaurer — à utiliser uniquement en connaissance de cause (perte des
données actuelles de la base, remplacées par celles de la sauvegarde).

```bash
ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96
sudo mongorestore \
  --host=localhost --port=27017 \
  --username=<vault_mongodb_admin_user> --password=<vault_mongodb_admin_password> \
  --authenticationDatabase=admin \
  --archive=/var/backups/logichain-mongodb/logichain-<timestamp>.archive.gz \
  --gzip --drop
```

Les identifiants admin sont dans `ansible/group_vars/production/vault.yml`
(chiffré) : `ansible-vault view group_vars/production/vault.yml` depuis un
poste ayant le mot de passe du vault.

### Récupérer une sauvegarde en local (avant un test risqué, par exemple)

```bash
scp -i ~/.ssh/logichain_deploy_ed25519 \
  deploy@187.127.84.96:/var/backups/logichain-mongodb/logichain-<timestamp>.archive.gz .
```

## 5. Incidents connus et résolutions

### SSH refuse la connexion, mais le serveur répond (ping/HTTP OK)

**Cause probable** : Fail2Ban a banni l'IP courante après plusieurs
échecs d'authentification (5 tentatives par défaut, `fail2ban_maxretry`).
C'est arrivé en conditions réelles pendant le développement de ce projet,
suite à des tentatives de connexion `root`+mot de passe (désactivé
volontairement par le durcissement SSH).

**Diagnostic et résolution**, via la **console web de l'hébergeur**
(indépendante de SSH — sur Hostinger : panneau VPS → Console) :

```bash
# Se connecter en root (le login console n'est pas soumis aux restrictions
# SSH : PermitRootLogin/PasswordAuthentication ne s'appliquent qu'à sshd)
fail2ban-client status sshd        # vérifier la liste des IP bannies
fail2ban-client set sshd unbanip <IP_BANNIE>
```

### `ansible-playbook` échoue en `--check` sur une tâche qui dépend d'une
### tâche précédente (ex: installer un paquet depuis un dépôt tout juste ajouté)

**Cause** : limitation connue du mode `--check` d'Ansible — une tâche
purement simulée (ex : ajout d'un dépôt APT) n'écrit rien réellement sur
le disque, donc une tâche suivante qui en dépend (ex : installer un paquet
de ce dépôt) échoue en dry-run alors qu'elle réussira au run réel.
**Solution** : ignorer ce type d'échec en `--check` sur des tâches
chaînées ; valider avec un run réel (`ansible-playbook` sans `--check`).

### Le déploiement CD échoue avec `Connection timed out` sur le port SSH

**Cause** : si le job tourne sur un runner GitHub-hébergé (`ubuntu-latest`),
la protection réseau anti-scan de l'hébergeur filtre silencieusement le
trafic entrant depuis les plages d'IP de datacenter (Azure, où tournent
les runners GitHub). **Solution déjà appliquée** : `cd.yml` utilise un
runner **self-hébergé** directement sur le VPS (`runs-on: [self-hosted,
production]`), qui exécute Ansible en connexion locale
(`inventory/production-local.ini`), sans traverser Internet.

Si le runner self-hébergé tombe en panne :

```bash
ssh -i ~/.ssh/logichain_deploy_ed25519 deploy@187.127.84.96
sudo systemctl status actions.runner.*
sudo systemctl restart actions.runner.*
```

## 6. Accès et secrets

| Élément                     | Emplacement                                                    |
|-------------------------------|--------------------------------------------------------------------|
| Clé SSH de déploiement         | `~/.ssh/logichain_deploy_ed25519` (générée localement, jamais commitée) |
| Mot de passe du vault Ansible  | Connu de l'équipe, jamais commité — nécessaire pour `ansible-vault view/edit group_vars/production/vault.yml` |
| Secrets applicatifs (JWT, Mongo) | `ansible/group_vars/production/vault.yml` (chiffré, commité) |
| Secrets GitHub Actions          | *Settings → Secrets and variables → Actions* (`ANSIBLE_VAULT_PASSWORD`) |
| Environnement de déploiement protégé | *Settings → Environments → production* (validation manuelle requise) |

Voir aussi [`ansible/README.md`](ansible/README.md) pour le détail complet
du provisionnement, et [`CONTRIBUTING.md`](CONTRIBUTING.md) pour le
workflow Git.

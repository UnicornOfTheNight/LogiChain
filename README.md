# LogiChain

Plateforme de traçabilité logistique terrain — back-end Node.js/Express
N-Tier + MongoDB, app mobile React Native (Expo) en mode Offline-First.

Projet réalisé dans le cadre du Mastère Data & IA, LA MANU. Cette phase
(Partie 3) couvre l'industrialisation : workflow Git, infrastructure as code
(Ansible), intégration/déploiement continu (GitHub Actions) et sécurité.

## Structure du dépôt

| Dossier                | Contenu                                              |
|--------------------------|---------------------------------------------------------|
| [`logichain-api/`](logichain-api/README.md)         | API REST Node.js + MongoDB              |
| [`logichain-mobile/`](logichain-mobile/README.md)    | App mobile Expo/React Native/TypeScript |
| `qrcodes-simulation/`    | QR codes de démonstration pour les tests terrain         |
| `ansible/`               | Provisionnement et déploiement du serveur (IaC)           |
| `.github/workflows/`     | Pipelines CI/CD                                          |

## Démarrage rapide

Voir le guide d'installation détaillé de chaque sous-projet :
[`logichain-api/README.md`](logichain-api/README.md) et
[`logichain-mobile/README.md`](logichain-mobile/README.md).

## Contribuer

Ce dépôt suit un Gitflow strict (`main` / `develop` / `feature`) et le
standard Conventional Commits. Toute contribution (workflow de branches,
revue de code, Pull Requests) est décrite dans
**[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Déploiement & exploitation

Le provisionnement du serveur de production (Ansible) et la procédure
d'exploitation (déploiement, rollback, sauvegardes MongoDB) sont décrits
dans `ansible/README.md` et `RUNBOOK.md` (à venir).

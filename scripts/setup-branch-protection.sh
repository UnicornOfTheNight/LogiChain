#!/usr/bin/env bash
# Configure les Branch Protection Rules GitHub pour main et develop,
# conformément à CONTRIBUTING.md.
#
# Prérequis :
#   1. Installer gh CLI : https://cli.github.com/
#      winget install --id GitHub.cli   (ou: choco install gh / scoop install gh)
#   2. S'authentifier avec des droits admin sur le repo :
#      gh auth login
#
# Usage :
#   ./scripts/setup-branch-protection.sh

set -euo pipefail

REPO="UnicornOfTheNight/LogiChain"

protect_branch() {
  local branch="$1"
  local extra_json="$2"

  echo "Protection de la branche ${branch}..."
  gh api --method PUT "repos/${REPO}/branches/${branch}/protection" --input - <<JSON
{
  "required_status_checks": null,
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false${extra_json}
}
JSON
}

# develop : intégration continue, pas d'historique linéaire imposé
protect_branch "develop" ""

# main : en plus, on impose un historique linéaire (pas de merge commits)
protect_branch "main" ',
  "required_linear_history": true'

cat <<'EOF'

Fait.

Une fois le chantier CI/CD terminé (jobs "lint" et "test" présents dans
.github/workflows/), relance la protection en exigeant ces checks avant
merge :

  gh api --method PUT repos/UnicornOfTheNight/LogiChain/branches/develop/protection \
    -f "required_status_checks[strict]=true" \
    -f "required_status_checks[contexts][]=lint" \
    -f "required_status_checks[contexts][]=test"

  gh api --method PUT repos/UnicornOfTheNight/LogiChain/branches/main/protection \
    -f "required_status_checks[strict]=true" \
    -f "required_status_checks[contexts][]=lint" \
    -f "required_status_checks[contexts][]=test"

(Adapte les noms "lint"/"test" aux noms exacts des jobs définis dans les
workflows GitHub Actions.)
EOF

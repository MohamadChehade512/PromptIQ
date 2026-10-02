#!/usr/bin/env bash
# Private-beta access codes for the live site (infra/access-gate/function.js, docs/deploy-aws.md).
#
#   ./scripts/access-gate.sh setup          create the gate with an "owner" code and turn it on
#   ./scripts/access-gate.sh add "Jane Doe" create a code for someone; prints the code and an invite link
#   ./scripts/access-gate.sh list           show every code and who it's for
#   ./scripts/access-gate.sh remove CODE    revoke a code (locked out within a minute or two)
#   ./scripts/access-gate.sh off | on       open the site to everyone / require codes again
#
# Needs AWS_PROFILE (or credentials) and PG_DISTRIBUTION_ID. The codes live only in the deployed
# CloudFront Function, never in git.
set -euo pipefail

: "${PG_DISTRIBUTION_ID:?Set PG_DISTRIBUTION_ID to the CloudFront distribution ID}"
cd "$(dirname "$0")/.."

FUNCTION=promptiq-access-gate
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

site() { aws cloudfront get-distribution --id "$PG_DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text; }
exists() { aws cloudfront describe-function --name "$FUNCTION" >/dev/null 2>&1; }

new_code() {
  python3 -c 'import secrets; a="23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; g=lambda: "".join(secrets.choice(a) for _ in range(4)); print(f"PIQ-{g()}-{g()}-{g()}")'
}

# The codes in the live function, as JSON ({} if there's no function yet).
current_codes() {
  if ! exists; then
    echo '{}'
    return
  fi
  aws cloudfront get-function --name "$FUNCTION" --stage LIVE "$TMP/live.js" >/dev/null
  python3 - "$TMP/live.js" <<'PY'
import json, re, sys
match = re.search(r"^const CODES = (\{.*\});$", open(sys.argv[1]).read(), re.M)
print(json.dumps(json.loads(match.group(1)) if match else {}))
PY
}

# Write the codes (JSON on stdin) into the function and publish it.
publish() {
  cat >"$TMP/codes.json"
  python3 - "$TMP/codes.json" infra/access-gate/function.js "$TMP/function.js" <<'PY'
import json, sys
codes = json.load(open(sys.argv[1]))
src = open(sys.argv[2]).read()
assert "const CODES = __CODES__;" in src
line = "const CODES = " + json.dumps(codes, separators=(",", ":")) + ";"
open(sys.argv[3], "w").write(src.replace("const CODES = __CODES__;", line, 1))
PY
  local config='{"Comment":"Prompt IQ beta access gate","Runtime":"cloudfront-js-2.0"}'
  if exists; then
    aws cloudfront update-function --name "$FUNCTION" --function-config "$config" \
      --function-code "fileb://$TMP/function.js" \
      --if-match "$(aws cloudfront describe-function --name "$FUNCTION" --query ETag --output text)" >/dev/null
  else
    aws cloudfront create-function --name "$FUNCTION" --function-config "$config" \
      --function-code "fileb://$TMP/function.js" >/dev/null
  fi
  aws cloudfront publish-function --name "$FUNCTION" \
    --if-match "$(aws cloudfront describe-function --name "$FUNCTION" --query ETag --output text)" >/dev/null
}

# Attach (with an ARN) or detach (empty) the gate on the default behavior.
set_gate() {
  aws cloudfront get-distribution-config --id "$PG_DISTRIBUTION_ID" >"$TMP/dist.json"
  FUNCTION_ARN=${1:-} python3 - "$TMP/dist.json" "$TMP/config.json" <<'PY'
import json, os, sys
config = json.load(open(sys.argv[1]))["DistributionConfig"]
arn = os.environ["FUNCTION_ARN"]
config["DefaultCacheBehavior"]["FunctionAssociations"] = (
    {"Quantity": 1, "Items": [{"FunctionARN": arn, "EventType": "viewer-request"}]}
    if arn else {"Quantity": 0}
)
json.dump(config, open(sys.argv[2], "w"))
PY
  aws cloudfront update-distribution --id "$PG_DISTRIBUTION_ID" \
    --if-match "$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["ETag"])' "$TMP/dist.json")" \
    --distribution-config "file://$TMP/config.json" >/dev/null
}

function_arn() {
  aws cloudfront describe-function --name "$FUNCTION" --stage LIVE \
    --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text
}

add_code() {
  local code
  code=$(new_code)
  current_codes | CODE=$code LABEL=$1 python3 -c \
    'import json,os,sys; c=json.load(sys.stdin); c[os.environ["CODE"]]=os.environ["LABEL"]; print(json.dumps(c))' |
    publish
  echo "Code for $1: $code"
  echo "Invite link:  https://$(site)/__access?code=$code"
}

case "${1:-}" in
  setup)
    if [ "$(current_codes)" = '{}' ]; then
      echo "→ Creating the gate with your own code (keep it; you need it to open the site):"
      add_code "owner"
    else
      echo "→ Updating the gate (codes kept)"
      current_codes | publish
    fi
    echo "→ Turning the gate on"
    set_gate "$(function_arn)"
    echo "✓ Done. CloudFront takes a few minutes to apply it everywhere."
    ;;
  add)
    add_code "${2:?Usage: $0 add NAME}"
    ;;
  list)
    current_codes | python3 -c '
import json, sys
codes = json.load(sys.stdin)
for code, label in sorted(codes.items(), key=lambda kv: kv[1].lower()):
    print(f"{code}  {label}")
print(f"{len(codes)} code(s)")'
    ;;
  remove)
    current_codes | CODE=$(echo "${2:?Usage: $0 remove CODE}" | tr '[:lower:]' '[:upper:]') python3 -c '
import json, os, sys
codes = json.load(sys.stdin)
if os.environ["CODE"] not in codes:
    sys.exit("No such code: " + os.environ["CODE"])
del codes[os.environ["CODE"]]
print(json.dumps(codes))' | publish
    echo "Removed. That code stops working within a minute or two."
    ;;
  off)
    set_gate ""
    echo "Gate off: the site is open to everyone (codes are kept)."
    ;;
  on)
    set_gate "$(function_arn)"
    echo "Gate on: an access code is required."
    ;;
  *)
    sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac

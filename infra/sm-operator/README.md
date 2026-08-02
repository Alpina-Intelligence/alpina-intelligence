# sm-operator (Bitwarden Secrets Manager → k8s Secrets)

Pulls app secrets from Bitwarden Secrets Manager into the cluster on a timer, so no app
secret is ever stored in git — encrypted or otherwise. Bitwarden is the source of truth;
k8s Secrets are a cache of it.

Replaces the SOPS + age scheme that `docs/architecture.md` §7 originally specified. See
that section for the reasoning; this file is how to run it.

## What's here

| File | Role |
| --- | --- |
| `helmchart.yaml` | k3s `HelmChart` CRD — the pinned install. |
| `bitwardensecret.example.yaml` | Reference shape for a per-app sync. Real ones live in project repos. |

## Install

The operator is **not** built into k3s and nothing happens until it's installed — creating
the namespace and auth token secret alone does nothing.

```bash
kubectl apply -f infra/sm-operator/helmchart.yaml
kubectl -n kube-system get job helm-install-sm-operator -w   # runs once
kubectl -n sm-operator-system get pods                        # expect 1/1 Running
```

k3s watches `/var/lib/rancher/k3s/server/manifests/`, so this could also be dropped there to
survive a rebuild — but it's applied explicitly, because that directory auto-deletes objects
when a file is removed and that's a sharp edge for something holding credentials.

If the install Job fails, its pod holds the reason:

```bash
kubectl -n kube-system logs job/helm-install-sm-operator
```

## The auth token goes in every consuming namespace

The single most common way to get this wrong. The operator resolves
`spec.authToken.secretName` **in the BitwardenSecret's own namespace**, not its own — a
token sitting in `sm-operator-system` is invisible to a CR in `puckprophet`.

So the bootstrap step is per-namespace:

```bash
read -rs BWS_ACCESS_TOKEN          # doesn't echo, doesn't hit .bash_history
kubectl create namespace puckprophet
kubectl create secret generic bw-auth-token -n puckprophet \
  --from-literal=token="$BWS_ACCESS_TOKEN"
unset BWS_ACCESS_TOKEN
```

A copy in `sm-operator-system` is harmless but unused. It can stay as the canonical "this is
the token" reference or be deleted; it does no work either way.

Watch the paste trap: `read -rs` shows nothing, so pasting a labelled string or a whole
command looks identical to pasting the token and fails later as an auth error. Check the
length before trusting it — same lesson as the cloudflared connector token.

## Syncing a secret

Machine account scope is the real access control. `github-ci-puckprophet` reads only the
`puckprophet` project; the cluster's account reads `platform` and `puckprophet`. The CR can
only ever surface secrets its token can already read, so keep `onlyMappedSecrets: true` and
list them explicitly — with `false`, widening the account later silently widens the Secret.

Apply the CR, then:

```bash
kubectl -n puckprophet get bitwardensecret puckprophet -o jsonpath='{.status}' | jq
kubectl -n puckprophet get secret puckprophet-secrets -o jsonpath='{.data}' | jq 'keys'
```

Keys, not values — never print the values to a shared terminal.

## Rotation is two steps, and the second is the one people forget

Changing a value in Bitwarden updates the **k8s Secret** within the refresh interval (300s).
It does **not** update anything running: env vars are read once at process start, so a pod
keeps serving the old value indefinitely.

```bash
kubectl -n puckprophet rollout restart deployment/web
```

That restart is the actual rotation. Until it runs, rotation has happened everywhere except
where it matters.

**Verify propagation once, deliberately, before trusting this.** Change a value in
Bitwarden, wait out the interval, confirm the k8s Secret changed. The failure this catches is
silent — pre-v2.1.0 the reconciler synced a CR once and never again unless the CR itself was
edited (`sm-kubernetes#157`), which looks completely healthy right up until a rotation
quietly doesn't land. `helmchart.yaml` pins past that bug; the check confirms it.

## What this does NOT cover

The operator only writes k8s Secrets. It has no reach outside the cluster, and two of the
most important secrets on this box live outside it:

| Secret | Where | Delivered by |
| --- | --- | --- |
| cloudflared connector token | `/etc/cloudflared/cloudflared.env` (systemd) | hand-placed file |
| Postgres superuser + per-project passwords | `/opt/platform/postgres/` (compose) | hand-placed file |
| app secrets (`DATABASE_URL`, auth keys) | k8s Secret | **sm-operator** |

Those two could fetch themselves at boot with `bws get`, and deliberately don't. cloudflared
is the only path into this box; making it reach `bitwarden.com` before it can start adds a
network dependency to the one service you need in order to recover from network problems.
Postgres has the same shape — a stack that can't start offline is worse than a `0600` file.

For host secrets Bitwarden is therefore **vault of record, not delivery mechanism**: the
value is there so it can be found and rotated, and a copy sits on disk so the box boots
unattended. The cost is honest — two places, so they can drift. That's why each host service
documents its own rotation procedure step by step.

## Non-secret configuration does not belong here

Ordinary config (`PORT`, `NODE_ENV`, hostnames) goes in a ConfigMap or as literal `env:` in
the Deployment, where it stays reviewable in git. Only put a value in Bitwarden if leaking it
matters — a secrets manager used as a config store is one more thing between a change and
production, with no benefit.

Note ConfigMaps have the same restart requirement as Secrets: env vars freeze at process
start either way.

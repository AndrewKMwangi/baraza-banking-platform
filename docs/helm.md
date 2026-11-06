# Helm Deployment and Release Management

## 1. Purpose

This document explains how Helm packages, configures, validates, installs, upgrades, and rolls back Baraza Banking Platform workloads on Kubernetes. Helm is the application release-management layer between Baraza's Kubernetes workload definitions and the cluster. It allows a service to be deployed consistently while environment-specific settings—replicas, image references, resources, ingress, and autoscaling—are supplied as values.

The guide describes the chart currently present in the repository and the conventions to use as the platform expands into a complete microservices banking system.

## 2. Where Helm fits

Baraza's delivery layers have distinct responsibilities:

1. **Application build:** Maven builds Java/Spring Boot services; the web application has its own frontend build.
2. **Container build:** Docker packages each deployable workload into an image.
3. **Registry:** GHCR is the intended registry for versioned application images.
4. **Helm:** charts describe Kubernetes resources and parameterize each service.
5. **GitOps:** the Baraza GitOps repository declares desired chart, values, and image version for an environment.
6. **Kubernetes:** the cluster reconciles rendered resources and runs workloads.

Helm does not build binaries, create images, provision AWS networking, or replace Kubernetes. Terraform provisions infrastructure; Helm describes application releases; Argo CD reconciles Git-managed desired state.

~~~mermaid
flowchart LR
    A[Source code] --> B[CI build and tests]
    B --> C[Container image]
    C --> D[GHCR registry]
    E[Helm chart and values] --> F[Rendered manifests]
    D --> F
    G[GitOps repository] --> H[Argo CD]
    H --> F
    F --> I[Kubernetes cluster]
~~~

## 3. Repository layout and current chart

The current chart is located at:

~~~text
infrastructure/
  helm/
    customer-service/
      Chart.yaml
      values.yaml
      values-dev.yaml
      values-staging.yaml
      values-prod.yaml
      deployment.yaml
      .helmignore
      templates/
        _helpers.tpl
        deployment.yaml
        service.yaml
        ingress.yaml
        httproute.yaml
        hpa.yaml
        serviceaccount.yaml
        NOTES.txt
        tests/
~~~

The chart is named customer-service and is an application chart using Helm chart API v2. Its metadata currently declares chart version 0.1.0 and app version 1.16.0. These are starter metadata values and must be deliberately maintained; they are not proof that the deployed application is version 1.16.0.

The chart templates a Deployment and Service, with optional Ingress, HTTPRoute, HPA, and ServiceAccount resources. Default values include one replica, a ClusterIP service on port 8080, database configuration, resource requests and limits, and TCP readiness/liveness probes.

The repository also contains direct Kubernetes manifests under infrastructure/kubernetes/. These are useful as deployment examples and implementation evidence. Avoid maintaining two competing sources of truth for the same environment. Once a workload is managed by Helm and GitOps, change its desired state through the chart and GitOps configuration rather than manually editing live objects.

## 4. Helm concepts

| Concept | Meaning in Baraza |
|---|---|
| Chart | Versioned package containing templates, metadata, and default values |
| Release | Named installation of a chart in a Kubernetes namespace |
| Values | Configuration supplied to templates |
| Template | Kubernetes YAML with Go-template expressions |
| Render | Expansion of templates into Kubernetes manifests |
| Revision | A release's recorded deployment revision |
| Repository | Location from which packaged charts can be retrieved |
| Dependency | Another chart required by a chart |
| Hook | Lifecycle action such as a controlled pre-upgrade or post-install Job |

A chart is reusable; a release is a specific installation. The same customer-service chart can be rendered with development or production values without maintaining separate copies of every Kubernetes template.

## 5. Chart anatomy

### 5.1 Chart.yaml

Chart.yaml describes the chart:

- apiVersion: Helm chart metadata API; use v2 for modern Helm 3 charts.
- name: chart name.
- description: concise service purpose.
- type: application for deployable workloads or library for reusable template helpers.
- version: chart package version. Increment when templates, defaults, or chart behavior changes.
- appVersion: informational application version. Track the application release, but configure the actual image tag or digest separately.

Chart version and application version solve different problems. A chart-only change can increment chart version without changing the application binary. An application release can change the image while reusing a chart version if chart content is unchanged.

### 5.2 values.yaml

The current customer-service chart includes these values groups:

- replicaCount
- image.repository, image.tag, and image.pullPolicy
- env and Secret key references
- imagePullSecrets
- naming overrides
- service-account configuration
- Pod labels and annotations
- Pod and container security contexts
- Service and Ingress settings
- HTTPRoute settings
- CPU and memory requests/limits
- startup, liveness, and readiness probes
- autoscaling
- volumes and volume mounts
- node selector, tolerations, and affinity

Keep defaults safe and environment-neutral. Never put production credentials, private keys, tokens, or real customer information in values files.

### 5.3 templates/

Files in templates/ are rendered into Kubernetes API objects. The current chart has:

- deployment.yaml: Pod template, image, environment, resources, probes, and scheduling.
- service.yaml: stable in-cluster endpoint for Pods.
- ingress.yaml: HTTP ingress routing when enabled.
- httproute.yaml: Gateway API HTTPRoute when enabled.
- hpa.yaml: HorizontalPodAutoscaler when enabled.
- serviceaccount.yaml: optional workload identity.
- _helpers.tpl: reusable naming and label helpers.
- NOTES.txt: operator guidance printed after release actions.

The top-level infrastructure/helm/customer-service/deployment.yaml is also present. The canonical template for Helm rendering is templates/deployment.yaml; do not confuse a standalone manifest with the template Helm renders.

## 6. Values layering and environments

Helm combines chart defaults with values supplied at install or upgrade time. Later values sources override earlier ones.

A typical layering model is:

1. Chart defaults in values.yaml.
2. Environment values such as values-dev.yaml, values-staging.yaml, or values-prod.yaml.
3. Explicit deployment-time overrides, used sparingly and preferably committed to GitOps for long-lived environments.

Run from the repository root in PowerShell:

~~~powershell
helm lint .\infrastructure\helm\customer-service

helm template customer-service .\infrastructure\helm\customer-service --namespace baraza-banking -f .\infrastructure\helm\customer-service\values.yaml -f .\infrastructure\helm\customer-service\values-dev.yaml

helm template customer-service .\infrastructure\helm\customer-service --namespace baraza-banking -f .\infrastructure\helm\customer-service\values.yaml -f .\infrastructure\helm\customer-service\values-prod.yaml
~~~

The dev and staging override files in the current chart are minimal placeholders. Production overrides contain a more developed configuration, including two replicas, autoscaling settings, startup/readiness/liveness probes, and stronger Pod/container security settings. These files are evolving configuration, not evidence that every production control is deployed.

| Setting | Development | Staging | Production target |
|---|---|---|---|
| Replicas | Lower-cost baseline | Production-like | At least two for critical stateless services |
| Image | Development build or commit tag | Release candidate | Promoted immutable image |
| Database | Isolated development database | Staging database | Managed private production database |
| Ingress | Internal/developer route | Controlled test endpoint | TLS-protected approved entry point |
| Autoscaling | Optional | Validate behavior | Enabled where justified by load |
| Resources | Local cluster sizing | Representative measurements | Load-tested requests and limits |
| Secrets | Non-production Kubernetes Secret | Managed secret workflow | AWS Secrets Manager integration |
| Availability | Developer convenience | Resilience validation | Multi-AZ cluster and service design |

Environment values should change deployment configuration, not application business logic. Promote the same immutable image from staging to production rather than rebuilding different artifacts.

## 7. Image references and release identity

An image reference consists of a registry/repository and tag or digest. The current default chart uses a local image name and pullPolicy Never, suitable only when the cluster already has the image loaded.

For GHCR or another remote registry:

- Use the complete registry and repository path.
- Use a unique immutable tag such as a Git commit SHA or release version.
- Prefer digest pinning for high-assurance production.
- Use IfNotPresent for immutable tags; avoid mutable latest tags in production.
- Configure image pull credentials or workload identity securely when required.

Illustrative override (replace the sample path and tag with the actual published image):

~~~yaml
image:
  repository: ghcr.io/OWNER/REPOSITORY/customer-service
  tag: "COMMIT_SHA"
  pullPolicy: IfNotPresent
~~~

This is an example, not a claim that this exact image path is currently published. CI and registry configuration must agree on the canonical name.

## 8. Configuration and secrets

Non-sensitive runtime configuration can be supplied as environment variables or mounted files. The current customer-service values express the PostgreSQL URL and obtain database username/password from a Kubernetes Secret using secretKeyRef.

The chart refers to a Secret named postgres-secret with keys POSTGRES_USER and POSTGRES_PASSWORD. It must exist in the same namespace as the workload.

Create a development-only Secret interactively without committing credentials:

~~~powershell
kubectl create secret generic postgres-secret --namespace baraza-banking --from-literal=POSTGRES_USER=<database-user> --from-literal=POSTGRES_PASSWORD=<database-password>
~~~

Replace placeholders locally. Do not commit the Secret manifest, shell history containing real credentials, or plaintext values files.

For production, use an approved external secret-management integration, such as AWS Secrets Manager with an appropriate Kubernetes integration and least-privilege IAM permissions. Access should be auditable and rotated. Never print Secret values in logs or diagnostics.

A database URL is configuration but may reveal internal topology. Keep production endpoints in controlled configuration and never expose them in frontend bundles.

## 9. Deployments, Services, and networking

The chart uses a Kubernetes Deployment to maintain the requested Pod replicas and a ClusterIP Service for a stable internal endpoint.

The Service port is configured as 8080. Verify that the Deployment container port and Spring Boot server port agree. Other Baraza services have their own ports and database ownership; do not copy customer-service settings into another chart without checking that service's application configuration.

Inside the cluster, workloads should call other services through Kubernetes DNS and stable Service names, not Pod IP addresses. External traffic should enter through a controlled Ingress or Gateway API implementation. TLS, hostnames, certificates, and routing must match the cluster's ingress controller or gateway.

Do not enable both Ingress and HTTPRoute for the same host/path unless the routing design intentionally supports that arrangement. The chart supports both; each environment should select the intended route.

## 10. Health checks and rollout behavior

The current chart has TCP-based readiness and liveness probes. Production overrides also define a startup probe. A TCP probe confirms that a port accepts connections; it does not prove that the application can authenticate to its database or safely process banking requests.

For Spring Boot services, prefer Actuator health endpoints when enabled, secured appropriately, and configured to expose the required health groups:

- Startup probe: allow a slow JVM/application initialization window.
- Readiness probe: determine whether a Pod should receive new traffic.
- Liveness probe: detect a process that is irrecoverably stuck and should be restarted.

Do not make liveness depend on every downstream dependency. A temporary database outage should not automatically cause every application Pod to restart. Readiness can reflect dependencies when removing a Pod from traffic is appropriate.

Configure rolling updates to preserve availability, termination grace periods, and graceful application shutdown so in-flight requests can complete. Financial operations must be retry-safe and idempotent; a Pod restart or client retry must not create duplicate postings.

## 11. Resources and autoscaling

Requests influence scheduling and provide the baseline for resource allocation. Limits constrain consumption. Current production values provide example CPU/memory requests and limits and enable an HPA with CPU and memory utilization targets.

These are starting points, not capacity guarantees. Tune them using JVM heap/native memory measurements, startup and steady-state profiles, CPU under representative load, request latency, throughput, database pool sizing, queue depth, and node capacity.

CPU-based HPA utilization is calculated relative to CPU requests. If requests are missing or unrealistic, scaling decisions become unreliable. Memory utilization alone is not always useful for JVM workloads; combine it with application metrics and load tests.

Scaling application Pods does not automatically scale PostgreSQL connections, brokers, provider quotas, or downstream services. Bound concurrency and connection pools so scale-out does not overwhelm dependencies.

For critical workloads, test disruption budgets, topology spread, anti-affinity, and node capacity alongside HPA behavior. HPA is not a substitute for multi-AZ design or database high availability.

## 12. Security context and workload identity

Current production values include a non-root Pod setting, RuntimeDefault seccomp profile, disabled privilege escalation, and dropped Linux capabilities. These are good baseline controls.

The production target should also:

- Run application containers as non-root.
- Drop all capabilities unless a documented requirement exists.
- Avoid privileged containers and host networking.
- Use a read-only root filesystem where supported.
- Mount writable temporary paths explicitly.
- Set service-account token automounting deliberately.
- Use dedicated service accounts and least-privilege RBAC.
- Use AWS workload identity for workloads that need AWS permissions.
- Restrict network paths with NetworkPolicies or equivalent controls.
- Keep secrets out of image layers, chart packages, and Git history.

A chart setting does not guarantee a secure runtime. Validate rendered manifests and inspect running Pod specifications.

## 13. Persistent data and banking integrity

Application Pods are replaceable and ephemeral. Do not store authoritative customer, account, transaction, payment, or ledger data in a container's writable layer.

Baraza's production data architecture uses persistent database services, with managed PostgreSQL as the AWS target. Each domain service owns its data and schema boundaries. Helm configures application connectivity; it should not encourage unrelated services to share write access to another service's database.

For local development, PostgreSQL may run in a container with a persistent Docker volume or Kubernetes PersistentVolume. Local volumes are not a production backup or disaster-recovery strategy.

Schema changes should use the service migration mechanism and compatibility planning. Helm rollback reverts Kubernetes release resources; it does not automatically reverse database migrations or restore financial data.

## 14. Validate a chart before deployment

Run from the repository root:

~~~powershell
helm version
helm show chart .\infrastructure\helm\customer-service
helm show values .\infrastructure\helm\customer-service
helm lint .\infrastructure\helm\customer-service

helm template customer-service .\infrastructure\helm\customer-service --namespace baraza-banking -f .\infrastructure\helm\customer-service\values-prod.yaml
~~~

Inspect rendered YAML for image references, namespace, labels, ports, Secret references, probes, security context, resources, ingress, and HPA settings.

If a cluster is available, validate against its API:

~~~powershell
kubectl config current-context
kubectl get nodes

helm template customer-service .\infrastructure\helm\customer-service --namespace baraza-banking -f .\infrastructure\helm\customer-service\values-prod.yaml | kubectl apply --dry-run=server -f -
~~~

Server-side dry-run requires a reachable cluster and suitable permissions. It validates API admission and schema compatibility but does not install the release. Linting and rendering do not prove that the application works.

## 15. Install and upgrade a release

Create the namespace if it does not exist:

~~~powershell
kubectl create namespace baraza-banking
~~~

Install or upgrade a development release:

~~~powershell
helm upgrade --install customer-service .\infrastructure\helm\customer-service --namespace baraza-banking -f .\infrastructure\helm\customer-service\values.yaml -f .\infrastructure\helm\customer-service\values-dev.yaml --wait --timeout 5m
~~~

For a controlled production test, use production values and the approved immutable image reference. In the intended production workflow, Argo CD owns reconciliation from the GitOps repository; operators should not repeatedly make direct Helm changes that conflict with Argo CD.

The --wait flag waits for supported resources to become ready within the timeout. A successful Helm command does not replace application smoke tests, transaction-path verification, or operational acceptance.

## 16. Inspect releases and workloads

~~~powershell
helm list --all --namespace baraza-banking
helm status customer-service --namespace baraza-banking
helm history customer-service --namespace baraza-banking
helm get values customer-service --namespace baraza-banking
helm get manifest customer-service --namespace baraza-banking

kubectl get deployments,replicasets,pods,services --namespace baraza-banking
kubectl rollout status deployment/customer-service --namespace baraza-banking
kubectl get events --namespace baraza-banking --sort-by=.metadata.creationTimestamp
~~~

Use helm get values --all only when the full merged values are required. Treat output as potentially sensitive if credentials have been incorrectly placed in values.

## 17. Rollback and recovery

Helm stores release revisions. A rollback returns Kubernetes resources to a previous revision:

~~~powershell
helm history customer-service --namespace baraza-banking
helm rollback customer-service <REVISION> --namespace baraza-banking --wait --timeout 5m
~~~

After rollback, confirm the revision, check Deployment and Pod readiness, inspect logs/events, run authentication and approved smoke tests, verify account and transaction APIs, confirm no duplicate financial actions occurred, and record the incident and recovery actions.

A Helm rollback does not undo external side effects, reverse a database migration, refund a payment, or reverse a ledger posting. Database and financial recovery follow separate controlled procedures. Never use release rollback as a substitute for transaction reconciliation.

## 18. Helm and Argo CD GitOps

The target delivery model stores environment-specific release configuration in the GitOps repository. Argo CD observes desired state and reconciles the cluster.

A service application definition typically identifies the Git repository and revision, chart path or source, destination cluster and namespace, values files or Helm parameters, and sync policy including pruning and self-healing.

The platform has Argo CD-managed development applications, including customer-service-dev. Keep the source of truth clear: update chart templates or values in the application repository, update the GitOps application reference or environment values in the GitOps repository, and let Argo CD synchronize desired state.

~~~mermaid
sequenceDiagram
    participant Dev as Engineer
    participant App as Application repo
    participant CI as GitHub Actions
    participant Reg as GHCR
    participant GitOps as GitOps repo
    participant Argo as Argo CD
    participant K8s as Kubernetes

    Dev->>App: Commit application or chart change
    App->>CI: Trigger pipeline
    CI->>CI: Test and build image
    CI->>Reg: Publish immutable image
    CI->>GitOps: Update approved image reference
    Argo->>GitOps: Observe desired state
    Argo->>K8s: Apply rendered resources
    K8s-->>Argo: Report health and sync state
~~~

For production, require review and approval before promotion. Use protected branches, environment approvals, immutable artifacts, and auditable sync history. Do not store GitHub tokens, AWS credentials, or production Secret values in chart files.

## 19. Chart testing and quality gates

A mature chart change should pass:

1. YAML syntax and formatting checks.
2. helm lint.
3. Template rendering for every supported environment.
4. Kubernetes schema validation or server-side dry-run.
5. Policy checks for security context, privilege, image tags, resources, and Secret handling.
6. Chart unit tests or template assertions where available.
7. Deployment to a non-production cluster.
8. Smoke tests and application health checks.
9. Rollout and rollback verification.

A chart test Job can verify an in-cluster endpoint, but must not perform destructive operations or create real financial transactions. Use synthetic accounts and isolated test data for end-to-end tests.

## 20. Troubleshooting

| Symptom | Likely cause | Investigation |
|---|---|---|
| helm lint fails | Invalid metadata, template, or values | Read first template error and check YAML indentation |
| Rendered field is empty or wrong | Values key mismatch or template conditional | Inspect merged values and rendered manifest |
| ImagePullBackOff | Wrong image path/tag or registry authentication | Inspect Pod events and imagePullSecrets |
| ErrImageNeverPull | Never policy but image not loaded | Load local image or use registry image |
| Pod Pending | Insufficient resources, taints, affinity, or storage | Describe Pod and inspect scheduling events |
| CrashLoopBackOff | Startup failure, missing config, or DB connectivity | Inspect previous logs and Secret references |
| Pod Running but not Ready | Probe failure or wrong port | Inspect probe settings and application health |
| Ingress has no route | Controller, class, hostname, or DNS mismatch | Inspect Ingress, controller, and events |
| HPA has unknown metrics | Metrics API unavailable or missing requests | Check metrics-server and HPA conditions |
| Helm upgrade times out | Workload did not become ready | Inspect rollout, events, probes, and dependencies |
| Argo CD reverts manual change | GitOps desired state differs from live state | Correct GitOps source, not the live object |

Useful diagnostics:

~~~powershell
helm status customer-service --namespace baraza-banking
helm get manifest customer-service --namespace baraza-banking

kubectl describe deployment customer-service --namespace baraza-banking
kubectl get pods --namespace baraza-banking -o wide
kubectl describe pod <POD_NAME> --namespace baraza-banking
kubectl logs deployment/customer-service --namespace baraza-banking
kubectl logs <POD_NAME> --previous --namespace baraza-banking
kubectl get events --namespace baraza-banking --sort-by=.metadata.creationTimestamp
kubectl describe hpa --namespace baraza-banking
~~~

Do not paste Secret values, access tokens, customer data, or payment payloads into public issue reports or logs.

## 21. Banking-specific deployment safeguards

Helm controls deployment mechanics; it does not guarantee correctness of banking operations.

- Use readiness gates so traffic is not sent to unready instances.
- Keep application versions compatible with database schema during rolling updates.
- Use backward-compatible expand/migrate/contract database changes.
- Ensure transaction and payment APIs enforce idempotency for retries.
- Prevent rollouts and retries from duplicating deposits, withdrawals, transfers, or payment callbacks.
- Separate operational health from financial correctness; Pod readiness is not proof of ledger integrity.
- Require auditable approvals for production chart and values changes.
- Verify reconciliation and transaction integrity after incidents that may interrupt processing.

## 22. Local development versus production

| Area | Local development | Production target |
|---|---|---|
| Cluster | Minikube | Amazon EKS |
| Image source | Local image or development registry | GHCR image promoted by immutable digest |
| Release owner | Developer for local testing | Argo CD GitOps reconciliation |
| Database | Local PostgreSQL container/volume | Managed PostgreSQL with private connectivity |
| Ingress | Local host mapping/development controller | Approved ingress or gateway with TLS |
| Secrets | Non-production Kubernetes Secret | External secret manager integration |
| Availability | Single-node/resource-constrained | Multi-AZ, capacity-managed cluster |
| Observability | Local logs and basic metrics | Centralized metrics, logs, traces, and alerts |

Minikube is a development environment, not the production architecture. EKS is the target production Kubernetes platform; provisioning and operating EKS are separate from packaging application releases with Helm.

## 23. Operational checklist

### Before a release

- [ ] Application tests and image build have passed.
- [ ] Image exists in the approved registry and is immutable.
- [ ] Chart version is updated when chart content changes.
- [ ] Values files contain no credentials or customer data.
- [ ] helm lint succeeds.
- [ ] Rendered manifests have been reviewed for the target environment.
- [ ] Security context, resources, and probes are appropriate.
- [ ] Secret references exist in the target namespace.
- [ ] Database migration compatibility and rollback implications are understood.
- [ ] GitOps change has been reviewed and approved.

### After a release

- [ ] Argo CD reports expected sync and health state.
- [ ] Deployment rollout completes and expected replicas are Ready.
- [ ] Service discovery and ingress routing work.
- [ ] Application health and dependency connectivity are verified.
- [ ] Authentication and key customer/account/transaction flows pass smoke tests.
- [ ] Logs, metrics, and alerts show no unexpected regression.
- [ ] Financial transaction and ledger integrity checks pass where applicable.
- [ ] Release revision and operational evidence are recorded.

## 24. Implementation status and next steps

The repository contains a customer-service Helm application chart with values files, templates for Deployment and Service, optional ingress/routing and autoscaling resources, and development/production configuration. Development and staging override files are minimal placeholders; production overrides contain more complete deployment settings. The chart and GitOps workflow are being developed as part of the platform modernization.

As Baraza expands, each independently deployable service should have a consistent chart or carefully designed shared-chart pattern. Service-specific settings must remain explicit: ports, database URLs, resource profiles, probes, environment variables, service accounts, and ingress routes must be checked against that service's actual application configuration.

Recommended evolution:

1. Standardize chart metadata, labels, naming, and image configuration across services.
2. Separate environment values from chart templates and keep secrets external.
3. Add values schema validation and automated template tests.
4. Pin production images by digest and add supply-chain attestations.
5. Add rollout controls, topology spread, disruption budgets, and workload identity.
6. Integrate chart validation and policy checks into GitHub Actions.
7. Manage all long-lived cluster releases through the GitOps repository.
8. Maintain tested rollback and database recovery procedures for critical services.

The desired outcome is a repeatable, reviewable, and auditable deployment model for the complete Baraza banking platform—not a collection of manually maintained Kubernetes manifests.

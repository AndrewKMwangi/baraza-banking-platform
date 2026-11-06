# Monitoring and Observability

## 1. Purpose

This document defines how the Baraza Banking Platform is monitored and how engineers use observability data to understand service health, investigate failures, protect banking operations, and improve reliability.

Monitoring answers known operational questions through metrics, dashboards, and alerts. Observability combines metrics, logs, and distributed traces so engineers can investigate conditions that were not anticipated when a dashboard or alert was designed.

Baraza is a modernization programme for a production banking platform. Its cloud-native target must provide operational visibility across customer channels, domain services, payment integrations, databases, messaging, and the Kubernetes infrastructure that runs them.

This document describes the target observability design and practical implementation conventions. A technology or dashboard described here is not automatically evidence that it is already deployed. Implementation status is summarized near the end.

## 2. Observability objectives

The observability design must help operations and engineering teams answer six questions:

1. **Availability:** Can customers and staff reach the banking services they need?
2. **Performance:** Are requests, database operations, and payment workflows completing within expected time?
3. **Correctness:** Are transactions moving through valid states, and are financial records reconcilable?
4. **Capacity:** Are services, nodes, databases, and connection pools approaching resource limits?
5. **Security:** Are authentication failures, suspicious access patterns, and configuration changes visible?
6. **Recoverability:** Can an operator identify the affected component, determine the impact, and follow a controlled recovery procedure?

Monitoring must cover both technical health and business-process health. A green Kubernetes Pod does not prove that a customer can transfer funds, that a payment provider has acknowledged a request, or that ledger postings balance.

## 3. Observability architecture

The target architecture uses the following signal paths:

- **Metrics:** Spring Boot/Micrometer and infrastructure exporters expose measurements; Prometheus collects and stores time-series data.
- **Dashboards and alerting:** Grafana presents service, platform, database, and banking-operation views. Alert rules notify the responsible team.
- **Traces:** OpenTelemetry instrumentation propagates trace context across HTTP and asynchronous service boundaries; an OpenTelemetry Collector receives and exports telemetry to a compatible trace backend.
- **Logs:** Services emit structured logs to stdout/stderr. A cluster-level collection pipeline forwards logs to a centralized searchable backend.
- **Kubernetes and cloud signals:** Cluster, node, workload, ingress, and managed database metrics are collected through appropriate exporters and cloud integrations.

~~~mermaid
flowchart TB
    subgraph Workloads["Baraza workloads"]
      A[Internet banking web]
      B[Customer service]
      C[Account service]
      D[Transaction and payment services]
      E[Notification and operations services]
    end
    subgraph Telemetry["Instrumentation and collection"]
      F[Micrometer / Actuator]
      G[OpenTelemetry SDK]
      H[OpenTelemetry Collector]
      I[Prometheus]
      J[Log collector]
    end
    subgraph Analysis["Observability platform"]
      K[Grafana dashboards and alerts]
      L[Trace backend]
      M[Central log backend]
    end
    A --> F
    B --> F
    C --> F
    D --> F
    E --> F
    B --> G
    C --> G
    D --> G
    E --> G
    F --> I
    G --> H
    H --> L
    I --> K
    J --> M
    K --> N[On-call / operations]
    L --> K
    M --> K
~~~

The diagram is logical. Exact exporters, storage backends, retention periods, and managed services are selected during environment implementation.

## 4. The three primary telemetry signals

### 4.1 Metrics

Metrics are numerical measurements recorded over time. They are efficient for alerting, trend analysis, capacity planning, and service-level objectives.

Examples include:

- Request rate, error rate, and request duration.
- JVM heap, garbage collection, thread count, and process uptime.
- CPU, memory, restarts, and Pod readiness.
- Database connection-pool usage, query latency, and connection failures.
- Payment-provider response time and outcome counts.
- Transaction processing volume and state-transition counts.

Metrics should use bounded labels. Avoid labels containing customer IDs, account numbers, transaction references, email addresses, phone numbers, or raw URLs with identifiers. High-cardinality labels increase storage cost and can make Prometheus unstable.

### 4.2 Logs

Logs are timestamped event records that explain what an application or platform component did.

Baraza services should write logs to stdout/stderr and let the runtime collection pipeline handle transport and retention. Prefer structured JSON logs with consistent fields:

- timestamp
- severity
- service name and version
- environment
- trace ID and span ID, when available
- event name
- outcome or error category
- safe operational context

Do not log passwords, access tokens, authorization headers, session cookies, full payment credentials, or unnecessary customer information. Mask or omit sensitive values. A transaction reference may be useful for controlled investigation, but it must be handled under the platform's data classification and access policy.

Use appropriate log levels:

| Level | Intended use |
|---|---|
| ERROR | Operation failed and requires investigation or controlled retry |
| WARN | Degraded or unusual condition that may need attention |
| INFO | Important lifecycle or business-process event without sensitive payload |
| DEBUG | Temporary diagnostic detail, disabled or restricted in production |
| TRACE | Very detailed instrumentation, generally unsuitable for routine production |

Avoid logging the same exception at every service boundary. Log the failure where actionable context is available and propagate trace context so the complete request can be investigated.

### 4.3 Distributed traces

A distributed trace represents one request or workflow across multiple services. A trace contains spans describing individual operations and their timing.

For example, an internet banking transfer can cross the web/API boundary, authentication, account validation, transaction orchestration, ledger posting, and notification. Trace context should be propagated through HTTP headers and supported messaging metadata.

~~~mermaid
sequenceDiagram
    participant UI as Internet banking
    participant API as API entry point
    participant TX as Transaction service
    participant AC as Account service
    participant GL as Ledger service
    participant NO as Notification service

    UI->>API: Submit transfer (trace context)
    API->>TX: Create transfer
    TX->>AC: Validate accounts
    AC-->>TX: Validation result
    TX->>GL: Request financial posting
    GL-->>TX: Posting result
    TX->>NO: Publish transfer event
    NO-->>TX: Accepted for delivery
    TX-->>API: Transfer result
    API-->>UI: Response
~~~

The trace shows technical execution and timing. It does not replace the authoritative transaction record, ledger, audit trail, or payment-provider reconciliation data.

## 5. Instrumenting Spring Boot services

Baraza backend services use Java and Spring Boot. The standard instrumentation approach is Spring Boot Actuator with Micrometer for application metrics, complemented by OpenTelemetry for distributed traces.

Typical capabilities to configure include:

- Liveness and readiness health groups.
- Prometheus-format metrics endpoint.
- JVM and process metrics.
- HTTP server request metrics.
- Database pool metrics where the connection pool exposes them.
- Custom domain metrics with bounded labels.
- Trace propagation and export through OpenTelemetry.

The exact dependencies and endpoint exposure must be checked in each service's Maven configuration and application settings. Do not assume every service currently exposes every endpoint.

### 5.1 Health endpoints

Common Spring Boot Actuator endpoints include:

| Endpoint | Purpose |
|---|---|
| /actuator/health | Overall health summary |
| /actuator/health/liveness | Whether the process should continue running |
| /actuator/health/readiness | Whether the instance should receive traffic |
| /actuator/prometheus | Prometheus scrape endpoint, when configured |

Expose only the endpoints required by the monitoring design. Restrict management endpoints through network policy, authentication, or a dedicated management interface. Do not expose environment, heap dump, configuration properties, or other sensitive diagnostic endpoints publicly.

Health semantics matter:

- **Liveness** should detect a process that is unable to make progress. It should not fail simply because an external dependency is temporarily unavailable.
- **Readiness** should indicate whether the instance can safely serve requests. Dependency checks may be included when they accurately reflect whether traffic should be routed to the instance.
- **Startup** probes allow applications with longer initialization to start without premature liveness restarts.

### 5.2 Example Prometheus scrape configuration

The following is an illustrative scrape job. The actual Kubernetes service labels, namespace, port name, and endpoint must match the deployed Service and Pod configuration.

~~~yaml
scrape_configs:
  - job_name: baraza-customer-service
    metrics_path: /actuator/prometheus
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace]
        action: keep
        regex: baraza-banking
      - source_labels: [__meta_kubernetes_pod_label_app]
        action: keep
        regex: customer-service
      - source_labels: [__meta_kubernetes_pod_ip]
        target_label: __address__
        replacement: $1:8080
~~~

This example demonstrates the discovery concept; production Prometheus Operator installations commonly use ServiceMonitor or PodMonitor resources instead of manually maintained scrape jobs. Choose one consistent discovery model.

## 6. Metrics design and naming

Use clear, consistent metric names and units. Prefer counters for cumulative event totals, gauges for values that can rise and fall, and histograms for distributions such as request duration.

Examples of useful application metrics include:

| Metric concept | Type | Useful dimensions |
|---|---|---|
| HTTP requests total | Counter | service, method, route template, status class |
| HTTP request duration | Histogram | service, route template |
| Active database connections | Gauge | service, pool |
| Database connection acquisition time | Histogram | service, pool |
| Payment requests total | Counter | provider, outcome category |
| Payment request duration | Histogram | provider, operation |
| Transaction state transitions total | Counter | operation type, from/to state |
| Notification delivery attempts total | Counter | channel, outcome |
| Pending work items | Gauge | queue or worker group |

Do not create a separate time series for every customer, account, payment reference, or transaction ID. Put controlled identifiers in access-restricted logs or traces when operationally justified, not in metric labels.

## 7. Infrastructure and Kubernetes monitoring

Application metrics alone cannot explain node pressure, scheduling failures, storage exhaustion, or cluster networking issues.

The production target should monitor:

### Cluster and node health

- Node readiness and resource pressure.
- CPU, memory, disk, and network utilization.
- Node capacity and allocatable resources.
- Node restarts, kernel pressure, and filesystem availability.
- Cluster autoscaler activity and pending capacity.

### Workload health

- Desired versus available replicas.
- Pod restarts and crash loops.
- Pending Pods and scheduling failures.
- Deployment rollout status and rollout duration.
- Container CPU throttling and memory working set.
- PersistentVolume capacity and mount errors.
- HPA current versus desired replicas and metric availability.

### Network and ingress

- Request volume, latency, and status codes at ingress.
- TLS certificate expiry.
- DNS resolution failures.
- Network policy denials where observable.
- Load balancer health and target availability.

For EKS, integrate Kubernetes metrics with AWS service telemetry for the control plane, load balancers, networking, and managed databases. Use CloudWatch or an approved equivalent where AWS-native signals are required. Do not assume Prometheus alone exposes every AWS control-plane or managed-service metric.

## 8. PostgreSQL monitoring

Database health is critical to customer, account, transaction, payment, and ledger workloads. Monitor each service-owned database or schema boundary according to its actual topology.

Important PostgreSQL signals include:

- Connection count and maximum connection utilization.
- Active, idle, and waiting sessions.
- Query latency and slow-query trends.
- Transaction rate and rollback rate.
- Lock waits, deadlocks, and long-running transactions.
- Cache hit ratio and I/O behavior.
- Table/index growth and bloat indicators.
- Replication lag and replication health where applicable.
- Backup completion, age, and restore-test status.
- Storage capacity and database availability.

Connection-pool metrics should be correlated with PostgreSQL connection counts. A service scale-out can multiply connection demand and exhaust database capacity even when each Pod appears healthy.

Do not expose SQL statements containing customer data in general dashboards. Restrict detailed query diagnostics to authorized operators and apply masking/retention controls.

## 9. Banking-domain monitoring

Baraza requires business-process indicators in addition to infrastructure metrics. These signals should show whether important banking workflows are progressing, failing, or becoming delayed.

### 9.1 Customer onboarding and access

Monitor:

- Customer application submissions and outcomes.
- Pending applications and age of oldest pending application.
- Approval/rejection processing failures.
- Authentication success and failure rates.
- Account lockouts and unusual authentication patterns.
- Token issuance errors and authorization denials.

A rise in login failures may indicate a genuine attack, a frontend regression, expired credentials, or an identity-service outage. Alerts should include enough context to distinguish these cases without exposing credentials or personal data.

### 9.2 Accounts and transactions

Monitor:

- Account API availability and latency.
- Transaction initiation, completion, rejection, and failure counts.
- Transaction processing duration and backlog age.
- Invalid state transitions.
- Duplicate request/idempotency conflict rates.
- Ledger posting failures and unbalanced journal detection.
- Reversal and exception-processing queues.

A successful API response is not sufficient evidence that a financial transaction has been fully posted. Instrument the transaction lifecycle and verify the final authoritative state.

### 9.3 Payments and external providers

Monitor each payment provider and operation separately:

- Request volume and response latency.
- Accepted, rejected, timed-out, and unknown outcomes.
- Callback delivery and callback processing failures.
- Signature/verification failures.
- Idempotency conflicts and duplicate callback attempts.
- Pending payment age and unresolved provider references.
- Reconciliation differences between internal records and provider statements.

A timeout can mean the provider never received the request or that it processed the request but the response was lost. Do not automatically interpret a timeout as a failed payment or retry a non-idempotent operation. Use the payment state machine, provider query/reconciliation process, and idempotency controls.

### 9.4 Deposits, withdrawals, teller and branch operations

Monitor:

- Deposit and withdrawal request outcomes.
- Teller session availability and session closure exceptions.
- Cash drawer opening/closing discrepancies.
- Branch connectivity and offline operation queues.
- Cash/vault movement exceptions.
- Delayed posting and unresolved operational exceptions.

Branch and teller metrics must not expose customer account details or sensitive cash-handling information to unauthorized audiences.

### 9.5 Ledger and reconciliation

Monitor:

- Journal posting success/failure.
- Debit/credit balancing exceptions.
- Unposted or partially processed transaction counts.
- Reconciliation run completion and duration.
- Unmatched internal/provider/bank statement entries.
- Age and value bands of unresolved exceptions, subject to access policy.

Ledger imbalance and reconciliation exceptions require high-priority investigation. Do not silently suppress or automatically clear them merely to restore a green dashboard.

## 10. Service-level indicators and objectives

A service-level indicator (SLI) is a measured aspect of service behavior. A service-level objective (SLO) is a target for that indicator over a defined period. Define objectives from customer impact and measured baseline rather than choosing arbitrary numbers.

Candidate SLIs:

| Service area | SLI | Example measurement |
|---|---|---|
| Internet banking | Successful request availability | Successful eligible requests / eligible requests |
| Authentication | Login service availability | Successful valid authentication attempts / valid attempts |
| Account service | Read latency | Request duration distribution for account reads |
| Transactions | Completion latency | Time from accepted request to terminal state |
| Payments | Provider processing outcome | Confirmed outcomes and unresolved/unknown outcomes |
| Notifications | Delivery timeliness | Time from event creation to delivery outcome |
| Database | Availability and saturation | Connection availability, latency, capacity |
| Reconciliation | Completion and exception age | Scheduled run completion and unresolved backlog |

An SLO must specify the service boundary, eligible traffic, measurement window, target, exclusions, and owner. For example, exclude invalid client requests from an availability denominator only when the exclusion is consistently defined and cannot hide service failures.

For critical financial workflows, pair latency and availability objectives with correctness indicators. A fast transfer that is posted twice is not a successful service outcome.

## 11. Alerting principles

Alerts should be actionable, owned, and tied to a response procedure. Prefer symptoms of customer impact over noisy alerts on every individual resource metric.

Alert priority should reflect impact and urgency:

| Priority | Meaning | Example |
|---|---|---|
| P1 Critical | Major customer or financial impact; immediate response | Ledger imbalance, widespread transaction failure, suspected data integrity issue |
| P2 High | Important service degraded; prompt response | Payment provider failures above threshold, customer login outage |
| P3 Medium | Limited degradation or capacity risk | Elevated latency, growing notification backlog |
| P4 Informational | Operational notice; no immediate response | Deployment completed, certificate renewal approaching |

Potential alert groups:

- Availability: service down, ingress failure, unavailable replicas.
- Latency: sustained request-duration regression.
- Errors: elevated 5xx rate, authentication dependency failures.
- Saturation: CPU/memory pressure, database connection exhaustion, disk capacity.
- Kubernetes: crash loops, pending Pods, failed rollouts, HPA unable to scale.
- Payments: provider outage, unknown payment outcomes, callback backlog.
- Financial integrity: ledger balancing exception, reconciliation discrepancy.
- Security: unusual authentication failure patterns, privilege escalation signals, suspicious access.
- Recovery: backup failure, replication lag, failed restore test.

Use sustained windows, sensible thresholds, grouping, and inhibition to avoid alert storms. A single root-cause alert should not generate dozens of duplicate notifications for every downstream service.

## 12. Dashboard design

Dashboards should be organized around the questions an operator needs to answer, not around a list of technologies.

Recommended dashboards:

1. **Executive banking health:** channel availability, transaction completion, payment outcomes, and critical incidents.
2. **Service overview:** request rate, error rate, latency, saturation, and replica health by service.
3. **Customer and authentication:** onboarding queue, login outcomes, authorization errors, and identity-service health.
4. **Transaction and ledger:** transaction state distribution, posting failures, idempotency conflicts, and ledger exceptions.
5. **Payments:** provider availability, response time, callbacks, unknown outcomes, and reconciliation status.
6. **PostgreSQL:** connections, query latency, locks, replication, storage, and backups.
7. **Kubernetes/EKS:** cluster capacity, nodes, Pods, rollouts, HPA, and ingress.
8. **Notifications:** queue depth, delivery latency, retry volume, and dead-letter backlog.
9. **Security operations:** authentication anomalies, privileged changes, and policy violations.

Each dashboard should show environment, time range, service version, and relevant links to logs/traces. Restrict financial and security dashboards to authorized roles. Avoid exposing personal or account-level data in broad operational views.

## 13. Distributed tracing and context propagation

Use W3C Trace Context where supported. Propagate trace context across HTTP calls and asynchronous messages. Instrument important spans such as authentication, account lookup, transaction validation, ledger posting, payment-provider call, and notification dispatch.

Useful span attributes are bounded and non-sensitive: service name, operation, environment, provider name, result category, and version. Do not attach access tokens, full request/response bodies, passwords, account numbers, or personal details to spans.

Sampling should balance cost and diagnostic value. Use head sampling for baseline control and consider tail sampling for retaining traces with errors or unusual latency when the selected backend supports it. Ensure trace retention and access are aligned with security and privacy requirements.

## 14. Log correlation and audit separation

Application logs, distributed traces, security events, and financial audit records serve different purposes:

- **Application logs** explain technical events and failures.
- **Traces** connect work across service boundaries.
- **Security events** record authentication, authorization, and privileged actions.
- **Financial audit records** provide authoritative evidence of business actions and changes to financial state.

Do not use ordinary application logs as the sole financial audit record. Audit events should be durable, access-controlled, tamper-evident where required, and governed by explicit retention policies.

Use a correlation identifier to connect an operational investigation to the relevant business record, subject to access controls. Keep the authoritative record in the domain data/audit system rather than copying sensitive payloads into telemetry.

## 15. Security, privacy, and access control

Observability systems can contain sensitive operational information. Apply security controls to collection, transport, storage, access, and export:

- Encrypt telemetry in transit and at rest.
- Restrict dashboards, logs, traces, and alert channels by role.
- Use separate permissions for platform operators, developers, security teams, and auditors.
- Mask or drop sensitive fields before collection.
- Define retention periods by signal and business requirement.
- Audit administrative access and changes to alerting/configuration.
- Protect scrape endpoints and collector receivers.
- Rotate credentials and use workload identity where supported.
- Prevent telemetry from becoming an unintended path for customer data exfiltration.

Never place secrets or personal financial data in metric labels, dashboard variables, alert annotations, or public issue links.

## 16. Retention, capacity, and cost

Metrics, logs, and traces have different storage and query patterns. Set retention according to operational use, regulatory requirements, incident investigation needs, and cost.

Control telemetry volume through:

- Bounded metric labels and cardinality reviews.
- Appropriate scrape intervals.
- Trace sampling and span filtering.
- Log-level controls and structured event selection.
- Retention tiers for frequently accessed and archived data.
- Compression, lifecycle policies, and capacity monitoring.
- Removal of duplicate or low-value instrumentation.

Do not select a retention duration without confirming applicable legal, regulatory, contractual, and organizational requirements. Financial audit retention is governed separately from routine telemetry retention.

## 17. Incident investigation workflow

When an alert fires:

1. Confirm the alert, environment, affected service, and time window.
2. Establish customer and business impact: which channel or workflow is affected?
3. Check service overview dashboards for rate, errors, latency, and saturation.
4. Check Kubernetes rollout, Pod events, restarts, and node health.
5. Inspect correlated logs and traces using trace/correlation identifiers.
6. Check dependencies: database, payment provider, DNS, ingress, and messaging.
7. Determine whether the issue affects in-flight or uncertain financial operations.
8. Follow the relevant runbook; do not improvise financial reversals or retries.
9. Verify service recovery and business-process completion.
10. Record timeline, impact, root cause, remediation, and follow-up actions.

~~~mermaid
flowchart TD
    A[Alert received] --> B[Confirm impact and scope]
    B --> C[Inspect service and platform metrics]
    C --> D[Correlate logs and traces]
    D --> E[Check dependencies and recent changes]
    E --> F{Financial outcome uncertain?}
    F -- Yes --> G[Pause unsafe retries and follow payment or ledger runbook]
    F -- No --> H[Apply approved service recovery]
    G --> I[Verify authoritative records and reconcile]
    H --> J[Verify service and customer workflow]
    I --> J
    J --> K[Document incident and corrective actions]
~~~

## 18. Local development and production environments

| Area | Local development | Production target |
|---|---|---|
| Application instrumentation | Actuator/Micrometer and local logs | Standardized metrics and traces across services |
| Metrics | Local Prometheus where resources permit | Highly available/managed Prometheus-compatible platform |
| Dashboards | Local Grafana | Role-controlled shared Grafana |
| Traces | Local collector/backend or sampled export | Centralized OpenTelemetry pipeline and trace backend |
| Logs | Docker/Kubernetes logs | Centralized structured log platform |
| Infrastructure | Minikube and local Docker | EKS, AWS networking, load balancers, managed database |
| Alerting | Test rules and local notifications | On-call routing, escalation, and incident integration |
| Data | Synthetic development data | Protected production telemetry with privacy controls |

The development workstation has limited memory. Keep local observability lightweight and enable only the components needed for the current exercise. Do not install a full production-scale metrics, logging, and tracing stack on a resource-constrained machine simply to demonstrate the architecture.

## 19. Practical verification commands

The following PowerShell commands help inspect current local Kubernetes workloads. They do not assume that Prometheus or Grafana is already installed.

~~~powershell
kubectl get pods -A
kubectl get services -A
kubectl get deployments -A

kubectl get pods -n baraza-banking
kubectl describe pod <POD_NAME> -n baraza-banking
kubectl logs <POD_NAME> -n baraza-banking
kubectl logs <POD_NAME> -n baraza-banking --previous

kubectl get events -n baraza-banking --sort-by=.metadata.creationTimestamp
kubectl top nodes
kubectl top pods -A
~~~

The metrics commands require a working Metrics Server or compatible metrics API. They do not provide historical Prometheus time series.

For a service that exposes Actuator locally, verify its health endpoint using the actual service port:

~~~powershell
Invoke-RestMethod -Uri "http://localhost:<SERVICE_PORT>/actuator/health"
~~~

Only test the Prometheus endpoint after the service has the required dependency and endpoint configuration:

~~~powershell
Invoke-WebRequest -Uri "http://localhost:<SERVICE_PORT>/actuator/prometheus"
~~~

Do not expose management endpoints publicly to make these tests work. Use local port forwarding or an approved internal route where appropriate.

## 20. Operational readiness checklist

### Instrumentation

- [ ] Every service has a consistent service name, version, and environment identity.
- [ ] Health endpoints are configured and access-controlled.
- [ ] Request metrics include rate, errors, and duration.
- [ ] JVM, connection-pool, and dependency metrics are available.
- [ ] Trace context crosses service and messaging boundaries.
- [ ] Logs are structured and correlated.
- [ ] Sensitive values are masked or excluded.

### Platform monitoring

- [ ] Kubernetes node, Pod, deployment, and ingress health is visible.
- [ ] Database connections, latency, locks, storage, and backups are monitored.
- [ ] Autoscaling and capacity failures generate actionable alerts.
- [ ] AWS managed-service signals are integrated for the EKS target.
- [ ] Retention and telemetry cost are reviewed.

### Banking operations

- [ ] Transaction lifecycle outcomes and processing delays are visible.
- [ ] Payment provider timeouts and unknown outcomes are tracked separately.
- [ ] Callback failures and idempotency conflicts are monitored.
- [ ] Ledger posting and balancing exceptions are alerted.
- [ ] Reconciliation runs and unresolved differences are visible.
- [ ] Teller, branch, and notification backlogs are monitored as those services are introduced.
- [ ] Dashboards do not expose unauthorized customer or financial data.

### Incident response

- [ ] Alerts have owners, priorities, and runbooks.
- [ ] On-call routing and escalation are tested.
- [ ] Operators can correlate metrics, logs, traces, and release changes.
- [ ] Recovery procedures protect financial integrity.
- [ ] Incidents result in documented corrective actions.

## 21. Implementation status and evolution

Baraza's target observability design uses Prometheus, Grafana, and OpenTelemetry, with structured centralized logging and AWS/EKS telemetry integration as the platform moves toward production. These are architectural standards and implementation targets; do not describe the complete observability stack as deployed until its components, service instrumentation, dashboards, alert rules, and retention controls have been installed and verified.

The platform should evolve in stages:

1. Standardize Actuator health and Micrometer metrics across the existing Spring Boot services.
2. Add Prometheus collection and a small set of service/Kubernetes dashboards.
3. Introduce OpenTelemetry context propagation and trace export across service boundaries.
4. Establish structured log fields, redaction, and centralized collection.
5. Add PostgreSQL and payment-provider monitoring.
6. Define measurable SLIs/SLOs and alert thresholds from observed baselines.
7. Add banking-domain dashboards for transaction state, ledger exceptions, and reconciliation.
8. Integrate EKS and AWS managed-service telemetry, access controls, retention, and on-call workflows.
9. Exercise incident runbooks and verify recovery without compromising financial records.

The goal is operational observability of the complete banking service—not merely a dashboard showing that containers are running.

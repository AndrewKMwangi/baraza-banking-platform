# Baraza Banking Platform — Architecture

## 1. Overview

The Baraza Banking Platform is an end-to-end cloud-native banking platform designed around a microservices architecture.

The platform separates core banking capabilities into independently deployable services while using Kubernetes, Helm, containerization, infrastructure-as-code, observability, and CI/CD practices to provide a production-oriented platform engineering foundation.

The architecture is designed to demonstrate how a banking workload can move from application development through containerization, deployment, service discovery, scaling, monitoring, and infrastructure automation.

At a high level, the platform consists of:

* Customer management
* Account management
* Transaction processing
* Notification services
* PostgreSQL persistence
* Docker containerization
* Kubernetes orchestration
* Helm-based application deployment
* Kubernetes Ingress for external HTTP access
* Metrics Server and Horizontal Pod Autoscaling
* Monitoring and observability components
* Terraform-managed infrastructure
* CI/CD automation

---

## 2. Architectural Principles

The platform follows several principles commonly used in modern cloud and platform engineering environments.

### 2.1 Microservice Separation

Business capabilities are separated into independently deployable services.

This allows individual services to be:

* Developed independently
* Built independently
* Containerized independently
* Deployed independently
* Scaled independently
* Updated without rebuilding the entire platform

### 2.2 Containerization

Each application service is packaged as a Docker image.

This provides consistency between development, testing, and Kubernetes environments.

The container image becomes the deployment artifact consumed by Kubernetes.

### 2.3 Kubernetes-Native Deployment

Kubernetes is responsible for running and managing the application workloads.

It provides:

* Pod scheduling
* Service discovery
* Replica management
* Rolling deployments
* Self-healing
* Resource management
* Horizontal scaling

### 2.4 Configuration Separation

Application configuration is separated from the application image.

Environment-specific configuration is managed through Kubernetes and Helm configuration rather than rebuilding the application image for every environment.

### 2.5 Infrastructure as Code

Terraform is used as the infrastructure-as-code layer.

The intended model is:

```text
Terraform
    │
    ▼
Infrastructure
    │
    ▼
Kubernetes Platform
    │
    ▼
Helm
    │
    ▼
Applications
```

This separates infrastructure provisioning from application deployment.

---

# 3. High-Level Architecture

The following represents the overall platform architecture.

```text
                         ┌───────────────────────┐
                         │        Client         │
                         │ Browser / API Client  │
                         └───────────┬───────────┘
                                     │
                                     │ HTTP
                                     ▼
                         ┌───────────────────────┐
                         │   Kubernetes Ingress  │
                         │       NGINX           │
                         └───────────┬───────────┘
                                     │
                ┌────────────────────┼────────────────────┐
                │                    │                    │
                ▼                    ▼                    ▼
       ┌────────────────┐   ┌────────────────┐   ┌────────────────┐
       │ Customer       │   │ Account        │   │ Transaction    │
       │ Service        │   │ Service        │   │ Service        │
       └───────┬────────┘   └───────┬────────┘   └───────┬────────┘
               │                    │                    │
               │                    │                    │
               └────────────────────┼────────────────────┘
                                    │
                                    ▼
                         ┌───────────────────────┐
                         │      PostgreSQL       │
                         │       Database        │
                         └───────────────────────┘

                         ┌───────────────────────┐
                         │ Notification Service  │
                         └───────────┬───────────┘
                                     │
                                     ▼
                              Notification
                              Infrastructure


       ┌──────────────────────────────────────────────────────┐
       │                  Kubernetes Cluster                   │
       │                                                      │
       │  Deployments │ Pods │ Services │ Ingress │ HPA      │
       │                                                      │
       │  Metrics Server │ Monitoring │ Configurations       │
       └──────────────────────────────────────────────────────┘

       ┌──────────────────────────────────────────────────────┐
       │                Platform Engineering                   │
       │                                                      │
       │ Terraform │ Helm │ Docker │ CI/CD │ Git             │
       └──────────────────────────────────────────────────────┘
```

---

# 4. Application Architecture

The application layer is composed of independently deployable Spring Boot microservices.

## 4.1 Customer Service

The Customer Service manages customer-related operations.

Typical responsibilities include:

* Customer creation
* Customer retrieval
* Customer updates
* Customer information management

The service exposes REST APIs and persists customer information in PostgreSQL.

```text
Client
   │
   ▼
Customer Service
   │
   ▼
Customer Repository
   │
   ▼
PostgreSQL
```

---

## 4.2 Account Service

The Account Service is responsible for banking account functionality.

Its responsibilities include operations around:

* Bank accounts
* Account ownership
* Account status
* Account information

The service is independently deployed and can be scaled separately from other services.

```text
Client
   │
   ▼
Account Service
   │
   ▼
Account Repository
   │
   ▼
PostgreSQL
```

---

## 4.3 Transaction Service

The Transaction Service handles financial transaction processing.

Its responsibilities include operations such as:

* Transaction creation
* Transaction validation
* Transaction retrieval
* Transaction status

Transactions represent a critical business capability and should be designed with strong consistency and auditability requirements.

```text
Client
   │
   ▼
Transaction Service
   │
   ▼
Transaction Repository
   │
   ▼
PostgreSQL
```

---

## 4.4 Notification Service

The Notification Service is responsible for notification-related operations.

It is intentionally separated from the core transaction flow so that notification processing can evolve independently.

Examples of notifications include:

* Transaction notifications
* Account notifications
* Customer notifications
* Operational alerts

The separation also allows notification processing to evolve toward asynchronous messaging in a future version.

---

# 5. Service-to-Service Architecture

Each microservice is deployed independently inside Kubernetes.

Kubernetes Services provide stable networking endpoints for the application workloads.

```text
                 Kubernetes Cluster
                        │
       ┌────────────────┼────────────────┐
       │                │                │
       ▼                ▼                ▼
 Customer Service   Account Service   Transaction Service
       │                │                │
       │                │                │
       └────────────────┼────────────────┘
                        │
                        ▼
                   PostgreSQL
```

A Kubernetes Service provides a stable abstraction over the underlying Pods.

For example:

```text
customer-service
       │
       ├── Pod
       ├── Pod
       └── Pod
```

If a Pod is replaced, the Service remains available while Kubernetes updates the underlying endpoints.

---

# 6. Kubernetes Architecture

The Kubernetes cluster provides the runtime platform for the Baraza services.

The major Kubernetes resources include:

* Namespace
* Deployment
* Pod
* Service
* Ingress
* ConfigMap
* Secret
* HorizontalPodAutoscaler

The workloads are logically isolated within the `baraza-banking` namespace.

```text
Kubernetes Cluster
│
├── kube-system
│   ├── Kubernetes control components
│   ├── CoreDNS
│   ├── Metrics Server
│   └── Ingress Controller
│
└── baraza-banking
    │
    ├── customer-service
    │   ├── Deployment
    │   ├── Pods
    │   └── Service
    │
    ├── account-service
    │   ├── Deployment
    │   ├── Pods
    │   └── Service
    │
    ├── transaction-service
    │   ├── Deployment
    │   ├── Pods
    │   └── Service
    │
    ├── notification-service
    │   ├── Deployment
    │   ├── Pods
    │   └── Service
    │
    ├── postgres
    │   ├── Deployment
    │   └── Service
    │
    └── Ingress
```

---

# 7. Kubernetes Deployment Model

Each application is represented by a Kubernetes Deployment.

The Deployment defines the desired state of the workload.

For example:

```yaml
replicas: 2
```

means Kubernetes should maintain two Pod replicas under normal conditions.

The Deployment also controls:

* Container image
* Container port
* Environment variables
* Resource requests
* Resource limits
* Liveness probes
* Readiness probes
* Replica count

Kubernetes continuously works to reconcile the actual state with the desired state.

---

# 8. Kubernetes Service Discovery

Pods are ephemeral.

Their IP addresses can change when Pods are recreated.

Kubernetes Services provide stable networking identities.

For example:

```text
customer-service
       │
       ▼
Kubernetes Service
       │
       ├── customer-service Pod
       ├── customer-service Pod
       └── customer-service Pod
```

Other workloads communicate with the Service rather than directly addressing individual Pods.

This allows Kubernetes to dynamically replace Pods without requiring consumers to know the new Pod IP addresses.

---

# 9. Ingress Architecture

External HTTP traffic enters the Kubernetes environment through the Ingress layer.

The platform uses the NGINX Ingress Controller.

The traffic flow is:

```text
External Client
      │
      │ HTTP
      ▼
NGINX Ingress Controller
      │
      ├── customer.baraza.local
      │          │
      │          ▼
      │    customer-service
      │
      ├── account.baraza.local
      │          │
      │          ▼
      │     account-service
      │
      └── transaction.baraza.local
                 │
                 ▼
          transaction-service
```

Ingress provides a centralized HTTP routing layer.

This avoids exposing every microservice directly to the external network.

---

# 10. Database Architecture

PostgreSQL provides relational persistence for the platform.

The database is deployed separately from the application services.

The logical architecture is:

```text
Microservices
     │
     ▼
PostgreSQL
     │
     ├── Customer data
     ├── Account data
     └── Transaction data
```

The current development environment uses PostgreSQL running in the Kubernetes environment.

The architecture can evolve toward a production-managed database service such as Amazon RDS or Amazon Aurora when deployed to AWS.

---

# 11. Configuration Management

Configuration is separated from application code.

Environment-specific settings can be supplied through Kubernetes and Helm.

Examples include:

* Database connection information
* Application ports
* Replica counts
* Image tags
* Resource configuration
* Ingress configuration

This allows the same application image to be promoted across environments while changing configuration independently.

---

# 12. Helm Architecture

Helm provides the application packaging and deployment layer.

Each application can have its own Helm chart.

For example:

```text
infrastructure/
└── helm/
    ├── customer-service/
    ├── account-service/
    ├── transaction-service/
    └── notification-service/
```

A Helm chart contains Kubernetes templates and configurable values.

The structure allows different environment configurations.

```text
values.yaml
     │
     ├── values-dev.yaml
     ├── values-staging.yaml
     └── values-prod.yaml
```

This allows the same chart to be deployed with environment-specific configuration.

---

# 13. Environment Promotion

The intended application promotion model is:

```text
Developer
    │
    ▼
Git Repository
    │
    ▼
CI Pipeline
    │
    ▼
Build
    │
    ▼
Test
    │
    ▼
Docker Image
    │
    ▼
Development
    │
    ▼
Staging
    │
    ▼
Production
```

The Docker image is treated as the immutable application artifact.

Rather than rebuilding the application for every environment, the same versioned image can be promoted through the deployment environments.

---

# 14. Docker Architecture

Spring Boot applications are packaged as Docker images.

The basic flow is:

```text
Spring Boot Application
          │
          ▼
       Maven Build
          │
          ▼
       JAR Artifact
          │
          ▼
     Docker Build
          │
          ▼
 Docker Image
          │
          ▼
 Kubernetes Deployment
```

For local Kubernetes development, images can be loaded into the Minikube environment.

This avoids requiring a public container registry during local development.

---

# 15. Autoscaling Architecture

The platform uses Kubernetes Horizontal Pod Autoscaling.

The relationship is:

```text
Application Pods
      │
      ▼
Metrics Server
      │
      ▼
HPA
      │
      ▼
Deployment
      │
      ▼
Replica Count
```

The HPA evaluates resource utilization against configured thresholds.

For example:

```text
CPU utilization:     70%
Memory utilization:  80%

Minimum replicas:    2
Maximum replicas:    5
```

If utilization increases beyond the configured target, the HPA can increase the number of replicas.

When demand decreases, the HPA can scale the workload back toward the configured minimum.

The Deployment remains the owner of the Pods while the HPA controls the desired replica count.

---

# 16. Observability Architecture

Observability is an important part of the platform.

The monitoring architecture is designed around:

* Metrics
* Logs
* Application health
* Kubernetes resource status
* Infrastructure health

The general model is:

```text
Applications
     │
     ▼
Kubernetes
     │
     ├── Metrics
     ├── Logs
     └── Health information
             │
             ▼
        Monitoring Stack
             │
             ▼
         Dashboards
```

Prometheus and Grafana are used as the foundation for monitoring and visualization within the platform's observability work.

---

# 17. Infrastructure Architecture

Infrastructure provisioning is separated from application deployment.

Terraform represents the infrastructure-as-code layer.

```text
                 Git Repository
                       │
                       ▼
                   Terraform
                       │
                       ▼
             Infrastructure Layer
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Cloud Resources       Kubernetes
                                   │
                                   ▼
                                  Helm
                                   │
                                   ▼
                              Applications
```

This separation establishes a clear boundary:

**Terraform provisions infrastructure.**

**Helm deploys applications onto the platform.**

---

# 18. CI/CD Architecture

The CI/CD pipeline automates the software delivery lifecycle.

A typical pipeline follows:

```text
Git Push
   │
   ▼
Source Checkout
   │
   ▼
Build
   │
   ▼
Unit Tests
   │
   ▼
Package
   │
   ▼
Docker Build
   │
   ▼
Image Scan
   │
   ▼
Push Image
   │
   ▼
Helm Deployment
   │
   ▼
Kubernetes
   │
   ▼
Health Verification
```

This creates a repeatable deployment process and reduces manual deployment operations.

---

# 19. End-to-End Request Flow

A typical external request follows this path:

```text
Client
  │
  │ HTTP Request
  ▼
Ingress
  │
  ▼
Kubernetes Service
  │
  ▼
Application Pod
  │
  ▼
Spring Boot Application
  │
  ▼
Repository / Persistence Layer
  │
  ▼
PostgreSQL
```

The response follows the reverse path:

```text
PostgreSQL
    │
    ▼
Spring Boot Application
    │
    ▼
Pod
    │
    ▼
Kubernetes Service
    │
    ▼
Ingress
    │
    ▼
Client
```

---

# 20. Failure and Self-Healing Model

One of Kubernetes' major responsibilities is maintaining the desired state.

For example, if a Deployment requires:

```text
replicas: 2
```

and one Pod fails:

```text
Desired:
2 Pods

Actual:
1 Pod
```

Kubernetes detects the difference and creates a replacement Pod.

```text
Pod failure
     │
     ▼
Kubernetes detects failure
     │
     ▼
Replacement Pod created
     │
     ▼
Desired state restored
```

This provides application-level self-healing.

Readiness and liveness probes further improve workload reliability by allowing Kubernetes to determine whether a container is ready to receive traffic or needs to be restarted.

---

# 21. Security Architecture

Security is applied across multiple layers.

### Application Layer

* Input validation
* Authentication and authorization
* Secure API design

### Container Layer

* Minimal container images
* Image scanning
* Versioned images

### Kubernetes Layer

* Namespace isolation
* Secrets
* RBAC
* Network policies where required
* Resource limits

### Infrastructure Layer

* IAM
* Private networking
* Security groups
* Encryption
* Managed secrets

The production AWS implementation can strengthen these controls using AWS-native security services.

---

# 22. Scalability Model

The platform supports horizontal scalability.

Instead of increasing the resources of a single application instance:

```text
1 large Pod
```

the platform can run multiple replicas:

```text
Pod 1
Pod 2
Pod 3
Pod 4
```

Traffic is distributed through the Kubernetes Service.

The HPA can dynamically change the number of replicas based on workload demand.

This makes the architecture suitable for workloads where demand can change over time.

---

# 23. Reliability Model

Reliability is achieved through multiple layers:

```text
                 Reliability
                      │
       ┌──────────────┼──────────────┐
       │              │              │
       ▼              ▼              ▼
   Kubernetes      Multiple       Health
   Self-Healing     Replicas      Probes
       │              │              │
       └──────────────┼──────────────┘
                      ▼
                 HPA Scaling
```

The combination provides:

* Pod replacement
* Multiple replicas
* Health-based traffic routing
* Horizontal scaling
* Controlled deployments

---

# 24. Local Development Architecture

The platform is currently developed and tested locally using Docker Desktop and Minikube.

The local architecture is:

```text
Windows Host
     │
     ├── Docker Desktop
     │
     └── Minikube
           │
           └── Kubernetes Cluster
                 │
                 ├── Baraza Namespace
                 │     │
                 │     ├── Applications
                 │     ├── PostgreSQL
                 │     ├── Services
                 │     └── Ingress
                 │
                 └── Monitoring Components
```

Minikube provides a local Kubernetes environment that allows production-style Kubernetes concepts to be tested without requiring a cloud environment.

---

# 25. Production Cloud Evolution

The architecture is designed to transition from local Kubernetes to a managed cloud environment.

A future AWS deployment can follow this model:

```text
                         AWS Cloud
                            │
                    ┌───────┴────────┐
                    │                │
                   VPC             IAM
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       EKS Cluster          RDS/Aurora
          │
          ├── Customer Service
          ├── Account Service
          ├── Transaction Service
          └── Notification Service
```

Potential AWS services include:

* Amazon EKS for Kubernetes
* Amazon RDS/Aurora for PostgreSQL
* Application Load Balancer
* Amazon ECR for container images
* IAM for identity and access management
* CloudWatch for AWS-native observability
* Secrets Manager for sensitive configuration
* S3 for object storage where required
* VPC for network isolation

Terraform can provision these cloud resources.

---

# 26. Architecture Boundaries

The platform separates responsibilities into four major layers.

```text
┌───────────────────────────────────────────────┐
│                 Application Layer             │
│  Customer │ Account │ Transaction │ Notify    │
└──────────────────────────┬────────────────────┘
                           │
┌──────────────────────────▼────────────────────┐
│               Container Platform               │
│                  Docker / OCI                  │
└──────────────────────────┬────────────────────┘
                           │
┌──────────────────────────▼────────────────────┐
│              Kubernetes Platform               │
│ Pods │ Deployments │ Services │ Ingress │ HPA │
└──────────────────────────┬────────────────────┘
                           │
┌──────────────────────────▼────────────────────┐
│             Infrastructure Layer               │
│          Terraform / Cloud Resources           │
└───────────────────────────────────────────────┘
```

This separation is important because it prevents application logic from becoming tightly coupled to the underlying infrastructure.

---

# 27. Architecture Summary

The Baraza Banking Platform follows a cloud-native architecture in which application services are independently developed and deployed as containers on Kubernetes.

The major architectural flow is:

```text
                    Developer
                       │
                       ▼
                  Git Repository
                       │
                       ▼
                    CI/CD
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
          Maven Build       Docker Build
                                │
                                ▼
                          Container Image
                                │
                                ▼
                             Helm
                                │
                                ▼
                         Kubernetes
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
     Customer Service      Account Service      Transaction Service
          │                     │                     │
          └─────────────────────┼─────────────────────┘
                                │
                                ▼
                           PostgreSQL

                     Kubernetes Platform
                              │
              ┌───────────────┼────────────────┐
              ▼               ▼                ▼
           Ingress            HPA          Monitoring
              │               │                │
              ▼               ▼                ▼
           Traffic         Scaling          Metrics
```

The architecture provides a foundation for demonstrating modern platform engineering practices including:

* Microservices
* REST APIs
* Docker
* Kubernetes
* Helm
* Ingress
* Service discovery
* Horizontal Pod Autoscaling
* Metrics
* Monitoring
* Infrastructure as Code
* CI/CD
* Cloud migration
* Production-oriented deployment practices

The key architectural principle is **separation of concerns**:

> **Terraform manages infrastructure, Helm manages application deployment, Kubernetes manages runtime orchestration, and the microservices implement business capabilities.**

This separation allows the platform to evolve from a local Minikube implementation into a production-grade managed Kubernetes environment without fundamentally changing the application architecture.

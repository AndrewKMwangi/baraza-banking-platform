# Baraza Banking Platform — Database Architecture

## 1. Overview

The Baraza Banking Platform uses **PostgreSQL** as its relational database.

PostgreSQL provides persistent storage for the banking platform while the Spring Boot microservices provide the application and business logic layer.

The database architecture is designed around:

* Relational data modeling
* Transactional consistency
* Referential integrity
* Persistence isolation
* Secure database connectivity
* Environment-specific configuration
* Containerized local development
* Future migration to managed cloud database services

The current development environment uses **PostgreSQL 16**.

---

# 2. Database Architecture

At a high level, the application interacts with PostgreSQL through the Spring Boot persistence layer.

```text
                    Client
                       |
                       v
                  REST API
                       |
                       v
              Spring Boot Service
                       |
                       v
              Business / Service Layer
                       |
                       v
              Repository / Data Layer
                       |
                       v
                  PostgreSQL
                       |
                       v
                  Persistent Data
```

The application should never expose PostgreSQL directly to external clients.

External clients communicate with APIs, while the application services control access to the database.

---

# 3. Logical Data Domains

The Baraza platform is divided into several banking domains.

```text
                    PostgreSQL
                         |
       +-----------------+------------------+
       |                 |                  |
       v                 v                  v
   Customers          Accounts          Transactions
       |
       v
 Notifications
```

The primary domains are:

| Domain       | Purpose                                   |
| ------------ | ----------------------------------------- |
| Customer     | Customer identity and profile information |
| Account      | Banking account information               |
| Transaction  | Financial transaction records             |
| Notification | Notification-related information          |

The exact physical tables and relationships should always remain synchronized with the entity classes and database migrations implemented by the application.

---

# 4. Customer Data

The Customer domain represents customers using the banking platform.

Conceptually, a customer may contain information such as:

```text
Customer
├── ID
├── Name
├── Email
├── Phone
├── Address
├── Status
└── Created / Updated timestamps
```

A simplified relational representation is:

```text
CUSTOMER
-------------------------
customer_id       PK
first_name
last_name
email
phone
status
created_at
updated_at
```

The exact columns should match the application's current entity model.

---

# 5. Account Data

The Account domain represents banking accounts owned by customers.

Conceptually:

```text
ACCOUNT
-------------------------
account_id        PK
customer_id       FK
account_number
account_type
balance
currency
status
created_at
updated_at
```

The relationship is:

```text
Customer
   |
   | owns
   |
   +------ Account
```

A customer may have one or more accounts depending on the business rules implemented by the platform.

---

# 6. Transaction Data

The Transaction domain records financial activity.

A conceptual transaction record may contain:

```text
TRANSACTION
-------------------------
transaction_id       PK
account_id           FK
transaction_type
amount
currency
status
reference
created_at
```

Transactions should be treated as important audit records.

A transaction should normally be immutable after completion, with corrections represented through additional business events or compensating transactions rather than silently modifying historical financial activity.

---

# 7. Entity Relationships

A simplified logical relationship is:

```text
                  ┌──────────────┐
                  │   CUSTOMER   │
                  └──────┬───────┘
                         |
                         | 1:N
                         |
                  ┌──────▼───────┐
                  │   ACCOUNT    │
                  └──────┬───────┘
                         |
                         | 1:N
                         |
                  ┌──────▼──────────┐
                  │  TRANSACTION    │
                  └─────────────────┘
```

This means:

```text
One Customer
    |
    +---- Many Accounts
              |
              +---- Many Transactions
```

The exact cardinality should follow the business rules implemented in the application.

---

# 8. Relational Integrity

PostgreSQL should enforce important relationships using database constraints.

Examples include:

### Primary keys

Uniquely identify records.

```sql
PRIMARY KEY
```

### Foreign keys

Maintain relationships between entities.

```sql
FOREIGN KEY
```

### Unique constraints

Prevent duplicate values where uniqueness is required.

For example:

```text
account_number
email
transaction_reference
```

depending on the business requirements.

### Not-null constraints

Prevent required values from being missing.

```sql
NOT NULL
```

Database constraints provide a second layer of protection in addition to application-level validation.

---

# 9. Application-to-Database Architecture

A typical Spring Boot service follows this architecture:

```text
Controller
    |
    v
Service
    |
    v
Repository
    |
    v
JPA / Hibernate
    |
    v
JDBC Driver
    |
    v
PostgreSQL
```

Each layer has a different responsibility.

### Controller

Handles HTTP/API requests.

### Service

Contains business logic.

### Repository

Provides persistence operations.

### Hibernate / JPA

Maps Java entities to relational database structures.

### PostgreSQL

Persists the actual data.

---

# 10. Spring Boot Database Configuration

The application requires database connection configuration.

A typical configuration looks like:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/baraza
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}

  jpa:
    hibernate:
      ddl-auto: validate
```

The exact database hostname and database name must match the Kubernetes and PostgreSQL configuration used by the deployed environment.

Sensitive values should be supplied through environment variables or secret-management mechanisms rather than committed directly to Git.

---

# 11. Database Service Discovery in Kubernetes

When PostgreSQL runs inside Kubernetes, applications should communicate with its **Kubernetes Service**, not directly with the PostgreSQL Pod.

The architecture is:

```text
Application Pod
      |
      | DNS
      v
postgres Service
      |
      v
PostgreSQL Pod
```

For example:

```text
postgres:5432
```

can represent the Kubernetes Service hostname and PostgreSQL port within the namespace.

This is preferable to using a Pod IP because Pod IP addresses are ephemeral.

---

# 12. Kubernetes Database Architecture

The local development architecture can be represented as:

```text
              Kubernetes Cluster
                     |
             baraza-banking
                     |
        +------------+------------+
        |                         |
        v                         v
 Application Pods           PostgreSQL Pod
        |                         |
        |                         |
        v                         v
 Kubernetes Services       PostgreSQL Service
        |                         |
        +------------+------------+
                     |
                     v
                PostgreSQL
```

The PostgreSQL workload is therefore part of the Kubernetes development environment.

For production, this architecture should generally be replaced with a managed database service.

---

# 13. PostgreSQL Container

The local platform uses:

```text
postgres:16
```

The container provides the PostgreSQL database runtime.

A typical local containerized database architecture is:

```text
PostgreSQL Container
       |
       +---- Database
       |
       +---- User
       |
       +---- Password
       |
       +---- Port 5432
```

The database configuration should be supplied through secure configuration rather than embedded in application images.

---

# 14. Database Port

PostgreSQL normally listens on:

```text
5432
```

Within Kubernetes, applications should connect through the PostgreSQL Service.

For local troubleshooting, port forwarding can be used when required:

```powershell
kubectl port-forward svc/postgres 5432:5432 -n baraza-banking
```

This creates a temporary path:

```text
Windows Host
     |
 localhost:5432
     |
     v
kubectl port-forward
     |
     v
PostgreSQL Service
     |
     v
PostgreSQL Pod
```

Port forwarding is primarily a development and troubleshooting technique, not the normal production connectivity model.

---

# 15. Database Credentials

Database credentials are sensitive information.

They should not be placed directly into:

```text
Git
Dockerfile
Source Code
Helm templates
CI logs
```

Instead, Kubernetes Secrets can provide the values.

Conceptually:

```text
Kubernetes Secret
       |
       +---- DB_USERNAME
       |
       +---- DB_PASSWORD
       |
       v
Application Pod
       |
       v
Spring Boot
       |
       v
PostgreSQL
```

For AWS production, a managed secret solution such as AWS Secrets Manager is preferable.

---

# 16. Database Transactions

Banking operations require transactional consistency.

Consider a transfer:

```text
Account A
   |
   | debit
   v
Account B
   |
   | credit
   v
Transaction Record
```

The operation should be treated as one logical unit when the business model requires atomicity.

Conceptually:

```text
BEGIN
   |
   +-- Validate source account
   |
   +-- Validate destination account
   |
   +-- Validate available funds
   |
   +-- Debit source
   |
   +-- Credit destination
   |
   +-- Record transaction
   |
COMMIT
```

If a critical operation fails:

```text
BEGIN
   |
   +-- Debit source
   |
   +-- Credit destination  X
   |
ROLLBACK
```

The database transaction should prevent a partially completed financial operation.

---

# 17. ACID Properties

PostgreSQL transactions provide ACID properties.

### Atomicity

A transaction is treated as a single unit.

Either the required operations succeed or the transaction is rolled back.

### Consistency

The database moves from one valid state to another valid state.

### Isolation

Concurrent transactions are isolated according to the configured isolation behavior.

### Durability

Once committed, data is persisted according to PostgreSQL's durability guarantees and underlying storage configuration.

These properties are particularly important for banking workloads.

---

# 18. Concurrency

Multiple customers may interact with the platform simultaneously.

For example:

```text
Customer A
     |
     +---- Transaction 1
     |
     +---- Transaction 2

Customer B
     |
     +---- Transaction 3
```

The database must safely handle concurrent access.

Important considerations include:

* Transaction isolation
* Row locking
* Optimistic/pessimistic locking where appropriate
* Unique constraints
* Atomic updates
* Idempotency

The exact concurrency strategy should be determined by the business operation.

---

# 19. Idempotency

Financial APIs should consider idempotency.

For example, a client might accidentally submit the same transaction request twice.

Without protection:

```text
Request 1
    |
    v
Debit KES 1,000

Request 2
    |
    v
Debit KES 1,000
```

The customer could be charged twice.

An idempotency mechanism can instead identify repeated requests:

```text
Request
   |
   v
Idempotency Key
   |
   +---- First request -> Process
   |
   +---- Duplicate     -> Return previous result
```

A unique transaction/reference identifier can be enforced at the database layer where appropriate.

---

# 20. Auditability

Banking systems require strong auditability.

Transaction records should provide enough information to establish:

* What happened
* When it happened
* Which account was affected
* The amount
* The transaction reference
* The transaction status
* The initiating operation

A useful conceptual model is:

```text
Transaction
     |
     +-- ID
     +-- Reference
     +-- Account
     +-- Amount
     +-- Type
     +-- Status
     +-- Timestamp
```

Audit information should be preserved rather than silently overwritten.

---

# 21. Database Indexing

Indexes improve query performance.

Potential indexed fields include:

```text
customer_id
account_id
account_number
transaction_reference
created_at
```

The exact indexes should be based on actual query patterns.

Indexes improve reads but have costs:

* Additional storage
* Additional write overhead
* Maintenance overhead

Therefore, indexes should be introduced based on measured access patterns rather than indexing every column.

---

# 22. Database Migrations

Schema changes should be version controlled.

A production-oriented platform should use a migration framework such as:

```text
Flyway
```

or:

```text
Liquibase
```

The migration lifecycle becomes:

```text
Developer
   |
   v
Schema Change
   |
   v
Migration Script
   |
   v
CI Validation
   |
   v
Deployment
   |
   v
Database Migration
```

This is preferable to manually changing production database schemas.

---

# 23. Schema Evolution

Application and database changes must be coordinated.

For example:

```text
Application v1
     |
     v
Database Schema v1
```

When introducing a new field:

```text
Database migration
     |
     v
Schema supports old + new application
     |
     v
Application deployment
     |
     v
New application uses field
```

Backward-compatible migration strategies reduce deployment risk.

This is especially important in environments where multiple application replicas may temporarily run different versions during a rolling deployment.

---

# 24. Database Connection Pooling

Spring Boot applications typically use a connection pool such as HikariCP.

Conceptually:

```text
Application
     |
     v
Connection Pool
     |
 +---+---+---+
 |   |   |   |
 v   v   v   v
 DB connections
     |
     v
 PostgreSQL
```

Connection pooling avoids establishing a new database connection for every request.

The pool must be sized carefully.

Too many connections can overload PostgreSQL.

Too few connections can create application-side contention.

---

# 25. Database Availability

A production banking database should not rely on a single database container.

The local development model may be:

```text
Application
    |
    v
PostgreSQL Pod
```

A production architecture should provide stronger availability:

```text
Application
    |
    v
Managed PostgreSQL
    |
    +---- Primary
    |
    +---- Standby / HA
```

Managed database services can provide automated failover and backups depending on the selected architecture.

---

# 26. Backup and Recovery

Production database operations should include:

* Automated backups
* Point-in-time recovery where supported
* Backup retention policies
* Restore testing
* Disaster recovery procedures

A backup that has never been restored successfully should not be considered a fully validated recovery strategy.

The operational model should therefore include periodic restore testing.

---

# 27. Database Security

Database security should be applied at multiple layers.

### Network

Only authorized application workloads should be able to reach PostgreSQL.

### Authentication

Applications should use dedicated database credentials.

### Authorization

Application users should not use PostgreSQL superuser accounts.

### Encryption

Production database traffic should use TLS where appropriate.

### Storage

Production database storage should be encrypted.

### Secrets

Credentials should be managed through a secure secret-management system.

---

# 28. Least Privilege

The application database user should have only the permissions it requires.

Avoid:

```text
Application
     |
     v
PostgreSQL superuser
```

Prefer:

```text
Application
     |
     v
Restricted application DB user
     |
     v
Required database objects
```

This limits the impact of a compromised application.

---

# 29. Database Observability

Database monitoring should include:

* Connection count
* Query latency
* CPU utilization
* Memory utilization
* Storage utilization
* Transaction rate
* Lock contention
* Error rate
* Replication health where applicable
* Backup status

The application layer should also monitor database-related errors.

For example:

```text
Application
    |
    +---- Connection failures
    +---- Query failures
    +---- Timeout errors
    +---- Transaction failures
```

---

# 30. Database Troubleshooting

A database problem should be investigated systematically.

Start with Kubernetes:

```powershell
kubectl get pods -n baraza-banking
```

Check PostgreSQL:

```powershell
kubectl get pods -n baraza-banking | Select-String postgres
```

Check the Service:

```powershell
kubectl get svc postgres -n baraza-banking
```

Inspect the PostgreSQL Pod:

```powershell
kubectl describe pod <postgres-pod> -n baraza-banking
```

Check logs:

```powershell
kubectl logs <postgres-pod> -n baraza-banking
```

Then inspect the application logs:

```powershell
kubectl logs <application-pod> -n baraza-banking
```

The troubleshooting chain is:

```text
Application
    |
    v
Database configuration
    |
    v
Kubernetes Service
    |
    v
PostgreSQL Pod
    |
    v
PostgreSQL process
    |
    v
Database
```

---

# 31. Common Database Failure Scenarios

## Incorrect credentials

Symptoms may include:

```text
password authentication failed
```

Check:

* Kubernetes Secret
* Environment variables
* PostgreSQL user
* Database configuration

---

## Incorrect hostname

Symptoms may include:

```text
Connection refused
Unknown host
Could not connect
```

Verify the application is using the correct Kubernetes Service name.

---

## PostgreSQL not ready

Check:

```powershell
kubectl get pods -n baraza-banking
```

If PostgreSQL is not `Running` and `Ready`, application connection failures may be a consequence rather than the root cause.

---

## Wrong database name

Verify the configured:

```text
database name
username
password
host
port
```

---

# 32. Local Database Connectivity

When testing from the Windows host, PostgreSQL inside Minikube is not automatically equivalent to PostgreSQL running directly on localhost.

A port-forward can temporarily expose it:

```powershell
kubectl port-forward svc/postgres 5432:5432 -n baraza-banking
```

Then a local PostgreSQL client can connect to:

```text
localhost:5432
```

The connection path becomes:

```text
Local Client
    |
    v
localhost:5432
    |
    v
kubectl port-forward
    |
    v
Kubernetes Service
    |
    v
PostgreSQL Pod
```

---

# 33. Production Database Architecture

For production AWS deployment, PostgreSQL should preferably be provided through a managed database service.

Target architecture:

```text
                    AWS VPC
                       |
              Private Database Subnets
                       |
                       v
                ┌──────────────┐
                │ RDS/Aurora   │
                │ PostgreSQL   │
                └──────┬───────┘
                       |
              +--------+--------+
              |                 |
              v                 v
           Primary           Standby
```

The Kubernetes workloads in EKS would access the database through private networking.

---

# 34. Local vs Production Database

| Area         | Local Development             | Production Target                |
| ------------ | ----------------------------- | -------------------------------- |
| Database     | PostgreSQL 16                 | RDS/Aurora PostgreSQL            |
| Runtime      | Kubernetes/Minikube           | Amazon EKS + AWS networking      |
| Storage      | Local/container storage       | Managed durable storage          |
| Secrets      | Kubernetes Secrets            | AWS Secrets Manager              |
| Availability | Development-level             | Multi-AZ/managed HA              |
| Backups      | Development configuration     | Automated managed backups        |
| Monitoring   | Kubernetes/Prometheus/Grafana | Managed + platform observability |
| Access       | Local/cluster                 | Private network only             |
| Recovery     | Manual/testing                | Formal backup and DR strategy    |

---

# 35. Database and Kubernetes Responsibility Boundary

An important architectural distinction is:

```text
Kubernetes
    |
    +---- Runs workloads
    +---- Provides networking
    +---- Provides service discovery
    +---- Provides resource management

PostgreSQL
    |
    +---- Stores data
    +---- Enforces relational integrity
    +---- Executes transactions
    +---- Provides database consistency
```

Kubernetes should not be considered a replacement for database functionality.

It orchestrates the database workload; PostgreSQL provides the database engine.

---

# 36. Database and Application Responsibility Boundary

Similarly:

```text
Application
    |
    +---- Business rules
    +---- API validation
    +---- Authentication/authorization
    +---- Workflow orchestration

Database
    |
    +---- Persistence
    +---- Constraints
    +---- Transactions
    +---- Referential integrity
```

Both layers should enforce appropriate invariants.

Application validation improves user experience and business correctness.

Database constraints protect the data even if another application path accidentally bypasses application validation.

---

# 37. Future Database Architecture

As the Baraza platform becomes more production-oriented, the database architecture can evolve toward:

```text
                     Application
                          |
                          v
                    Connection Pool
                          |
                          v
                    RDS/Aurora
                          |
              +-----------+-----------+
              |                       |
              v                       v
          Primary                 Standby
              |
              v
          Backups / PITR
```

Additional capabilities can include:

* Read replicas
* Connection pooling
* Database proxying
* Encryption
* Automated backups
* Point-in-time recovery
* Multi-AZ availability
* Performance monitoring

These should be introduced according to actual availability, performance, and compliance requirements.

---

# 38. Database Architecture Principles

The Baraza database architecture follows these principles:

### 1. Never expose the database directly to users

Applications provide controlled APIs.

### 2. Keep credentials out of source control

Secrets must be managed securely.

### 3. Use transactions for atomic financial operations

Partial financial updates must be avoided.

### 4. Enforce important integrity rules in the database

Use primary keys, foreign keys, unique constraints, and appropriate validation.

### 5. Version database changes

Schema evolution should be managed through migrations.

### 6. Monitor database health

Database availability and performance directly affect application availability.

### 7. Design for recovery

Backups and restoration must be tested.

### 8. Use managed databases for production where practical

A managed PostgreSQL service reduces the operational burden of running a production database inside application Kubernetes workloads.

---

# 39. Database Architecture Summary

The Baraza Banking Platform uses PostgreSQL as the persistent data layer beneath its Spring Boot microservices.

The overall relationship is:

```text
                         CLIENT
                           |
                           v
                        INGRESS
                           |
                           v
                    KUBERNETES SERVICE
                           |
                           v
                   SPRING BOOT POD
                           |
                           v
                    BUSINESS LOGIC
                           |
                           v
                      REPOSITORY
                           |
                           v
                    JPA / HIBERNATE
                           |
                           v
                       JDBC
                           |
                           v
                 POSTGRESQL SERVICE
                           |
                           v
                    POSTGRESQL 16
                           |
                           v
                  PERSISTENT STORAGE
```

The key architectural principle is:

> **The application owns business behavior, while PostgreSQL provides durable relational persistence, transactional consistency, and data integrity.**

For local development, PostgreSQL can run inside the Kubernetes environment. For production, the preferred evolution is a managed PostgreSQL platform such as Amazon RDS or Aurora PostgreSQL, accessed privately from the Kubernetes workloads.

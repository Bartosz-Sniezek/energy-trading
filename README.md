# Energy Trading Platform

A full-stack energy commodities trading platform. The backend demonstrates production-grade patterns: **DDD**, **CQRS**, **Transactional Outbox + Debezium CDC**, **JWT auth with refresh token rotation**, and **real-time WebSocket price feeds**.

---

## Stack

| | |
|---|---|
| Backend | NestJS, TypeScript |
| Frontend | Next.js, React, TanStack Query |
| Database | PostgreSQL + TypeORM |
| Messaging | Apache Kafka (Confluent JS client) |
| Cache / PubSub | Redis |
| Auth | JWT in signed cookies, Passport |
| Real-time | Socket.io |
| Validation | Zod (shared package) |
| Testing | Vitest + Testcontainers |
| Monorepo | pnpm workspaces |

---

## Architecture Overview

```mermaid
graph TB
    subgraph Client
        FE[Next.js]
    end

    subgraph Backend
        REST["REST API\n/api/auth\n/api/users\n/api/ledger"]
        WS["WebSocket\nns: price-feed"]
        PE[Price Engine\nOU stochastic sim]
    end

    subgraph Kafka
        UOT[users_outbox topic]
        PTT[price_tick topic]
        UOTDLQ[users_outbox.dlq]
    end

    subgraph Consumers
        EMAIL[UsersOutbox\nEmail Consumer]
        LEDGER_INIT[LedgerUsers\nOutbox Consumer]
        PE_RC[PriceEngine\nRedis Consumer]
    end

    subgraph Redis
        PRICE_CACHE["price:{symbol}"]
        FEED_PS["feed:{symbol} pub/sub"]
        SESSION_PS["auth:session:remove pub/sub"]
        BLACKLIST["token blacklist"]
    end

    PG[(PostgreSQL)]

    FE -->|HTTP + cookies| REST
    FE -->|WebSocket + cookie| WS
    REST --> PG
    REST --> BLACKLIST

    PE -->|publishes tick| PTT
    PTT --> PE_RC
    PE_RC --> PRICE_CACHE
    PE_RC --> FEED_PS
    FEED_PS -->|pmessage| WS
    SESSION_PS -->|force disconnect| WS

    PG -->|Debezium CDC| UOT
    UOT --> EMAIL
    UOT --> LEDGER_INIT
    EMAIL -->|sends email| SMTP[SMTP / Console]
    LEDGER_INIT --> PG

    UOT -->|on failure| UOTDLQ
```

---

## Folder Structure

```
energy-trading/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── domain/                     # Entities, Value Objects, Domain Errors
│   │   │   │   ├── users/                  #   UserEntity, Email VO, Password VO
│   │   │   │   ├── auth/                   #   RefreshTokenEntity, TokenService
│   │   │   │   ├── ledger/                 #   LedgerEntryEntity, MinorUnitValue VO
│   │   │   │   ├── orders/                 #   OrderEntity (in progress)
│   │   │   │   └── trades/                 #   TradeEntity (in progress)
│   │   │   ├── modules/                    # Application modules (NestJS)
│   │   │   │   ├── auth/                   #   login, logout, activate, token rotation
│   │   │   │   ├── users/                  #   register, /me
│   │   │   │   ├── ledger/                 #   deposit, withdrawal, balance
│   │   │   │   ├── price-engine/           #   OU price simulation
│   │   │   │   ├── price-engine-gateway/   #   WebSocket feed
│   │   │   │   ├── price-engine-redis-consumer/
│   │   │   │   ├── users-outbox-email-consumer/
│   │   │   │   ├── ledger-users-outbox-consumer/
│   │   │   │   ├── jwt-auth/
│   │   │   │   ├── kafka/
│   │   │   │   └── hashing/
│   │   │   └── technical/                  # Cross-cutting infra
│   │   │       ├── app-config/             #   env schema (Zod)
│   │   │       ├── database/
│   │   │       ├── redis/                  #   client, pub, sub
│   │   │       ├── mailing/
│   │   │       ├── cache/
│   │   │       └── datetime/
│   │   └── db/migrations/
│   └── frontend/
└── packages/
    └── shared/                             # Zod schemas + TS types shared by FE & BE
```

---

## REST API

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | - | Login, sets access + refresh cookies |
| `POST` | `/api/auth/refresh` | refresh cookie | Rotate tokens |
| `POST` | `/api/auth/logout` | JWT | Blacklist session, clear cookies |
| `POST` | `/api/auth/activate` | - | Activate account via token |
| `POST` | `/api/auth/resend-activation-email` | - | Resend activation email |
| `POST` | `/api/users` | - | Register |
| `GET` | `/api/users/me` | JWT | Get own profile |
| `POST` | `/api/ledger/deposit` | JWT | Deposit funds |
| `POST` | `/api/ledger/withdrawal` | JWT | Withdraw funds |
| `GET` | `/api/ledger/balance` | JWT | Get available + locked balance |
| `GET` | `/api/health` | - | Health check |

**WebSocket** namespace `/price-feed`:

| Event (client → server) | Payload | Description |
|---|---|---|
| `subscribe` | `{ instruments: string[] }` | Join price rooms |
| `keepalive` | - | Reset 30s inactivity timer |

| Event (server → client) | Description |
|---|---|
| `authenticated` | Emitted on successful connection |
| `price` | Price tick (JSON string) |
| `keepalive:timeout` | Disconnected due to inactivity |

---

## Auth Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant API as AuthController
    participant DB as PostgreSQL
    participant R as Redis

    C->>API: POST /auth/login {email, password}
    API->>DB: find user by email
    API->>API: bcrypt.compare(password, hash)
    API->>DB: save RefreshTokenEntity (family=uuid)
    API->>R: SET session:{family}
    API-->>C: Set-Cookie: access_token + refresh_token (signed)

    Note over C,R: Protected request
    C->>API: GET /users/me (cookie: access_token)
    API->>R: check blacklist:{jti}
    API-->>C: 200 { id, email, ... }

    Note over C,DB: Token rotation
    C->>API: POST /auth/refresh (cookie: refresh_token)
    API->>DB: SELECT ... FOR UPDATE NOWAIT (pessimistic lock)
    API->>DB: mark old token revoked_at, replacedBy = new id
    API->>DB: save new RefreshTokenEntity (same family)
    API->>R: update session:{family}
    API-->>C: Set-Cookie: new access_token + refresh_token

    Note over C,R: Theft detection - reuse of revoked token
    C->>API: POST /auth/refresh (stolen old token)
    API->>DB: token.isRevoked() == true
    API->>DB: revoke all tokens in family
    API->>R: DEL session:{family}
    API->>R: publish auth:session:remove → {family}
    API-->>C: 401

    Note over C,R: Logout
    C->>API: POST /auth/logout (JWT)
    API->>R: SET blacklist:{jti}
    API->>R: DEL session:{family}
    API->>R: publish auth:session:remove → {sessionId}
    API-->>C: clear cookies
```

---

## CreateUserAccountUseCase - Outbox Pattern

Registration uses the **Transactional Outbox** pattern. The use case writes to both `users` and `users_outbox` in one transaction. Debezium CDC picks up the outbox row from the Postgres WAL and publishes it to Kafka. Two independent consumer groups consume the **same topic** for different purposes.

```mermaid
sequenceDiagram
    participant C as Client
    participant UC as CreateUserAccountUseCase
    participant DB as PostgreSQL
    participant DEB as Debezium CDC
    participant K as Kafka\n(KAFKA_USERS_OUTBOX_TOPIC)

    participant EH as UsersOutboxMessageHandler
    participant REG as EventMapperRegistry
    participant EM as UserAccountCreatedEventMapper\n(email module)
    participant MAIL as MailService

    participant LH as LedgerUsersOutboxMessageHandler
    participant LEM as UserAccountCreatedEventMapper\n(ledger module)
    participant LINIT as LedgerUserStateInitializerService

    C->>UC: POST /api/users { email, password, firstName, lastName }

    rect rgb(230,245,255)
        Note over UC,DB: Single DB transaction
        UC->>DB: SAVEPOINT user_creation_attempt
        UC->>DB: INSERT INTO users
        UC->>DB: RELEASE SAVEPOINT
        UC->>DB: INSERT INTO users_outbox\n{ event_type: USER_ACCOUNT_REGISTERED, payload: { email, firstName,\nlastName, activationToken, activationTokenExpirationDate } }
    end
    UC-->>C: 201

    DB-->>DEB: Postgres WAL (new users_outbox row)
    DEB->>K: produce DebeziumMessage\n(headers: event_type, correlation_id, user_id, id)

    par UsersOutboxEmailConsumerModule - group: EMAIL_NOTIFIER_CONSUMER_GROUP_ID
        K->>EH: EachMessagePayload
        EH->>EH: DebeziumConnectorMessageParser.parse()
        EH->>REG: getMapper(event)
        REG-->>EH: UserAccountCreatedEventMapper
        EH->>EM: mapper.parse(event) → UserAccountCreatedEvent
        EH->>EM: mapper.createTemplate(event) → EmailTemplate
        EH->>MAIL: send({ to, subject, html })
    and LedgerUsersOutboxConsumerModule - group: KAFKA_LEDGER_USERS_ACCOUNT_CREATED_GROUP
        K->>LH: EachMessagePayload
        LH->>LH: DebeziumConnectorMessageParser.parse()
        LH->>LH: skip if eventType ≠ USER_ACCOUNT_REGISTERED
        LH->>LEM: parse(event) → UserAccountCreatedEvent
        LH->>LEM: execute(event)
        LEM->>LINIT: initializeLedgerUserState(userId)
        LINIT->>DB: INSERT INTO ledger_user_locks (OR IGNORE)
        LINIT->>DB: INSERT INTO ledger_users_balances\n{ available: 0, locked: 0 } (OR IGNORE)
    end

    Note over K: On PermanentError or max retries → DLQ topic
```

**Duplicate email** is handled gracefully with `SAVEPOINT`: if the `INSERT INTO users` violates the unique constraint on `email`, the savepoint rolls back just that insert, the transaction continues, and a `UserAccountRegistrationAttemptedWithExistingAccount` event is written to the outbox instead - which triggers a security notification email to the existing account owner.

---

## Deposit Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant UC as DepositUseCase
    participant DB as PostgreSQL

    C->>UC: POST /ledger/deposit { amount }
    rect rgb(230,245,255)
        Note over UC,DB: Single DB transaction
        UC->>DB: verify user exists + isActive
        UC->>DB: INSERT ledger_entries { type: deposit, amount, direction: credit }
        UC->>DB: INSERT ledger_outbox { event_type: deposited, payload }
        UC->>DB: UPDATE ledger_users_balances SET available += amount
    end
    UC-->>C: 200
```

> Balance projection (`ledger_users_balances`) is updated **synchronously** inside the same transaction as the ledger entry - no eventual consistency lag on deposit/withdrawal.

---

## Real-Time Price Feed

The price engine runs an **Ornstein-Uhlenbeck** stochastic process (mean-reverting diffusion) with seasonal adjustments and rare volatility spikes for 8 energy commodities: `NG`, `CL`, `BZ`, `RB`, `HO`, `EL`, `CO2`, `UR`.

```mermaid
sequenceDiagram
    participant PE as PriceEngine (interval)
    participant KP as Kafka (price_tick topic)
    participant RC as PriceEngineRedisConsumer
    participant R as Redis
    participant GW as PriceEngineGateway (WebSocket)
    participant C as Client

    C->>GW: connect (cookie: access_token)
    GW->>GW: validate JWT from cookie
    GW->>GW: start 30s keepalive timer
    GW-->>C: emit "authenticated"

    C->>GW: subscribe { instruments: ["NG", "CL"] }
    GW->>GW: socket.join("price:NG"), socket.join("price:CL")

    loop every PRICE_ENGINE_TICK_INTERVAL_MS
        PE->>PE: OU step + seasonal + spike
        PE->>KP: produce { symbol, price, bid, ask, ... }
    end

    KP->>RC: consume message
    RC->>R: SET price:NG {tick JSON}
    RC->>R: PUBLISH feed:NG {tick JSON}

    R-->>GW: pmessage feed:NG (via psubscribe feed:*)
    GW->>C: emit "price" to room price:NG

    Note over GW,C: On logout or session invalidation
    R-->>GW: message auth:session:remove {sessionId}
    GW->>C: disconnect
```

---

## Database Schema

```mermaid
erDiagram
    users {
        uuid id PK
        varchar email UK
        varchar password_hash
        varchar first_name
        varchar last_name
        boolean is_active
        varchar activation_token UK
        timestamptz activation_token_expires_at
        int balance
        timestamptz created_at
        timestamptz updated_at
    }

    users_outbox {
        uuid id PK
        uuid correlation_id
        uuid aggregate_id
        varchar aggregate_type
        varchar event_type
        uuid user_id
        jsonb payload
        timestamptz created_at
    }

    refresh_tokens {
        uuid id PK
        uuid user_id
        text token
        text family
        uuid replaced_by FK
        timestamptz revoked_at
        timestamptz expires_at
        timestamptz created_at
    }

    ledger_entries {
        uuid id PK
        uuid correlation_id
        uuid user_id
        uuid order_id
        uuid trade_id
        varchar entry_type
        numeric_18_6 amount
        varchar direction
        uuid idempotency_key UK
        timestamptz created_at
    }

    ledger_outbox {
        uuid id PK
        uuid correlation_id
        uuid aggregate_id
        varchar aggregate_type
        uuid user_id
        varchar event_type
        jsonb payload
        timestamptz created_at
    }

    ledger_users_balances {
        uuid user_id PK
        numeric_18_6 available
        numeric_18_6 locked
        timestamptz updated_at
    }

    ledger_user_locks {
        uuid user_id PK
        timestamptz created_at
    }

    refresh_tokens ||--o| refresh_tokens : "replaced_by"
```

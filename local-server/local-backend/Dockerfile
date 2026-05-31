# ── Build stage ──────────────────────────────────────────────────────────────
FROM rust:1-bookworm AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# 1. Copy workspace manifests — allows cargo to resolve the full dep tree.
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./

# Copy each crate's Cargo.toml (needed for workspace dep resolution).
COPY src/core/Cargo.toml           src/core/
COPY src/application/Cargo.toml    src/application/
COPY src/infrastructure/Cargo.toml src/infrastructure/
COPY src/interfaces/Cargo.toml     src/interfaces/
COPY src/gateway/Cargo.toml        src/gateway/

# 2. Stub sources — compile only dependencies, not real code.
#    pool.rs uses sqlx::migrate!() which needs the migrations dir, but since
#    the stub lib.rs has no `mod` declarations, pool.rs is never compiled here.
RUN mkdir -p \
      src/core/src src/application/src src/infrastructure/src \
      src/interfaces/src src/gateway/src && \
    printf 'pub fn _dummy(){}' | tee \
      src/core/src/lib.rs \
      src/application/src/lib.rs \
      src/infrastructure/src/lib.rs \
      src/interfaces/src/lib.rs >/dev/null && \
    echo 'fn main(){}' > src/gateway/src/main.rs && \
    cargo build --release --bin local-server && \
    rm -rf src/*/src

# 3. Real source + migrations (embedded by sqlx::migrate!() at compile time).
COPY src        ./src
COPY migrations ./migrations

# The stub build above compiles minimal sources for workspace members. After
# swapping in real sources, drop workspace artifacts so Cargo cannot reuse stub
# rlibs or the empty `fn main(){}` binary (cargo clean -p is unreliable here).
RUN rm -rf target/release/deps/liblocal_server_* \
           target/release/deps/local_server-* \
           target/release/.fingerprint/local-server-* \
           target/release/local-server && \
    cargo build --release --bin local-server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/local-server ./
COPY config ./config
RUN mkdir -p data

EXPOSE 8080
CMD ["./local-server"]

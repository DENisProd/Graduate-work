# syntax=docker/dockerfile:1.4
# ── Build stage ──────────────────────────────────────────────────────────────
FROM rust:1-bookworm AS builder
WORKDIR /app

# release-device: fast compile on ARM SBC (Orange Pi). Override with "release" for max opt.
ARG CARGO_PROFILE=release-device
# Limit parallel rustc jobs on low-RAM boards, e.g. CARGO_BUILD_JOBS=2
ARG CARGO_BUILD_JOBS=

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libsqlite3-dev mold \
    && rm -rf /var/lib/apt/lists/*

ENV RUSTFLAGS="-C link-arg=-fuse-ld=mold"

# 1. Copy workspace manifests — allows cargo to resolve the full dep tree.
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./

# Copy each crate's Cargo.toml (needed for workspace dep resolution).
COPY src/core/Cargo.toml           src/core/
COPY src/application/Cargo.toml    src/application/
COPY src/infrastructure/Cargo.toml src/infrastructure/
COPY src/interfaces/Cargo.toml     src/interfaces/
COPY src/gateway/Cargo.toml        src/gateway/

# 2. Stub sources — compile dependencies once; cache survives code-only changes.
RUN mkdir -p \
      src/core/src src/application/src src/infrastructure/src \
      src/interfaces/src src/gateway/src && \
    printf 'pub fn _dummy(){}' | tee \
      src/core/src/lib.rs \
      src/application/src/lib.rs \
      src/infrastructure/src/lib.rs \
      src/interfaces/src/lib.rs >/dev/null && \
    echo 'fn main(){}' > src/gateway/src/main.rs

RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target \
    if [ -n "$CARGO_BUILD_JOBS" ]; then export CARGO_BUILD_JOBS; fi && \
    cargo build --profile "${CARGO_PROFILE}" --bin local-server && \
    rm -rf src/*/src

# 3. Real source + migrations (embedded by sqlx::migrate!() at compile time).
COPY src        ./src
COPY migrations ./migrations

# Drop workspace member artifacts so Cargo cannot reuse stub rlibs.
# target/ lives in a cache mount — copy the binary out before the layer ends.
RUN --mount=type=cache,target=/usr/local/cargo/registry \
    --mount=type=cache,target=/usr/local/cargo/git \
    --mount=type=cache,target=/app/target \
    rm -rf "target/${CARGO_PROFILE}/deps/liblocal_server_"* \
           "target/${CARGO_PROFILE}/deps/local_server-"* \
           "target/${CARGO_PROFILE}/.fingerprint/local-server-"* \
           "target/${CARGO_PROFILE}/local-server" && \
    if [ -n "$CARGO_BUILD_JOBS" ]; then export CARGO_BUILD_JOBS; fi && \
    cargo build --profile "${CARGO_PROFILE}" --bin local-server && \
    cp "target/${CARGO_PROFILE}/local-server" /app/local-server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/local-server ./
COPY config ./config
RUN mkdir -p data

ENV ZIGBEE_MQTT_URL=mqtt://mosquitto:1883

EXPOSE 8080
CMD ["./local-server"]

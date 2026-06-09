# ── Build stage ──────────────────────────────────────────────────────────────
FROM rust:1-bookworm AS builder
WORKDIR /app

# release-device: fast compile on ARM SBC (Orange Pi). Override with "release" for max opt.
ARG CARGO_PROFILE=release-device
# Limit parallel rustc jobs on low-RAM boards: --build-arg BUILD_JOBS=2
ARG BUILD_JOBS

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config libsqlite3-dev mold \
    && rm -rf /var/lib/apt/lists/*

ENV RUSTFLAGS="-C link-arg=-fuse-ld=mold"
ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse

# Toolchain layer — cached until rust-toolchain.toml changes.
COPY rust-toolchain.toml ./
RUN rustup show

# Manifest layer — cached until Cargo.toml / Cargo.lock change.
COPY Cargo.toml Cargo.lock ./
COPY src/core/Cargo.toml           src/core/
COPY src/application/Cargo.toml    src/application/
COPY src/infrastructure/Cargo.toml src/infrastructure/
COPY src/interfaces/Cargo.toml     src/interfaces/
COPY src/gateway/Cargo.toml        src/gateway/

# Stub sources — compile third-party deps once; Docker reuses this layer when only src/ changes.
RUN mkdir -p \
      src/core/src src/application/src src/infrastructure/src \
      src/interfaces/src src/gateway/src && \
    printf 'pub fn _dummy(){}' | tee \
      src/core/src/lib.rs \
      src/application/src/lib.rs \
      src/infrastructure/src/lib.rs \
      src/interfaces/src/lib.rs >/dev/null && \
    echo 'fn main(){}' > src/gateway/src/main.rs

# Registry + target live in the image layer (not BuildKit cache mounts — those are often
# empty on Orange Pi and force a full crate download on every build).
RUN unset CARGO_BUILD_JOBS; \
    if [ -n "$BUILD_JOBS" ]; then export CARGO_BUILD_JOBS="$BUILD_JOBS"; fi && \
    cargo build --profile "${CARGO_PROFILE}" --bin local-server && \
    rm -rf src/*/src

# Real source + migrations (embedded by sqlx::migrate!() at compile time).
COPY src        ./src
COPY migrations ./migrations

RUN rm -rf "target/${CARGO_PROFILE}/deps/liblocal_server_"* \
           "target/${CARGO_PROFILE}/deps/local_server-"* \
           "target/${CARGO_PROFILE}/.fingerprint/local-server-"* \
           "target/${CARGO_PROFILE}/local-server" && \
    unset CARGO_BUILD_JOBS; \
    if [ -n "$BUILD_JOBS" ]; then export CARGO_BUILD_JOBS="$BUILD_JOBS"; fi && \
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

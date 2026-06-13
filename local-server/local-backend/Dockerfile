# ── Build stage ──────────────────────────────────────────────────────────────
# Builder runs on the host platform (x86_64 in CI) and cross-compiles to ARM64.
FROM --platform=$BUILDPLATFORM rust:1-bookworm AS builder
WORKDIR /app

ARG CARGO_PROFILE=release-device
ARG BUILD_JOBS

RUN dpkg --add-architecture arm64 && \
    apt-get update && apt-get install -y --no-install-recommends \
    pkg-config gcc-aarch64-linux-gnu \
    libc6-dev-arm64-cross \
    perl make ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CARGO_REGISTRIES_CRATES_IO_PROTOCOL=sparse
# Cross-linker and C compiler for the aarch64 target.
ENV CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
ENV CC_aarch64_unknown_linux_gnu=aarch64-linux-gnu-gcc
ENV AR_aarch64_unknown_linux_gnu=aarch64-linux-gnu-ar
# ring C code must use ARM64 sysroot headers, not host /usr/include.
ENV CFLAGS_aarch64_unknown_linux_gnu=--sysroot=/usr/aarch64-linux-gnu
ENV CXXFLAGS_aarch64_unknown_linux_gnu=--sysroot=/usr/aarch64-linux-gnu

# Toolchain layer — cached until rust-toolchain.toml changes.
COPY rust-toolchain.toml ./
RUN rustup target add aarch64-unknown-linux-gnu && rustup show

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

RUN unset CARGO_BUILD_JOBS; \
    if [ -n "$BUILD_JOBS" ]; then export CARGO_BUILD_JOBS="$BUILD_JOBS"; fi && \
    cargo build --profile "${CARGO_PROFILE}" --target aarch64-unknown-linux-gnu --bin local-server && \
    rm -rf src/*/src

# Real source + migrations (embedded by sqlx::migrate!() at compile time).
COPY src        ./src
COPY migrations ./migrations

RUN rm -rf "target/aarch64-unknown-linux-gnu/${CARGO_PROFILE}/deps/liblocal_server_"* \
           "target/aarch64-unknown-linux-gnu/${CARGO_PROFILE}/deps/local_server-"* \
           "target/aarch64-unknown-linux-gnu/${CARGO_PROFILE}/.fingerprint/local-server-"* \
           "target/aarch64-unknown-linux-gnu/${CARGO_PROFILE}/local-server" && \
    unset CARGO_BUILD_JOBS; \
    if [ -n "$BUILD_JOBS" ]; then export CARGO_BUILD_JOBS="$BUILD_JOBS"; fi && \
    cargo build --profile "${CARGO_PROFILE}" --target aarch64-unknown-linux-gnu --bin local-server && \
    cp "target/aarch64-unknown-linux-gnu/${CARGO_PROFILE}/local-server" /app/local-server

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM --platform=$TARGETPLATFORM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/local-server ./
COPY config ./config
RUN mkdir -p data

ENV ZIGBEE_MQTT_URL=mqtt://mosquitto:1883

EXPOSE 8080
CMD ["./local-server"]

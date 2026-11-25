FROM rust:1-bookworm AS rust-build
RUN apt-get update && apt-get install -y --no-install-recommends g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace
COPY rust ./rust
COPY src ./src
RUN cargo build --manifest-path rust/Cargo.toml --release --bin principia-core-server

FROM golang:1.25-bookworm AS go-build
WORKDIR /workspace/services/go-api
COPY services/go-api ./
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/principia-go-api .

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app
COPY --from=rust-build /workspace/rust/target/release/principia-core-server /app/principia-core-server
COPY --from=go-build /out/principia-go-api /app/principia-go-api
ENV PRINCIPIA_CORE_BIN=/app/principia-core-server
ENV ADDR=:8080
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/app/principia-go-api"]

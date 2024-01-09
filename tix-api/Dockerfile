FROM clux/muslrust:stable AS builder
COPY . .
RUN --mount=type=cache,target=/volume/target \
  --mount=type=cache,target=/root/.cargo/registry \
  cargo build --release && \
  mv /volume/target/x86_64-unknown-linux-musl/release/tix-api .

FROM cgr.dev/chainguard/static
COPY --from=builder --chown=nonroot:nonroot /volume/tix-api /app/
EXPOSE 8000
ENTRYPOINT ["/app/tix-api"]

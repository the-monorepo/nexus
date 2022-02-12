# syntax=docker/dockerfile:1.3
FROM alpine:3.15.0

RUN apk add --no-cache python3 python2 make g++ curl bash yarn

RUN apk add --no-cache rustup
# TODO: Lock dependency
RUN /usr/bin/rustup-init -y --default-toolchain 1.58.1

ENV PATH "/root/.cargo/bin:$PATH"

# TODO: Build local version?
RUN cargo install scriptplan-cli --version 5.0.0 --root .

RUN rustup target add x86_64-pc-windows-gnu
RUN rustup target add x86_64-apple-darwin

RUN rustup target add x86_64-unknown-linux-gnu
RUN rustup target add wasm32-unknown-unknown

WORKDIR /app

CMD bash

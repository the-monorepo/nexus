#!/usr/bin/env bash

set -xe

cargo build --release --bins --package scriptplan
mv ./target/release/scriptplan ./cli

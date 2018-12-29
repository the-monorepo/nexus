{
  description = "Monorepo environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, utils, rust-overlay }:
    utils.lib.eachDefaultSystem(system: 
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        rustPlatform = (pkgs.makeRustPlatform {
          cargo = pkgs.rust-bin.stable.latest.default;
          rustc = pkgs.rust-bin.stable.latest.default;
        });

        scriptplanPkg = rustPlatform.buildRustPackage rec {
          pname = "scriptplan-cli";
          version = "8.0.0";
          src = ./.;

          cargoLock = {
            lockFile = ./Cargo.lock;
          };
        };
      in {
        devShells.default = pkgs.mkShell { 
          buildInputs = [
            pkgs.nodejs-16_x
            pkgs.yarn
            pkgs.rust-bin.stable.latest.default
            pkgs.openssl

            pkgs.git

            pkgs.git-lfs

            scriptplanPkg
          ];
        };
      });
}

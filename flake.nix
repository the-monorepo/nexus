{
  description = "Monorepo environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs";
    formatter.url = "github:kamadorueda/alejandra";
    formatter.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = {
    self,
    nixpkgs,
    utils,
    rust-overlay,
    formatter,
  }:
    utils.lib.eachDefaultSystem (system: let
      overlays = [(import rust-overlay)];
      pkgs = import nixpkgs {inherit system overlays;};

      rustPlatform = pkgs.makeRustPlatform {
        cargo = pkgs.rust-bin.stable.latest.default;
        rustc = pkgs.rust-bin.stable.latest.default;
      };

      scriptplanPkg = rustPlatform.buildRustPackage rec {
        pname = "scriptplan-cli";
        version = "8.0.0";
        src = ./.;

        cargoLock = {lockFile = ./Cargo.lock;};
      };
    in {
      formatter = formatter.packages.${system}.default;
      devShells.default = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs-16_x
          pkgs.yarn
          pkgs.rust-bin.stable.latest.default
          pkgs.openssl

          pkgs.git

          pkgs.git-lfs

          scriptplanPkg

          pkgs.brotli
        ];
      };
    });
}

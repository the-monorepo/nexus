{
  description = "Monorepo environment";

  inputs = {
    utils.url = "github:numtide/flake-utils";
    
    rust-overlay.url = "github:oxalica/rust-overlay";
    rust-overlay.inputs.nixpkgs.follows = "nixpkgs";

    formatter.url = "github:kamadorueda/alejandra";
    formatter.inputs.nixpkgs.follows = "nixpkgs";
  };

  outputs = { self, nixpkgs, utils, rust-overlay, formatter, }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system}.appendOverlays [rust-overlay.overlays.default];

        rustPlatform = pkgs.makeRustPlatform {
          cargo = pkgs.rust-bin.stable.latest.default;
          rustc = pkgs.rust-bin.stable.latest.default;
        };

        scriptplanPkg = rustPlatform.buildRustPackage rec {
          pname = "scriptplan-cli";
          version = "8.0.0";
          src = ./.;

          cargoLock = { lockFile = ./Cargo.lock; };
        };
      in {
        formatter = formatter.packages.${system}.default;
        devShells.default = pkgs.mkShell {
          buildInputs = [
            pkgs.nodejs_20
            # See: https://github.com/NixOS/nixpkgs/issues/145634
            # pkgs.yarn
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

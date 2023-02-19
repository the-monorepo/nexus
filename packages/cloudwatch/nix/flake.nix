{
  inputs = {
    aarch64-darwin = {
      # Getting "contains an unexpected number of top-level files" error if we use tarball for some reason
      type = "file";
      url = "https://github.com/lucagrulla/cw/releases/download/v4.1.1/cw_4.1.1_Darwin_arm64.tar.gz";
      flake = false;
    };
    x86_64-darwin = {
      type = "file";
      url = "https://github.com/lucagrulla/cw/releases/download/v4.1.1/cw_4.1.1_Darwin_x86_64.tar.gz";
      flake = false;
    };
    aarch64-linux = {
      type = "file";
      url = "https://github.com/lucagrulla/cw/releases/download/v4.1.1/cw_4.1.1_Linux_arm64.tar.gz";
      flake = false;
    };
    armv6l-linux = {
      type = "file";
      url = "https://github.com/lucagrulla/cw/releases/download/v4.1.1/cw_4.1.1_Linux_armv6.tar.gz";
      flake = false;
    };
    x86_64-linux = {
      type = "file";
      url = "https://github.com/lucagrulla/cw/releases/download/v4.1.1/cw_4.1.1_Linux_x86_64.tar.gz";
      flake = false;
    };

    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";
  };

  outputs = inputs: let
    createDerivation = system: let
      pkgs = import inputs.nixpkgs {inherit system;};
    in {
      "${system}".default = pkgs.stdenv.mkDerivation {
        pname = "cloudwatch";
        version = "1.0.0";

        src = inputs.${system};
        sourceRoot = ".";

        unpackPhase = ''
          tar -xvf $src
        '';

        installPhase = ''
          install -m755 -D cw $out/bin/cw
        '';
      };
    };
  in {
    packages =
      (createDerivation "aarch64-darwin")
      // (createDerivation "x86_64-darwin")
      // (createDerivation "aarch64-linux")
      // (createDerivation "armv6l-linux")
      // (createDerivation "x86_64-linux");
  };
}

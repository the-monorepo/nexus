{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };
  outputs = { nixpkgs, ...}@inputs: {
      nixosModules.default =
        ({ pkgs, lib, options, ... }: lib.mkMerge [
          (lib.optionalAttrs (options?boot) {
            # See: https://vitejs.dev/guide/troubleshooting.html#requests-are-stalled-forever
            boot.kernel.sysctl = {
                "fs.inotify.max_user_watches" = 1048576;
                "fs.inotify.max_queued_events" = 16384;
                "fs.inotify.max_user_instances" = 8192;
            };
          })
          (lib.optionalAttrs (options.security.pam?loginLimits) {
            security.pam.loginLimits = [
                # Probably not necessary to have it quite so high but it avoids running into problems with other apps like wine.
                # See: https://github.com/lutris/docs/blob/master/HowToEsync.md
                # Might be worth adding a separate config in the future to opt into a higher value
                { domain = "*"; item = "nofile"; type = "-"; value = "1048576"; }
            ];
          })
        ]);
  };
}
{
    outputs = {...}: {
        nixosModules.default = {
          # See: https://vitejs.dev/guide/troubleshooting.html#requests-are-stalled-foreverw
          boot.kernel.sysctl= {
            "fs.inotify.max_user_watches" = 1048576;
            "fs.inotify.max_queued_events" = 16384;
            "fs.inotify.max_user_instances" = 8192;
          };
          security.pam.loginLimits = [
            { domain = "*"; item = "nofile"; type = "-"; value = "65536"; }
          ];
        };
    };
}
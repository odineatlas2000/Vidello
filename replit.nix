{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.ffmpeg
    pkgs.yt-dlp
    pkgs.curl
    pkgs.wget
  ];
  env = {
    PYTHON_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc.lib
      pkgs.zlib
      pkgs.glibc
    ];
    PATH = "${pkgs.python3}/bin:${pkgs.yt-dlp}/bin:$PATH";
  };
}
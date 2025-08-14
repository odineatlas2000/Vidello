{ pkgs }: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.ffmpeg
    pkgs.yt-dlp
    pkgs.curl
    pkgs.wget
    pkgs.git
  ];
  env = {
    PYTHON_LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.stdenv.cc.cc.lib
      pkgs.zlib
      pkgs.glib
      pkgs.xorg.libX11
      pkgs.xorg.libXext
      pkgs.xorg.libXtst
      pkgs.xorg.libXi
      pkgs.xorg.libXrandr
      pkgs.freetype
      pkgs.fontconfig
      pkgs.gtk3
      pkgs.cairo
      pkgs.gdk-pixbuf
      pkgs.atk
      pkgs.pango
      pkgs.glibc
    ];
    PYTHONHOME = "${pkgs.python3}";
    PYTHONPATH = "${pkgs.python3}/lib/python3.11/site-packages";
  };
}
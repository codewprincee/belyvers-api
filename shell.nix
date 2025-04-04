{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.nodejs_20
    pkgs.yarn
    pkgs.typescript
    pkgs.nodePackages.typescript-language-server
  ];

  shellHook = ''
    export PATH="$PWD/node_modules/.bin:$PATH"
  '';
} 
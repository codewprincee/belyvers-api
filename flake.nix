{
  description = "A Node.js/TypeScript API project";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_20;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            nodejs
            pkgs.yarn
            pkgs.typescript
            pkgs.nodePackages.typescript-language-server
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
          '';
        };

        packages.default = pkgs.stdenv.mkDerivation {
          name = "api";
          src = ./.;
          buildInputs = [ nodejs ];
          buildPhase = ''
            npm install --legacy-peer-deps
            npm run build
          '';
          installPhase = ''
            mkdir -p $out
            cp -r dist $out/
            cp package.json $out/
            cp -r node_modules $out/
          '';
        };
      });
} 
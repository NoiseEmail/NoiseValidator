# -- TSC Compile (Ignore Errors)
tsc 2> /dev/null
echo "TSC Compile Done"

# -- Copy over the package.json, README.md, and LICENSE
cp package.json dist/package.json
cp README.md dist/README.md
cp LICENSE dist/LICENSE

# -- Publish "registry": "http://localhost:4873"
cd dist && npm publish --registry http://localhost:4873

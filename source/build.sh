#!/bin/sh
set -e; cd "$(dirname "$0")"
rm -rf dist && mkdir dist
cp src/index.html src/app.css src/app.js dist/
touch dist/.nojekyll
printf 'window.QCON_DATA=' > dist/data.js && cat src/data.json >> dist/data.js && printf ';\n' >> dist/data.js
python3 - <<'PY'
s=open("dist/index.html",encoding="utf-8").read()
css=open("dist/app.css",encoding="utf-8").read(); js=open("dist/app.js",encoding="utf-8").read(); data=open("dist/data.js",encoding="utf-8").read()
s=s.replace("<link rel=\"stylesheet\" href=\"app.css\">","<style>"+css+"</style>").replace("<script src=\"data.js\"></script>","<script>"+data.replace("</","<\\/")+"</script>").replace("<script src=\"app.js\"></script>","<script>"+js+"</script>")
open("dist/qcon-sh2026.html","w",encoding="utf-8").write(s)
PY

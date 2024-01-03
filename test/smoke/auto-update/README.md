# Test auto upgrade function

auto-upgrade need a server for providing static for update.

you need to prebuild version+1 before to test if you want to test auto-upgrade.

before you run make sure that root directory has dev-app-update.yml appoint to a certain local port.

> cd ./dist && python -m http.server --bind localhost 8000

or

> node ./test/smoke/auto-update/server.js

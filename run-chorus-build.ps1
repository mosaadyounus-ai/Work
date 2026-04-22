$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = "$root\.tools\node-v22.14.0-win-x64;$env:Path"

& "$root\.tools\node-v22.14.0-win-x64\node.exe" "$root\node_modules\vite\bin\vite.js" build

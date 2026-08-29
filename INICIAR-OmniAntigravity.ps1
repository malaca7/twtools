$antigravity = "C:\Users\nullp\AppData\Local\Programs\Antigravity IDE\Antigravity IDE.exe"
$omni = "C:\Users\nullp\Desktop\OmniAntigravityRemoteChat"
$ngrok = "C:\Users\nullp\AppData\Roaming\npm\ngrok.cmd"
$npm = "C:\Program Files\nodejs\npm.cmd"

wt.exe `
    new-tab --title "Antigravity - 7800" powershell.exe -NoExit -Command "& '$antigravity' --remote-debugging-port=7800" `
    `; new-tab --title "Omni - 4747" cmd.exe /k "cd /d $omni && `"$npm`" start" `
    `; new-tab --title "ngrok - Remote" cmd.exe /k "`"$ngrok`" http https://127.0.0.1:4747"
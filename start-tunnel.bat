@echo off
title Khoi dong Tunnel cho Momo Pay Simulator
echo Dang xoa log cu...
if exist tunnel.log del /f /q tunnel.log

:: Kiem tra phím SSH Key, neu chua co thi tu dong tao
if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo [INFO] Khong tim thay SSH Key. Dang tu dong tao SSH Key moi...
    if not exist "%USERPROFILE%\.ssh" mkdir "%USERPROFILE%\.ssh"
    ssh-keygen -t rsa -b 2048 -N "" -f "%USERPROFILE%\.ssh\id_rsa"
    echo [INFO] Da tao xong SSH Key!
    echo ------------------------------------------------------------
)

echo.
echo Dang khoi dong cong ket noi Tunnel qua SSH (localhost.run)...
echo Nut "yes" neu he thong yeu cau xac nhan (Fingerprint)...
echo ------------------------------------------------------------
powershell -Command "ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run | Tee-Object -FilePath tunnel.log"
pause

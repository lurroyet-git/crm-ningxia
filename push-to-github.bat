@echo off
REM GitHub 推送脚本 - 宁夏CRM作战地图
REM 在 Windows 命令提示符或 Git Bash 中运行

cd C:\Users\lurro\Documents\work\crm-platform

echo 设置远程仓库...
git remote add origin https://github.com/lurroyet-git/crm-ningxia.git 2>nul

echo 推送代码到 GitHub...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo 推送失败，可能原因：
    echo 1. 网络问题 - 检查是否能访问 github.com
    echo 2. 认证问题 - 需要使用 Personal Access Token
    echo.
    echo 解决方案：
    echo 1. 打开 https://github.com/settings/tokens
    echo 2. 点击 Generate new token (classic)
    echo 3. 勾选 repo 权限
    echo 4. 生成令牌后，在密码提示处粘贴令牌代替密码
    echo.
    pause
    exit /b 1
)

echo.
echo 推送成功！
echo 请继续执行 Render.com 部署步骤
echo 详见 docs/Render部署指南.md
pause

@echo off
REM GitHub 推送故障排除脚本
chcp 65001 >nul

echo ==========================================
echo 宁夏CRM - GitHub 推送故障排除
echo ==========================================
echo.
echo 正在检测网络环境...

cd C:\Users\lurro\Documents\work\crm-platform

REM 检查 git remote
echo [1/5] 检查远程仓库配置...
git remote -v
echo.

REM 测试 GitHub 连通性
echo [2/5] 测试 GitHub 连通性...
ping github.com -n 2 2>nul && echo GitHub 可访问 || echo GitHub 不可访问（可能被防火墙拦截）
echo.

REM 检查代理设置
echo [3/5] 检查 Git 代理设置...
git config --global http.proxy 2>nul && echo HTTP代理已设置: & git config --global http.proxy || echo 无HTTP代理
git config --global https.proxy 2>nul && echo HTTPS代理已设置: & git config --global https.proxy || echo 无HTTPS代理
echo.

echo ==========================================
echo 解决方案（请逐一尝试）
echo ==========================================
echo.
echo 【方案1】使用代理（如果你在公司/学校网络）
echo   设置代理后重试 push：
echo   git config --global http.proxy http://代理地址:端口
echo   git config --global https.proxy http://代理地址:端口
echo   git push -u origin main
echo.
echo 【方案2】取消代理后重试
echo   git config --global --unset http.proxy
echo   git config --global --unset https.proxy
echo   git push -u origin main
echo.
echo 【方案3】切换为 SSH 协议（需要配置 SSH 密钥）
echo   git remote set-url origin git@github.com:lurroyet-git/crm-ningxia.git
echo   git push -u origin main
echo.
echo 【方案4】增大缓冲区（解决大数据包被重置）
echo   git config --global http.postBuffer 524288000
echo   git config --global http.version HTTP/1.1
echo   git push -u origin main
echo.
echo 【方案5】关闭 SSL 验证（不推荐长期使用）
echo   git config --global http.sslVerify false
echo   git push -u origin main
echo.
echo 【方案6】手动上传到 GitHub（最可靠）
echo   1. 打开 https://github.com/lurroyet-git/crm-ningxia
echo   2. 点击 "Add file" → "Upload files"
echo   3. 将项目文件夹压缩为 ZIP，拖拽上传
echo   4. 或使用 GitHub Desktop 客户端
echo.

pause

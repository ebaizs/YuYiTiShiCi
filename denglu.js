
// 显示登录消息
function showLoginMessage(message, type) {
    const loginError = document.getElementById('login-error');
    if (loginError) {
        loginError.textContent = message;
        loginError.className = `login-error ${type}`;
    }
}

// 重置登录表单
function resetLoginForm() {
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// 1. 本地默认用户（备用）
function getDefaultUsers() {
    return [
        {
            "username": "qiyu",
            "password": "8418",
            "name": "系统管理员",
            "isLocal": true,
            "isAdmin": true
        }
    ];
}
// 9. 全局退出函数 - 替换index.html中的版本
function logout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除所有存储
        sessionStorage.clear();
        localStorage.removeItem('aiPromptHistory');
        
        // 强制刷新页面回到登录状态
        location.reload();
    }
}

// 2. 从云端加载账号信息
async function loadCloudUsers() {
    const cloudUrl = 'https://gist.githubusercontent.com/ebaizs/2769a9e28995f23cf9be60dd8f2891ca/raw/my-zhanghao.js';
    
    try {
        const response = await fetch(cloudUrl);
        const jsContent = await response.text();
        const users = parseUsersFromJS(jsContent);
        return users || [];
    } catch (error) {
        console.error('加载云端账号失败:', error);
        throw error;
    }
}

function parseUsersFromJS(jsContent) {
    try {
        const patterns = [
            /const\s+builtInUsers\s*=\s*(\[[\s\S]*?\]);/,
            /var\s+builtInUsers\s*=\s*(\[[\s\S]*?\]);/,
            /let\s+builtInUsers\s*=\s*(\[[\s\S]*?\]);/,
            /builtInUsers\s*=\s*(\[[\s\S]*?\]);/
        ];
        
        let usersArray = null;
        
        for (const pattern of patterns) {
            const match = jsContent.match(pattern);
            if (match) {
                try {
                    usersArray = JSON.parse(match[1].replace(/(\w+):/g, '"$1":'));
                    break;
                } catch (parseError) {
                    continue;
                }
            }
        }
        
        if (!usersArray) {
            try {
                const jsWithReturn = jsContent + '; return builtInUsers || [];';
                const getUsers = new Function(jsWithReturn);
                usersArray = getUsers();
            } catch (evalError) {
                console.error('eval方式也失败了:', evalError);
            }
        }
        
        return usersArray || [];
    } catch (error) {
        console.error('解析用户数据失败:', error);
        return [];
    }
}

// 3. 登录处理函数
async function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const loginButton = document.getElementById('login-button');
    const loginLoading = document.getElementById('login-loading');
    const loginError = document.getElementById('login-error');
    
    if (!username || !password) {
        loginError.textContent = '请输入用户名和密码';
        loginError.style.color = '#fa8c16';
        return;
    }
    
    loginButton.style.display = 'none';
    loginLoading.style.display = 'block';
    loginError.textContent = '';
    
    try {
        const cloudUsers = await loadCloudUsers();
        const user = cloudUsers.find(u => u.username === username && u.password === password);
        
        if (user) {
            handleLoginSuccess(user);
        } else {
            // 备用：检查本地用户
            const defaultUsers = getDefaultUsers();
            const localUser = defaultUsers.find(u => u.username === username && u.password === password);
            
            if (localUser) {
                handleLoginSuccess(localUser);
            } else {
                loginError.textContent = '用户名或密码错误';
                loginError.style.color = '#ff4d4f';
                loginButton.style.display = 'block';
                loginLoading.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('登录过程出错:', error);
        loginError.textContent = '登录失败，请检查网络连接或联系管理员';
        loginError.style.color = '#ff4d4f';
        loginButton.style.display = 'block';
        loginLoading.style.display = 'none';
    }
}

// 4. 登录成功处理
function handleLoginSuccess(user) {
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('userName', user.name);
    sessionStorage.setItem('userRole', user.isAdmin ? 'admin' : 'user');
    
    const loginError = document.getElementById('login-error');
    loginError.textContent = '登录成功，正在进入系统...';
    loginError.style.color = '#52c41a';
    
    setTimeout(() => {
        location.reload();
    }, 800);
}


// 5. 显示主应用
function showMainApp() {
    const userName = sessionStorage.getItem('userName') || '用户';
    
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('main-container').style.display = 'block';
    
    // 更新用户信息到右上角
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.innerHTML = `
            <span class="user-name"><i class="fas fa-user"></i> ${userName}</span>
            <button onclick="logout()" class="logout-btn">
                <i class="fas fa-sign-out-alt"></i> 退出
            </button>
        `;
    }
}


// 7. 初始化登录界面 - 修改为每次都检查
function initLogin() {
    // 清除之前的登录状态，强制每次都登录
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userRole');
    
    // 显示登录界面
    document.getElementById('login-container').style.display = 'flex';
    
    // 绑定登录按钮事件
    const loginButton = document.getElementById('login-button');
    if (loginButton) {
        loginButton.addEventListener('click', handleLogin);
    }
    
    // 绑定回车键登录
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });
    }
    
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('password').focus();
            }
        });
    }
}

// 8. 检查登录状态（每次刷新都要求登录）
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (isLoggedIn === 'true') {
        showMainApp();
        return true;
    } else {
        // 未登录，显示登录界面
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
        return false;
    }
}


// 10. 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，检查登录状态...');
    
    // 检查登录状态
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userName = sessionStorage.getItem('userName');
    
    if (isLoggedIn === 'true' && userName) {
        console.log('用户已登录，显示主应用');
        
        // 如果已登录，显示主应用
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
        
        // 更新用户信息到右上角
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name"><i class="fas fa-user"></i> ${userName}</span>
                <button onclick="logout()" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i> 退出
                </button>
            `;
        }
        
        // 注意：这里不调用 CoreFunctions.initApp()，让 app.js 来处理初始化
    } else {
        console.log('用户未登录，显示登录界面');
        
        // 未登录，显示登录界面
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
        
        // 初始化登录界面
        initLogin();
    }
});
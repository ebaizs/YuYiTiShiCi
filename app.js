// 定义全局应用管理器
window.AppInitializer = {
    init: function() {
        console.log("开始初始化应用...");
        
        // 检查登录状态
        const isLoggedIn = sessionStorage.getItem('isLoggedIn');
        const userName = sessionStorage.getItem('userName');
        
        if (isLoggedIn === 'true' && userName) {
            this.initLoggedIn(userName);
        } else {
            this.initLogin();
        }
    },
    
    initLoggedIn: function(userName) {
        console.log("用户已登录，初始化主应用");
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
        
        // 更新用户信息
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span><i class="fas fa-user"></i> ${userName}</span>
                <button onclick="logout()" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i> 退出
                </button>
            `;
            userInfo.style.display = 'flex';
        }
        
        // 执行主应用初始化
        setTimeout(() => {
            if (typeof CoreFunctions !== 'undefined' && CoreFunctions.initApp) {
                CoreFunctions.initApp();
            } else {
                console.error("CoreFunctions 未加载");
            }
        }, 100);
    },
    
    initLogin: function() {
        console.log("用户未登录，显示登录界面");
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
        
        // 等待denglu.js加载
        setTimeout(() => {
            if (typeof initLogin === 'function') {
                initLogin();
            }
        }, 500);
    }
};

// ================ 登录状态检查 ================
(function checkLoginBeforeInit() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userName = sessionStorage.getItem('userName');
    
    if (isLoggedIn === 'true' && userName) {
        // 如果已登录，显示主应用
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('main-container').style.display = 'block';
        
        // 更新用户信息到最右边
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span><i class="fas fa-user"></i> ${userName}</span>
                <button onclick="logout()" class="logout-btn">
                    <i class="fas fa-sign-out-alt"></i> 退出
                </button>
            `;
            userInfo.style.display = 'flex';
        }
        
        // 继续初始化应用
        setTimeout(() => {
            if (typeof CoreFunctions !== 'undefined' && CoreFunctions.initApp) {
                CoreFunctions.initApp();
            }
        }, 100);
    } else {
        // 未登录，显示登录界面
        document.getElementById('main-container').style.display = 'none';
        document.getElementById('login-container').style.display = 'flex';
        
        // 等待denglu.js加载后初始化登录界面
        setTimeout(() => {
            if (typeof initLogin === 'function') {
                initLogin();
            }
        }, 500);
        
        // 阻止继续执行主应用初始化
        return;
    }
})();

(function () {
      // 只有在登录状态下才执行后续初始化
      if (sessionStorage.getItem('isLoggedIn') !== 'true') {
        return;
    }
    // ================ 状态管理模块 ================
    const AppState = {
        currentConfig: null,
        customColors: {},
        globalColorMap: {},
        state: {
            currentColor: "玻璃幕墙",
            operationMode: "paint",
            vanishColor: [50, 50, 50],
            vanishColorName: "消失区域",
            brushSize: 15,
            isDrawing: false,
            lastX: 0,
            lastY: 0,
            labels: [],
            backgroundCanvas: null,
            backgroundCtx: null,
            drawingCanvas: null,
            drawingCtx: null,
            previewCanvas: null,
            previewCtx: null,
            zoomLevel: 1,
            originalImage: null,
            backgroundVisible: true,
            canvasWidth: 1024,
            canvasHeight: 1024,
            scaleFactor: 1,
            usedColors: new Set(),
            isShiftPressed: false,
            drawingHistory: [],
            maxHistorySteps: 20,
            lastOperationLabels: [],
            lineStartPoint: null,
            lassoPoints: [],
            isLassoActive: false,
            promptConfig: {
                spaceType: "客厅",
                designStyle: "现代简约风格",
                lightingStyle: "自然采光",
                furniture: [],
                additionalPrompt: "",
                useSpaceType: true,// 默认启用
                useDesignStyle: true,// 默认启用
                useLightingStyle: true// 默认启用
            },
            colorCategories: [],
            originalPrompt: "",
            originalSmartPrompt: "",
            originalPromptConfig: null,
            appliedSmartPrompt: false,
            isAltPressed: false,
            canvasTranslateX: 0,
            canvasTranslateY: 0,
            operationState: {
                lastAction: null,
                isReverted: false,
                isBlurred: false,
                fusionState: 0,
                lastFusionState: null
            }
        }
    };

    const StateManager = {
        initState() {
            this.initGlobalColorMap();
        },
        initGlobalColorMap() {
            AppState.globalColorMap = {};
            Object.values(defaultConfigs).forEach(config => {
                Object.keys(config.colorPalette).forEach(colorName => {
                    AppState.globalColorMap[colorName] = config.colorPalette[colorName];
                });
            });
            Object.keys(AppState.customColors).forEach(colorName => {
                AppState.globalColorMap[colorName] = AppState.customColors[colorName];
            });
        },
        getState() { return AppState.state; },
        updateState(key, value) {
            if (key.includes('.')) {
                const keys = key.split('.');
                let obj = AppState.state;
                for (let i = 0; i < keys.length - 1; i++) { obj = obj[keys[i]]; }
                obj[keys[keys.length - 1]] = value;
            } else { AppState.state[key] = value; }
        },
        saveDrawingState(imageData) {
            const state = {
                imageData: imageData,
                labels: JSON.parse(JSON.stringify(AppState.state.labels)),
                usedColors: Array.from(AppState.state.usedColors),
                lastOperationLabels: JSON.parse(JSON.stringify(AppState.state.lastOperationLabels || [])),
                operationState: JSON.parse(JSON.stringify(AppState.state.operationState)),
                promptOutput: document.getElementById('promptOutput')?.value || "",
                smartPromptOutput: document.getElementById('smartPromptOutput')?.value || "",
                appliedSmartPrompt: AppState.state.appliedSmartPrompt,
                originalPrompt: AppState.state.originalPrompt,
                originalSmartPrompt: AppState.state.originalSmartPrompt
            };
            AppState.state.drawingHistory.push(state);
            if (AppState.state.drawingHistory.length > AppState.state.maxHistorySteps) {
                AppState.state.drawingHistory.shift();
            }
            AppState.state.lastOperationLabels = [];
        },
        restoreDrawingState(state) {
            if (!state) return false;
            AppState.state.drawingCtx.putImageData(state.imageData, 0, 0);
            AppState.state.labels = state.labels;
            AppState.state.usedColors = new Set(state.usedColors);
            AppState.state.operationState = state.operationState || { fusionState: 0 };
            AppState.state.appliedSmartPrompt = state.appliedSmartPrompt || false;
            AppState.state.originalPrompt = state.originalPrompt || "";
            AppState.state.originalSmartPrompt = state.originalSmartPrompt || "";
            if (state.promptOutput && document.getElementById('promptOutput')) {
                document.getElementById('promptOutput').value = state.promptOutput;
            }
            if (state.smartPromptOutput && document.getElementById('smartPromptOutput')) {
                document.getElementById('smartPromptOutput').value = state.smartPromptOutput;
            }
            return true;
        },
        getOperationState() { return AppState.state.operationState; },
        updateOperationState(action) {
            const opState = AppState.state.operationState;
            switch (action) {
                case 'applySmartPrompt': opState.fusionState = 1; opState.lastAction = 'applySmartPrompt'; opState.isReverted = false; opState.isBlurred = false; break;
                case 'revertSmartPrompt': opState.fusionState = 0; opState.lastAction = 'revertSmartPrompt'; opState.isReverted = true; break;
                case 'blurPrompt': opState.lastAction = 'blurPrompt'; opState.isBlurred = true; break;
                case 'clearDrawing': opState.fusionState = 0; opState.lastAction = 'clearDrawing'; opState.isReverted = false; opState.isBlurred = false; break;
                case 'undo': opState.lastAction = 'undo'; break;
            }
            if (opState.fusionState === 1) {
                opState.lastFusionState = {
                    labels: JSON.parse(JSON.stringify(AppState.state.labels)),
                    usedColors: Array.from(AppState.state.usedColors)
                };
            }
        },
        canBlur() { return !AppState.state.operationState.isBlurred && AppState.state.operationState.fusionState === 1; },
        canRevert() { return AppState.state.operationState.fusionState === 1 && !AppState.state.operationState.isReverted && AppState.state.appliedSmartPrompt; },
        resetOperationState() {
            AppState.state.operationState = {
                lastAction: null,
                isReverted: false,
                isBlurred: false,
                fusionState: 0,
                lastFusionState: null
            };
        },
        clearAllState() {
            AppState.state.labels = [];
            AppState.state.usedColors.clear();
            AppState.state.drawingHistory = [];
            AppState.state.lastOperationLabels = [];
            AppState.state.lassoPoints = [];
            AppState.state.isLassoActive = false;
            AppState.state.originalPrompt = "";
            AppState.state.originalSmartPrompt = "";
            AppState.state.originalPromptConfig = null;
            AppState.state.appliedSmartPrompt = false;
            this.resetOperationState();
        }
    };

    // ================ 画布管理模块 ================
    const CanvasManager = {
        initCanvas() {
            console.log("初始化画布...");
            try {
                const appState = StateManager.getState();
                appState.canvasWidth = 1024;
                appState.canvasHeight = 1024;
                appState.backgroundCanvas.width = appState.canvasWidth;
                appState.backgroundCanvas.height = appState.canvasHeight;
                appState.drawingCanvas.width = appState.canvasWidth;
                appState.drawingCanvas.height = appState.canvasHeight;
                appState.previewCanvas.width = appState.canvasWidth;
                appState.previewCanvas.height = appState.canvasHeight;
                appState.backgroundCanvas.style.width = appState.canvasWidth + 'px';
                appState.backgroundCanvas.style.height = appState.canvasHeight + 'px';
                appState.drawingCanvas.style.width = appState.canvasWidth + 'px';
                appState.drawingCanvas.style.height = appState.canvasHeight + 'px';
                appState.previewCanvas.style.width = appState.canvasWidth + 'px';
                appState.previewCanvas.style.height = appState.canvasHeight + 'px';
                const canvasWrapper = document.getElementById('canvasWrapper');
                if (canvasWrapper) {
                    canvasWrapper.style.width = appState.canvasWidth + 'px';
                    canvasWrapper.style.height = appState.canvasHeight + 'px';
                }
                appState.backgroundCtx.fillStyle = 'white';
                appState.backgroundCtx.fillRect(0, 0, appState.backgroundCanvas.width, appState.backgroundCanvas.height);
                appState.drawingCtx.clearRect(0, 0, appState.drawingCanvas.width, appState.drawingCanvas.height);
                appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
                this.drawGridBackground();
                this.resetCanvasState();
                console.log("画布初始化完成");
                setTimeout(() => this.resetZoom(), 100);
            } catch (error) { console.error("画布初始化失败:", error); }
            StateManager.getState().usedColors = new Set();
        },
        drawGridBackground() {
            const appState = StateManager.getState();
            const ctx = appState.backgroundCtx;
            const width = appState.backgroundCanvas.width;
            const height = appState.backgroundCanvas.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            ctx.strokeStyle = '#f0f0f0';
            ctx.lineWidth = 1;
            for (let y = 0; y <= height; y += 20) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            for (let x = 0; x <= width; x += 20) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
        },
        resetCanvasState() {
            const appState = StateManager.getState();
            appState.labels = [];
            appState.usedColors.clear();
            appState.drawingHistory = [];
            appState.lastOperationLabels = [];
            appState.lassoPoints = [];
            appState.isLassoActive = false;
            appState.lineStartPoint = null;
            appState.isDrawing = false;
            appState.isShiftPressed = false;
            document.getElementById('promptOutput').value = "空置空间";
        },
        updatePreview() {
            const previewCircle = document.getElementById('previewCircle');
            const previewCircleInner = document.getElementById('previewCircleInner');
            const previewBrushSize = document.getElementById('previewBrushSize');
            const previewColorName = document.getElementById('previewColorName');
            const previewCircleExport = document.getElementById('previewCircleExport');
            const previewCircleInnerExport = document.getElementById('previewCircleInnerExport');
            const previewBrushSizeExport = document.getElementById('previewBrushSizeExport');
            const previewColorNameExport = document.getElementById('previewColorNameExport');
            if (!previewCircle || !previewCircleInner || !previewBrushSize || !previewColorName) return;
            const appState = StateManager.getState();
            const colorInfo = this.getColorInfo(appState.currentColor);
            const hexColor = colorInfo ? rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]) : '#000000';
            const maxDisplaySize = 48;
            const minDisplaySize = 3;
            const displaySize = Math.min(maxDisplaySize, Math.max(minDisplaySize, appState.brushSize));
            previewCircle.style.borderColor = hexColor;
            previewCircleInner.style.backgroundColor = hexColor;
            previewCircleInner.style.width = `${displaySize}px`;
            previewCircleInner.style.height = `${displaySize}px`;
            previewBrushSize.textContent = `${appState.brushSize}px`;
            previewColorName.textContent = appState.currentColor;
            if (previewCircleExport && previewCircleInnerExport && previewBrushSizeExport && previewColorNameExport) {
                previewCircleExport.style.borderColor = hexColor;
                previewCircleInnerExport.style.backgroundColor = hexColor;
                previewCircleInnerExport.style.width = `${displaySize}px`;
                previewCircleInnerExport.style.height = `${displaySize}px`;
                previewBrushSizeExport.textContent = `${appState.brushSize}px`;
                previewColorNameExport.textContent = appState.currentColor;
            }
            this.updatePreviewMode();
        },
        updatePreviewMode() {
            const previewCircle = document.getElementById('previewCircle');
            const previewCircleExport = document.getElementById('previewCircleExport');
            if (!previewCircle) return;
            const appState = StateManager.getState();
            previewCircle.classList.remove('eraser-mode', 'lasso-mode', 'pipette-mode', 'vanish-mode');
            if (previewCircleExport) {
                previewCircleExport.classList.remove('eraser-mode', 'lasso-mode', 'pipette-mode', 'vanish-mode');
            }
            if (appState.operationMode === 'erase') {
                previewCircle.classList.add('eraser-mode');
                if (previewCircleExport) previewCircleExport.classList.add('eraser-mode');
            } else if (appState.operationMode === 'lasso') {
                previewCircle.classList.add('lasso-mode');
                if (previewCircleExport) previewCircleExport.classList.add('lasso-mode');
            } else if (appState.operationMode === 'pipette') {
                previewCircle.classList.add('pipette-mode');
                if (previewCircleExport) previewCircleExport.classList.add('pipette-mode');
            } else if (appState.operationMode === 'vanish') {
                previewCircle.classList.add('vanish-mode');
                if (previewCircleExport) previewCircleExport.classList.add('vanish-mode');
            }
        },
        getColorInfo(colorName) {
            if (AppState.currentConfig && AppState.currentConfig.colorPalette[colorName]) {
                return AppState.currentConfig.colorPalette[colorName];
            } else if (AppState.customColors[colorName]) {
                return AppState.customColors[colorName];
            } else if (AppState.globalColorMap[colorName]) {
                return AppState.globalColorMap[colorName];
            }
            return null;
        },
        resizeCanvasContent(width, height) {
            const appState = StateManager.getState();
            const tempBackgroundCanvas = document.createElement('canvas');
            tempBackgroundCanvas.width = appState.backgroundCanvas.width;
            tempBackgroundCanvas.height = appState.backgroundCanvas.height;
            const tempBackgroundCtx = tempBackgroundCanvas.getContext('2d');
            tempBackgroundCtx.drawImage(appState.backgroundCanvas, 0, 0);
            const tempDrawingCanvas = document.createElement('canvas');
            tempDrawingCanvas.width = appState.drawingCanvas.width;
            tempDrawingCanvas.height = appState.drawingCanvas.height;
            const tempDrawingCtx = tempDrawingCanvas.getContext('2d');
            tempDrawingCtx.drawImage(appState.drawingCanvas, 0, 0);
            appState.backgroundCanvas.width = width;
            appState.backgroundCanvas.height = height;
            appState.drawingCanvas.width = width;
            appState.drawingCanvas.height = height;
            appState.previewCanvas.width = width;
            appState.previewCanvas.height = height;
            appState.backgroundCanvas.style.width = width + 'px';
            appState.backgroundCanvas.style.height = height + 'px';
            appState.drawingCanvas.style.width = width + 'px';
            appState.drawingCanvas.style.height = height + 'px';
            appState.previewCanvas.style.width = width + 'px';
            appState.previewCanvas.style.height = height + 'px';
            const canvasWrapper = document.getElementById('canvasWrapper');
            if (canvasWrapper) {
                canvasWrapper.style.width = width + 'px';
                canvasWrapper.style.height = height + 'px';
            }
            appState.backgroundCtx.drawImage(tempBackgroundCanvas, 0, 0);
            appState.drawingCtx.drawImage(tempDrawingCanvas, 0, 0);
            if (appState.originalImage) {
                this.drawImageOnCanvas(appState.originalImage);
            } else {
                this.drawGridBackground();
            }
        },
        drawImageOnCanvas(img) {
            const appState = StateManager.getState();
            appState.canvasWidth = img.width;
            appState.canvasHeight = img.height;
            appState.backgroundCanvas.width = img.width;
            appState.backgroundCanvas.height = img.height;
            appState.drawingCanvas.width = img.width;
            appState.drawingCanvas.height = img.height;
            appState.previewCanvas.width = img.width;
            appState.previewCanvas.height = img.height;
            appState.backgroundCanvas.style.width = img.width + 'px';
            appState.backgroundCanvas.style.height = img.height + 'px';
            appState.drawingCanvas.style.width = img.width + 'px';
            appState.drawingCanvas.style.height = img.height + 'px';
            appState.previewCanvas.style.width = img.width + 'px';
            appState.previewCanvas.style.height = img.height + 'px';
            const canvasWrapper = document.getElementById('canvasWrapper');
            if (canvasWrapper) {
                canvasWrapper.style.width = img.width + 'px';
                canvasWrapper.style.height = img.height + 'px';
            }
            appState.backgroundCtx.clearRect(0, 0, appState.backgroundCanvas.width, appState.backgroundCanvas.height);
            appState.backgroundCtx.drawImage(img, 0, 0);
            this.resetZoom();
        },
        saveDrawingState() {
            const appState = StateManager.getState();
            const imageData = appState.drawingCtx.getImageData(0, 0, appState.drawingCanvas.width, appState.drawingCanvas.height);
            StateManager.saveDrawingState(imageData);
        },
        setOperationMode(mode) {
            const appState = StateManager.getState();
            appState.operationMode = mode;
            document.querySelectorAll('.tool-button').forEach(btn => { btn.classList.remove('active'); });
            if (mode === 'pipette') {
                document.getElementById('pipetteMode').classList.add('active');
                document.getElementById('currentTool').textContent = '吸管';
                appState.drawingCanvas.style.cursor = 'crosshair';
            } else if (mode === 'paint') {
                document.getElementById('paintMode').classList.add('active');
                document.getElementById('currentTool').textContent = '画笔';
                appState.drawingCanvas.style.cursor = 'crosshair';
            } else if (mode === 'erase') {
                document.getElementById('eraseMode').classList.add('active');
                document.getElementById('currentTool').textContent = '橡皮';
                appState.drawingCanvas.style.cursor = 'crosshair';
            } else if (mode === 'lasso') {
                document.getElementById('lassoMode').classList.add('active');
                document.getElementById('currentTool').textContent = '套索';
                this.cancelLasso();
            } else if (mode === 'vanish') {
                document.getElementById('vanishMode').classList.add('active');
                document.getElementById('currentTool').textContent = '消失';
                appState.drawingCanvas.style.cursor = 'crosshair';
            }
            this.updatePreview();
        },
        drawOnCanvas(x, y, isClick = false) {
            const appState = StateManager.getState();
            let colorInfo;
            if (appState.operationMode === 'vanish') {
                colorInfo = { color: appState.vanishColor, id: -1, category: appState.vanishColorName };
                appState.drawingCtx.globalCompositeOperation = 'source-over';
                const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                appState.drawingCtx.fillStyle = hexColor;
            } else if (appState.operationMode === 'erase') {
                appState.drawingCtx.globalCompositeOperation = 'destination-out';
                appState.drawingCtx.fillStyle = 'rgba(0,0,0,1)';
                this.checkErasedLabels(x, y);
            } else {
                appState.drawingCtx.globalCompositeOperation = 'source-over';
                colorInfo = this.getColorInfo(appState.currentColor);
                if (colorInfo) {
                    const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                    appState.drawingCtx.fillStyle = hexColor;
                }
            }
            const halfSize = appState.brushSize / 2;
            appState.drawingCtx.fillRect(x - halfSize, y - halfSize, appState.brushSize, appState.brushSize);
            if (isClick && appState.operationMode !== 'erase') {
                const newLabel = {
                    category: appState.operationMode === 'vanish' ? appState.vanishColorName : appState.currentColor,
                    coordinates: { x: Math.round(x), y: Math.round(y) },
                    color: appState.operationMode === 'vanish' ? appState.vanishColor : (colorInfo ? colorInfo.color : [0, 0, 0]),
                    id: appState.operationMode === 'vanish' ? -1 : (colorInfo ? colorInfo.id : 0),
                    brushSize: appState.brushSize,
                    timestamp: new Date().toISOString()
                };
                appState.labels.push(newLabel);
                appState.lastOperationLabels.push(newLabel);
                CoreFunctions.updateUI();
                SmartPrompt.updatePromptColors();
            }
            appState.lastX = x;
            appState.lastY = y;
        },
        checkErasedLabels(x, y) {
            const appState = StateManager.getState();
            const brushSize = appState.brushSize;
            const halfSize = brushSize / 2;
            const labelsToRemove = [];
            appState.labels.forEach((label, index) => {
                const labelX = label.coordinates.x;
                const labelY = label.coordinates.y;
                if (labelX >= x - halfSize && labelX <= x + halfSize && labelY >= y - halfSize && labelY <= y + halfSize) {
                    labelsToRemove.push(index);
                }
            });
            for (let i = labelsToRemove.length - 1; i >= 0; i--) {
                const index = labelsToRemove[i];
                appState.labels.splice(index, 1);
            }
            if (labelsToRemove.length > 0) {
                const actualUsedColors = new Set();
                appState.labels.forEach(label => {
                    if (label.category !== appState.vanishColorName) {
                        actualUsedColors.add(label.category);
                    } else {
                        actualUsedColors.add(appState.vanishColorName);
                    }
                });
                appState.usedColors = new Set(actualUsedColors);
                CoreFunctions.updateUI();
                SmartPrompt.updatePromptColors();
            }
        },
        pickColorFromCanvas(x, y) {
            const appState = StateManager.getState();
            const imageData = appState.drawingCtx.getImageData(x, y, 1, 1).data;
            if (imageData[3] === 0) {
                showTemporaryMessage('该位置没有标注颜色');
                return;
            }
            const r = imageData[0];
            const g = imageData[1];
            const b = imageData[2];
            const exactColor = this.findExactColorInGlobal(r, g, b);
            if (exactColor) {
                appState.currentColor = exactColor.name;
                this.updatePreview();
                CoreFunctions.updateUI();
                showTemporaryMessage(`已找到颜色: ${exactColor.name}`);
                this.setOperationMode('paint');
            } else {
                showTemporaryMessage('色板中没有找到完全相同的颜色');
            }
        },
        findExactColorInGlobal(r, g, b) {
            let foundColor = null;
            if (AppState.currentConfig) {
                Object.keys(AppState.currentConfig.colorPalette).forEach(colorName => {
                    const colorInfo = AppState.currentConfig.colorPalette[colorName];
                    const colorR = colorInfo.color[0];
                    const colorG = colorInfo.color[1];
                    const colorB = colorInfo.color[2];
                    if (r === colorR && g === colorG && b === colorB) {
                        foundColor = { name: colorName, info: colorInfo, source: 'currentConfig' };
                        return;
                    }
                });
                if (foundColor) return foundColor;
            }
            Object.keys(AppState.customColors).forEach(colorName => {
                const colorInfo = AppState.customColors[colorName];
                const colorR = colorInfo.color[0];
                const colorG = colorInfo.color[1];
                const colorB = colorInfo.color[2];
                if (r === colorR && g === colorG && b === colorB) {
                    foundColor = { name: colorName, info: colorInfo, source: 'custom' };
                    return;
                }
            });
            if (!foundColor) {
                Object.keys(defaultConfigs).forEach(configKey => {
                    if (configKey !== document.getElementById('configSelector').value) {
                        const config = defaultConfigs[configKey];
                        Object.keys(config.colorPalette).forEach(colorName => {
                            const colorInfo = config.colorPalette[colorName];
                            const colorR = colorInfo.color[0];
                            const colorG = colorInfo.color[1];
                            const colorB = colorInfo.color[2];
                            if (r === colorR && g === colorG && b === colorB) {
                                foundColor = { name: colorName, info: colorInfo, source: 'otherConfig' };
                                return;
                            }
                        });
                    }
                });
            }
            return foundColor;
        },
        drawLineOnCanvas(x1, y1, x2, y2) {
            const appState = StateManager.getState();
            const colorInfo = this.getColorInfo(appState.currentColor);
            if (appState.operationMode === 'erase') {
                appState.drawingCtx.globalCompositeOperation = 'destination-out';
                appState.drawingCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                appState.drawingCtx.globalCompositeOperation = 'source-over';
                const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                appState.drawingCtx.strokeStyle = hexColor;
            }
            appState.drawingCtx.lineWidth = appState.brushSize;
            appState.drawingCtx.lineCap = 'square';
            appState.drawingCtx.beginPath();
            appState.drawingCtx.moveTo(x1, y1);
            appState.drawingCtx.lineTo(x2, y2);
            appState.drawingCtx.stroke();
            if (appState.operationMode !== 'erase') {
                const midX = Math.round((x1 + x2) / 2);
                const midY = Math.round((y1 + y2) / 2);
                const newLabel = {
                    category: appState.currentColor,
                    coordinates: { x: midX, y: midY },
                    color: colorInfo.color,
                    id: colorInfo.id,
                    brushSize: appState.brushSize,
                    timestamp: new Date().toISOString()
                };
                appState.labels.push(newLabel);
                appState.lastOperationLabels.push(newLabel);
                appState.usedColors.add(appState.currentColor);
                CoreFunctions.updateUI();
                SmartPrompt.updatePromptColors();
            }
        },
        drawLinePreview(x1, y1, x2, y2) {
            const appState = StateManager.getState();
            appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
            const colorInfo = this.getColorInfo(appState.currentColor);
            if (appState.operationMode === 'erase') {
                appState.previewCtx.strokeStyle = 'rgba(255,0,0,0.5)';
            } else {
                const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                appState.previewCtx.strokeStyle = hexColor;
            }
            appState.previewCtx.lineWidth = appState.brushSize;
            appState.previewCtx.lineCap = 'square';
            appState.previewCtx.setLineDash([5, 5]);
            appState.previewCtx.beginPath();
            appState.previewCtx.moveTo(x1, y1);
            appState.previewCtx.lineTo(x2, y2);
            appState.previewCtx.stroke();
            appState.previewCtx.setLineDash([]);
        },
        startLasso(x, y) {
            const appState = StateManager.getState();
            if (appState.isAltPressed) return;
            appState.lassoPoints = [{ x, y }];
            appState.isLassoActive = true;
            appState.lastOperationLabels = [];
            this.drawLassoPreview();
        },
        addLassoPoint(x, y) {
            const appState = StateManager.getState();
            if (appState.isAltPressed || !appState.isLassoActive) return;
            appState.lassoPoints.push({ x, y });
            this.drawLassoPreview();
        },
        completeLasso() {
            const appState = StateManager.getState();
            if (!appState.isLassoActive || appState.lassoPoints.length < 3) return;
            const colorInfo = this.getColorInfo(appState.currentColor);
            const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
            appState.drawingCtx.globalCompositeOperation = 'source-over';
            appState.drawingCtx.fillStyle = hexColor;
            appState.drawingCtx.beginPath();
            appState.drawingCtx.moveTo(appState.lassoPoints[0].x, appState.lassoPoints[0].y);
            for (let i = 1; i < appState.lassoPoints.length; i++) {
                appState.drawingCtx.lineTo(appState.lassoPoints[i].x, appState.lassoPoints[i].y);
            }
            appState.drawingCtx.closePath();
            appState.drawingCtx.fill();
            const center = this.getPolygonCenter(appState.lassoPoints);
            const newLabel = {
                category: appState.currentColor,
                coordinates: { x: Math.round(center.x), y: Math.round(center.y) },
                color: colorInfo.color,
                id: colorInfo.id,
                brushSize: appState.brushSize,
                timestamp: new Date().toISOString(),
                isLasso: true,
                points: [...appState.lassoPoints]
            };
            appState.labels.push(newLabel);
            appState.lastOperationLabels.push(newLabel);
            appState.usedColors.add(appState.currentColor);
            appState.lassoPoints = [];
            appState.isLassoActive = false;
            appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
            this.saveDrawingState();
            CoreFunctions.updateUI();
            SmartPrompt.updatePromptColors();
        },
        cancelLasso() {
            const appState = StateManager.getState();
            appState.lassoPoints = [];
            appState.isLassoActive = false;
            appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
        },
        drawLassoPreview() {
            const appState = StateManager.getState();
            if (!appState.isLassoActive || appState.lassoPoints.length === 0) return;
            appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
            const colorInfo = this.getColorInfo(appState.currentColor);
            const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
            appState.previewCtx.strokeStyle = hexColor;
            appState.previewCtx.fillStyle = hexColor + '40';
            appState.previewCtx.lineWidth = 2;
            appState.previewCtx.setLineDash([5, 5]);
            appState.previewCtx.beginPath();
            appState.previewCtx.moveTo(appState.lassoPoints[0].x, appState.lassoPoints[0].y);
            for (let i = 1; i < appState.lassoPoints.length; i++) {
                appState.previewCtx.lineTo(appState.lassoPoints[i].x, appState.lassoPoints[i].y);
            }
            if (appState.lassoPoints.length > 0) {
                appState.previewCtx.lineTo(appState.lastX, appState.lastY);
            }
            appState.previewCtx.stroke();
            if (appState.lassoPoints.length >= 2) {
                appState.previewCtx.closePath();
                appState.previewCtx.fill();
            }
            appState.previewCtx.setLineDash([]);
            appState.lassoPoints.forEach(point => {
                appState.previewCtx.beginPath();
                appState.previewCtx.arc(point.x, point.y, 4, 0, Math.PI * 2);
                appState.previewCtx.fillStyle = hexColor;
                appState.previewCtx.fill();
            });
        },
        getPolygonCenter(points) {
            let x = 0, y = 0;
            points.forEach(point => { x += point.x; y += point.y; });
            return { x: x / points.length, y: y / points.length };
        },
        toggleBackground() {
            const appState = StateManager.getState();
            appState.backgroundVisible = !appState.backgroundVisible;
            appState.backgroundCanvas.style.display = appState.backgroundVisible ? 'block' : 'none';
            document.getElementById('toggleBackground').textContent = appState.backgroundVisible ? '隐藏背景' : '显示背景';
        },
        adjustZoom(delta) {
            const appState = StateManager.getState();
            const oldZoom = appState.zoomLevel;
            appState.zoomLevel += delta;
            appState.zoomLevel = Math.max(0.1, Math.min(5, appState.zoomLevel));
            const displayPercent = Math.round(appState.zoomLevel * 100);
            document.getElementById('zoomLevel').textContent = `${displayPercent}%`;
            document.getElementById('zoomLevelDisplay').textContent = `${displayPercent}%`;
            const canvasWrapper = document.getElementById('canvasWrapper');
            canvasWrapper.style.transform = `translate(${appState.canvasTranslateX}px, ${appState.canvasTranslateY}px) scale(${appState.zoomLevel})`;
            setTimeout(() => this.checkScrollHint(), 100);
        },
        resetZoom() {
            const appState = StateManager.getState();
            appState.zoomLevel = 1;
            appState.canvasTranslateX = 0;
            appState.canvasTranslateY = 0;
            document.getElementById('zoomLevel').textContent = '100%';
            document.getElementById('zoomLevelDisplay').textContent = '100%';
            const canvasWrapper = document.getElementById('canvasWrapper');
            canvasWrapper.style.transform = 'translate(0px, 0px) scale(1)';
            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                canvasContainer.scrollLeft = 0;
                canvasContainer.scrollTop = 0;
            }
            setTimeout(() => this.checkScrollHint(), 100);
        },
        checkScrollHint() {
            const canvasContainer = document.querySelector('.canvas-container');
            const canvasWrapper = document.getElementById('canvasWrapper');
            if (!canvasContainer || !canvasWrapper) return;
            const existingHint = document.querySelector('.scroll-hint');
            if (existingHint) { existingHint.remove(); }
            const containerWidth = canvasContainer.clientWidth;
            const containerHeight = canvasContainer.clientHeight;
            const wrapperWidth = canvasWrapper.offsetWidth;
            const wrapperHeight = canvasWrapper.offsetHeight;
            const needsHorizontalScroll = wrapperWidth > containerWidth;
            const needsVerticalScroll = wrapperHeight > containerHeight;
            if (needsHorizontalScroll || needsVerticalScroll) {
                const scrollHint = document.createElement('div');
                scrollHint.className = 'scroll-hint';
                let hintText = '可滚动查看完整图像';
                if (needsHorizontalScroll && needsVerticalScroll) {
                    hintText = '可拖拽滚动查看完整图像';
                } else if (needsHorizontalScroll) { hintText = '可左右滚动查看完整图像'; }
                else if (needsVerticalScroll) { hintText = '可上下滚动查看完整图像'; }
                scrollHint.textContent = hintText;
                canvasContainer.appendChild(scrollHint);
                setTimeout(() => { scrollHint.classList.add('visible'); }, 100);
                setTimeout(() => {
                    scrollHint.classList.remove('visible');
                    setTimeout(() => {
                        if (scrollHint.parentNode) { scrollHint.parentNode.removeChild(scrollHint); }
                    }, 300);
                }, 3000);
            }
        },
        increaseBrushSize() {
            const appState = StateManager.getState();
            if (appState.brushSize < 100) {
                appState.brushSize += 1;
                this.updateBrushSizeUI();
                this.updatePreview();
            }
        },
        decreaseBrushSize() {
            const appState = StateManager.getState();
            if (appState.brushSize > 1) {
                appState.brushSize -= 1;
                this.updateBrushSizeUI();
                this.updatePreview();
            }
        },
        updateBrushSizeUI() {
            const appState = StateManager.getState();
            document.getElementById('brushSize').value = appState.brushSize;
            document.getElementById('currentBrushSize').textContent = `${appState.brushSize}px`;
        }
    };

    // ================ 智能提示词模块 ================
    const SmartPrompt = {
        updatePromptColors() {
            const promptTextarea = document.getElementById('promptOutput');
            const appState = StateManager.getState();
        
            if (appState.labels.length === 0 && !appState.appliedSmartPrompt) {
                const smartPrompt = document.getElementById('smartPromptOutput').value.trim();
                if (smartPrompt) {
                    promptTextarea.value = smartPrompt;
                } else {
                    promptTextarea.value = "空置空间";
                }
                return;
            }
        
            const actualUsedColors = new Set();
            appState.labels.forEach(label => {
                if (label.category !== appState.vanishColorName) {
                    actualUsedColors.add(label.category);
                } else {
                    actualUsedColors.add(appState.vanishColorName);
                }
            });
            appState.usedColors = new Set(actualUsedColors);
        
            let colorPrompt = "";
            let colorDetails = [];
            const seenColors = new Set();
            
            // 收集颜色详情，但不单独收集颜色名称
            appState.usedColors.forEach(colorName => {
                if (colorName === appState.vanishColorName) {
                    const hexColor = rgbToHex(appState.vanishColor[0], appState.vanishColor[1], appState.vanishColor[2]);
                    if (!seenColors.has('vanish')) {
                        colorDetails.push(`将${hexColor}颜色区域的物体清除`);
                        seenColors.add('vanish');
                    }
                } else {
                    const colorInfo = CanvasManager.getColorInfo(colorName);
                    if (colorInfo && !seenColors.has(colorName)) {
                        const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                        // 只添加颜色区域描述，不单独添加颜色名称
                        colorDetails.push(`在${hexColor}颜色区域添加${colorName}`);
                        seenColors.add(colorName);
                    }
                }
            });
        
            if (colorDetails.length > 0) {
                // 直接以"实景照片"开头，后面跟上颜色区域描述
                colorPrompt = "实景照片，" + colorDetails.join('，');
            } else {
                colorPrompt = "实景照片";
            }
        
            let finalPrompt = colorPrompt;
            if (appState.appliedSmartPrompt) {
                const smartPrompt = document.getElementById('smartPromptOutput').value;
                if (smartPrompt) {
                    finalPrompt = colorPrompt + "\n" + smartPrompt;
                }
            }
        
            if (!finalPrompt.trim()) {
                finalPrompt = "空置空间";
            }
        
            // 清理多余的逗号
            finalPrompt = finalPrompt
                .replace(/，，/g, '，')
                .replace(/^，/, '')
                .replace(/，$/, '')
                .trim();
            
            promptTextarea.value = finalPrompt;
        },
        generateSmartPrompt() {
            
            const spaceType = document.getElementById('spaceType').value;
            const designStyle = document.getElementById('designStyle').value;
            const lightingStyle = document.getElementById('lightingStyle').value;
            const additionalPrompt = document.getElementById('additionalPrompt').value.trim();
            const useSpaceType = document.getElementById('spaceTypeCheckbox').checked;
            const useDesignStyle = document.getElementById('designStyleCheckbox').checked;
            const useLightingStyle = document.getElementById('lightingStyleCheckbox').checked;
           // 1. 空间元素（必要元素）
const requiredItems = Array.from(
    document.querySelectorAll('#furnitureOptions .category-section:first-child input:checked')
).map(i => {
    const item = i.value;
    if (item && item.includes("==")) {
        const parts = item.split("==");
        return parts.length >= 2 ? parts[1].trim() : item;
    }
    return item;
}).filter(item => item && item.trim());
const optionalItems = Array.from(
    document.querySelectorAll('#furnitureOptions .category-section:last-child input:checked')
).map(i => {
    const item = i.value;
    if (item && item.includes("==")) {
        const parts = item.split("==");
        return parts.length >= 2 ? parts[1].trim() : item;
    }
    return item;
}).filter(item => item && item.trim());
            const additionalItems = additionalPrompt ? [additionalPrompt] : [];
           // 4. 可选选项（处理 == 格式）
const otherOptionalItems = Array.from(
    document.querySelectorAll('input[name="otherOptional"]:checked')
).map(i => {
    const item = i.value;
    // 检查是否包含 ==
    if (item && item.includes("==")) {
        const parts = item.split("==");
        if (parts.length >= 2) {
            return parts[1].trim();  // 返回 == 后面的部分
        }
    }
    // 如果没有 ==，返回原值
    return item;
}).filter(item => item && item.trim());  // 过滤空值

           // 5. 必选选项（同样处理，以保持一致性）
const otherRequiredItems = Array.from(
    document.querySelectorAll('input[name="otherRequired"]:checked')
).map(i => {
    const item = i.value;
    if (item && item.includes("==")) {
        const parts = item.split("==");
        if (parts.length >= 2) {
            return parts[1].trim();
        }
    }
    return item;
}).filter(item => item && item.trim());
            let prompt = "";
            const allItems = [];
            if (useSpaceType && spaceType) { allItems.push(spaceType); }
            if (useDesignStyle && designStyle) { allItems.push(designStyle); }
            if (useLightingStyle && lightingStyle) { allItems.push(lightingStyle); }
            allItems.push(...requiredItems);
            allItems.push(...optionalItems);
            allItems.push(...additionalItems);
            allItems.push(...otherOptionalItems);
            allItems.push(...otherRequiredItems);
            const filteredItems = [...new Set(allItems.filter(item => item && item.trim()))];
            if (filteredItems.length > 0) { prompt += filteredItems.join('，'); }
            if (prompt.length > 0 && !prompt.endsWith('，')) { prompt += '，'; }
            prompt += "细节丰富";
            prompt = prompt.replace(/，，/g, '，').replace(/^，/, '').replace(/，$/, '');
            document.getElementById('smartPromptOutput').value = prompt;
            const appState = StateManager.getState();
            appState.promptConfig = {
                spaceType: spaceType,
                designStyle: designStyle,
                lightingStyle: lightingStyle,
                requiredItems: requiredItems,
                optionalItems: optionalItems,
                otherRequired: otherRequiredItems,
                otherOptional: otherOptionalItems,
                additionalPrompt: additionalPrompt,
                useSpaceType: useSpaceType,
                useDesignStyle: useDesignStyle,
                useLightingStyle: useLightingStyle
            };
        },
        // 应用智能提示词
        applySmartPrompt() {
            const appState = StateManager.getState();

            const smartPrompt = document.getElementById('smartPromptOutput').value;
            if (!smartPrompt) {
                alert('请先生成提示词');
                return;
            }

            // 保存当前状态到历史
            CanvasManager.saveDrawingState();

            // 保存原始提示词和智能提示词状态
            if (!appState.appliedSmartPrompt) {
                appState.originalPrompt = document.getElementById('promptOutput').value;
                appState.originalSmartPrompt = document.getElementById('smartPromptOutput').value;
                appState.originalPromptConfig = JSON.parse(JSON.stringify(appState.promptConfig));
                appState.appliedSmartPrompt = true;
            }




            // 更新操作状态
            StateManager.updateOperationState('applySmartPrompt');

            // 立即更新UI显示
            this.updatePromptColors();
            CoreFunctions.updateUI();

            alert('提示词已实时应用到导出');
        },
        revertSmartPrompt() {
            const appState = StateManager.getState();

            if (appState.originalPrompt) {
                document.getElementById('promptOutput').value = appState.originalPrompt;
                if (appState.originalSmartPrompt) {
                    document.getElementById('smartPromptOutput').value = appState.originalSmartPrompt;
                }

                if (appState.originalPromptConfig) {
                    appState.promptConfig = appState.originalPromptConfig;
                    document.getElementById('spaceType').value = appState.originalPromptConfig.spaceType;
                    document.getElementById('designStyle').value = appState.originalPromptConfig.designStyle;
                    document.getElementById('lightingStyle').value = appState.originalPromptConfig.lightingStyle;
                    document.getElementById('additionalPrompt').value = appState.originalPromptConfig.additionalPrompt;
                    document.getElementById('spaceTypeCheckbox').checked = appState.originalPromptConfig.useSpaceType;
                    document.getElementById('designStyleCheckbox').checked = appState.originalPromptConfig.useDesignStyle;
                    document.getElementById('lightingStyleCheckbox').checked = appState.originalPromptConfig.useLightingStyle;

                    // 恢复其他要求选项
                    const requiredCheckboxes = document.querySelectorAll('input[name="otherRequired"]');
                    const optionalCheckboxes = document.querySelectorAll('input[name="otherOptional"]');
                    requiredCheckboxes.forEach(checkbox => {
                        checkbox.checked = appState.originalPromptConfig.otherRequired.includes(checkbox.value);
                    });
                    optionalCheckboxes.forEach(checkbox => {
                        checkbox.checked = appState.originalPromptConfig.otherOptional.includes(checkbox.value);
                    });

                    // 恢复家具选项
                    SmartPrompt.updateFurnitureOptions();
                    const checkboxes = document.querySelectorAll('#furnitureOptions input[type="checkbox"]');
                    checkboxes.forEach(checkbox => {
                        // 注意：这里需要获取家具选项的配置
                        const configKey = document.getElementById('configSelector').value;
                        const furnitureConfig = furnitureData[configKey] || {};
                        const spaceData = furnitureConfig[appState.originalPromptConfig.spaceType] || { required: [], optional: [] };
                        const isRequired = spaceData.required.includes(checkbox.value);
                        const isOptional = spaceData.optional.includes(checkbox.value);
                        checkbox.checked = isRequired || isOptional;
                    });
                }

                appState.appliedSmartPrompt = false;

                // 立即更新UI
                CoreFunctions.updateUI();

                alert('已撤回智能提示词，所有设置已恢复');
            } else {
                alert('没有可撤回的提示词');
            }
        },
        copySmartPrompt() {
            const smartPromptText = document.getElementById('smartPromptOutput');
            smartPromptText.select();
            try {
                document.execCommand('copy');
                alert('智能提示词已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动选择并复制文本');
            }
        },
        generatePromptFromCanvasAnalysis() {
            const appState = StateManager.getState();
            if (appState.labels.length === 0) {
                alert('画布上没有标注，请先进行标注');
                return;
            }
            const analysis = this.analyzeCanvasComposition();
            const prompt = this.generateCompositionPrompt(analysis);
            document.getElementById('smartPromptOutput').value = prompt;
            alert('已根据画布标注生成构图描述');
        },
        analyzeCanvasComposition() {
            const appState = StateManager.getState();
            const analysis = { primaryElements: [], secondaryElements: [], backgroundElements: [], spatialRelations: [], overallComposition: '' };
            const elements = this.analyzeElementsByArea();
            elements.forEach((element) => {
                const elementInfo = { name: element.name, area: element.area, position: element.position, dominance: element.dominance };
                if (element.dominance === 'primary') { analysis.primaryElements.push(elementInfo); }
                else if (element.dominance === 'secondary') { analysis.secondaryElements.push(elementInfo); }
                else { analysis.backgroundElements.push(elementInfo); }
            });
            analysis.spatialRelations = this.analyzeSpatialRelations(elements);
            analysis.overallComposition = this.generateOverallComposition(analysis);
            return analysis;
        },
        analyzeElementsByArea() {
            const appState = StateManager.getState();
            const elements = [];
            const elementAreas = {};
            const elementPositions = {};
            appState.labels.forEach(label => {
                const elementName = label.category;
                if (!elementAreas[elementName]) {
                    elementAreas[elementName] = 0;
                    elementPositions[elementName] = { x: 0, y: 0, count: 0 };
                }
                elementAreas[elementName]++;
                elementPositions[elementName].x += label.coordinates.x;
                elementPositions[elementName].y += label.coordinates.y;
                elementPositions[elementName].count++;
            });
            const totalArea = appState.labels.length;
            Object.keys(elementAreas).forEach(elementName => {
                const area = elementAreas[elementName];
                const areaRatio = area / totalArea;
                const avgX = elementPositions[elementName].x / elementPositions[elementName].count;
                const avgY = elementPositions[elementName].y / elementPositions[elementName].count;
                const position = this.describePosition(avgX, avgY);
                let dominance = 'background';
                if (areaRatio > 0.3) { dominance = 'primary'; }
                else if (areaRatio > 0.1) { dominance = 'secondary'; }
                elements.push({ name: elementName, area: area, areaRatio: areaRatio, position: position, dominance: dominance, center: { x: avgX, y: avgY } });
            });
            return elements.sort((a, b) => b.area - a.area);
        },
        describePosition(x, y) {
            const appState = StateManager.getState();
            const canvasWidth = appState.canvasWidth;
            const canvasHeight = appState.canvasHeight;
            const horizontal = x < canvasWidth * 0.33 ? '左侧' : x < canvasWidth * 0.66 ? '中间' : '右侧';
            const vertical = y < canvasHeight * 0.33 ? '上部' : y < canvasHeight * 0.66 ? '中部' : '下部';
            if (x < canvasWidth * 0.1) return '最左侧';
            if (x > canvasWidth * 0.9) return '最右侧';
            if (y < canvasHeight * 0.1) return '顶部';
            if (y > canvasHeight * 0.9) return '底部';
            if (Math.abs(x - canvasWidth / 2) < canvasWidth * 0.1 && Math.abs(y - canvasHeight / 2) < canvasHeight * 0.1) { return '中心位置'; }
            return `${vertical}${horizontal}`;
        },
        analyzeSpatialRelations(elements) {
            const relations = [];
            if (elements.length < 2) return relations;
            const primaryElements = elements.filter(el => el.dominance === 'primary');
            primaryElements.forEach((el1, i) => {
                primaryElements.forEach((el2, j) => {
                    if (i < j) {
                        const relation = this.describeRelation(el1, el2);
                        if (relation) relations.push(relation);
                    }
                });
            });
            return relations;
        },
        describeRelation(el1, el2) {
            const dx = el2.center.x - el1.center.x;
            const dy = el2.center.y - el1.center.y;
            let horizontalRelation = '';
            if (Math.abs(dx) > StateManager.getState().canvasWidth * 0.3) {
                if (dx > 0) { horizontalRelation = `${el1.name}在${el2.name}左侧`; }
                else { horizontalRelation = `${el1.name}在${el2.name}右侧`; }
            }
            let verticalRelation = '';
            if (Math.abs(dy) > StateManager.getState().canvasHeight * 0.3) {
                if (dy > 0) { verticalRelation = `${el1.name}在${el2.name}上方`; }
                else { verticalRelation = `${el1.name}在${el2.name}下方`; }
            }
            if (horizontalRelation && verticalRelation) { return `${horizontalRelation}，${verticalRelation}`; }
            else if (horizontalRelation) { return horizontalRelation; }
            else if (verticalRelation) { return verticalRelation; }
            return null;
        },
        generateOverallComposition(analysis) {
            const primaries = analysis.primaryElements;
            const secondaries = analysis.secondaryElements;
            if (primaries.length === 0) return '构图较为分散，无明显主体';
            let composition = '';
            if (primaries.length === 1) { composition = `${primaries[0].name}为主体，位于${primaries[0].position}`; }
            else { const primaryNames = primaries.map(el => el.name).join('、'); composition = `${primaryNames}为主要元素`; }
            if (secondaries.length > 0) { const secondaryNames = secondaries.map(el => el.name).join('、'); composition += `，辅以${secondaryNames}`; }
            if (analysis.spatialRelations.length > 0) { composition += `，${analysis.spatialRelations.join('，')}`; }
            return composition;
        },
        generateCompositionPrompt(analysis) {
            let prompt = '';
            prompt += `【整体构图】${analysis.overallComposition}。\n\n`;
            if (analysis.primaryElements.length > 0) {
                prompt += `【主要元素】\n`;
                analysis.primaryElements.forEach(element => {
                    prompt += `• ${element.name}：位于${element.position}，占据显著位置\n`;
                });
                prompt += `\n`;
            }
            if (analysis.secondaryElements.length > 0) {
                prompt += `【次要元素】\n`;
                analysis.secondaryElements.forEach(element => { prompt += `• ${element.name}：位于${element.position}\n`; });
                prompt += `\n`;
            }
            if (analysis.backgroundElements.length > 0) {
                prompt += `【背景环境】\n`;
                analysis.backgroundElements.forEach(element => { prompt += `• ${element.name}\n`; });
            }
            prompt += `\n【构图特点】`;
            if (analysis.primaryElements.some(el => el.position.includes('中心'))) { prompt += `中心对称构图，`; }
            if (analysis.primaryElements.length === 1) { prompt += `焦点突出，`; }
            if (analysis.spatialRelations.length > 2) { prompt += `层次丰富，`; }
            prompt += `元素布局合理，视觉平衡良好。`;
            return prompt;
        },

        isStyleWord(word) {
            const styleWords = ["构图协调", "高画质", "专业摄影", "质感真实", "细节丰富", "风格", "现代主义", "后现代", "极简", "工业风", "新中式", "欧式古典", "日式禅意", "生态自然", "未来科技", "现代", "北欧", "法式", "意式轻奢", "复古", "卡通", "动漫", "3D", "素描", "油画", "水彩", "写实", "抽象", "自然采光", "柔和温暖", "明亮清晰", "浪漫氛围", "高级质感", "艺术氛围", "戏剧效果", "温馨舒适", "功能照明", "自然光", "展示灯光", "环境光", "重点照明", "柔和光", "明亮光", "戏剧光", "黄昏光", "夜晚光"];
            return styleWords.includes(word) || word.includes("风格") || word.includes("照明") || word.includes("采光") || word.includes("氛围");
        },

        updatePromptAfterAction() {
            const appState = StateManager.getState();
            if (appState.appliedSmartPrompt) {
                const smartPrompt = document.getElementById('smartPromptOutput').value;
                if (smartPrompt) {
                    const currentPrompt = document.getElementById('promptOutput').value;
                    const lines = currentPrompt.split('\n');
                    if (lines.length > 0 && lines[0].trim() !== "空置空间") {
                        document.getElementById('promptOutput').value = lines[0] + "\n" + smartPrompt;
                    } else { document.getElementById('promptOutput').value = smartPrompt; }
                }
            }
        },
        resetSmartPromptState() {
            const appState = StateManager.getState();
            appState.appliedSmartPrompt = false;
            appState.originalPrompt = "";
            appState.originalSmartPrompt = "";
            appState.originalPromptConfig = null;
        },
        clearPromptAfterUpload() {
            const promptTextarea = document.getElementById('promptOutput');
            const smartPromptTextarea = document.getElementById('smartPromptOutput');
            if (promptTextarea) { promptTextarea.value = "空置空间"; }
            if (smartPromptTextarea) { smartPromptTextarea.value = ""; }
            const appState = StateManager.getState();
            appState.usedColors.clear();
            appState.appliedSmartPrompt = false;
            appState.originalPrompt = "";
            appState.originalSmartPrompt = "";
            appState.originalPromptConfig = null;
            console.log("上传图片后提示词已重置");
        },
        updateFurnitureOptions() {
            const spaceType = document.getElementById('spaceType').value;
    const furnitureOptions = document.getElementById('furnitureOptions');
    if (!furnitureOptions) return;

    // 获取当前配置键值
    const configKey = document.getElementById('configSelector').value;

    // 从 furnitureData 中获取对应配置的数据
    const data = furnitureData[configKey] || {};

    // 获取当前空间类型的数据
    const spaceData = data[spaceType] || { required: [], optional: [] };

    furnitureOptions.innerHTML = '';

    // 必要元素部分
    const requiredSection = document.createElement('div');
    requiredSection.className = 'category-section';

    const requiredTitle = document.createElement('div');
    requiredTitle.className = 'category-section-title';
    requiredTitle.textContent = '必要元素';
    requiredSection.appendChild(requiredTitle);

    const requiredDiv = document.createElement('div');
    requiredDiv.className = 'checkbox-group';

    spaceData.required.forEach(item => {
        const label = document.createElement('label');
        // 处理可能包含 == 分隔符的情况
        let displayValue = item;
        let displayText = item;
        
        if (item && item.includes("==")) {
            const parts = item.split("==");
            if (parts.length >= 2) {
                displayText = parts[0];  // 显示 == 前面的部分
                displayValue = item;     // 完整值
            }
        }
        
        // 如果有特殊格式，显示为蓝色
        if (item && item.includes("==")) {
            label.innerHTML = `<input type="checkbox" checked value="${displayValue}"><span style="color: #cc6600;">${displayText}</span>`;
        } else {
            label.innerHTML = `<input type="checkbox" checked value="${displayValue}">${displayText}`;
        }
        requiredDiv.appendChild(label);
    });

    requiredSection.appendChild(requiredDiv);
    furnitureOptions.appendChild(requiredSection);

    // 可选元素部分
    const optionalSection = document.createElement('div');
    optionalSection.className = 'category-section';

    const optionalTitle = document.createElement('div');
    optionalTitle.className = 'category-section-title';
    optionalTitle.textContent = '可选元素';
    optionalSection.appendChild(optionalTitle);

    const optionalDiv = document.createElement('div');
    optionalDiv.className = 'checkbox-group';

    spaceData.optional.forEach(item => {
        const label = document.createElement('label');
        // 处理可能包含 == 分隔符的情况
        let displayValue = item;
        let displayText = item;
        
        if (item && item.includes("==")) {
            const parts = item.split("==");
            if (parts.length >= 2) {
                displayText = parts[0];  // 显示 == 前面的部分
                displayValue = item;     // 完整值
            }
        }
        
        // 如果有特殊格式，显示为蓝色
        if (item && item.includes("==")) {
            label.innerHTML = `<input type="checkbox" value="${displayValue}"><span style="color: #cc6600;">${displayText}</span>`;
        } else {
            label.innerHTML = `<input type="checkbox" value="${displayValue}">${displayText}`;
        }
        optionalDiv.appendChild(label);
    });

    optionalSection.appendChild(optionalDiv);
    furnitureOptions.appendChild(optionalSection);

            
             // 为所有复选框添加事件监听
    const allCheckboxes = furnitureOptions.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => this.generateSmartPrompt());
            });
        },
        initOtherRequirements() {
            const otherRequirements = document.getElementById('otherRequirements');
            if (!otherRequirements || !otherRequirementsData) return;
            
            otherRequirements.innerHTML = '';
            
            // 必选选项部分
            const requiredSection = document.createElement('div');
            requiredSection.className = 'category-section';
            
            const requiredTitle = document.createElement('div');
            requiredTitle.className = 'category-section-title';
            requiredTitle.textContent = '必选选项';
            requiredTitle.style.color = '#e74c3c';
            requiredSection.appendChild(requiredTitle);
            
            const requiredDiv = document.createElement('div');
            requiredDiv.className = 'checkbox-group';
            
            otherRequirementsData.required.forEach(item => {
                const label = document.createElement('label');
                
                // 检查是否有 == 分隔符
                if (item.includes("==")) {
                    const parts = item.split("==");
                    const displayText = parts[0];
                    // 显示文本用蓝色
                    label.innerHTML = `<input type="checkbox" name="otherRequired" value="${item}" checked><span style="color: #cc6600;">${displayText}</span>`;
                } else {
                    // 没有 ==，正常显示
                    label.innerHTML = `<input type="checkbox" name="otherRequired" value="${item}" checked>${item}`;
                }
                
                requiredDiv.appendChild(label);
            });
            
            requiredSection.appendChild(requiredDiv);
            otherRequirements.appendChild(requiredSection);
            
            // 可选选项部分
            const optionalSection = document.createElement('div');
            optionalSection.className = 'category-section';
            
            const optionalTitle = document.createElement('div');
            optionalTitle.className = 'category-section-title';
            optionalTitle.textContent = '可选选项';
            optionalTitle.style.color = '#e74c3c';
            optionalSection.appendChild(optionalTitle);
            
            const optionalDiv = document.createElement('div');
            optionalDiv.className = 'checkbox-group';
            
            otherRequirementsData.optional.forEach(item => {
                const label = document.createElement('label');
                
                // 检查是否有 == 分隔符
                if (item.includes("==")) {
                    const parts = item.split("==");
                    const displayText = parts[0];
                    // 显示文本用蓝色
                    label.innerHTML = `<input type="checkbox" name="otherOptional" value="${item}"><span style="color: #cc6600;">${displayText}</span>`;
                } else {
                    // 没有 ==，正常显示
                    label.innerHTML = `<input type="checkbox" name="otherOptional" value="${item}">${item}`;
                }
                
                optionalDiv.appendChild(label);
            });
            
            optionalSection.appendChild(optionalDiv);
            otherRequirements.appendChild(optionalSection);
             // 为所有复选框添加事件监听
    const allCheckboxes = otherRequirements.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => this.generateSmartPrompt());
    });
        }
    };

    // ================ 颜色调色板模块 ================
    const ColorPalette = {
        loadConfig(config) {
            if (!config) {
                console.error("配置为空，使用默认配置");
                config = defaultConfigs.interior;
            }

            // 确保配置有必要的数组属性
            if (!config.spaceTypes || !Array.isArray(config.spaceTypes)) {
                // 从 furnitureData 中获取对应配置的空间类型
                const configKey = document.getElementById('configSelector').value;
                if (furnitureData[configKey]) {
                    config.spaceTypes = furnitureData[configKey].spaceTypes || ["通用场景"];
                } else {
                    config.spaceTypes = ["通用场景"];
                }
            }

            if (!config.designStyles || !Array.isArray(config.designStyles)) {
                // 从 furnitureData 中获取对应配置的设计风格
                const configKey = document.getElementById('configSelector').value;
                if (furnitureData[configKey]) {
                    config.designStyles = furnitureData[configKey].designStyles || ["现代主义"];
                } else {
                    config.designStyles = ["现代主义"];
                }
            }

            if (!config.lightingStyles || !Array.isArray(config.lightingStyles)) {
                // 从 furnitureData 中获取对应配置的照明风格
                const configKey = document.getElementById('configSelector').value;
                if (furnitureData[configKey]) {
                    config.lightingStyles = furnitureData[configKey].lightingStyles || ["自然采光"];
                } else {
                    config.lightingStyles = ["自然采光"];
                }
            }

            if (!config.colorCategories || !Array.isArray(config.colorCategories)) {
                config.colorCategories = ["其它"];
            }

            if (!config.colorPalette) {
                config.colorPalette = {};
            }

            AppState.currentConfig = config;
            AppState.currentConfig = config;

            // 确保家具数据存在
            if (!config.furnitureData) {
                const configKey = document.getElementById('configSelector').value;
                config.furnitureData = furnitureData[configKey] || {};
            }

            const appState = StateManager.getState();
            appState.colorCategories = config.colorCategories || ["其它"];

            this.initColorCategories();
            this.initColorPalette();
            this.initPromptGenerator();

            document.getElementById('currentConfigInfo').textContent = `当前配置: ${config.name}`;

            const firstColor = Object.keys(config.colorPalette)[0];
            if (firstColor) {
                appState.currentColor = firstColor;
                CanvasManager.updatePreview();
                CoreFunctions.updateUI();
            }
        },
        initColorCategories() {
            const colorCategorySelect = document.getElementById('colorCategory');
            if (!colorCategorySelect) return;
            colorCategorySelect.innerHTML = '';
            const defaultOption = document.createElement('option');
            defaultOption.value = "";
            defaultOption.textContent = "先选择分类";
            defaultOption.disabled = true;
            defaultOption.selected = true;
            colorCategorySelect.appendChild(defaultOption);
            const appState = StateManager.getState();
            appState.colorCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                colorCategorySelect.appendChild(option);
            });
            colorCategorySelect.addEventListener('change', function () {
                if (this.value) {
                    const categoryElements = document.querySelectorAll('.collapse-category');
                    categoryElements.forEach(collapseCategory => {
                        const content = collapseCategory.querySelector('.collapse-content');
                        const header = collapseCategory.querySelector('.collapse-header');
                        const subCategories = content.querySelectorAll('.color-category-title');
                        let found = false;
                        subCategories.forEach(subCategory => {
                            if (subCategory.textContent.includes(this.value)) { found = true; }
                        });
                        if (found) {
                            header.classList.add('expanded');
                            content.classList.add('expanded');
                            collapseCategory.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        } else {
                            header.classList.remove('expanded');
                            content.classList.remove('expanded');
                        }
                    });
                }
            });
        },
        initPromptGenerator() {
            if (!AppState.currentConfig) {
                console.error("当前配置未定义");
                return;
            }

            // 获取配置键值
            const configKey = document.getElementById('configSelector').value;

            // 从 furnitureData 中获取当前配置的数据
            const furnitureConfig = furnitureData[configKey] || {};

            // 确保数组属性存在
            const spaceTypes = furnitureConfig.spaceTypes || AppState.currentConfig.spaceTypes || ["通用场景"];
            const designStyles = furnitureConfig.designStyles || AppState.currentConfig.designStyles || ["现代主义"];
            const lightingStyles = furnitureConfig.lightingStyles || AppState.currentConfig.lightingStyles || ["自然采光"];

            // 更新空间类型下拉菜单
            const spaceTypeSelect = document.getElementById('spaceType');
            if (spaceTypeSelect) {
                spaceTypeSelect.innerHTML = '';
                spaceTypes.forEach(spaceType => {
                    const option = document.createElement('option');
                    option.value = spaceType;
                    option.textContent = spaceType;
                    spaceTypeSelect.appendChild(option);
                });
            }

            // 更新设计风格下拉菜单
            const designStyleSelect = document.getElementById('designStyle');
            if (designStyleSelect) {
                designStyleSelect.innerHTML = '';
                designStyles.forEach(style => {
                    const option = document.createElement('option');
                    option.value = style;
                    option.textContent = style;
                    designStyleSelect.appendChild(option);
                });
            }

            // 更新照明风格下拉菜单
            const lightingStyleSelect = document.getElementById('lightingStyle');
            if (lightingStyleSelect) {
                lightingStyleSelect.innerHTML = '';
                lightingStyles.forEach(lighting => {
                    const option = document.createElement('option');
                    option.value = lighting;
                    option.textContent = lighting;
                    lightingStyleSelect.appendChild(option);
                });
            }

            SmartPrompt.updateFurnitureOptions();
            SmartPrompt.initOtherRequirements();
            SmartPrompt.generateSmartPrompt();
        },
        initColorPalette() {
            const paletteContainer = document.getElementById('colorPalette');
            if (!paletteContainer || !AppState.currentConfig) {
                if (paletteContainer) {
                    paletteContainer.innerHTML = '<div class="hint-text">配置加载失败，请刷新页面</div>';
                }
                return;
            }
            paletteContainer.innerHTML = '';
            if (AppState.currentConfig.mainCategories) {
                Object.keys(AppState.currentConfig.mainCategories).forEach(mainCategory => {
                    const subCategories = AppState.currentConfig.mainCategories[mainCategory];
                    const collapseCategory = document.createElement('div');
                    collapseCategory.className = 'collapse-category';
                    const collapseHeader = document.createElement('div');
                    collapseHeader.className = 'collapse-header';
                    collapseHeader.innerHTML = `${mainCategory}<i class="fas fa-chevron-down"></i>`;
                    const collapseContent = document.createElement('div');
                    collapseContent.className = 'collapse-content';
                    let hasColorsInCategory = false;
                    subCategories.forEach(subCategory => {
                        const colorsInCategory = [];
                        Object.keys(AppState.currentConfig.colorPalette).forEach(colorName => {
                            const colorInfo = AppState.currentConfig.colorPalette[colorName];
                            if (colorInfo.category === subCategory) {
                                colorsInCategory.push({ name: colorName, info: colorInfo, isCustom: false });
                            }
                        });
                        Object.keys(AppState.customColors).forEach(colorName => {
                            const colorInfo = AppState.customColors[colorName];
                            if (colorInfo.category === subCategory) {
                                colorsInCategory.push({ name: colorName, info: colorInfo, isCustom: true });
                            }
                        });
                        if (colorsInCategory.length > 0) {
                            hasColorsInCategory = true;
                            const subCategoryDiv = document.createElement('div');
                            subCategoryDiv.className = 'color-category';
                            const subCategoryTitle = document.createElement('div');
                            subCategoryTitle.className = 'color-category-title';
                            const defaultCount = colorsInCategory.filter(c => !c.isCustom).length;
                            const customCount = colorsInCategory.filter(c => c.isCustom).length;
                            let countText = '';
                            if (defaultCount > 0 && customCount > 0) { countText = ` (默认:${defaultCount}, 自定义:${customCount})`; }
                            else if (customCount > 0) { countText = ` (自定义:${customCount})`; }
                            subCategoryTitle.textContent = subCategory + countText;
                            subCategoryDiv.appendChild(subCategoryTitle);
                            const colorGrid = document.createElement('div');
                            colorGrid.className = 'color-palette';
                            colorsInCategory.forEach(item => {
                                const colorName = item.name;
                                const colorInfo = item.info;
                                const isCustom = item.isCustom;
                                const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                                const colorItem = document.createElement('div');
                                colorItem.className = 'color-item';
                                if (isCustom) { colorItem.style.borderLeft = '3px solid #3498db'; }
                                const appState = StateManager.getState();
                                if (colorName === appState.currentColor) { colorItem.classList.add('active'); }
                                const categoryClass = getCategoryClass(subCategory);
                                colorItem.innerHTML = `
                                    <div class="color-preview" style="background-color: ${hexColor};"></div>
                                    <div class="color-info">
                                        <div class="color-name">
                                            ${colorName} 
                                            ${isCustom ? '<span style="color:#3498db; font-size:0.6em;">(自定义)</span>' : ''}
                                            <span class="category-tag ${categoryClass}">${subCategory}</span>
                                        </div>
                                        <div class="color-hex">${hexColor}</div>
                                    </div>
                                `;
                                colorItem.addEventListener('click', () => {
                                    document.querySelectorAll('.color-item').forEach(item => { item.classList.remove('active'); });
                                    colorItem.classList.add('active');
                                    const appState = StateManager.getState();
                                    appState.currentColor = colorName;
                                    CanvasManager.updatePreview();
                                    CoreFunctions.updateUI();
                                });
                                colorGrid.appendChild(colorItem);
                            });
                            subCategoryDiv.appendChild(colorGrid);
                            collapseContent.appendChild(subCategoryDiv);
                        }
                    });
                    if (hasColorsInCategory) {
                        collapseCategory.appendChild(collapseHeader);
                        collapseCategory.appendChild(collapseContent);
                        paletteContainer.appendChild(collapseCategory);
                        collapseHeader.addEventListener('click', function () {
                            this.classList.toggle('expanded');
                            collapseContent.classList.toggle('expanded');
                        });
                        if (mainCategory === Object.keys(AppState.currentConfig.mainCategories)[0]) {
                            collapseHeader.classList.add('expanded');
                            collapseContent.classList.add('expanded');
                        }
                    }
                });
            }
            const uncategorizedCustomColors = Object.keys(AppState.customColors).filter(colorName => {
                const colorInfo = AppState.customColors[colorName];
                return !AppState.currentConfig.mainCategories || !Object.values(AppState.currentConfig.mainCategories).flat().includes(colorInfo.category);
            });
            if (uncategorizedCustomColors.length > 0) {
                const customCategory = document.createElement('div');
                customCategory.className = 'collapse-category';
                const customHeader = document.createElement('div');
                customHeader.className = 'collapse-header';
                customHeader.innerHTML = `自定义颜色<i class="fas fa-chevron-down"></i>`;
                const customContent = document.createElement('div');
                customContent.className = 'collapse-content';
                const customGrid = document.createElement('div');
                customGrid.className = 'color-palette';
                uncategorizedCustomColors.forEach(colorName => {
                    const colorInfo = AppState.customColors[colorName];
                    const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                    const colorItem = document.createElement('div');
                    colorItem.className = 'color-item';
                    colorItem.style.borderLeft = '3px solid #3498db';
                    const appState = StateManager.getState();
                    if (colorName === appState.currentColor) { colorItem.classList.add('active'); }
                    colorItem.innerHTML = `
                        <div class="color-preview" style="background-color: ${hexColor};"></div>
                        <div class="color-info">
                            <div class="color-name">
                                ${colorName} 
                                <span style="color:#3498db; font-size:0.6em;">(自定义)</span>
                            </div>
                            <div class="color-hex">${hexColor}</div>
                        </div>
                    `;
                    colorItem.addEventListener('click', () => {
                        document.querySelectorAll('.color-item').forEach(item => { item.classList.remove('active'); });
                        colorItem.classList.add('active');
                        const appState = StateManager.getState();
                        appState.currentColor = colorName;
                        CanvasManager.updatePreview();
                        CoreFunctions.updateUI();
                    });
                    customGrid.appendChild(colorItem);
                });
                customContent.appendChild(customGrid);
                customCategory.appendChild(customHeader);
                customCategory.appendChild(customContent);
                paletteContainer.appendChild(customCategory);
                customHeader.addEventListener('click', function () {
                    this.classList.toggle('expanded');
                    customContent.classList.toggle('expanded');
                });
            }
        },
        addCustomColor() {
            const namesInput = document.getElementById('customColorNames');
            const colorNames = namesInput.value.trim();
            const colorCategory = document.getElementById('colorCategory').value;
            if (!colorNames) { alert('请输入颜色名称'); return; }
            if (AppState.currentConfig.colorPalette[colorNames] || AppState.customColors[colorNames]) {
                alert(`颜色名称 "${colorNames}" 已存在`); return;
            }
            let finalCategory = colorCategory;
            const randomColor = generateRandomColor();
            const maxId = Math.max(...Object.values(AppState.currentConfig.colorPalette).map(c => c.id), ...Object.values(AppState.customColors).map(c => c.id));
            const newId = maxId + 1;
            AppState.customColors[colorNames] = { color: randomColor, id: newId, category: finalCategory };
            AppState.globalColorMap[colorNames] = AppState.customColors[colorNames];
            namesInput.value = '';
            this.initColorPalette();
            const appState = StateManager.getState();
            appState.currentColor = colorNames;
            CanvasManager.updatePreview();
            CoreFunctions.updateUI();
            alert('颜色已添加');
        },
        searchColors() {
            const searchTerm = document.getElementById('colorSearch').value.trim().toLowerCase();
            if (!searchTerm) { this.initColorPalette(); return; }
            const paletteContainer = document.getElementById('colorPalette');
            if (!paletteContainer) return;
            paletteContainer.innerHTML = '';
            const allColors = { ...AppState.currentConfig.colorPalette, ...AppState.customColors };
            const filteredColors = {};
            Object.keys(allColors).forEach(colorName => {
                if (colorName.toLowerCase().includes(searchTerm)) { filteredColors[colorName] = allColors[colorName]; }
            });
            if (Object.keys(filteredColors).length === 0) {
                paletteContainer.innerHTML = '<div class="hint-text">未找到匹配的颜色</div>';
                return;
            }
            const categories = {};
            Object.keys(filteredColors).forEach(colorName => {
                const colorInfo = filteredColors[colorName];
                const category = colorInfo.category;
                if (!categories[category]) { categories[category] = []; }
                categories[category].push({ name: colorName, info: colorInfo });
            });
            Object.keys(categories).forEach(category => {
                const colorsInCategory = categories[category];
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'color-category';
                const categoryTitle = document.createElement('div');
                categoryTitle.className = 'color-category-title';
                categoryTitle.textContent = category;
                categoryDiv.appendChild(categoryTitle);
                const colorGrid = document.createElement('div');
                colorGrid.className = 'color-palette';
                colorsInCategory.forEach(item => {
                    const colorName = item.name;
                    const colorInfo = item.info;
                    const hexColor = rgbToHex(colorInfo.color[0], colorInfo.color[1], colorInfo.color[2]);
                    const colorItem = document.createElement('div');
                    colorItem.className = 'color-item';
                    const appState = StateManager.getState();
                    if (colorName === appState.currentColor) { colorItem.classList.add('active'); }
                    const categoryClass = getCategoryClass(category);
                    colorItem.innerHTML = `
                        <div class="color-preview" style="background-color: ${hexColor};"></div>
                        <div class="color-info">
                            <div class="color-name">${colorName} <span class="category-tag ${categoryClass}">${category}</span></div>
                            <div class="color-hex">${hexColor}</div>
                        </div>
                    `;
                    colorItem.addEventListener('click', () => {
                        document.querySelectorAll('.color-item').forEach(item => { item.classList.remove('active'); });
                        colorItem.classList.add('active');
                        const appState = StateManager.getState();
                        appState.currentColor = colorName;
                        CanvasManager.updatePreview();
                        CoreFunctions.updateUI();
                    });
                    colorGrid.appendChild(colorItem);
                });
                categoryDiv.appendChild(colorGrid);
                paletteContainer.appendChild(categoryDiv);
            });
        }
    };

    // ================ 核心功能模块 ================
    const CoreFunctions = {
        initApp() {
            console.log("开始初始化应用...");
            try {
                this.checkRequiredElements();
                StateManager.initState();
                const appState = StateManager.getState();
                appState.backgroundCanvas = document.getElementById('backgroundCanvas');
                appState.drawingCanvas = document.getElementById('drawingCanvas');
                appState.previewCanvas = document.getElementById('previewCanvas');
                appState.backgroundCtx = appState.backgroundCanvas.getContext('2d', { willReadFrequently: true });
                appState.drawingCtx = appState.drawingCanvas.getContext('2d', { willReadFrequently: true });
                appState.previewCtx = appState.previewCanvas.getContext('2d', { willReadFrequently: true });
                if (!appState.backgroundCtx || !appState.drawingCtx || !appState.previewCtx) {
                    throw new Error("无法获取Canvas上下文");
                }
                console.log("Canvas上下文获取成功");
                this.loadDefaultConfig();
                CanvasManager.initCanvas();
                EventHandlers.setupEventListeners();
                this.updateUI();
                CanvasManager.updatePreview();
                CanvasManager.saveDrawingState();
                console.log("应用初始化完成");
            } catch (error) {
                console.error("初始化失败:", error);
                alert("初始化失败: " + error.message);
            }
        },
        checkRequiredElements() {
            const requiredElements = ['backgroundCanvas', 'drawingCanvas', 'previewCanvas', 'configSelector', 'currentConfigInfo', 'promptOutput'];
            const missingElements = [];
            requiredElements.forEach(id => { if (!document.getElementById(id)) { missingElements.push(id); } });
            if (missingElements.length > 0) { throw new Error(`缺少必需的元素: ${missingElements.join(', ')}`); }
        },
        loadDefaultConfig() {
            const savedConfig = localStorage.getItem('defaultConfig');
            let useDefault = false;

            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    // 检查配置是否包含必要的属性
                    if (config && config.colorPalette) {
                        ColorPalette.loadConfig(config);
                        const configSelector = document.getElementById('configSelector');
                        if (configSelector && config.id) {
                            configSelector.value = config.id;
                        }
                    } else {
                        console.error("配置格式不正确，缺少必要属性");
                        useDefault = true;
                    }
                } catch (e) {
                    console.error("加载默认配置失败:", e);
                    useDefault = true;
                }
            } else {
                useDefault = true;
            }

            if (useDefault) {
                ColorPalette.loadConfig(defaultConfigs.interior);
            }
        },
        updateUI() {
            const appState = StateManager.getState();
            document.getElementById('labelCount').textContent = appState.labels.length;
            document.getElementById('currentBrushSize').textContent = `${appState.brushSize}px`;
            document.getElementById('canvasSize').textContent = `${appState.canvasWidth}x${appState.canvasHeight}`;
            let toolName = '画笔';
            if (appState.operationMode === 'erase') toolName = '橡皮';
            if (appState.operationMode === 'pipette') toolName = '吸管';
            if (appState.operationMode === 'lasso') toolName = '套索';
            if (appState.operationMode === 'vanish') toolName = '消除';
            document.getElementById('currentTool').textContent = toolName;
        },
        undoLastAction() {
            const appState = StateManager.getState();
            if (appState.drawingHistory.length > 0) {
                const lastState = appState.drawingHistory.pop();
                StateManager.restoreDrawingState(lastState);
                StateManager.updateOperationState('undo');
                this.updateUI();
                if (appState.appliedSmartPrompt) { SmartPrompt.updatePromptAfterAction(); }
            }
        },
        clearDrawingLayer() {
            const appState = StateManager.getState();
            if (confirm('确定要清空所有标注吗？')) {
                appState.drawingCtx.clearRect(0, 0, appState.drawingCanvas.width, appState.drawingCanvas.height);
                appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
                StateManager.clearAllState();
                document.getElementById('promptOutput').value = "空置空间";
                SmartPrompt.resetSmartPromptState();
                CanvasManager.saveDrawingState();
                this.updateUI();
            }
        },
        // 模糊化提示词（只保留颜色名称）
        blurPrompt() {
            const promptTextarea = document.getElementById('promptOutput');
            let prompt = promptTextarea.value;

            // 检查是否包含颜色区域描述
            const hasColorArea = /在#[a-fA-F0-9]{6}颜色区域添加/.test(prompt) ||
                /将#[a-fA-F0-9]{6}颜色区域的物体清除/.test(prompt);

            if (!hasColorArea) {
                alert('当前提示词中没有需要模糊化的颜色区域描述');
                return;
            }

            // 第一步：提取所有颜色名称
            const colorNames = new Set();

            // 从 "在#xxxxxx颜色区域添加颜色名称" 格式中提取颜色名称
            const colorNameMatches = prompt.match(/在#[a-fA-F0-9]{6}颜色区域添加([^，,\n]+)/g);
            if (colorNameMatches) {
                colorNameMatches.forEach(match => {
                    const colorName = match.replace(/在#[a-fA-F0-9]{6}颜色区域添加/, '').trim();
                    if (colorName && colorName !== "物体清除") {
                        colorNames.add(colorName);
                    }
                });
            }

            // 第二步：删除所有颜色代码和位置描述，但保留颜色名称
            // 删除 "在#xxxxxx颜色区域添加xxx" 格式
            prompt = prompt.replace(/在#[a-fA-F0-9]{6}颜色区域添加[^，,\n]+/g, '');
            // 删除 "将#xxxxxx颜色区域的物体清除" 格式
            prompt = prompt.replace(/将#[a-fA-F0-9]{6}颜色区域的物体清除/g, '');

            // 第三步：清理多余的逗号和空格
            prompt = prompt.replace(/，，/g, '，')
                .replace(/，\s*，/g, '，')
                .replace(/^\s*，/, '')
                .replace(/，\s*$/, '')
                .trim();

            // 第四步：分离基础提示词和颜色名称部分
            const basePrompts = ["实景照片", "空置空间"];
            let basePrompt = "";
            let existingColorNames = [];

            // 提取基础提示词
            const promptParts = prompt.split('，');
            promptParts.forEach(part => {
                const trimmedPart = part.trim();
                if (trimmedPart) {
                    if (basePrompts.some(base => trimmedPart.includes(base))) {
                        basePrompt += (basePrompt ? '，' : '') + trimmedPart;
                    } else {
                        existingColorNames.push(trimmedPart);
                    }
                }
            });

            // 如果没有基础提示词，添加默认的
            if (!basePrompt) {
                basePrompt = "实景照片";
            }

            // 第五步：合并所有颜色名称（已存在的 + 新提取的）
            existingColorNames.forEach(name => colorNames.add(name));

            // 将颜色名称转换为数组并过滤掉空值
            const allColorNames = Array.from(colorNames).filter(name => name && name.trim());

            // 第六步：构建最终的提示词
            let finalPrompt = basePrompt;

            if (allColorNames.length > 0) {
                finalPrompt += '，' + allColorNames.join('，');
            }

            // 最后清理一次多余的逗号
            finalPrompt = finalPrompt.replace(/，，/g, '，')
                .replace(/^\s*，/, '')
                .replace(/，\s*$/, '')
                .trim();

            // 如果没有内容，恢复为默认
            if (!finalPrompt) {
                finalPrompt = "空置空间";
            }

            promptTextarea.value = finalPrompt;

            alert('提示词已模糊化，只保留颜色名称');
        },
        exportImage() {
            const appState = StateManager.getState();
            const exportType = document.querySelector('input[name="exportType"]:checked').value;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = appState.drawingCanvas.width;
            tempCanvas.height = appState.drawingCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (exportType === 'combined') {
                if (appState.backgroundVisible) {
                    tempCtx.drawImage(appState.backgroundCanvas, 0, 0);
                } else {
                    tempCtx.fillStyle = 'white';
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                }
                tempCtx.drawImage(appState.drawingCanvas, 0, 0);
            } else {
                tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(appState.drawingCanvas, 0, 0);
            }
            const link = document.createElement('a');
            link.href = tempCanvas.toDataURL('image/png');
            link.download = `semantic_labels_${exportType}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
            link.click();
        },
        copyPrompt() {
            const promptText = document.getElementById('promptOutput');
            promptText.select();
            try {
                document.execCommand('copy');
                alert('提示词已复制到剪贴板');
            } catch (err) {
                console.error('复制失败:', err);
                alert('复制失败，请手动选择并复制文本');
            }
        },
      
        resizeCanvas() {
            const width = parseInt(document.getElementById('canvasWidth').value) || 800;
            let height = parseInt(document.getElementById('canvasHeight').value) || 600;
            if (height > 1024) { height = 1024; document.getElementById('canvasHeight').value = 1024; alert('画布高度已限制为最大值1200像素'); }
            if (width < 100 || width > 2000 || height < 100 || height > 1024) { alert('画布尺寸必须在100x100到2000x1200之间'); return; }
            const appState = StateManager.getState();
            appState.canvasWidth = width;
            appState.canvasHeight = height;
            CanvasManager.resizeCanvasContent(width, height);
            document.getElementById('canvasSize').textContent = `${width}x${height}`;
            this.updateUI();
        },
        handleImageUpload(e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (event) {
                const img = new Image();
                img.onload = function () {
                    let newWidth = img.width;
                    let newHeight = img.height;
                    const maxLongSide = 1024;
                    const longSide = Math.max(img.width, img.height);
                    if (longSide > maxLongSide) {
                        const scale = maxLongSide / longSide;
                        newWidth = Math.round(img.width * scale);
                        newHeight = Math.round(img.height * scale);
                    }
                    const scaledCanvas = document.createElement('canvas');
                    scaledCanvas.width = newWidth;
                    scaledCanvas.height = newHeight;
                    const scaledCtx = scaledCanvas.getContext('2d');
                    scaledCtx.drawImage(img, 0, 0, newWidth, newHeight);
                    const scaledImg = new Image();
                    scaledImg.onload = function () {
                        const appState = StateManager.getState();
                        appState.originalImage = scaledImg;
                        CanvasManager.drawImageOnCanvas(scaledImg);
                        SmartPrompt.clearPromptAfterUpload();
                        document.getElementById('canvasWidth').value = newWidth;
                        document.getElementById('canvasHeight').value = newHeight;
                        document.getElementById('canvasSize').textContent = `${newWidth}x${newHeight}`;
                        CoreFunctions.updateUI();
                    };
                    scaledImg.src = scaledCanvas.toDataURL('image/png');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    // ================ 事件处理模块 ================
    const EventHandlers = {
        setupEventListeners() {
            this.setupConfigEventListeners();
            this.setupCanvasEventListeners();
            this.setupKeyboardEventListeners();
            this.setupTabEventListeners();
            this.setupColorEventListeners();
            this.setupPromptEventListeners();
            this.setupToolEventListeners();
            this.setupOtherEventListeners();
        },
        // 在 setupConfigEventListeners 函数中添加：
        setupConfigEventListeners() {
            document.getElementById('configSelector').addEventListener('change', function () {
                const configId = this.value;
                if (defaultConfigs[configId]) {
                    ColorPalette.loadConfig(defaultConfigs[configId]);
                }
            });

            // 添加这行代码
            document.getElementById('setDefaultConfigButton').addEventListener('click', function () {
                if (AppState.currentConfig) {
                    const configToSave = {
                        ...AppState.currentConfig,
                        id: document.getElementById('configSelector').value
                    };
                    localStorage.setItem('defaultConfig', JSON.stringify(configToSave));
                    alert('已设置为默认配置');
                }
            });
        },
        setupCanvasEventListeners() {
            const appState = StateManager.getState();
            const drawingCanvas = appState.drawingCanvas;
            const previewCanvas = appState.previewCanvas;
            if (!drawingCanvas || !previewCanvas) return;
            const canvasContainer = document.querySelector('.canvas-container');
            if (canvasContainer) {
                canvasContainer.addEventListener('scroll', () => {
                    const scrollHint = document.querySelector('.scroll-hint');
                    if (scrollHint) {
                        scrollHint.classList.remove('visible');
                        setTimeout(() => {
                            if (scrollHint.parentNode) { scrollHint.parentNode.removeChild(scrollHint); }
                        }, 300);
                    }
                });
            }
            drawingCanvas.addEventListener('mousemove', (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                document.getElementById('cursorCoordinates').textContent = `(${Math.round(x)}, ${Math.round(y)})`;
                const appState = StateManager.getState();
                appState.lastX = x;
                appState.lastY = y;
                if (appState.isDrawing) {
                    if (appState.isShiftPressed && appState.lineStartPoint) {
                        CanvasManager.drawLinePreview(appState.lineStartPoint.x, appState.lineStartPoint.y, x, y);
                    } else { CanvasManager.drawOnCanvas(x, y); }
                } else if (appState.isShiftPressed && appState.lineStartPoint) {
                    CanvasManager.drawLinePreview(appState.lineStartPoint.x, appState.lineStartPoint.y, x, y);
                } else if (appState.isLassoActive) { CanvasManager.drawLassoPreview(); }
            });
            drawingCanvas.addEventListener('mousedown', (e) => {
                const { x, y } = this.getCanvasCoordinates(e);
                const appState = StateManager.getState();
                appState.lastX = x;
                appState.lastY = y;
                if (appState.operationMode === 'pipette') {
                    CanvasManager.pickColorFromCanvas(x, y);
                    return;
                }
                if (appState.operationMode === 'lasso') {
                    if (!appState.isLassoActive) { CanvasManager.startLasso(x, y); }
                    else { CanvasManager.addLassoPoint(x, y); }
                } else {
                    appState.isDrawing = true;
                    appState.lastX = x;
                    appState.lastY = y;
                    appState.lastOperationLabels = [];
                    if (appState.isShiftPressed) { appState.lineStartPoint = { x, y }; }
                    else { CanvasManager.drawOnCanvas(x, y, true); }
                }
            });
            drawingCanvas.addEventListener('dblclick', (e) => {
                const appState = StateManager.getState();
                if (appState.operationMode === 'lasso' && appState.isLassoActive) {
                    e.preventDefault();
                    CanvasManager.completeLasso();
                }
            });
            drawingCanvas.addEventListener('mouseup', (e) => {
                const appState = StateManager.getState();
                if (appState.isDrawing) {
                    const { x, y } = this.getCanvasCoordinates(e);
                    if (appState.isShiftPressed && appState.lineStartPoint) {
                        CanvasManager.drawLineOnCanvas(appState.lineStartPoint.x, appState.lineStartPoint.y, x, y);
                        appState.lineStartPoint = null;
                        appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
                    }
                    appState.isDrawing = false;
                    CanvasManager.saveDrawingState();
                }
            });
            drawingCanvas.addEventListener('mouseleave', () => {
                const appState = StateManager.getState();
                if (appState.isDrawing) {
                    appState.isDrawing = false;
                    CanvasManager.saveDrawingState();
                }
                appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
            });
            drawingCanvas.addEventListener('wheel', (e) => {
                if (e.altKey) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.1 : 0.1;
                    CanvasManager.adjustZoom(delta);
                }
            });
            let isDragging = false;
            let lastDragX = 0;
            let lastDragY = 0;
            drawingCanvas.addEventListener('mousedown', (e) => {
                if (e.altKey || e.button === 1) {
                    e.preventDefault();
                    isDragging = true;
                    lastDragX = e.clientX;
                    lastDragY = e.clientY;
                    drawingCanvas.style.cursor = 'grabbing';
                }
            });
            drawingCanvas.addEventListener('mousemove', (e) => {
                if (isDragging) {
                    const deltaX = e.clientX - lastDragX;
                    const deltaY = e.clientY - lastDragY;
                    lastDragX = e.clientX;
                    lastDragY = e.clientY;
                    const canvasWrapper = document.getElementById('canvasWrapper');
                    const appState = StateManager.getState();
                    appState.canvasTranslateX += deltaX;
                    appState.canvasTranslateY += deltaY;
                    canvasWrapper.style.transform = `translate(${appState.canvasTranslateX}px, ${appState.canvasTranslateY}px) scale(${appState.zoomLevel})`;
                }
            });
            drawingCanvas.addEventListener('mouseup', (e) => {
                if (isDragging) {
                    isDragging = false;
                    this.updateCanvasCursor();
                }
            });
            drawingCanvas.addEventListener('mouseleave', (e) => {
                if (isDragging) {
                    isDragging = false;
                    this.updateCanvasCursor();
                }
            });
        },
        setupKeyboardEventListeners() {
            window.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') { e.preventDefault(); this.toggleRightPanel(); }
                if (e.key === 'i' || e.key === 'I') { e.preventDefault(); CanvasManager.setOperationMode('pipette'); }
                else if (e.key === 'b' || e.key === 'B') { e.preventDefault(); CanvasManager.setOperationMode('paint'); }
                else if (e.key === 'e' || e.key === 'E') { e.preventDefault(); CanvasManager.setOperationMode('erase'); }
                else if (e.key === 'o' || e.key === 'O') { e.preventDefault(); CanvasManager.setOperationMode('lasso'); }
                else if (e.key === 'x' || e.key === 'X') { e.preventDefault(); CanvasManager.setOperationMode('vanish'); }
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); CoreFunctions.undoLastAction(); }
                if (e.key === 'Shift') {
                    const appState = StateManager.getState();
                    appState.isShiftPressed = true;
                    if (appState.isDrawing && !appState.lineStartPoint) {
                        appState.lineStartPoint = { x: appState.lastX, y: appState.lastY };
                    }
                }
                if (e.key === 'Alt') {
                    const appState = StateManager.getState();
                    appState.isAltPressed = true;
                    this.updateCanvasCursor();
                }
                if (e.key === '=' || e.key === 'ArrowUp') { e.preventDefault(); CanvasManager.increaseBrushSize(); }
                else if (e.key === '-' || e.key === 'ArrowDown') { e.preventDefault(); CanvasManager.decreaseBrushSize(); }
                if (e.key === '[') { e.preventDefault(); CanvasManager.decreaseBrushSize(); }
                else if (e.key === ']') { e.preventDefault(); CanvasManager.increaseBrushSize(); }
                const appState = StateManager.getState();
                if (appState.operationMode === 'lasso') {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (appState.isLassoActive) { CanvasManager.completeLasso(); }
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        if (appState.isLassoActive) { CanvasManager.cancelLasso(); }
                    }
                }
                if (e.altKey && (e.key === '2' || e.key === '2')) { e.preventDefault(); this.toggleRightTabs(); }
                if (e.altKey && (e.key === '1' || e.key === '1')) { e.preventDefault(); this.toggleLeftTabs(); }
            });
            window.addEventListener('keyup', (e) => {
                if (e.key === 'Shift') {
                    const appState = StateManager.getState();
                    appState.isShiftPressed = false;
                    appState.lineStartPoint = null;
                    appState.previewCtx.clearRect(0, 0, appState.previewCanvas.width, appState.previewCanvas.height);
                }
                if (e.key === 'Alt') {
                    const appState = StateManager.getState();
                    appState.isAltPressed = false;
                    this.updateCanvasCursor();
                }
            });
        },
        setupTabEventListeners() {
            document.querySelectorAll('.tab-button-left').forEach(button => {
                button.addEventListener('click', function () {
                    const tabId = this.getAttribute('data-tab');
                    document.querySelectorAll('.tab-button-left').forEach(btn => { btn.classList.remove('active'); });
                    this.classList.add('active');
                    document.querySelectorAll('.tab-content-left').forEach(content => { content.classList.remove('active'); });
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', function () {
                    const tabId = this.getAttribute('data-tab');
                    document.querySelectorAll('.tab-button').forEach(btn => { btn.classList.remove('active'); });
                    button.classList.add('active');
                    document.querySelectorAll('.tab-content').forEach(content => { content.classList.remove('active'); });
                    document.getElementById(`${tabId}-tab`).classList.add('active');
                });
            });
        },
        setupColorEventListeners() {
            document.getElementById('searchButton').addEventListener('click', () => ColorPalette.searchColors());
            document.getElementById('colorSearch').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') { ColorPalette.searchColors(); }
            });
            document.getElementById('addCustomColor').addEventListener('click', () => ColorPalette.addCustomColor());
        },
        setupPromptEventListeners() {
            document.getElementById('spaceType').addEventListener('change', () => {
                SmartPrompt.updateFurnitureOptions();
                SmartPrompt.generateSmartPrompt();
            });
            document.getElementById('designStyle').addEventListener('change', () => { SmartPrompt.generateSmartPrompt(); });
            document.getElementById('lightingStyle').addEventListener('change', () => { SmartPrompt.generateSmartPrompt(); });
            document.getElementById('additionalPrompt').addEventListener('input', () => SmartPrompt.generateSmartPrompt());
            document.getElementById('spaceTypeCheckbox').addEventListener('change', () => SmartPrompt.generateSmartPrompt());
            document.getElementById('designStyleCheckbox').addEventListener('change', () => SmartPrompt.generateSmartPrompt());
            document.getElementById('lightingStyleCheckbox').addEventListener('change', () => SmartPrompt.generateSmartPrompt());
            document.getElementById('applySmartPrompt').addEventListener('click', () => SmartPrompt.applySmartPrompt());
            document.getElementById('revertSmartPrompt').addEventListener('click', () => SmartPrompt.revertSmartPrompt());
            document.getElementById('copySmartPrompt').addEventListener('click', () => SmartPrompt.copySmartPrompt());
            const generatePromptBtn = document.getElementById('generatePromptFromCanvas');
            if (generatePromptBtn) {
                generatePromptBtn.addEventListener('click', () => SmartPrompt.generatePromptFromCanvasAnalysis());
            }
            document.querySelectorAll('input[name="otherRequired"], input[name="otherOptional"]').forEach(checkbox => {
                checkbox.addEventListener('change', () => SmartPrompt.generateSmartPrompt());
            });
        },
        setupToolEventListeners() {
            document.getElementById('pipetteMode').addEventListener('click', () => CanvasManager.setOperationMode('pipette'));
            document.getElementById('paintMode').addEventListener('click', () => CanvasManager.setOperationMode('paint'));
            document.getElementById('eraseMode').addEventListener('click', () => CanvasManager.setOperationMode('erase'));
            document.getElementById('lassoMode').addEventListener('click', () => CanvasManager.setOperationMode('lasso'));
            document.getElementById('vanishMode').addEventListener('click', () => CanvasManager.setOperationMode('vanish'));
            document.getElementById('undoButton').addEventListener('click', () => CoreFunctions.undoLastAction());
            document.getElementById('brushSize').addEventListener('input', (e) => {
                const appState = StateManager.getState();
                appState.brushSize = parseInt(e.target.value);
                CanvasManager.updatePreview();
                CoreFunctions.updateUI();
            });
            document.getElementById('resizeCanvas').addEventListener('click', () => CoreFunctions.resizeCanvas());
            document.getElementById('imageUpload').addEventListener('change', (e) => CoreFunctions.handleImageUpload(e));
            document.getElementById('zoomIn').addEventListener('click', () => CanvasManager.adjustZoom(0.1));
            document.getElementById('zoomOut').addEventListener('click', () => CanvasManager.adjustZoom(-0.1));
            document.getElementById('resetZoom').addEventListener('click', () => CanvasManager.resetZoom());
            document.getElementById('toggleBackground').addEventListener('click', () => CanvasManager.toggleBackground());
            document.getElementById('toggleBackground1').addEventListener('click', () => CanvasManager.toggleBackground());
            document.getElementById('clearDrawing').addEventListener('click', () => CoreFunctions.clearDrawingLayer());
            document.getElementById('clearDrawing1').addEventListener('click', () => CoreFunctions.clearDrawingLayer());
        },
        setupOtherEventListeners() {
            document.getElementById('toggleRightPanel').addEventListener('click', () => this.toggleRightPanel());
            document.getElementById('canvasToggleRightPanel').addEventListener('click', () => this.toggleRightPanel());
            document.getElementById('copyPrompt').addEventListener('click', () => CoreFunctions.copyPrompt());
            document.getElementById('exportImage').addEventListener('click', () => CoreFunctions.exportImage());
            document.getElementById('blurPrompt').addEventListener('click', () => CoreFunctions.blurPrompt());
            window.addEventListener('resize', this.handleResize);
        },
     toggleRightPanel() {
    const infoPanel = document.querySelector('.info-panel');
    const toggleButton = document.getElementById('toggleRightPanel');
    const canvasToggleButton = document.getElementById('canvasToggleRightPanel');
    const canvasContainer = document.querySelector('.canvas-container');
    const currentScrollTop = canvasContainer.scrollTop;
    const currentScrollLeft = canvasContainer.scrollLeft;
    
    infoPanel.classList.toggle('hidden');
    
    if (infoPanel.classList.contains('hidden')) {
        toggleButton.style.display = 'none';
        canvasToggleButton.style.display = 'block';
        canvasToggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        canvasToggleButton.title = '显示右侧工具栏 (Tab)';
        
        setTimeout(() => {
            // 这里也改为直接调用 EventHandlers 的方法
            EventHandlers.adjustCanvasToFitContainer();
            setTimeout(() => {
                canvasContainer.scrollTop = currentScrollTop;
                canvasContainer.scrollLeft = currentScrollLeft;
            }, 10);
        }, 50);
    } else {
        toggleButton.style.display = 'block';
        canvasToggleButton.style.display = 'none';
        toggleButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
        toggleButton.title = '隐藏右侧工具栏 (Tab)';
        
        setTimeout(() => {
            // 这里也改为直接调用 EventHandlers 的方法
            EventHandlers.resetCanvasSize();
            setTimeout(() => {
                canvasContainer.scrollTop = currentScrollTop;
                canvasContainer.scrollLeft = currentScrollLeft;
            }, 10);
        }, 50);
    }
    
    window.dispatchEvent(new Event('resize'));
},
        toggleRightTabs() {
            const colorsTab = document.getElementById('colors-tab');
            const promptTab = document.getElementById('prompt-generator-tab');
            const colorsButton = document.querySelector('.tab-button[data-tab="colors"]');
            const promptButton = document.querySelector('.tab-button[data-tab="prompt-generator"]');
            if (colorsTab.classList.contains('active')) {
                colorsTab.classList.remove('active');
                promptTab.classList.add('active');
                colorsButton.classList.remove('active');
                promptButton.classList.add('active');
            } else {
                promptTab.classList.remove('active');
                colorsTab.classList.add('active');
                promptButton.classList.remove('active');
                colorsButton.classList.add('active');
            }
        },
        toggleLeftTabs() {
            const basicTab = document.getElementById('basic-tab');
            const exportTab = document.getElementById('export-tab');
            const basicButton = document.querySelector('.tab-button-left[data-tab="basic"]');
            const exportButton = document.querySelector('.tab-button-left[data-tab="export"]');
            if (basicTab.classList.contains('active')) {
                basicTab.classList.remove('active');
                exportTab.classList.add('active');
                basicButton.classList.remove('active');
                exportButton.classList.add('active');
            } else {
                exportTab.classList.remove('active');
                basicTab.classList.add('active');
                exportButton.classList.remove('active');
                basicButton.classList.add('active');
            }
        },
        adjustCanvasToFitContainer() {
            const canvasContainer = document.querySelector('.canvas-container');
            const canvasWrapper = document.getElementById('canvasWrapper');
            if (!canvasContainer || !canvasWrapper) return;
            const currentScrollTop = canvasContainer.scrollTop;
            const currentScrollLeft = canvasContainer.scrollLeft;
            const containerWidth = canvasContainer.clientWidth;
            const containerHeight = canvasContainer.clientHeight;
            const appState = StateManager.getState();
            const currentWidth = appState.canvasWidth;
            const currentHeight = appState.canvasHeight;
            const scaleX = containerWidth / currentWidth;
            const scaleY = containerHeight / currentHeight;
            const scale = Math.min(scaleX, scaleY, 1);
            canvasWrapper.style.transform = `scale(${scale})`;
            canvasWrapper.style.transformOrigin = 'center center';
            console.log(`画布已缩放至: ${(scale * 100).toFixed(1)}%`);
            setTimeout(() => {
                canvasContainer.scrollTop = currentScrollTop;
                canvasContainer.scrollLeft = currentScrollLeft;
            }, 10);
        },
        resetCanvasSize() {
            const canvasContainer = document.querySelector('.canvas-container');
            const canvasWrapper = document.getElementById('canvasWrapper');
            if (canvasWrapper) {
                const currentScrollTop = canvasContainer.scrollTop;
                const currentScrollLeft = canvasContainer.scrollLeft;
                canvasWrapper.style.transform = 'scale(1)';
                canvasWrapper.style.transformOrigin = 'center center';
                setTimeout(() => {
                    canvasContainer.scrollTop = currentScrollTop;
                    canvasContainer.scrollLeft = currentScrollLeft;
                }, 10);
            }
        },
        handleResize() {
    const infoPanel = document.querySelector('.info-panel');
    const canvasContainer = document.querySelector('.canvas-container');
    const currentScrollTop = canvasContainer.scrollTop;
    const currentScrollLeft = canvasContainer.scrollLeft;
    
    if (infoPanel && infoPanel.classList.contains('hidden')) {
        setTimeout(() => {
            // 直接调用 EventHandlers 对象的方法
            EventHandlers.adjustCanvasToFitContainer();
            setTimeout(() => {
                canvasContainer.scrollTop = currentScrollTop;
                canvasContainer.scrollLeft = currentScrollLeft;
            }, 10);
        }, 100);
            }
        },
        updateCanvasCursor() {
            const appState = StateManager.getState();
            const drawingCanvas = appState.drawingCanvas;
            if (!drawingCanvas) return;
            if (appState.isAltPressed) { drawingCanvas.style.cursor = 'grab'; }
            else if (appState.operationMode === 'paint') { drawingCanvas.style.cursor = 'crosshair'; }
            else if (appState.operationMode === 'erase') { drawingCanvas.style.cursor = 'crosshair'; }
            else if (appState.operationMode === 'lasso') { drawingCanvas.style.cursor = 'crosshair'; }
            else { drawingCanvas.style.cursor = 'default'; }
        },
        getCanvasCoordinates(e) {
            const appState = StateManager.getState();
            const canvas = appState.drawingCanvas;
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;
            return { x, y };
        }
    };

    // 导出到全局
    window.StateManager = StateManager;
    window.AppState = AppState;   
    window.CoreFunctions = CoreFunctions;
    window.CanvasManager = CanvasManager;
    window.SmartPrompt = SmartPrompt;
    window.ColorPalette = ColorPalette;
    window.EventHandlers = EventHandlers;
  // 在window对象上暴露logout函数
  window.logout = function() {
    if (confirm('确定要退出登录吗？')) {
        // 清除所有存储
        sessionStorage.clear();
        localStorage.removeItem('aiPromptHistory');
        
        // 强制刷新页面回到登录状态
        location.reload();
    }
};
})();


// RGB转十六进制
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 获取分类CSS类名
function getCategoryClass(category) {
    if (category.includes("建筑")) return 'category-architecture';
    if (category.includes("景观")) return 'category-landscape';
    if (category.includes("结构")) return 'category-structure';
    if (category.includes("照明") || category.includes("灯具")) return 'category-lighting';
    if (category.includes("家具")) return 'category-furniture';
    if (category.includes("材料")) return 'category-material';
    if (category.includes("环境")) return 'category-environment';
    if (category.includes("细部") || category.includes("装饰")) return 'category-detail';
    if (category.includes("自然")) return 'category-nature';
    if (category.includes("人物")) return 'category-character';
    if (category.includes("艺术") || category.includes("绘画")) return 'category-art';
    return 'category-other';
}

// 生成随机颜色
function generateRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return [r, g, b];
}

// 显示临时消息
function showTemporaryMessage(message) {
    // 创建临时消息元素
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10000;
        font-size: 14px;
        pointer-events: none;
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    // 2秒后移除消息
    setTimeout(() => {
        document.body.removeChild(messageEl);
    }, 2000);
}

// 使用localStorage存储次数
function checkUsageLimit() {
  const count = localStorage.getItem('launchCount') || 0;
  if (parseInt(count) >= 1000) {
    alert('使用次数已达上限');
    window.close();
    return false;
  }
  localStorage.setItem('launchCount', parseInt(count) + 1);
  return true;
}

// 在页面加载时调用
if (!checkUsageLimit()) {
  window.close();
}
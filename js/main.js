/**
 * main.js - 应用程序入口点
 * 负责初始化应用程序并协调各个模块
 */

// 导入其他模块
import { initModules, handleModuleDrag } from './modules.js';
import { initConnections, toggleConnectionMode } from './connections.js';
import { exportToJSON, generateCode } from './export.js';
import { initUI, showModuleConfig, openModuleConfig } from './ui.js';

// 将UI函数导出到全局作用域
window.nnUI = { showModuleConfig, openModuleConfig };
window.nnExport = { exportToJSON, generateCode };

// 全局状态
const appState = {
    isConnectMode: false,
    selectedModule: null,
    modules: [],
    connections: []
};

// DOM 元素
let canvas;
let connectBtn;
let exportBtn;
let clearBtn;
let codeOutput;

// 初始化应用
function initApp() {
    // 获取DOM元素
    canvas = document.getElementById('canvas');
    connectBtn = document.getElementById('connect-btn');
    exportBtn = document.getElementById('export-btn');
    clearBtn = document.getElementById('clear-btn');
    codeOutput = document.getElementById('code-output');
    
    // 初始化各个模块
    initModules(canvas, appState);
    initConnections(canvas, appState);
    initUI(appState);
    
    // 绑定事件处理程序
    connectBtn.addEventListener('click', () => toggleConnectionMode(appState));
    exportBtn.addEventListener('click', () => {
        const jsonData = exportToJSON(appState);
        const code = generateCode(appState);
        codeOutput.querySelector('pre').textContent = code;
    });
    clearBtn.addEventListener('click', clearCanvas);
    
    // 双击画布上的模块打开配置面板
    canvas.addEventListener('dblclick', (e) => {
        const moduleElement = e.target.closest('.canvas-module');
        if (moduleElement) {
            showModuleConfig(moduleElement, appState);
        }
    });
}

// 清空画布
function clearCanvas() {
    // 移除所有模块和连接
    while (canvas.firstChild) {
        canvas.removeChild(canvas.firstChild);
    }
    
    // 重置应用状态
    appState.modules = [];
    appState.connections = [];
    appState.selectedModule = null;
    
    // 更新代码输出
    codeOutput.querySelector('pre').textContent = '// 这里将显示生成的代码';
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);
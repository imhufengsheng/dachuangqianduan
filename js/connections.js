/**
 * connections.js - 实现模块间连线逻辑
 * 负责处理模块之间的连接创建和管理
 */

// 连接计数器（用于生成唯一ID）
let connectionCounter = 0;

// 当前连接操作的状态
let connectionState = {
    isCreating: false,
    sourceModule: null,
    sourceConnector: null,
    tempConnection: null
};

/**
 * 初始化连接功能
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} appState - 应用状态
 */
export function initConnections(canvas, appState) {
    // 监听画布上的点击事件，处理连接器的点击
    canvas.addEventListener('click', (e) => {
        if (!appState.isConnectMode) return;
        
        const connector = e.target.closest('.connector');
        if (connector) {
            handleConnectorClick(connector, canvas, appState);
        } else {
            // 点击空白区域取消连接创建
            cancelConnectionCreation(canvas);
        }
    });
    
    // 监听鼠标移动，更新临时连接线
    canvas.addEventListener('mousemove', (e) => {
        if (connectionState.isCreating && connectionState.tempConnection) {
            updateTempConnection(e, canvas);
        }
    });
}

/**
 * 处理连接器点击事件
 * @param {HTMLElement} connector - 被点击的连接器
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} appState - 应用状态
 */
function handleConnectorClick(connector, canvas, appState) {
    const moduleElement = connector.closest('.canvas-module');
    const connectorType = connector.dataset.connector; // 'input' 或 'output'
    
    // 如果没有正在创建的连接
    if (!connectionState.isCreating) {
        // 只能从输出连接器开始创建连接
        if (connectorType === 'output') {
            startConnectionCreation(moduleElement, connector, canvas);
        }
    } else {
        // 已经有一个正在创建的连接
        // 只能连接到输入连接器
        if (connectorType === 'input') {
            // 不能连接到自己
            if (moduleElement !== connectionState.sourceModule) {
                completeConnection(moduleElement, connector, canvas, appState);
            }
        } else {
            // 点击了另一个输出连接器，取消当前连接并开始新的连接
            cancelConnectionCreation(canvas);
            startConnectionCreation(moduleElement, connector, canvas);
        }
    }
}

/**
 * 开始创建连接
 * @param {HTMLElement} moduleElement - 源模块元素
 * @param {HTMLElement} connector - 源连接器
 * @param {HTMLElement} canvas - 画布元素
 */
function startConnectionCreation(moduleElement, connector, canvas) {
    connectionState.isCreating = true;
    connectionState.sourceModule = moduleElement;
    connectionState.sourceConnector = connector;
    
    // 创建临时连接线
    const tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    tempConnection.classList.add('connection', 'temp-connection');
    tempConnection.style.position = 'absolute';
    tempConnection.style.width = '100%';
    tempConnection.style.height = '100%';
    tempConnection.style.zIndex = '0';
    tempConnection.style.pointerEvents = 'none';
    
    // 创建路径
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', '#6e8efb');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-dasharray', '5,5');
    
    tempConnection.appendChild(path);
    canvas.appendChild(tempConnection);
    
    connectionState.tempConnection = tempConnection;
    
    // 获取源连接器的位置
    const connectorRect = connector.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // 计算连接器在画布中的相对位置
    const x1 = connectorRect.left + connectorRect.width / 2 - canvasRect.left;
    const y1 = connectorRect.top + connectorRect.height / 2 - canvasRect.top;
    
    // 初始时，目标点与源点相同
    path.setAttribute('d', `M${x1},${y1} C${x1},${y1} ${x1},${y1} ${x1},${y1}`);
}

/**
 * 更新临时连接线
 * @param {Event} e - 鼠标事件
 * @param {HTMLElement} canvas - 画布元素
 */
function updateTempConnection(e, canvas) {
    const path = connectionState.tempConnection.querySelector('path');
    const canvasRect = canvas.getBoundingClientRect();
    
    // 获取源连接器的位置
    const sourceConnector = connectionState.sourceConnector;
    const sourceRect = sourceConnector.getBoundingClientRect();
    
    // 计算源点和当前鼠标位置
    const x1 = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
    const x2 = e.clientX - canvasRect.left;
    const y2 = e.clientY - canvasRect.top;
    
    // 更新路径
    path.setAttribute('d', `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`);
}

/**
 * 完成连接创建
 * @param {HTMLElement} targetModule - 目标模块元素
 * @param {HTMLElement} targetConnector - 目标连接器
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} appState - 应用状态
 */
function completeConnection(targetModule, targetConnector, canvas, appState) {
    // 检查是否已存在相同的连接
    const sourceId = connectionState.sourceModule.id;
    const targetId = targetModule.id;
    
    const existingConnection = appState.connections.find(
        conn => conn.sourceId === sourceId && conn.targetId === targetId
    );
    
    if (existingConnection) {
        // 如果已存在连接，取消当前操作
        cancelConnectionCreation(canvas);
        return;
    }
    
    // 创建新的连接ID
    const connectionId = `connection-${++connectionCounter}`;
    
    // 创建连接对象
    const connectionData = {
        id: connectionId,
        sourceId: sourceId,
        targetId: targetId,
        // 添加连接器类型信息，便于后续更新
        sourceType: 'output',
        targetType: 'input'
    };
    
    // 添加到应用状态
    appState.connections.push(connectionData);
    
    // 获取源连接器和目标连接器的位置
    const sourceConnector = connectionState.sourceConnector;
    const sourceRect = sourceConnector.getBoundingClientRect();
    const targetRect = targetConnector.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();
    
    // 计算连接器在画布中的相对位置
    const x1 = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
    const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
    const x2 = targetRect.left + targetRect.width / 2 - canvasRect.left;
    const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;
    
    // 创建永久连接线
    const connection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    connection.classList.add('connection', 'active');
    connection.id = connectionId;
    connection.style.position = 'absolute';
    connection.style.width = '100%';
    connection.style.height = '100%';
    connection.style.zIndex = '0';
    connection.style.pointerEvents = 'none';
    
    // 创建路径
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', '#6e8efb');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('d', `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`);
    
    connection.appendChild(path);
    
    // 移除临时连接线
    if (connectionState.tempConnection) {
        canvas.removeChild(connectionState.tempConnection);
    }
    
    // 添加永久连接线
    canvas.insertBefore(connection, canvas.firstChild); // 插入到最底层
    
    // 重置连接状态
    resetConnectionState();
}

/**
 * 取消连接创建
 * @param {HTMLElement} canvas - 画布元素
 */
function cancelConnectionCreation(canvas) {
    if (connectionState.tempConnection) {
        canvas.removeChild(connectionState.tempConnection);
    }
    
    resetConnectionState();
}

/**
 * 重置连接状态
 */
function resetConnectionState() {
    connectionState.isCreating = false;
    connectionState.sourceModule = null;
    connectionState.sourceConnector = null;
    connectionState.tempConnection = null;
}

/**
 * 切换连接模式
 * @param {Object} appState - 应用状态
 */
export function toggleConnectionMode(appState) {
    appState.isConnectMode = !appState.isConnectMode;
    
    // 更新UI
    const connectBtn = document.getElementById('connect-btn');
    const connectModeIndicator = document.querySelector('.connect-mode') || createConnectModeIndicator();
    
    if (appState.isConnectMode) {
        connectBtn.classList.add('active');
        connectModeIndicator.classList.add('active');
    } else {
        connectBtn.classList.remove('active');
        connectModeIndicator.classList.remove('active');
    }
}

/**
 * 创建连接模式指示器
 * @returns {HTMLElement} - 连接模式指示器元素
 */
function createConnectModeIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'connect-mode';
    indicator.innerHTML = '<i class="fas fa-link"></i> 连线模式已启用';
    document.body.appendChild(indicator);
    return indicator;
}
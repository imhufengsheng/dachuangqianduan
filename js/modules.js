/**
 * modules.js - 处理模块定义和拖拽功能
 * 负责模块的创建、拖拽和定位
 */

// 模块类型定义
const MODULE_TYPES = {
    input: { name: '输入层 (Input)', params: { shape: '(28, 28, 1)' } },
    conv2d: { name: '卷积层 (Conv2D)', params: { filters: 32, kernel_size: 3, activation: 'relu', padding: 'same', strides: 1 } },
    pooling: { name: '池化层 (Pooling)', params: { pool_size: 2, pool_type: 'max', strides: 2 } },
    dense: { name: '全连接层 (Dense)', params: { units: 128, activation: 'relu' } },
    dropout: { name: 'Dropout层 (Dropout)', params: { rate: 0.25 } },
    activation: { name: '激活层 (Activation)', params: { activation: 'relu' } },
    regularization: { name: '正则化层 (Regularization)', params: { l1: 0.01, l2: 0.01, type: 'l1_l2' } },
    normalization: { name: '标准化层 (Normalization)', params: { axis: -1, momentum: 0.99, epsilon: 0.001, type: 'batch' } },
    lstm: { 
        name: 'LSTM层 (LSTM)', 
        params: { 
            units: 64, 
            return_sequences: true,
            input_weights: '输入到输入门的权重矩阵',
            hidden_weights: '隐藏层到输入门的权重矩阵',
            input_bias: '输入门的偏置向量',
            forget_weights: '输入到遗忘门的权重矩阵',
            forget_hidden: '隐藏层到遗忘门的权重矩阵',
            forget_bias: '遗忘门的偏置向量',
            cell_weights: '输入到细胞状态更新的权重矩阵',
            cell_hidden: '隐藏层到细胞状态更新的权重矩阵',
            cell_bias: '细胞状态更新的偏置向量',
            output_weights: '输入到输出门的权重矩阵',
            output_hidden: '隐藏层到输出门的权重矩阵',
            output_bias: '输出门的偏置向量',
            hidden_output: '隐藏层到输出层的权重矩阵'
        } 
    },
    gru: { 
        name: '门控循环单元 (GRU)', 
        params: { 
            units: 64, 
            return_sequences: true,
            reset_weights: '输入到重置门的权重矩阵',
            reset_hidden: '隐藏层到重置门的权重矩阵',
            reset_bias: '重置门的偏置向量',
            update_weights: '输入到更新门的权重矩阵',
            update_hidden: '隐藏层到更新门的权重矩阵',
            update_bias: '更新门的偏置向量',
            candidate_weights: '输入到候选隐藏状态的权重矩阵',
            candidate_hidden: '隐藏层到候选隐藏状态的权重矩阵',
            candidate_bias: '候选隐藏状态的偏置向量',
            hidden_output: '隐藏层到输出层的权重矩阵'
        } 
    },
    rnn: { 
        name: 'RNN层 (RNN)', 
        params: { 
            units: 32, 
            activation: 'tanh',
            input_weights: '输入到隐藏层的权重矩阵',
            hidden_weights: '隐藏层到隐藏层的权重矩阵',
            hidden_output: '隐藏层到输出层的权重矩阵',
            output_bias: '输出层的偏置向量'
        } 
    },
    output: { name: '输出层 (Output)', params: { units: 10, activation: 'softmax' } }
};

// 模块计数器（用于生成唯一ID）
let moduleCounter = 0;

// 定义各种模块类型的默认参数
const moduleDefaults = {
  input: {
    shape: [28, 28, 1],
    name: 'input'
  },
  conv2d: {
    filters: 32,
    kernelSize: [3, 3],
    strides: [1, 1],
    padding: 'same',
    activation: 'relu'
  },
  pooling: {
    poolSize: [2, 2],
    strides: [2, 2],
    poolType: 'max'
  },
  dense: {
    units: 128,
    activation: 'relu'
  },
  dropout: {
    rate: 0.25
  },
  activation: {
    activation: 'relu'
  },
  regularization: {
    l1: 0.01,
    l2: 0.01,
    type: 'l1_l2'
  },
  normalization: {
    axis: -1,
    momentum: 0.99,
    epsilon: 0.001,
    type: 'batch'
  },
  lstm: {
    units: 64,
    returnSequences: true
  },
  gru: {
    units: 64,
    returnSequences: true
  },
  rnn: {
    units: 32,
    activation: 'tanh'
  },
  output: {
    units: 10,
    activation: 'softmax'
  }
};

/**
 * 初始化模块拖拽功能
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} appState - 应用状态
 */
export function initModules(canvas, appState) {
    // 获取所有可拖拽模块
    const draggableModules = document.querySelectorAll('.module');
    
    // 为每个模块添加拖拽事件
    draggableModules.forEach(module => {
        module.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('moduleType', module.dataset.type);
        });
    });
    
    // 设置画布为放置区域
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    // 处理模块放置
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const moduleType = e.dataTransfer.getData('moduleType');
        
        // 创建新模块并添加到画布
        if (moduleType) {
            createModule(moduleType, e.clientX, e.clientY, canvas, appState);
        }
    });
    
    // 处理画布上模块的拖动
    canvas.addEventListener('mousedown', (e) => {
        handleModuleDrag(e, canvas, appState);
    });
}

/**
 * 创建新模块并添加到画布
 * @param {string} type - 模块类型
 * @param {number} clientX - 鼠标X坐标
 * @param {number} clientY - 鼠标Y坐标
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} appState - 应用状态
 */
function createModule(type, clientX, clientY, canvas, appState) {
    // 获取画布位置信息
    const canvasRect = canvas.getBoundingClientRect();
    
    // 计算模块在画布中的位置
    const x = clientX - canvasRect.left;
    const y = clientY - canvasRect.top;
    
    // 创建模块ID
    const moduleId = `module-${++moduleCounter}`;
    
    // 创建模块对象
    const moduleData = {
        id: moduleId,
        type: type,
        x: x,
        y: y,
        params: { ...MODULE_TYPES[type].params }
    };
    
    // 添加到应用状态
    appState.modules.push(moduleData);
    
    // 创建DOM元素
    const moduleElement = document.createElement('div');
    moduleElement.className = 'canvas-module';
    moduleElement.id = moduleId;
    moduleElement.dataset.type = type;
    
    // 设置模块位置
    moduleElement.style.left = `${x}px`;
    moduleElement.style.top = `${y}px`;
    
    // 格式化参数显示
    let paramsHtml = '<div class="module-params">';
    for (const [key, value] of Object.entries(moduleData.params)) {
        paramsHtml += `<div class="param-item"><span class="param-name">${key}:</span> <span class="param-value">${value}</span></div>`;
    }
    paramsHtml += '</div>';
    
    // 创建模块内容
    moduleElement.innerHTML = `
        <div class="module-header">
            <div class="module-icon"><i class="fas ${getIconForType(type)}"></i></div>
            <div class="module-title">${MODULE_TYPES[type].name}</div>
            <div class="module-actions">
                <i class="fas fa-cog edit-module" title="编辑参数"></i>
                <i class="fas fa-times delete-module" title="删除模块"></i>
            </div>
        </div>
        ${paramsHtml}
        <div class="connector input-connector" data-connector="input"></div>
        <div class="connector output-connector" data-connector="output"></div>
    `;
    
    // 添加到画布
    canvas.appendChild(moduleElement);
    
    // 添加编辑参数事件
    moduleElement.querySelector('.edit-module').addEventListener('click', (e) => {
        e.stopPropagation();
        // 导入UI模块中的函数
        const { showModuleConfig } = window.nnUI || {};
        if (showModuleConfig) {
            showModuleConfig(moduleElement, appState);
        }
    });
    
    // 添加双击编辑事件
    moduleElement.addEventListener('dblclick', () => {
        const { showModuleConfig } = window.nnUI || {};
        if (showModuleConfig) {
            showModuleConfig(moduleElement, appState);
        }
    });
    
    // 添加删除模块事件
    moduleElement.querySelector('.delete-module').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteModule(moduleId, appState, canvas);
    });
}

/**
 * 处理模块拖动
 * @param {Event} e - 鼠标事件
 * @param {HTMLElement} canvas - 画布元素
 * @param {Object} appState - 应用状态
 */
export function handleModuleDrag(e, canvas, appState) {
    const moduleElement = e.target.closest('.canvas-module');
    if (!moduleElement) return;
    
    // 如果在连接模式下点击了连接器，不进行拖动
    if (appState.isConnectMode && e.target.closest('.connector')) return;
    
    // 设置为当前选中的模块
    if (appState.selectedModule) {
        appState.selectedModule.classList.remove('selected');
    }
    moduleElement.classList.add('selected');
    appState.selectedModule = moduleElement;
    
    // 获取初始位置
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseInt(moduleElement.style.left);
    const startTop = parseInt(moduleElement.style.top);
    
    // 鼠标移动处理函数
    function onMouseMove(e) {
        // 计算新位置
        const newLeft = startLeft + (e.clientX - startX);
        const newTop = startTop + (e.clientY - startY);
        
        // 更新模块位置
        moduleElement.style.left = `${newLeft}px`;
        moduleElement.style.top = `${newTop}px`;
        
        // 更新应用状态中的模块位置
        const moduleId = moduleElement.id;
        const moduleIndex = appState.modules.findIndex(m => m.id === moduleId);
        if (moduleIndex !== -1) {
            appState.modules[moduleIndex].x = newLeft;
            appState.modules[moduleIndex].y = newTop;
        }
        
        // 更新连接线
        updateConnections(moduleElement, appState);
    }
    
    // 鼠标释放处理函数
    function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }
    
    // 添加事件监听
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

/**
 * 更新与模块相关的连接线
 * @param {HTMLElement} moduleElement - 模块元素
 * @param {Object} appState - 应用状态
 */
function updateConnections(moduleElement, appState) {
    const moduleId = moduleElement.id;
    const canvas = moduleElement.parentElement; // 获取画布元素
    
    // 查找与此模块相关的所有连接
    const relatedConnections = appState.connections.filter(
        conn => conn.sourceId === moduleId || conn.targetId === moduleId
    );
    
    // 更新每个连接线的位置
    relatedConnections.forEach(conn => {
        const connectionElement = document.getElementById(conn.id);
        if (connectionElement) {
            // 获取源模块和目标模块
            const sourceModule = document.getElementById(conn.sourceId);
            const targetModule = document.getElementById(conn.targetId);
            
            if (sourceModule && targetModule) {
                // 获取连接器位置
                const sourceConnector = sourceModule.querySelector('.output-connector');
                const targetConnector = targetModule.querySelector('.input-connector');
                
                // 获取连接器的绝对位置
                const sourceRect = sourceConnector.getBoundingClientRect();
                const targetRect = targetConnector.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                
                // 计算连接器在画布中的相对位置
                const x1 = sourceRect.left + sourceRect.width / 2 - canvasRect.left;
                const y1 = sourceRect.top + sourceRect.height / 2 - canvasRect.top;
                const x2 = targetRect.left + targetRect.width / 2 - canvasRect.left;
                const y2 = targetRect.top + targetRect.height / 2 - canvasRect.top;
                
                // 更新SVG路径
                const path = connectionElement.querySelector('path');
                path.setAttribute('d', `M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`);
            }
        }
    });
}

/**
 * 获取模块类型对应的图标类名
 * @param {string} type - 模块类型
 * @returns {string} - 图标类名
 */
function getIconForType(type) {
    const iconMap = {
        input: 'fa-sign-in-alt',
        conv2d: 'fa-filter',
        pooling: 'fa-compress-arrows-alt',
        dense: 'fa-network-wired',
        dropout: 'fa-random',
        activation: 'fa-bolt',
        regularization: 'fa-shield-alt',
        normalization: 'fa-balance-scale',
        lstm: 'fa-history',
        gru: 'fa-recycle',
        rnn: 'fa-redo',
        output: 'fa-sign-out-alt'
    };
    
    return iconMap[type] || 'fa-cube';
}

/**
 * 创建画布上的模块元素
 */
function createCanvasModule(moduleType, x, y, canvas, appState) {
  const moduleId = `module-${++moduleCounter}`;
  
  // 获取模块默认参数
  const params = JSON.parse(JSON.stringify(moduleDefaults[moduleType] || {}));
  
  // 创建模块元素
  const moduleElement = document.createElement('div');
  moduleElement.id = moduleId;
  moduleElement.className = 'canvas-module';
  moduleElement.dataset.type = moduleType;
  moduleElement.style.left = `${x}px`;
  moduleElement.style.top = `${y}px`;
  
  // 设置模块颜色
  const moduleColor = getModuleColor(moduleType);
  
  // 创建模块内容
  moduleElement.innerHTML = `
    <div class="module-header">
      <div class="module-icon" style="background-color: ${moduleColor}">
        <i class="${getModuleIcon(moduleType)}"></i>
      </div>
      <div class="module-title">${getModuleTitle(moduleType)}</div>
      <div class="module-actions">
        <i class="fas fa-cog edit-module" title="编辑参数"></i>
      </div>
    </div>
    <div class="module-params">
      ${formatParamsDisplay(params)}
    </div>
    <div class="connector input-connector" data-connector="input"></div>
    <div class="connector output-connector" data-connector="output"></div>
  `;
  
  // 添加到画布
  canvas.appendChild(moduleElement);
  
  // 添加到应用状态
  appState.modules.push({
    id: moduleId,
    type: moduleType,
    x: x,
    y: y,
    params: params
  });
  
  // 添加事件监听
  moduleElement.addEventListener('mousedown', (e) => handleModuleDrag(e, moduleElement, canvas, appState));
  
  // 添加双击编辑事件
  moduleElement.querySelector('.edit-module').addEventListener('click', (e) => {
    e.stopPropagation();
    openModuleConfig(moduleId, appState);
  });
  
  return moduleElement;
}

/**
 * 格式化参数显示
 */
function formatParamsDisplay(params) {
  let html = '<div class="param-list">';
  
  for (const [key, value] of Object.entries(params)) {
    let displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
    html += `<div class="param-item"><span class="param-name">${key}:</span> <span class="param-value">${displayValue}</span></div>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * 删除模块及其连接
 * @param {string} moduleId - 要删除的模块ID
 * @param {Object} appState - 应用状态
 * @param {HTMLElement} canvas - 画布元素
 */
function deleteModule(moduleId, appState, canvas) {
  // 查找与此模块相关的所有连接
  const relatedConnections = appState.connections.filter(
    conn => conn.sourceId === moduleId || conn.targetId === moduleId
  );
  
  // 删除相关连接
  relatedConnections.forEach(conn => {
    // 从DOM中删除连接元素
    const connectionElement = document.getElementById(conn.id);
    if (connectionElement) {
      connectionElement.remove();
    }
    
    // 从应用状态中删除连接
    const connIndex = appState.connections.findIndex(c => c.id === conn.id);
    if (connIndex !== -1) {
      appState.connections.splice(connIndex, 1);
    }
  });
  
  // 从DOM中删除模块元素
  const moduleElement = document.getElementById(moduleId);
  if (moduleElement) {
    moduleElement.remove();
  }
  
  // 从应用状态中删除模块
  const moduleIndex = appState.modules.findIndex(m => m.id === moduleId);
  if (moduleIndex !== -1) {
    appState.modules.splice(moduleIndex, 1);
  }
  
  // 如果删除的是当前选中的模块，清除选中状态
  if (appState.selectedModule && appState.selectedModule.id === moduleId) {
    appState.selectedModule = null;
  }
}

/**
 * 打开模块配置弹窗
 * @param {string} moduleId - 模块ID
 * @param {Object} appState - 应用状态
 */
function openModuleConfig(moduleId, appState) {
  // 查找模块数据
  const moduleIndex = appState.modules.findIndex(m => m.id === moduleId);
  if (moduleIndex === -1) return;
  
  const moduleData = appState.modules[moduleIndex];
  
  // 触发自定义事件，通知UI组件打开配置弹窗
  const event = new CustomEvent('openModuleConfig', {
    detail: {
      moduleId: moduleId,
      moduleType: moduleData.type,
      params: moduleData.params
    }
  });
  
  document.dispatchEvent(event);
}
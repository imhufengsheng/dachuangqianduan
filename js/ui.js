/**
 * ui.js - 管理界面交互
 * 负责处理模块配置面板和其他UI元素
 */

// 当前正在编辑的模块
let currentEditingModule = null;

/**
 * 初始化UI交互
 * @param {Object} appState - 应用状态
 */
export function initUI(appState) {
    // 获取模态框元素
    const moduleConfig = document.getElementById('module-config');
    const configForm = document.getElementById('config-form');
    const saveConfigBtn = document.getElementById('save-config');
    const cancelConfigBtn = document.getElementById('cancel-config');
    const closeBtn = moduleConfig.querySelector('.close');
    
    // 绑定关闭按钮事件
    closeBtn.addEventListener('click', () => {
        moduleConfig.style.display = 'none';
    });
    
    // 绑定取消按钮事件
    cancelConfigBtn.addEventListener('click', () => {
        moduleConfig.style.display = 'none';
    });
    
    // 绑定保存按钮事件
    saveConfigBtn.addEventListener('click', () => {
        if (currentEditingModule) {
            saveModuleConfig(currentEditingModule, configForm, appState);
            // 注意：不需要在这里设置display为none，因为saveModuleConfig函数已经处理了关闭模态框
        }
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === moduleConfig) {
            moduleConfig.style.display = 'none';
        }
    });
    
    // 创建连接模式指示器
    createConnectModeIndicator();
}

/**
 * 显示模块配置面板
 * @param {HTMLElement} moduleElement - 模块元素
 * @param {Object} appState - 应用状态
 */
export function showModuleConfig(moduleElement, appState) {
    // 如果处于连接模式，不显示配置面板
    if (appState.isConnectMode) return;
    
    // 获取模块ID和类型
    const moduleId = moduleElement.id;
    const moduleType = moduleElement.dataset.type;
    
    // 查找模块数据
    const moduleData = appState.modules.find(m => m.id === moduleId);
    if (!moduleData) return;
    
    // 设置当前编辑的模块
    currentEditingModule = moduleData;
    
    // 获取模态框和表单元素
    const moduleConfig = document.getElementById('module-config');
    const configForm = document.getElementById('config-form');
    
    // 清空表单
    configForm.innerHTML = '';
    
    // 根据模块类型生成表单
    generateConfigForm(moduleType, moduleData.params, configForm);
    
    // 显示模态框
    moduleConfig.style.display = 'flex';
}

/**
 * 根据模块类型生成配置表单
 * @param {string} moduleType - 模块类型
 * @param {Object} params - 模块参数
 * @param {HTMLElement} formElement - 表单元素
 */
function generateConfigForm(moduleType, params, formElement) {
    // 根据模块类型定义不同的表单字段
    const formFields = getFormFieldsByType(moduleType);
    
    // 创建表单字段
    formFields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        
        // 创建标签
        const label = document.createElement('label');
        label.textContent = field.label;
        label.setAttribute('for', field.name);
        
        // 创建输入元素
        let input;
        if (field.type === 'select') {
            input = document.createElement('select');
            field.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                if (params[field.name] === option) {
                    optionElement.selected = true;
                }
                input.appendChild(optionElement);
            });
        } else {
            input = document.createElement('input');
            input.type = field.type;
            input.value = params[field.name] || field.default;
            
            // 添加数值输入的属性
            if (field.type === 'number') {
                if (field.min !== undefined) input.min = field.min;
                if (field.max !== undefined) input.max = field.max;
                if (field.step !== undefined) input.step = field.step;
            }
        }
        
        input.id = field.name;
        input.name = field.name;
        
        // 添加到表单组
        formGroup.appendChild(label);
        formGroup.appendChild(input);
        
        // 添加到表单
        formElement.appendChild(formGroup);
    });
}

/**
 * 根据模块类型获取表单字段定义
 * @param {string} moduleType - 模块类型
 * @returns {Array} - 表单字段定义数组
 */
function getFormFieldsByType(moduleType) {
    switch (moduleType) {
        case 'input':
            return [
                { name: 'shape', label: '输入形状 (shape)', type: 'text', default: '(28, 28, 1)' }
            ];
            
        case 'conv2d':
            return [
                { name: 'filters', label: '过滤器数量 (filters)', type: 'number', default: 32 },
                { name: 'kernel_size', label: '卷积核大小 (kernel_size)', type: 'number', default: 3 },
                { name: 'strides', label: '步长 (strides)', type: 'number', default: 1 },
                { name: 'padding', label: '填充方式 (padding)', type: 'select', options: ['same', 'valid'], default: 'same' },
                { name: 'activation', label: '激活函数 (activation)', type: 'select', options: ['relu', 'sigmoid', 'tanh', 'leaky_relu', 'linear'], default: 'relu' }
            ];
            
        case 'pooling':
            return [
                { name: 'pool_size', label: '池化大小 (pool_size)', type: 'number', default: 2 },
                { name: 'strides', label: '步长 (strides)', type: 'number', default: 2 },
                { name: 'pool_type', label: '池化类型 (pool_type)', type: 'select', options: ['max', 'average'], default: 'max' }
            ];
            
        case 'dense':
            return [
                { name: 'units', label: '神经元数量 (units)', type: 'number', default: 128 },
                { name: 'activation', label: '激活函数 (activation)', type: 'select', options: ['relu', 'sigmoid', 'tanh', 'softmax', 'leaky_relu', 'linear'], default: 'relu' }
            ];
            
        case 'dropout':
            return [
                { name: 'rate', label: '丢弃率 (rate)', type: 'number', default: 0.25, step: 0.01, min: 0, max: 1 },
                { name: 'seed', label: '随机种子 (seed)', type: 'number', default: 42 }
            ];
            
        case 'activation':
            return [
                { name: 'activation', label: '激活函数 (activation)', type: 'select', options: ['relu', 'sigmoid', 'tanh', 'softmax', 'leaky_relu', 'elu', 'selu', 'linear'], default: 'relu' }
            ];
            
        case 'regularization':
            return [
                { name: 'type', label: '正则化类型 (type)', type: 'select', options: ['l1', 'l2', 'l1_l2'], default: 'l1_l2' },
                { name: 'l1', label: 'L1正则化系数 (l1)', type: 'number', default: 0.01, step: 0.001, min: 0 },
                { name: 'l2', label: 'L2正则化系数 (l2)', type: 'number', default: 0.01, step: 0.001, min: 0 }
            ];
            
        case 'normalization':
            return [
                { name: 'type', label: '标准化类型 (type)', type: 'select', options: ['batch', 'layer', 'instance', 'group'], default: 'batch' },
                { name: 'axis', label: '轴 (axis)', type: 'number', default: -1 },
                { name: 'momentum', label: '动量 (momentum)', type: 'number', default: 0.99, step: 0.01, min: 0, max: 1 },
                { name: 'epsilon', label: '小值 (epsilon)', type: 'number', default: 0.001, step: 0.0001, min: 0.0001 }
            ];
            
        case 'lstm':
            return [
                { name: 'units', label: '神经元数量 (units)', type: 'number', default: 64 },
                { name: 'return_sequences', label: '返回序列 (return_sequences)', type: 'select', options: ['true', 'false'], default: 'true' },
                { name: 'input_weights', label: '输入到输入门的权重矩阵 (input_weights)', type: 'text', default: '输入到输入门的权重矩阵' },
                { name: 'hidden_weights', label: '隐藏层到输入门的权重矩阵 (hidden_weights)', type: 'text', default: '隐藏层到输入门的权重矩阵' },
                { name: 'input_bias', label: '输入门的偏置向量 (input_bias)', type: 'text', default: '输入门的偏置向量' },
                { name: 'forget_weights', label: '输入到遗忘门的权重矩阵 (forget_weights)', type: 'text', default: '输入到遗忘门的权重矩阵' },
                { name: 'forget_hidden', label: '隐藏层到遗忘门的权重矩阵 (forget_hidden)', type: 'text', default: '隐藏层到遗忘门的权重矩阵' },
                { name: 'forget_bias', label: '遗忘门的偏置向量 (forget_bias)', type: 'text', default: '遗忘门的偏置向量' },
                { name: 'cell_weights', label: '输入到细胞状态更新的权重矩阵 (cell_weights)', type: 'text', default: '输入到细胞状态更新的权重矩阵' },
                { name: 'cell_hidden', label: '隐藏层到细胞状态更新的权重矩阵 (cell_hidden)', type: 'text', default: '隐藏层到细胞状态更新的权重矩阵' },
                { name: 'cell_bias', label: '细胞状态更新的偏置向量 (cell_bias)', type: 'text', default: '细胞状态更新的偏置向量' },
                { name: 'output_weights', label: '输入到输出门的权重矩阵 (output_weights)', type: 'text', default: '输入到输出门的权重矩阵' },
                { name: 'output_hidden', label: '隐藏层到输出门的权重矩阵 (output_hidden)', type: 'text', default: '隐藏层到输出门的权重矩阵' },
                { name: 'output_bias', label: '输出门的偏置向量 (output_bias)', type: 'text', default: '输出门的偏置向量' },
                { name: 'hidden_output', label: '隐藏层到输出层的权重矩阵 (hidden_output)', type: 'text', default: '隐藏层到输出层的权重矩阵' }
            ];
            
        case 'gru':
            return [
                { name: 'units', label: '神经元数量 (units)', type: 'number', default: 64 },
                { name: 'return_sequences', label: '返回序列 (return_sequences)', type: 'select', options: ['true', 'false'], default: 'true' },
                { name: 'reset_weights', label: '输入到重置门的权重矩阵 (reset_weights)', type: 'text', default: '输入到重置门的权重矩阵' },
                { name: 'reset_hidden', label: '隐藏层到重置门的权重矩阵 (reset_hidden)', type: 'text', default: '隐藏层到重置门的权重矩阵' },
                { name: 'reset_bias', label: '重置门的偏置向量 (reset_bias)', type: 'text', default: '重置门的偏置向量' },
                { name: 'update_weights', label: '输入到更新门的权重矩阵 (update_weights)', type: 'text', default: '输入到更新门的权重矩阵' },
                { name: 'update_hidden', label: '隐藏层到更新门的权重矩阵 (update_hidden)', type: 'text', default: '隐藏层到更新门的权重矩阵' },
                { name: 'update_bias', label: '更新门的偏置向量 (update_bias)', type: 'text', default: '更新门的偏置向量' },
                { name: 'candidate_weights', label: '输入到候选隐藏状态的权重矩阵 (candidate_weights)', type: 'text', default: '输入到候选隐藏状态的权重矩阵' },
                { name: 'candidate_hidden', label: '隐藏层到候选隐藏状态的权重矩阵 (candidate_hidden)', type: 'text', default: '隐藏层到候选隐藏状态的权重矩阵' },
                { name: 'candidate_bias', label: '候选隐藏状态的偏置向量 (candidate_bias)', type: 'text', default: '候选隐藏状态的偏置向量' },
                { name: 'hidden_output', label: '隐藏层到输出层的权重矩阵 (hidden_output)', type: 'text', default: '隐藏层到输出层的权重矩阵' }
            ];
            
        case 'rnn':
            return [
                { name: 'units', label: '神经元数量 (units)', type: 'number', default: 32 },
                { name: 'activation', label: '激活函数 (activation)', type: 'select', options: ['tanh', 'relu', 'sigmoid', 'linear'], default: 'tanh' },
                { name: 'input_weights', label: '输入到隐藏层的权重矩阵 (input_weights)', type: 'text', default: '输入到隐藏层的权重矩阵' },
                { name: 'hidden_weights', label: '隐藏层到隐藏层的权重矩阵 (hidden_weights)', type: 'text', default: '隐藏层到隐藏层的权重矩阵' },
                { name: 'hidden_output', label: '隐藏层到输出层的权重矩阵 (hidden_output)', type: 'text', default: '隐藏层到输出层的权重矩阵' },
                { name: 'output_bias', label: '输出层的偏置向量 (output_bias)', type: 'text', default: '输出层的偏置向量' }
            ];
            
        case 'output':
            return [
                { name: 'units', label: '神经元数量', type: 'number', default: 10 },
                { name: 'activation', label: '激活函数', type: 'select', options: ['softmax', 'sigmoid', 'linear'], default: 'softmax' }
            ];
            
        default:
            return [];
    }
}

/**
 * 打开模块配置面板
 * @param {string} moduleId - 模块ID
 * @param {Object} appState - 应用状态
 */
export function openModuleConfig(moduleId, appState) {
  const moduleData = appState.modules.find(m => m.id === moduleId);
  if (!moduleData) return;
  
  // 设置当前编辑的模块
  currentEditingModule = moduleData;
  
  const moduleConfig = document.getElementById('module-config');
  const configForm = document.getElementById('config-form');
  
  // 清空表单
  configForm.innerHTML = '';
  
  // 根据模块类型生成表单
  generateConfigForm(moduleData.type, moduleData.params, configForm);
  
  // 显示模态框
  moduleConfig.style.display = 'flex';
}

/**
 * 保存模块配置
 * @param {Object} moduleData - 模块数据
 * @param {HTMLElement} formElement - 表单元素
 * @param {Object} appState - 应用状态
 */
function saveModuleConfig(moduleData, formElement, appState) {
    // 兼容div收集所有input/select
    const inputs = formElement.querySelectorAll('input, select');
    const newParams = {};
    inputs.forEach(input => {
        let value = input.value;
        // 处理数字类型
        if (input.type === 'number' && value !== '') {
            value = parseFloat(value);
        }
        newParams[input.name] = value;
    });
    // 保留原有参数中未在表单中出现的参数
    for (const key in moduleData.params) {
      if (!newParams.hasOwnProperty(key)) {
        newParams[key] = moduleData.params[key];
      }
    }
    // 更新模块参数
    moduleData.params = newParams;
    // 更新应用状态中的模块
    const moduleIndex = appState.modules.findIndex(m => m.id === moduleData.id);
    if (moduleIndex !== -1) {
      appState.modules[moduleIndex].params = newParams;
    }
    // 更新模块显示
    updateModuleParamsDisplay(moduleData.id, newParams);
    // 更新代码输出
    updateCodeOutput(appState);
    console.log('模块参数已更新:', moduleData.id, newParams);

    // 关闭配置面板
    const moduleConfig = document.getElementById('module-config');
    if (moduleConfig) {
      moduleConfig.style.display = 'none';
    }
    return true;
}

/**
 * 更新模块参数显示
 * @param {string} moduleId - 模块ID
 * @param {Object} params - 更新后的参数
 */
function updateModuleParamsDisplay(moduleId, params) {
  const moduleElement = document.getElementById(moduleId);
  if (!moduleElement) return;
  
  // 使用formatParamsDisplay生成参数HTML
  const paramsContent = formatParamsDisplay(params);
  
  // 更新参数显示区域
  let paramsHtml = `<div class="module-params">${paramsContent}</div>`;
  
  // 替换现有的参数显示
  const existingParams = moduleElement.querySelector('.module-params');
  if (existingParams) {
    existingParams.outerHTML = paramsHtml;
  } else {
    // 如果不存在，则插入到header后面
    const header = moduleElement.querySelector('.module-header');
    if (header) {
      header.insertAdjacentHTML('afterend', paramsHtml);
    }
  }
  
  // 触发自定义事件，通知模块参数已更新
  const updateEvent = new CustomEvent('module-updated', { detail: { moduleId, params } });
  document.dispatchEvent(updateEvent);
}

    



/**
 * 格式化参数名称显示
 * @param {string} key - 参数键名
 * @returns {string} - 格式化后的参数名称
 */
function formatParamName(key) {
  const nameMap = {
    'filters': '过滤器数量 (filters)',
    'kernel_size': '卷积核大小 (kernel_size)',
    'strides': '步长 (strides)',
    'padding': '填充方式 (padding)',
    'activation': '激活函数 (activation)',
    'units': '神经元数量 (units)',
    'pool_size': '池化大小 (pool_size)',
    'pool_type': '池化类型 (pool_type)',
    'rate': '丢弃率 (rate)',
    'seed': '随机种子 (seed)',
    'return_sequences': '返回序列 (return_sequences)',
    'shape': '输入形状 (shape)',
    'type': '类型 (type)',
    'l1': 'L1正则化系数 (l1)',
    'l2': 'L2正则化系数 (l2)',
    'axis': '轴 (axis)',
    'momentum': '动量 (momentum)',
    'epsilon': '小值 (epsilon)'
  };
  
  return nameMap[key] || key;
}

/**
 * 格式化参数显示
 * @param {Object} params - 模块参数
 * @returns {string} - 格式化后的HTML
 */
function formatParamsDisplay(params) {
  let html = '';
  
  for (const [key, value] of Object.entries(params)) {
    let displayValue = Array.isArray(value) ? `[${value.join(', ')}]` : value;
    let displayName = formatParamName(key);
    html += `<div class="param-item"><span class="param-name">${displayName}:</span> <span class="param-value">${displayValue}</span></div>`;
  }
  
  return html;
}



/**
 * 更新代码输出
 * @param {Object} appState - 应用状态
 */
function updateCodeOutput(appState) {
    // 导入生成代码函数
    const { generateCode } = window.nnExport || {};
    if (generateCode) {
        const code = generateCode(appState);
        const codeOutput = document.getElementById('code-output');
        if (codeOutput) {
            codeOutput.querySelector('pre').textContent = code;
        }
    }
}

/**
 * 创建连接模式指示器
 * @returns {HTMLElement} - 连接模式指示器元素
 */
function createConnectModeIndicator() {
    // 检查是否已存在
    let indicator = document.querySelector('.connect-mode');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'connect-mode';
        indicator.innerHTML = '<i class="fas fa-link"></i> 连线模式已启用';
        document.body.appendChild(indicator);
    }
    
    return indicator;
}
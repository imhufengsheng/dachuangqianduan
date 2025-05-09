/**
 * export.js - 处理JSON数据导出和代码生成
 * 负责将可视化模型转换为JSON格式和生成对应的代码
 */

/**
 * 将当前模型导出为JSON格式
 * @param {Object} appState - 应用状态
 * @returns {string} - JSON字符串
 */
export function exportToJSON(appState) {
    // 创建导出对象
    const exportData = {
        modules: appState.modules.map(module => ({
            id: module.id,
            type: module.type,
            params: module.params
        })),
        connections: appState.connections.map(conn => ({
            source: conn.sourceId,
            target: conn.targetId
        }))
    };
    
    // 转换为JSON字符串
    const jsonString = JSON.stringify(exportData, null, 2);
    
    // 可选：触发下载
    downloadJSON(jsonString, 'neural_network_model.json');
    
    return jsonString;
}

/**
 * 触发JSON文件下载
 * @param {string} jsonString - JSON字符串
 * @param {string} filename - 文件名
 */
function downloadJSON(jsonString, filename) {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * 生成模型代码
 * @param {Object} appState - 应用状态
 * @returns {string} - 生成的代码
 */
export function generateCode(appState) {
    // 如果没有模块，返回空代码
    if (appState.modules.length === 0) {
        return '// 请先添加模块到画布';
    }
    
    // 创建拓扑排序
    const sortedModules = topologicalSort(appState.modules, appState.connections);
    
    // 如果拓扑排序失败（存在循环），返回错误信息
    if (!sortedModules) {
        return '// 错误：模型中存在循环连接，无法生成代码';
    }
    
    // 生成Python代码
    return generatePythonCode(sortedModules, appState.connections);
}

/**
 * 对模块进行拓扑排序
 * @param {Array} modules - 模块数组
 * @param {Array} connections - 连接数组
 * @returns {Array|null} - 排序后的模块数组，如果存在循环则返回null
 */
function topologicalSort(modules, connections) {
    // 创建邻接表
    const adjacencyList = {};
    modules.forEach(module => {
        adjacencyList[module.id] = [];
    });
    
    // 填充邻接表
    connections.forEach(conn => {
        adjacencyList[conn.sourceId].push(conn.targetId);
    });
    
    // 计算入度
    const inDegree = {};
    modules.forEach(module => {
        inDegree[module.id] = 0;
    });
    
    connections.forEach(conn => {
        inDegree[conn.targetId]++;
    });
    
    // 找出入度为0的节点
    const queue = [];
    modules.forEach(module => {
        if (inDegree[module.id] === 0) {
            queue.push(module.id);
        }
    });
    
    // 拓扑排序
    const result = [];
    while (queue.length > 0) {
        const currentId = queue.shift();
        const currentModule = modules.find(m => m.id === currentId);
        result.push(currentModule);
        
        adjacencyList[currentId].forEach(neighborId => {
            inDegree[neighborId]--;
            if (inDegree[neighborId] === 0) {
                queue.push(neighborId);
            }
        });
    }
    
    // 检查是否所有节点都被访问
    if (result.length !== modules.length) {
        return null; // 存在循环
    }
    
    return result;
}

/**
 * 生成Python代码
 * @param {Array} sortedModules - 拓扑排序后的模块数组
 * @param {Array} connections - 连接数组
 * @returns {string} - 生成的Python代码
 */
function generatePythonCode(sortedModules, connections) {
    let code = '# 导入必要的库\nimport tensorflow as tf\nfrom tensorflow.keras.models import Model\nfrom tensorflow.keras.layers import *\n\n';
    
    // 生成层定义
    code += '# 定义模型层\n';
    sortedModules.forEach(module => {
        code += generateLayerCode(module);
    });
    
    // 生成连接代码
    code += '\n# 定义层之间的连接\n';
    
    // 找出输入层和输出层
    const inputModules = sortedModules.filter(m => m.type === 'input');
    const outputModules = [];
    
    // 找出没有出边的节点作为输出层
    sortedModules.forEach(module => {
        const hasOutgoing = connections.some(conn => conn.sourceId === module.id);
        if (!hasOutgoing && module.type !== 'input') {
            outputModules.push(module);
        }
    });
    
    // 生成连接代码
    connections.forEach(conn => {
        const sourceModule = sortedModules.find(m => m.id === conn.sourceId);
        const targetModule = sortedModules.find(m => m.id === conn.targetId);
        code += `${getVariableName(targetModule.id)} = ${getVariableName(sourceModule.id)}(${getVariableName(targetModule.id)})\n`;
    });
    
    // 生成模型定义
    code += '\n# 创建模型\n';
    if (inputModules.length > 0 && outputModules.length > 0) {
        const inputVars = inputModules.map(m => getVariableName(m.id)).join(', ');
        const outputVars = outputModules.map(m => getVariableName(m.id)).join(', ');
        code += `model = Model(inputs=[${inputVars}], outputs=[${outputVars}])\n`;
        code += '\n# 编译模型\nmodel.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])\n';
        code += '\n# 打印模型摘要\nmodel.summary()\n';
    } else {
        code += '# 错误：未找到有效的输入层或输出层\n';
    }
    
    return code;
}

/**
 * 生成层定义代码
 * @param {Object} module - 模块对象
 * @returns {string} - 层定义代码
 */
function generateLayerCode(module) {
    const varName = getVariableName(module.id);
    let code = '';
    
    switch (module.type) {
        case 'input':
            const shape = module.params.shape || '(28, 28, 1)';
            code = `${varName} = Input(shape=${shape})\n`;
            break;
            
        case 'conv2d':
            const filters = module.params.filters || 32;
            const kernelSize = module.params.kernel_size || 3;
            const activation = module.params.activation || 'relu';
            const padding = module.params.padding || 'same';
            const strides = module.params.strides || 1;
            code = `${varName} = Conv2D(filters=${filters}, kernel_size=${kernelSize}, strides=${strides}, padding='${padding}', activation='${activation}')\n`;
            break;
            
        case 'pooling':
            const poolSize = module.params.pool_size || 2;
            const poolStrides = module.params.strides || 2;
            const poolType = module.params.pool_type || 'max';
            if (poolType === 'max') {
                code = `${varName} = MaxPooling2D(pool_size=${poolSize}, strides=${poolStrides})\n`;
            } else {
                code = `${varName} = AveragePooling2D(pool_size=${poolSize}, strides=${poolStrides})\n`;
            }
            break;
            
        case 'activation':
            const activationType = module.params.activation || 'relu';
            code = `${varName} = Activation('${activationType}')\n`;
            break;
            
        case 'regularization':
            const regType = module.params.type || 'l1_l2';
            const l1 = module.params.l1 || 0.01;
            const l2 = module.params.l2 || 0.01;
            
            if (regType === 'l1') {
                code = `${varName} = ActivityRegularization(l1=${l1})\n`;
            } else if (regType === 'l2') {
                code = `${varName} = ActivityRegularization(l2=${l2})\n`;
            } else {
                code = `${varName} = ActivityRegularization(l1=${l1}, l2=${l2})\n`;
            }
            break;
            
        case 'normalization':
            const normType = module.params.type || 'batch';
            const axis = module.params.axis || -1;
            const momentum = module.params.momentum || 0.99;
            const epsilon = module.params.epsilon || 0.001;
            
            if (normType === 'batch') {
                code = `${varName} = BatchNormalization(axis=${axis}, momentum=${momentum}, epsilon=${epsilon})\n`;
            } else if (normType === 'layer') {
                code = `${varName} = LayerNormalization(axis=${axis}, epsilon=${epsilon})\n`;
            } else {
                // 对于其他标准化类型，使用BatchNormalization作为默认
                code = `${varName} = BatchNormalization(axis=${axis}, momentum=${momentum}, epsilon=${epsilon}) # ${normType} normalization\n`;
            }
            break;
            
        case 'dense':
            const units = module.params.units || 128;
            const denseActivation = module.params.activation || 'relu';
            code = `${varName} = Dense(units=${units}, activation='${denseActivation}')\n`;
            break;
            
        case 'dropout':
            const rate = module.params.rate || 0.25;
            code = `${varName} = Dropout(rate=${rate})\n`;
            break;
            
        case 'lstm':
            const lstmUnits = module.params.units || 64;
            const returnSequences = module.params.return_sequences || true;
            code = `${varName} = LSTM(units=${lstmUnits}, return_sequences=${returnSequences})\n`;
            break;
            
        case 'gru':
            const gruUnits = module.params.units || 64;
            const gruReturnSequences = module.params.return_sequences || true;
            code = `${varName} = GRU(units=${gruUnits}, return_sequences=${gruReturnSequences})\n`;
            break;
            
        case 'rnn':
            const rnnUnits = module.params.units || 32;
            const rnnActivation = module.params.activation || 'tanh';
            code = `${varName} = SimpleRNN(units=${rnnUnits}, activation='${rnnActivation}')\n`;
            break;
            
        case 'output':
            const outputUnits = module.params.units || 10;
            const outputActivation = module.params.activation || 'softmax';
            code = `${varName} = Dense(units=${outputUnits}, activation='${outputActivation}')\n`;
            break;
            
        default:
            code = `${varName} = Lambda(lambda x: x) # 未知层类型: ${module.type}\n`;
    }
    
    return code;
}

/**
 * 获取模块的变量名
 * @param {string} moduleId - 模块ID
 * @returns {string} - 变量名
 */
function getVariableName(moduleId) {
    // 从moduleId中提取数字部分作为变量名
    const match = moduleId.match(/module-(\d+)/);
    if (match) {
        return `layer_${match[1]}`;
    }
    return moduleId.replace('module-', 'layer_');
}
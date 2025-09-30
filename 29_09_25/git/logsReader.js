const designationSets = [
    ['HCapA', 'CAP', 'HCapB'],
    ['1x2A', '1x2D', '1x2B'],
    ['GM', 'G', 'GL'],
    ['CM', 'C', 'CL']
];

function getbmker(line) {
    if (line.includes('OnTe_ZeTu_ZeEt_ZeTu_')) return 'b36';
    if (line.includes('OnTe_ZeTu_ZeEt_e')) return '1x';
    if (line.includes('OnTe_ZeTu_ZeEt_ZeRe_')) return 'CBe';
    if (line.includes('OnTe_ZeTu_ZeEt_OnFi_')) return 'BMr';
    return null;
}

function classifyLine(line) {
    if (line.length < 5) return 'separator';
    if (getbmker(line)) return 'main_indicator';
    if (line.startsWith('ZeOn_0OnTu_') && line.split('_').length <= 3) return 'additional_indicator';
    if (line.match(/[0-9]/)) return 'data';
    return 'unknown';
}

function isSeparatorSequence(lines, startIndex) {
    // Проверяем, идут ли 2 или более строки-разделители подряд
    let count = 0;
    for (let i = startIndex; i < lines.length; i++) {
        if (classifyLine(lines[i]) === 'separator') {
            count++;
        } else {
            break;
        }
    }
    return count >= 2;
}

function detectScenarioType(block) {
    let dataCount = 0;
    let hasMainIndicator = false;
    let hasAdditionalIndicator = false;
    let mainIndicatorIndex = -1;
    let additionalIndicatorIndex = -1;
    let dataIndices = [];

    for (let i = 0; i < block.length; i++) {
        const { type } = block[i];
        if (type === 'data') {
            dataCount++;
            dataIndices.push(i);
        } else if (type === 'main_indicator') {
            hasMainIndicator = true;
            mainIndicatorIndex = i;
        } else if (type === 'additional_indicator') {
            hasAdditionalIndicator = true;
            additionalIndicatorIndex = i;
        }
    }

    // Сценарий A: 9 строк данных, дополнительный индикатор после 3-х строк, основной после 6-и
    if (dataCount === 9 && hasMainIndicator && hasAdditionalIndicator) {
        return 'A';
    }
    // Сценарий B: 6 строк данных, только основной индикатор
    else if (dataCount === 6 && hasMainIndicator && !hasAdditionalIndicator) {
        return 'B';
    }
    // Сценарий C: 3 строки данных, основной индикатор, затем дополнительный индикатор
    else if (dataCount === 3 && hasMainIndicator && hasAdditionalIndicator && 
             mainIndicatorIndex < additionalIndicatorIndex) {
        return 'C';
    }
    // Сценарий D: 3 строки данных, дополнительный индикатор, затем основной индикатор
    else if (dataCount === 3 && hasMainIndicator && hasAdditionalIndicator && 
             additionalIndicatorIndex < mainIndicatorIndex) {
        return 'D';
    }
    // Специальный случай: только строки данных без индикаторов (матчи 9, 10)
    else if (dataCount === 3 && !hasMainIndicator && !hasAdditionalIndicator) {
        return 'data_only';
    }

    return 'unknown';
}

function processScenarioA(block, bmker, designationSet) {
    const comments = [];
    let dataIndex = 0;
    
    for (const { line, type } of block) {
        if (type === 'data') {
            let comment;
            if (dataIndex < 3) {
                comment = `old_${designationSet[dataIndex % 3]}_${bmker}`;
            } else if (dataIndex < 6) {
                comment = `live_${designationSet[dataIndex % 3]}_${bmker}`;
            } else if (dataIndex < 9) {
                comment = `new_${designationSet[dataIndex % 3]}_${bmker}`;
            }
            comments.push(`${line} # ${comment}`);
            dataIndex++;
        } else if (type === 'main_indicator') {
            comments.push(`${line} # Основной индикатор (${bmker})`);
        } else if (type === 'additional_indicator') {
            comments.push(`${line} # Дополнительный индикатор`);
        } else {
            comments.push(`${line} # Неизвестная строка`);
        }
    }
    
    return comments;
}

function processScenarioB(block, bmker, designationSet) {
    const comments = [];
    let dataIndex = 0;
    
    for (const { line, type } of block) {
        if (type === 'data') {
            let comment;
            if (dataIndex < 3) {
                comment = `old_${designationSet[dataIndex % 3]}_${bmker}`;
            } else if (dataIndex < 6) {
                comment = `new_${designationSet[dataIndex % 3]}_${bmker}`;
            }
            comments.push(`${line} # ${comment}`);
            dataIndex++;
        } else if (type === 'main_indicator') {
            comments.push(`${line} # Основной индикатор (${bmker})`);
        } else {
            comments.push(`${line} # Неизвестная строка`);
        }
    }
    
    return comments;
}

function processScenarioC(block, bmker, designationSet) {
    const comments = [];
    let dataIndex = 0;
    
    for (const { line, type } of block) {
        if (type === 'data') {
            const comment = `old_${designationSet[dataIndex % 3]}_${bmker}`;
            comments.push(`${line} # ${comment}`);
            dataIndex++;
        } else if (type === 'main_indicator') {
            comments.push(`${line} # Основной индикатор (${bmker})`);
        } else if (type === 'additional_indicator') {
            comments.push(`${line} # Дополнительный индикатор`);
        } else {
            comments.push(`${line} # Неизвестная строка`);
        }
    }
    
    return comments;
}

function processScenarioD(block, bmker, designationSet) {
    const comments = [];
    let dataIndex = 0;
    
    for (const { line, type } of block) {
        if (type === 'additional_indicator') {
            comments.push(`${line} # Дополнительный индикатор`);
        } else if (type === 'data') {
            const comment = `live_${designationSet[dataIndex % 3]}_${bmker}`;
            comments.push(`${line} # ${comment}`);
            dataIndex++;
        } else if (type === 'main_indicator') {
            comments.push(`${line} # Основной индикатор (${bmker})`);
        } else {
            comments.push(`${line} # Неизвестная строка`);
        }
    }
    
    return comments;
}

function processDataOnlyBlock(block, globalContext) {
    const comments = [];
    let dataIndex = 0;
    
    // Пытаемся определить bmker по контексту
    let bmker = globalContext.lastBookmaker || '1x'; // По умолчанию 1x для матчей 9,10
    let designationSet = ['HCapA', 'CAP', 'HCapB']; // По умолчанию первый набор
    
    // Определяем набор обозначений на основе глобального контекста
    if (globalContext.counts && globalContext.counts[bmker] !== undefined) {
        designationSet = designationSets[globalContext.counts[bmker] % designationSets.length];
    }
    
    for (const { line, type } of block) {
        if (type === 'data') {
            const comment = `live_${designationSet[dataIndex % 3]}_${bmker}`;
            comments.push(`${line} # ${comment}`);
            dataIndex++;
        }
    }
    
    return comments;
}

function processScenarioBlock(block, counts) {
    // Определяем букмекера
    let bmker = null;
    for (const { line, type } of block) {
        if (type === 'main_indicator') {
            bmker = getbmker(line);
            break;
        }
    }
    
    // Определяем тип сценария
    const scenarioType = detectScenarioType(block);
    
    // Обрабатываем блоки только с данными (без индикаторов)
    if (scenarioType === 'data_only') {
        const globalContext = { lastBookmaker: '1x', counts };
        const comments = processDataOnlyBlock(block, globalContext);
        // Выводим каждый комментарий с новой строки в том же порядке
        comments.forEach(comment => console.log(comment));
        return;
    }
    
    if (!bmker) {
        // Не выводим отладку для блоков без основных индикаторов
        return;
    }

    if (scenarioType === 'unknown') {
        console.log(`Неизвестный тип сценария для bmker ${bmker}`);
        console.log('Содержимое блока:', block.map(item => `${item.type}: ${item.line}`).join(', '));
        
        // Подсчитываем элементы для отладки
        let dataCount = 0, mainCount = 0, additionalCount = 0;
        block.forEach(({ type }) => {
            if (type === 'data') dataCount++;
            else if (type === 'main_indicator') mainCount++;
            else if (type === 'additional_indicator') additionalCount++;
        });
        console.log(`Статистика: data=${dataCount}, main_indicator=${mainCount}, additional_indicator=${additionalCount}`);
        return;
    }

    console.log(`Определен сценарий ${scenarioType} для bmker ${bmker}`);

    // Получаем набор обозначений на основе счетчика появлений bmker
    const count = counts[bmker];
    const designationSet = designationSets[count % designationSets.length];
    
    // Обрабатываем блок в зависимости от типа сценария
    let comments;
    switch (scenarioType) {
        case 'A':
            comments = processScenarioA(block, bmker, designationSet);
            break;
        case 'B':
            comments = processScenarioB(block, bmker, designationSet);
            break;
        case 'C':
            comments = processScenarioC(block, bmker, designationSet);
            break;
        case 'D':
            comments = processScenarioD(block, bmker, designationSet);
            break;
    }
    
    // Выводим результат в том же порядке, каждый комментарий с новой строки
    comments.forEach(comment => console.log(comment));
    
    // Увеличиваем счетчик для bmker
    counts[bmker] += 1;
}

function processLogs(logString) {
    const lines = logString.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const blocks = [];
    let currentBlock = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const type = classifyLine(line);
        
        if (type === 'separator') {
            // Проверяем, идут ли несколько разделителей подряд
            if (isSeparatorSequence(lines, i)) {
                // Завершаем текущий блок если он не пустой
                if (currentBlock.length > 0) {
                    blocks.push(currentBlock);
                    currentBlock = [];
                }
                // Пропускаем все разделители в последовательности
                while (i < lines.length && classifyLine(lines[i]) === 'separator') {
                    i++;
                }
                i--; // Компенсируем инкремент в цикле for
            }
            // Если это одиночный разделитель, он может быть частью блока
            else {
                // Проверяем, не является ли это четвертой строкой данных
                let dataCount = 0;
                for (const { type: blockType } of currentBlock) {
                    if (blockType === 'data') dataCount++;
                }
                
                if (dataCount === 3) {
                    // Четвертая строка данных - разделитель блоков
                    if (currentBlock.length > 0) {
                        blocks.push(currentBlock);
                        currentBlock = [];
                    }
                } else {
                    // Добавляем разделитель в текущий блок
                    currentBlock.push({ line, type });
                }
            }
        } else {
            currentBlock.push({ line, type });
        }
    }
    
    // Добавляем последний блок если он не пустой
    if (currentBlock.length > 0) {
        blocks.push(currentBlock);
    }
    
    const counts = { 'b36': 0, '1x': 0, 'CBe': 0, 'BMr': 0 };
    
    for (const block of blocks) {
        processScenarioBlock(block, counts);
    }
}

function parseLogs(logString) {
    const lines = logString.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const oddsData = { 'b36': {}, '1x': {}, 'CBe': {}, 'BMr': {} };
    const counts = { 'b36': 0, '1x': 0, 'CBe': 0, 'BMr': 0 };
    let currentBlock = [];
    
    for (const line of lines) {
        const type = classifyLine(line);
        if (type === 'separator') {
            if (currentBlock.length > 0) {
                parseMainBlock(currentBlock, oddsData, counts);
                currentBlock = [];
            }
        } else {
            currentBlock.push({ line, type });
        }
    }
    
    if (currentBlock.length > 0) {
        parseMainBlock(currentBlock, oddsData, counts);
    }
    
    return oddsData;
}

function parseMainBlock(block, oddsData, counts) {
    let bmker = null;
    for (const { line, type } of block) {
        if (type === 'main_indicator') {
            bmker = getbmker(line);
            break;
        }
    }
    
    // Обработка блоков только с данными (без индикаторов)
    const scenarioType = detectScenarioType(block);
    if (scenarioType === 'data_only') {
        // Используем последний известный bmker или 1x по умолчанию
        bmker = '1x';
        let dataIndex = 0;
        const count = counts[bmker] || 0;
        const designationSet = designationSets[count % designationSets.length];
        
        for (const { line, type } of block) {
            if (type === 'data') {
                const designation = `live_${designationSet[dataIndex % 3]}_${bmker}`;
                const value = line.split('_').pop();
                oddsData[bmker][designation] = value;
                dataIndex++;
            }
        }
        return;
    }
    
    if (!bmker) return;
    
    const count = counts[bmker];
    const designationSet = designationSets[count % designationSets.length];
    const miniBlocks = [];
    let currentMiniBlock = [];
    
    for (const { line, type } of block) {
        if (type === 'data') {
            currentMiniBlock.push(line);
            if (currentMiniBlock.length === 3) {
                miniBlocks.push(currentMiniBlock);
                currentMiniBlock = [];
            }
        } else if (type === 'main_indicator' || type === 'additional_indicator') {
            if (currentMiniBlock.length > 0) {
                miniBlocks.push(currentMiniBlock);
                currentMiniBlock = [];
            }
        }
    }
    
    if (currentMiniBlock.length === 3) {
        miniBlocks.push(currentMiniBlock);
    }
    
    let types = [];
    if (miniBlocks.length === 3) {
        types = ['old_', 'live_', 'new_'];
    } else if (miniBlocks.length === 2) {
        types = ['old_', 'new_'];
    } else if (miniBlocks.length === 1) {
        // Определяем тип на основе сценария
        if (scenarioType === 'D') {
            types = ['live_'];
        } else {
            types = ['old_'];
        }
    } else {
        return;
    }
    
    for (let i = 0; i < miniBlocks.length; i++) {
        const type = types[i];
        for (let j = 0; j < 3; j++) {
            const designation = `${type}${designationSet[j]}_${bmker}`;
            const value = miniBlocks[i][j].split('_').pop();
            oddsData[bmker][designation] = value;
        }
    }
    
    counts[bmker] += 1;
}

module.exports = { processLogs, parseLogs };
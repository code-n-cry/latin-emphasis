// Карта диакритических знаков для долготы/краткости
const macronMap = {
    'Ā': 'A', 'ā': 'a',
    'Ē': 'E', 'ē': 'e',
    'Ī': 'I', 'ī': 'i',
    'Ō': 'O', 'ō': 'o',
    'Ū': 'U', 'ū': 'u',
    'Ȳ': 'Y', 'ȳ': 'y'
};

const breveMap = {
    'Ă': 'A', 'ă': 'a',
    'Ĕ': 'E', 'ĕ': 'e',
    'Ĭ': 'I', 'ĭ': 'i',
    'Ŏ': 'O', 'ŏ': 'o',
    'Ŭ': 'U', 'ŭ': 'u',
    'Ў': 'Y', 'ў': 'y'
};

const allDiacritics = {...macronMap, ...breveMap};

// Проверка, является ли символ долгим гласным
function isLongVowel(char) {
    return char in macronMap;
}

// Проверка, является ли символ гласным (любым)
function isVowel(char) {
    return /[AEIOUYaeiouyĀāĒēĪīŌōŪūȲȳĂăĔĕĬĭŎŏŬŭЎў]/i.test(char);
}

// Удаление диакритики
function removeDiacritics(text) {
    return text.split('').map(char => allDiacritics[char] || char).join('');
}

// Нормализация текста
function normalizeText(text) {
    return text.trim();
}

// Разбивка на слова с сохранением позиции
function tokenize(text) {
    const tokens = [];
    const regex = /[A-Za-zĀāĒēĪīŌōŪūȲȳĂăĔĕĬĭŎŏŬŭЎў‹›]+|[^A-Za-zĀāĒēĪīŌōŪūȲȳĂăĔĕĬĭŎŏŬŭЎў‹›\s]+|\s+/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
        tokens.push({
            text: match[0],
            isWord: /[A-Za-zĀāĒēĪīŌōŪūȲȳĂăĔĕĬĭŎŏŬŭЎў‹›]/.test(match[0])
        });
    }
    
    return tokens;
}

// Поиск позиции первого долгого гласного в слове
function findFirstLongVowelPosition(refWord) {
    for (let i = 0; i < refWord.length; i++) {
        if (isLongVowel(refWord[i])) {
            return i;
        }
    }
    return -1;
}

// Получение индекса гласной по позиции символа
function getVowelIndexAtPosition(word, charPosition) {
    let vowelCount = 0;
    for (let i = 0; i <= charPosition && i < word.length; i++) {
        if (isVowel(word[i])) {
            if (i === charPosition) {
                return vowelCount;
            }
            vowelCount++;
        }
    }
    return -1;
}

// Применение ударения к гласной по её индексу
function applyStressByVowelIndex(plainWord, vowelIndex) {
    if (vowelIndex === -1) {
        return plainWord;
    }
    
    let result = '';
    let currentVowelIndex = 0;
    
    for (let i = 0; i < plainWord.length; i++) {
        const char = plainWord[i];
        
        if (isVowel(char)) {
            if (currentVowelIndex === vowelIndex) {
                result += `<span class="stressed">${char}</span>`;
            } else {
                result += char;
            }
            currentVowelIndex++;
        } else {
            result += char;
        }
    }
    
    return result;
}

// Проверка, содержит ли строка разделитель (четная строка)
function hasCaesura(line) {
    return line.includes('‖') || line.includes('||');
}

// Основная функция анализа
function analyzePoetry(referenceText, inputText) {
    const refLines = referenceText.split('\n');
    const inputLines = inputText.split('\n');
    
    const outputLines = [];
    
    for (let lineIdx = 0; lineIdx < Math.max(refLines.length, inputLines.length); lineIdx++) {
        const refLine = refLines[lineIdx] ? normalizeText(refLines[lineIdx]) : '';
        const inputLine = inputLines[lineIdx] ? normalizeText(inputLines[lineIdx]) : '';
        
        if (!refLine || !inputLine) {
            outputLines.push(removeDiacritics(inputLine));
            continue;
        }
        
        // Четные строки (с палочками) - не ставим ударения
        const isEvenLine = hasCaesura(refLine);
        
        const refTokens = tokenize(refLine);
        const inputTokens = tokenize(inputLine);
        
        let outputLine = '';
        let refWordIndex = 0;
        
        // Обработка токенов
        for (let i = 0; i < inputTokens.length; i++) {
            const inputToken = inputTokens[i];
            
            if (!inputToken.isWord) {
                outputLine += removeDiacritics(inputToken.text);
                continue;
            }
            
            // Очистить слово от диакритики
            const plainWord = removeDiacritics(inputToken.text);
            
            // Найти соответствующее слово в эталоне
            let refWord = null;
            while (refWordIndex < refTokens.length) {
                if (refTokens[refWordIndex].isWord) {
                    refWord = refTokens[refWordIndex].text;
                    refWordIndex++;
                    break;
                }
                refWordIndex++;
            }
            
            if (!refWord || isEvenLine) {
                outputLine += plainWord;
                continue;
            }
            
            // Найти первый долгий гласный
            const longVowelPos = findFirstLongVowelPosition(refWord);
            
            if (longVowelPos !== -1) {
                const vowelIndex = getVowelIndexAtPosition(refWord, longVowelPos);
                outputLine += applyStressByVowelIndex(plainWord, vowelIndex);
            } else {
                outputLine += plainWord;
            }
        }
        
        outputLines.push(outputLine);
    }
    
    return outputLines.join('\n');
}

// Обработчик события
document.getElementById('analyze').addEventListener('click', () => {
    const referenceText = document.getElementById('reference').value;
    const inputText = document.getElementById('plain').value;
    
    if (!referenceText || !inputText) {
        alert('Пожалуйста, заполните оба поля!');
        return;
    }
    
    const result = analyzePoetry(referenceText, inputText);
    document.getElementById('output').innerHTML = result;
});

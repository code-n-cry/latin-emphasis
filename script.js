// Карта диакритических знаков для долготы/краткости
const macronMap = {
    'Ā': 'A', 'ā': 'a',
    'Ē': 'E', 'ē': 'e',
    'Ī': 'I', 'ī': 'i',
    'Ō': 'O', 'ō': 'o',
    'Ū': 'U', 'ū': 'u',
    'Ў': 'Y', 'ў': 'y',
    'Ȳ': 'Y', 'ȳ': 'y'
};

const breveMap = {
    'Ă': 'A', 'ă': 'a',
    'Ĕ': 'E', 'ĕ': 'e',
    'Ĭ': 'I', 'ĭ': 'i',
    'Ŏ': 'O', 'ŏ': 'o',
    'Ŭ': 'U', 'ŭ': 'u',
    'Ў': 'Y', 'ў': 'y',
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

// Нормализация текста (убрать пунктуацию, лишние пробелы)
function normalizeText(text) {
    return text.replace(/[‖|]/g, '').trim();
}

// Разбивка на слова с сохранением пунктуации
function tokenize(text) {
    const tokens = [];
    const words = text.split(/\s+/);
    
    words.forEach(word => {
        tokens.push(word);
    });
    
    return tokens;
}

// Поиск ударного слога в слове
function findStressedSyllable(refWord) {
    let syllableIndex = 0;
    let foundFirstLong = false;
    
    for (let i = 0; i < refWord.length; i++) {
        const char = refWord[i];
        
        if (isVowel(char)) {
            if (isLongVowel(char) && !foundFirstLong) {
                foundFirstLong = true;
                return syllableIndex;
            }
            syllableIndex++;
        }
    }
    
    return -1; // Ударения нет
}

// Применение ударения к слову
function applyStress(plainWord, stressedSyllableIndex) {
    if (stressedSyllableIndex === -1) {
        return plainWord;
    }
    
    let result = '';
    let syllableIndex = 0;
    
    for (let i = 0; i < plainWord.length; i++) {
        const char = plainWord[i];
        
        if (isVowel(char)) {
            if (syllableIndex === stressedSyllableIndex) {
                result += `<span class="stressed">${char}</span>`;
            } else {
                result += char;
            }
            syllableIndex++;
        } else {
            result += char;
        }
    }
    
    return result;
}

// Основная функция анализа
function analyzePoetry(referenceText, plainText) {
    const refLines = referenceText.split('\n');
    const plainLines = plainText.split('\n');
    
    const outputLines = [];
    
    for (let lineIdx = 0; lineIdx < Math.min(refLines.length, plainLines.length); lineIdx++) {
        const refLine = normalizeText(refLines[lineIdx]);
        const plainLine = normalizeText(plainLines[lineIdx]);
        
        const isOddLine = (lineIdx % 2) === 0; // 0-индексация: 0, 2, 4... = нечетные строки
        
        const refTokens = tokenize(refLine);
        const plainTokens = tokenize(plainLine);
        
        let outputLine = '';
        let foundFirstStress = false;
        
        for (let i = 0; i < Math.min(refTokens.length, plainTokens.length); i++) {
            const refToken = refTokens[i];
            const plainToken = plainTokens[i];
            
            // Извлечение слова (убрать пунктуацию)
            const refWordMatch = refToken.match(/[A-Za-zĀāĒēĪīŌōŪūȲȳĂăĔĕĬĭŎŏŬŭЎў‹›]+/);
            const plainWordMatch = plainToken.match(/[A-Za-z‹›]+/);
            
            if (!refWordMatch || !plainWordMatch) {
                outputLine += plainToken + ' ';
                continue;
            }
            
            const refWord = refWordMatch[0];
            const plainWord = plainWordMatch[0];
            
            // Найти ударный слог
            const stressedSyllable = findStressedSyllable(refWord);
            
            let processedWord = plainWord;
            
            if (isOddLine && stressedSyllable !== -1 && !foundFirstStress) {
                // Применяем ударение только к первому длинному слогу в нечетных строках
                processedWord = applyStress(plainWord, stressedSyllable);
                foundFirstStress = true;
            }
            
            // Восстановить пунктуацию
            const before = plainToken.substring(0, plainToken.indexOf(plainWord));
            const after = plainToken.substring(plainToken.indexOf(plainWord) + plainWord.length);
            
            outputLine += before + processedWord + after + ' ';
        }
        
        outputLines.push(outputLine.trim());
    }
    
    return outputLines.join('\n');
}

// Обработчик события
document.getElementById('analyze').addEventListener('click', () => {
    const referenceText = document.getElementById('reference').value;
    const plainText = document.getElementById('plain').value;
    
    if (!referenceText || !plainText) {
        alert('Пожалуйста, заполните оба поля!');
        return;
    }
    
    const result = analyzePoetry(referenceText, plainText);
    document.getElementById('output').innerHTML = result;
});

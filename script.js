// Нормализуем текст (приводим к единому стандарту Unicode NFC)
function normalizeInput(text) {
    return text ? text.normalize('NFC') : '';
}

// Проверка, является ли символ долгим гласным
// Добавлены все возможные варианты макронов и циркумфлексов (ŷ)
const longVowelsList = ['Ā','ā','Ē','ē','Ī','ī','Ō','ō','Ū','ū','Ȳ','ȳ','Ŷ','ŷ'];

function isLongVowel(char) {
    return longVowelsList.includes(char);
}

// Проверка, является ли символ гласным
function isVowel(char) {
    // Используем NFD декомпозицию для проверки базовой буквы
    const base = char.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toUpperCase();
    return "AEIOUY".includes(base);
}

// Умная очистка текста от диакритики (удаляет ударения, макроны, бреве)
function removeDiacritics(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
}

// Проверка на наличие цезуры (разделителя в пентаметре)
function isPentameter(line) {
    // Ищем двойную палочку ‖ или обычную |
    return line.includes('‖') || line.includes('|');
}

// Основная функция анализа
function analyzePoetry(referenceText, inputText) {
    // Нормализация входных данных
    referenceText = normalizeInput(referenceText);
    inputText = normalizeInput(inputText);

    const refLines = referenceText.split('\n');
    const inputLines = inputText.split('\n');
    
    const outputLines = [];
    
    for (let lineIdx = 0; lineIdx < Math.max(refLines.length, inputLines.length); lineIdx++) {
        // Берем строки, убираем лишние пробелы по краям
        const refLine = refLines[lineIdx] ? refLines[lineIdx].trim() : '';
        const inputLine = inputLines[lineIdx] ? inputLines[lineIdx].trim() : '';
        
        // Если строки пустые, просто добавляем пустую строку
        if (!refLine && !inputLine) {
            outputLines.push('');
            continue;
        }

        // Если нет reference, возвращаем просто очищенный input
        if (!refLine) {
            outputLines.push(removeDiacritics(inputLine));
            continue;
        }

        // Логика: если есть палочка (пентаметр/четная строка) -> НЕ ставим ударения
        // Если палочки нет (гекзаметр/нечетная строка) -> ставим ударения
        const shouldStress = !isPentameter(refLine);
        
        let outputLineHtml = '';
        
        // Регулярное выражение для поиска СЛОВ (использует Unicode Property Escapes \p{L})
        // Это захватывает любые буквы, включая ā, ŷ, ē и т.д.
        const wordRegex = /[\p{L}]+/gu; 
        
        let match;
        let lastIndex = 0;
        let refWords = refLine.match(wordRegex) || [];
        let wordCounter = 0;

        // Проходим по словам в INPUT строке
        // Мы используем replace с функцией, чтобы собрать строку обратно с сохранением пунктуации
        outputLineHtml = inputLine.replace(wordRegex, (plainWord) => {
            // plainWord - это слово из второго поля (например "Etsi" или "Ētsī")
            // Нам нужно найти соответствующее слово в reference
            const refWord = refWords[wordCounter];
            wordCounter++;

            // Сразу очищаем слово для вывода (чтобы убрать долготы, если они были во втором поле)
            const cleanWord = removeDiacritics(plainWord);

            // Если мы не должны ставить ударения (четная строка) или слова закончились
            if (!shouldStress || !refWord) {
                return cleanWord;
            }

            // Ищем первую долгую гласную в ETALON слове (refWord)
            let longVowelIndex = -1; // Индекс гласной (0 - первая гласная, 1 - вторая...)
            let vowelCounter = 0;

            for (const char of refWord) {
                if (isVowel(char)) {
                    if (isLongVowel(char)) {
                        longVowelIndex = vowelCounter;
                        break; // Нашли первую долгую, выходим
                    }
                    vowelCounter++;
                }
            }

            // Если долгой гласной нет
            if (longVowelIndex === -1) {
                return cleanWord;
            }

            // Применяем ударение к cleanWord
            let resultWord = '';
            let currentVowelCount = 0;
            
            for (const char of cleanWord) {
                if (isVowel(char)) {
                    if (currentVowelCount === longVowelIndex) {
                        resultWord += `<span class="stressed">${char}</span>`;
                    } else {
                        resultWord += char;
                    }
                    currentVowelCount++;
                } else {
                    resultWord += char;
                }
            }

            return resultWord;
        });

        outputLines.push(outputLineHtml);
    }
    
    return outputLines.join('\n');
}

// Привязка к кнопке
document.getElementById('analyze').addEventListener('click', () => {
    const ref = document.getElementById('reference').value;
    const inp = document.getElementById('plain').value;
    
    if(!ref) return;

    // Если второе поле пустое, используем первое как источник
    const textToProcess = inp || ref;
    
    const res = analyzePoetry(ref, textToProcess);
    document.getElementById('output').innerHTML = res;
});

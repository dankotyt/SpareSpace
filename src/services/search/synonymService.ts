export const SEARCH_SYNONYMS: Record<string, string[]> = {
    // Парковочные места
    'парковочное место': ['парковка', 'стоянка', 'паркоместо', 'автостоянка', 'паркинг', 'автопарковка'],
    'парковка': ['парковочное место', 'стоянка', 'паркоместо', 'автостоянка', 'паркинг', 'автопарковка'],
    'стоянка': ['парковочное место', 'парковка', 'паркоместо', 'автостоянка', 'паркинг', 'автопарковка'],
    'паркинг': ['парковочное место', 'парковка', 'стоянка', 'автостоянка'],

    // Кладовые
    'кладовка': ['кладовая', 'хранилище', 'кладовое помещение', 'подсобка', 'чулан', 'подсобное помещение'],
    'кладовая': ['кладовка', 'хранилище', 'кладовое помещение', 'подсобка', 'чулан', 'подсобное помещение'],
    'хранилище': ['кладовка', 'кладовая', 'кладовое помещение', 'подсобка', 'подсобное помещение'],
    'кладовое помещение': ['кладовка', 'кладовая', 'хранилище', 'подсобка'],

    // Гаражи
    'гараж': ['гаражное помещение', 'автогараж', 'машиноместо', 'бокс', 'автобокс'],
    'гаражное помещение': ['гараж', 'автогараж', 'машиноместо', 'бокс', 'автобокс'],
    'машиноместо': ['гараж', 'парковочное место', 'стоянка'],

    // Периоды
    'посуточно': ['сутки', 'ежедневно', 'на сутки', 'за сутки', 'в сутки'],
    'почасово': ['час', 'по часам', 'почасово', 'понарочно', 'за час', 'в час'],
    'помесячно': ['месяц', 'ежемесячно', 'в месяц', 'за месяц', 'помесячная аренда'],
    'понедельно': ['неделя', 'еженедельно', 'в неделю', 'за неделю', 'понедельная аренда'],

    // Локации
    'центр': ['центральный', 'в центре', 'центр города', 'центральный район'],
    'окраина': ['на окраине', 'окраинный', 'спальный район'],
    'подземная': ['подземный', 'подземная парковка', 'подземный паркинг'],

    // Размеры
    'небольшой': ['маленький', 'компактный', 'небольшая'],
    'просторный': ['большой', 'вместительный', 'просторная'],

    // Условия
    'охраняемая': ['охрана', 'под охраной', 'охраняемый', 'с охраной'],
    'крытая': ['крытый', 'под крышей', 'закрытая'],
    'отопление': ['отапливаемый', 'с отоплением', 'теплый'],
};

// Основные ключевые слова для каждого типа
export const TYPE_KEYWORDS = {
    'PARKING': ['парковочное место', 'парковка', 'стоянка', 'паркинг', 'автостоянка'],
    'STORAGE': ['кладовка', 'кладовая', 'хранилище', 'кладовое помещение'],
    'GARAGE': ['гараж', 'гаражное помещение', 'автогараж', 'бокс'],
};

export const expandQueryWithSynonyms = (query: string): string => {
    if (!query || query.trim().length === 0) return query;

    const queryLower = query.toLowerCase().trim();
    const words = queryLower.split(/\s+/);
    const expandedWords = new Set<string>();

    words.forEach(word => expandedWords.add(word));

    words.forEach(word => {
        if (SEARCH_SYNONYMS[word]) {
            SEARCH_SYNONYMS[word].forEach(synonym => {
                expandedWords.add(synonym);
            });
        }

        Object.entries(SEARCH_SYNONYMS).forEach(([mainWord, synonyms]) => {
            if (synonyms.includes(word)) {
                expandedWords.add(mainWord);
            }
        });
    });

    if (words.length > 1) {
        const twoWordPhrase = words.slice(0, 2).join(' ');
        if (SEARCH_SYNONYMS[twoWordPhrase]) {
            SEARCH_SYNONYMS[twoWordPhrase].forEach(synonym => {
                expandedWords.add(synonym);
            });
        }
    }

    return Array.from(expandedWords).join(' ');
};

// Функция для определения типа по запросу
export const determineSearchType = (query: string): string => {
    const queryLower = query.toLowerCase();

    // Проверяем ключевые слова для каждого типа
    for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
        if (keywords.some(keyword => queryLower.includes(keyword))) {
            return type;
        }
    }

    return 'SEARCH';
};

// Функция для получения всех синонимов типа
export const getTypeSynonyms = (type: string): string[] => {
    switch (type) {
        case 'PARKING':
            return TYPE_KEYWORDS.PARKING;
        case 'STORAGE':
            return TYPE_KEYWORDS.STORAGE;
        case 'GARAGE':
            return TYPE_KEYWORDS.GARAGE;
        default:
            return [];
    }
};

// Функция для нормализации запроса (приведение к основным терминам)
export const normalizeQuery = (query: string): string => {
    const queryLower = query.toLowerCase();
    let normalized = queryLower;

    // Заменяем синонимы на основные термины
    Object.entries(SEARCH_SYNONYMS).forEach(([mainTerm, synonyms]) => {
        synonyms.forEach(synonym => {
            if (queryLower.includes(synonym)) {
                normalized = normalized.replace(synonym, mainTerm);
            }
        });
    });

    return normalized;
};
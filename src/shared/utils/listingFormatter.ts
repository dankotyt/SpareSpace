export type PricePeriodType = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
export type ListingType = 'PARKING' | 'STORAGE' | 'GARAGE' | 'OTHER';

const pricePeriodMap: Record<PricePeriodType, string> = {
    'HOUR': 'час',
    'DAY': 'день',
    'WEEK': 'неделя',
    'MONTH': 'месяц'
};

const typeMap: Record<ListingType, string> = {
    'PARKING': 'Парковочное место',
    'STORAGE': 'Кладовка',
    'GARAGE': 'Гараж',
    'OTHER': 'Другое'
};

/**
 * Форматирует строку с ценой, удаляя нецифровые символы и добавляя пробелы между тысячами
 * @param price - строка с ценой для форматирования
 * @returns Отформатированную строку с ценой
 */
export const formatPrice = (price: string): string => {
    if (!price || price === '') return '';

    const cleanPrice = price.replace(/\D/g, '');

    if (cleanPrice === '') return '';

    return cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Форматирует число с пробелами между тысячами
 * @param num - число или строка для форматирования
 * @returns Отформатированную строку с пробелами между тысячами
 */
export const formatNumberWithSpaces = (num: number | string): string => {
    if (typeof num === 'string') {
        const parsedNum = parseFloat(num);
        if (isNaN(parsedNum)) return '0';
        num = parsedNum;
    }

    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Форматирует цену, убирая десятичные знаки и добавляя пробелы между тысячами
 * @param price - число или строка с ценой
 * @returns Отформатированную строку с ценой без десятичных знаков
 */
export const formatDecimal = (price: number | string): string => {
    return formatNumberWithSpaces(price);
};

/**
 * Форматирует цену с добавлением символа валюты
 * @param price - число или строка с ценой
 * @param currency - символ валюты (по умолчанию '₽')
 * @returns Отформатированную строку с ценой и валютой
 */
export const formatPriceWithCurrency = (price: number | string, currency: string = '₽'): string => {
    const formattedPrice = formatDecimal(price);
    return `${formattedPrice} ${currency}`;
};

/**
 * Форматирует цену с периодом аренды
 * @param price - число или строка с ценой
 * @param period - период аренды (час, день, неделя, месяц)
 * @param currency - символ валюты (по умолчанию '₽')
 * @returns Отформатированную строку с ценой, валютой и периодом
 */
export const formatPriceWithPeriod = (
    price: number | string,
    period: 'HOUR' | 'DAY' | 'WEEK' | 'MONTH',
    currency: string = '₽'
): string => {

    const formattedPrice = formatNumberWithSpaces(price);
    const periodText = pricePeriodMap[period] || 'период';
    return `${formattedPrice} ${currency}/${periodText}`;
};

/**
 * Форматирует тип объявления в читаемый текст
 * @param type - тип объявления
 * @returns Локализованное название типа объявления
 */
export const formatListingType = (type: ListingType): string => {
    return typeMap[type] || type;
};

/**
 * Форматирует объект объявления для отображения в UI
 * @param listing - объект объявления с сервера
 * @returns Объект объявления с добавленными полями для отображения
 */
export const formatListingForDisplay = (listing: any) => {

    const price = typeof listing.price === 'string' ? parseFloat(listing.price) : listing.price;
    const userId = listing.userId || listing.user?.id;

    return {
        ...listing,
        userId: userId,
        price: price,
        pricePeriod: listing.pricePeriod,
        displayPrice: formatPriceWithPeriod(price, listing.pricePeriod),
        displayType: formatListingType(listing.type),
        originalPrice: price,
        displayPriceShort: formatPriceWithCurrency(price)
    };
};
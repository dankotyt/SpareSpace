import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_WIDTH = 430;

// Коэффициент масштабирования
const scale = SCREEN_WIDTH / BASE_WIDTH;

// Минимальный и максимальный масштаб (опционально)
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.5;
const limitedScale = Math.min(Math.max(scale, MIN_SCALE), MAX_SCALE);

/**
 * Нормализует размер относительно базовой ширины
 * @param size - размер в пикселях при базовой ширине
 * @returns адаптированный размер с учётом плотности пикселей
 */
export const normalize = (size: number): number => {
    const newSize = size * limitedScale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Процент от ширины экрана
 * @param percent - число от 0 до 100
 */
export const wp = (percent: number): number => {
    return (SCREEN_WIDTH * percent) / 100;
};

/**
 * Процент от высоты экрана
 * @param percent - число от 0 до 100
 */
export const hp = (percent: number): number => {
    return (SCREEN_HEIGHT * percent) / 100;
};
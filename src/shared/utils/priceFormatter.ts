export const formatPrice = (price: string): string => {
    if (!price || price === '') return '';

    const cleanPrice = price.replace(/\D/g, '');

    if (cleanPrice === '') return '';

    return cleanPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
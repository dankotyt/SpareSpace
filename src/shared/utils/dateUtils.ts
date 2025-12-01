export const formatChatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        // Сегодня
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays === 1) {
        return 'Вчера';
    } else if (diffDays < 7) {
        return date.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
    }
};
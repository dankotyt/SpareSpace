export const formatChatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();

    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = nowStart.getTime() - dateStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const day = date.getDate();
    const monthNames = [
        'янв', 'фев', 'мар', 'апр', 'мая', 'июн',
        'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'
    ];
    const month = monthNames[date.getMonth()];
    const dayMonth = `${day} ${month}`;

    if (diffDays === 0) {
        // Сегодня - показываем только время
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    } else if (diffDays === 1) {
        // Вчера
        return 'вчера';
    } else if (diffDays < 7) {
        // В течение недели - день недели, день и месяц
        const days = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
        const weekday = days[date.getDay()];
        return `${weekday}, ${dayMonth}`;
    } else if (date.getFullYear() === now.getFullYear()) {
        // Более недели назад, но в этом году
        return dayMonth;
    } else {
        // Более года назад
        return `${dayMonth} ${date.getFullYear()} г.`;
    }
};

export const formatMessageDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = nowStart.getTime() - dateStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const day = date.getDate();
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const month = monthNames[date.getMonth()];
    const dayMonth = `${day} ${month}`;

    const weekdayNames = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    const weekday = weekdayNames[date.getDay()];

    if (diffDays === 0) return 'сегодня';
    if (diffDays === 1) return 'вчера';

    if (diffDays < 7) {
        // В течение недели
        return `${weekday}, ${dayMonth}`;
    } else if (date.getFullYear() === now.getFullYear()) {
        // Более недели назад, но в этом году
        return dayMonth;
    } else {
        // Более года назад
        return `${dayMonth} ${date.getFullYear()} г.`;
    }
};

export const formatChatSeparatorDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();

    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = nowStart.getTime() - dateStart.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const day = date.getDate();
    const monthNames = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    const month = monthNames[date.getMonth()];
    const dayMonth = `${day} ${month}`;

    const weekdayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const weekday = weekdayNames[date.getDay()];

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';

    if (diffDays < 7) {
        return `${weekday}, ${dayMonth}`;
    } else if (date.getFullYear() === now.getFullYear()) {
        return dayMonth;
    } else {
        return `${dayMonth} ${date.getFullYear()} г.`;
    }
};
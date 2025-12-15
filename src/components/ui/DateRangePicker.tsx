import React, {useState} from 'react';
import {Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {COLORS} from '@/shared/constants/colors';
import {Ionicons} from '@expo/vector-icons';

interface DateRangePickerProps {
    onDateRangeSelected: (start: Date, end: Date) => void;
    initialStartDate?: Date;
    initialEndDate?: Date;
    minDate?: Date;
    maxDate?: Date;
    startTime?: Date;
    endTime?: Date;
    onTimeChange?: (startTime: Date, endTime: Date) => void;
    availableDates?: Array<{start: string, end: string}>;
    bookedDates?: Array<{start: string, end: string}>;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
                                                                    onDateRangeSelected,
                                                                    initialStartDate,
                                                                    initialEndDate,
                                                                    minDate = new Date(),
                                                                    maxDate,
                                                                    startTime: externalStartTime,
                                                                    endTime: externalEndTime,
                                                                    onTimeChange,
                                                                    availableDates = [],
                                                                    bookedDates = [],
                                                                }) => {
    const [showPicker, setShowPicker] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(initialStartDate || null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(initialEndDate || null);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);

    const [internalStartTime, setInternalStartTime] = useState<Date>(() => {
        if (externalStartTime) return externalStartTime;
        const defaultTime = new Date();
        defaultTime.setHours(9, 0, 0, 0);
        return defaultTime;
    });

    const [internalEndTime, setInternalEndTime] = useState<Date>(() => {
        if (externalEndTime) return externalEndTime;
        const defaultTime = new Date();
        defaultTime.setHours(18, 0, 0, 0);
        return defaultTime;
    });

    const startTime = externalStartTime || internalStartTime;
    const endTime = externalEndTime || internalEndTime;

    const isDateAvailable = (date: Date): boolean => {
        if (availableDates.length === 0) return true;

        const dateStr = date.toISOString().split('T')[0]; // Получаем дату в формате YYYY-MM-DD

        return availableDates.some(slot => {
            const slotStart = new Date(slot.start);
            const slotEnd = new Date(slot.end);
            slotStart.setHours(0, 0, 0, 0);
            slotEnd.setHours(0, 0, 0, 0);

            return date >= slotStart && date <= slotEnd;
        });
    };

    const isDateBooked = (date: Date): boolean => {
        if (bookedDates.length === 0) return false;

        const dateStr = date.toISOString().split('T')[0];

        return bookedDates.some(booking => {
            const bookingStart = new Date(booking.start);
            const bookingEnd = new Date(booking.end);

            bookingStart.setHours(0, 0, 0, 0);
            bookingEnd.setHours(0, 0, 0, 0);

            return date >= bookingStart && date <= bookingEnd;
        });
    };

    const generateCalendar = () => {
        const today = new Date();
        const months = [];

        for (let m = 0; m < 6; m++) {
            const month = new Date(today.getFullYear(), today.getMonth() + m, 1);
            const monthData = {
                name: month.toLocaleString('ru', { month: 'long' }),
                year: month.getFullYear(),
                weeks: [] as Date[][]
            };

            const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
            const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const startDate = new Date(firstDay);
            startDate.setDate(startDate.getDate() - startDate.getDay() + (startDate.getDay() === 0 ? -6 : 1));

            const weeks = [];
            let currentDate = new Date(startDate);

            while (currentDate <= lastDay || weeks.length < 6) {
                const week = [];
                for (let i = 0; i < 7; i++) {
                    week.push(new Date(currentDate));
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                weeks.push(week);
            }

            monthData.weeks = weeks;
            months.push(monthData);
        }

        return months;
    };

    const handleDateSelect = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) return;

        // Проверяем доступность даты
        if (!isDateAvailable(date)) {
            alert('Эта дата недоступна для бронирования владельцем');
            return;
        }

        // Проверяем, не забронирована ли дата
        if (isDateBooked(date)) {
            alert('Эта дата уже забронирована другим пользователем');
            return;
        }

        if (!selectedStartDate) {
            setSelectedStartDate(date);
            setSelectedEndDate(null);
        } else if (!selectedEndDate) {
            if (date > selectedStartDate) {
                // Проверяем, что все даты в диапазоне доступны и не забронированы
                const start = selectedStartDate;
                const end = date;

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const currentDate = new Date(d);
                    if (!isDateAvailable(currentDate)) {
                        alert('Некоторые даты в выбранном диапазоне недоступны для бронирования');
                        return;
                    }
                    if (isDateBooked(currentDate)) {
                        alert('Некоторые даты в выбранном диапазоне уже забронированы');
                        return;
                    }
                }

                setSelectedEndDate(date);
            } else if (date < selectedStartDate) {
                setSelectedEndDate(selectedStartDate);
                setSelectedStartDate(date);
            } else {
                setSelectedStartDate(null);
                setSelectedEndDate(null);
            }
        } else {
            setSelectedStartDate(date);
            setSelectedEndDate(null);
        }
    };

    const handleStartTimeChange = (event: any, selectedDate?: Date) => {

        if (selectedDate) {
            const newTime = selectedDate;
            setInternalStartTime(newTime);
            onTimeChange?.(newTime, endTime);
        }
    };

    const handleEndTimeChange = (event: any, selectedDate?: Date) => {
        setShowEndTimePicker(false);
        if (selectedDate) {
            const newTime = selectedDate;
            setInternalEndTime(newTime);
            onTimeChange?.(startTime, newTime);
        }
    };

    const handleSave = () => {
        if (selectedStartDate && selectedEndDate) {
            const startDate = selectedStartDate < selectedEndDate ? selectedStartDate : selectedEndDate;
            const endDate = selectedStartDate < selectedEndDate ? selectedEndDate : selectedStartDate;

            const startDateTime = new Date(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate(),
                startTime.getHours(),
                startTime.getMinutes(),
                0,
                0
            );

            const endDateTime = new Date(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate(),
                endTime.getHours(),
                endTime.getMinutes(),
                0,
                0
            );

            if (endDateTime <= startDateTime) {
                alert('Время окончания должно быть после времени начала');
                return;
            }

            onDateRangeSelected(startDateTime, endDateTime);
            setShowPicker(false);
        }
    };

    const clearSelection = () => {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
    };

    const isDateInRange = (date: Date) => {
        if (!selectedStartDate || !selectedEndDate) return false;
        const start = selectedStartDate < selectedEndDate ? selectedStartDate : selectedEndDate;
        const end = selectedStartDate < selectedEndDate ? selectedEndDate : selectedStartDate;
        return date >= start && date <= end;
    };

    const isDateSelected = (date: Date) => {
        return date.getTime() === selectedStartDate?.getTime() ||
            date.getTime() === selectedEndDate?.getTime();
    };

    const isDatePast = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today || !isDateAvailable(date) || isDateBooked(date);
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDateRange = () => {
        if (selectedStartDate && selectedEndDate) {
            const startDate = selectedStartDate.toLocaleDateString('ru-RU');
            const endDate = selectedEndDate.toLocaleDateString('ru-RU');
            return `${startDate} ${formatTime(startTime)} - ${endDate} ${formatTime(endTime)}`;
        }
        return null;
    };

    const getInstructionsText = () => {
        if (availableDates.length > 0 && bookedDates.length > 0) {
            return '• Зеленым отмечены доступные даты\n• Серым - недоступные владельцем\n• Красным - забронированные';
        } else if (availableDates.length > 0) {
            return '• Зеленым отмечены доступные даты\n• Серым - недоступные владельцем';
        } else if (bookedDates.length > 0) {
            return '• Красным отмечены забронированные даты';
        } else {
            return '• Нажмите на дату начала аренды\n• Нажмите на дату окончания аренды\n• Промежуточные дни выделятся автоматически';
        }
    };

    const calendarMonths = generateCalendar();
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <View>
            <TouchableOpacity
                style={styles.openButton}
                onPress={() => setShowPicker(true)}
            >
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.openButtonText}>
                    {formatDateRange() || 'Выбрать даты бронирования'}
                </Text>
            </TouchableOpacity>

            <Modal
                visible={showPicker}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Выберите период бронирования</Text>
                            <TouchableOpacity onPress={() => setShowPicker(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.timeSelection}>

                            <View style={styles.timeRow}>
                                <Text style={styles.timeLabel}>Время начала</Text>
                                <DateTimePicker
                                    value={startTime}
                                    mode="time"
                                    display="default"
                                    onChange={handleStartTimeChange}
                                    style={styles.timePicker}
                                />
                            </View>

                            <View style={styles.timeSpacer} />

                            <View style={styles.timeRow}>
                                <Text style={styles.timeLabel}>Время окончания</Text>
                                <DateTimePicker
                                    value={endTime}
                                    mode="time"
                                    display="default"
                                    onChange={handleEndTimeChange}
                                    style={styles.timePicker}
                                />
                            </View>
                        </View>

                        {showStartTimePicker && (
                            <DateTimePicker
                                value={startTime}
                                mode="time"
                                display="default"
                                onChange={handleStartTimeChange}
                            />
                        )}

                        {showEndTimePicker && (
                            <DateTimePicker
                                value={endTime}
                                mode="time"
                                display="default"
                                onChange={handleEndTimeChange}
                            />
                        )}

                        <View style={styles.calendarInstructions}>
                            <Text style={styles.instructionsText}>
                                {getInstructionsText()}
                            </Text>
                        </View>

                        <ScrollView style={styles.calendarContainer}>
                            {calendarMonths.map((month, monthIndex) => (
                                <View key={monthIndex} style={styles.monthContainer}>
                                    <Text style={styles.monthTitle}>
                                        {month.name} {month.year}
                                    </Text>

                                    <View style={styles.daysHeader}>
                                        {daysOfWeek.map((day) => (
                                            <Text key={day} style={styles.dayHeader}>{day}</Text>
                                        ))}
                                    </View>

                                    {month.weeks.map((week, weekIndex) => (
                                        <View key={weekIndex} style={styles.weekRow}>
                                            {week.map((date, dayIndex) => {
                                                const isCurrentMonth = date.getMonth() === (new Date().getMonth() + monthIndex) % 12;
                                                const isToday = date.toDateString() === new Date().toDateString();
                                                const isInRange = isDateInRange(date);
                                                const isSelected = isDateSelected(date);
                                                const isPast = isDatePast(date);
                                                const isAvailable = isDateAvailable(date);
                                                const isBooked = isDateBooked(date);

                                                return (
                                                    <TouchableOpacity
                                                        key={dayIndex}
                                                        style={[
                                                            styles.dateCell,
                                                            !isCurrentMonth && styles.otherMonthDate,
                                                            isToday && styles.todayDate,
                                                            isInRange && styles.inRangeDate,
                                                            isSelected && styles.selectedDate,
                                                            (isPast || isBooked) && styles.pastDate,
                                                        ]}
                                                        onPress={() => handleDateSelect(date)}
                                                        disabled={isPast || !isCurrentMonth || !isAvailable || isBooked}
                                                    >
                                                        <Text style={[
                                                            styles.dateText,
                                                            (!isCurrentMonth || isPast || isBooked) && styles.otherMonthText,
                                                            isSelected && styles.selectedDateText,
                                                            isInRange && !isSelected && styles.inRangeDateText,
                                                        ]}>
                                                            {date.getDate()}
                                                        </Text>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.calendarActions}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={clearSelection}
                            >
                                <Text style={styles.clearButtonText}>Сбросить</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.saveButton,
                                    (!selectedStartDate || !selectedEndDate) && styles.saveButtonDisabled
                                ]}
                                onPress={handleSave}
                                disabled={!selectedStartDate || !selectedEndDate}
                            >
                                <Text style={styles.saveButtonText}>Выбрать</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    openButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 8,
    },
    openButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        padding: 20,
        width: '95%',
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    timeSelection: {
        marginBottom: 16,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    timeButton: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    timeButtonValue: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    timeSpacer: {
        height: 12,
    },
    calendarInstructions: {
        backgroundColor: COLORS.primaryLight,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    instructionsText: {
        fontSize: 12,
        color: COLORS.primary,
        lineHeight: 16,
    },
    calendarContainer: {
        maxHeight: 400,
    },
    timePicker: {
        flex: 1,
        marginLeft: 0,
        height: 40,
    },
    monthContainer: {
        marginBottom: 24,
    },
    monthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    daysHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    dayHeader: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.gray[600],
    },
    weekRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    dateCell: {
        flex: 1,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        margin: 1,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.text,
    },
    otherMonthDate: {
        opacity: 0.3,
    },
    otherMonthText: {
        color: COLORS.gray[400],
    },
    todayDate: {
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    inRangeDate: {
        backgroundColor: COLORS.primaryLight,
    },
    inRangeDateText: {
        color: COLORS.primary,
    },
    selectedDate: {
        backgroundColor: COLORS.primary,
    },
    selectedDateText: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
    pastDate: {
        opacity: 0.3,
    },
    calendarActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    clearButton: {
        flex: 1,
        backgroundColor: COLORS.gray[200],
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearButtonText: {
        color: COLORS.gray[600],
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        flex: 2,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: COLORS.gray[300],
    },
    saveButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
});
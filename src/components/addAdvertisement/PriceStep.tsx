import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface PriceStepProps {
    price: {
        daily?: string;
        weekly?: string;
        monthly?: string;
    };
    availability?: {
        startDate: string;
        endDate: string;
    };
    onPriceChange: (price: any) => void;
    onAvailabilityChange: (availability: { startDate: string; endDate: string } | undefined) => void;
}

export const PriceStep: React.FC<PriceStepProps> = ({
                                                        price,
                                                        availability,
                                                        onPriceChange,
                                                        onAvailabilityChange,
                                                    }) => {
    const [selectedPriceType, setSelectedPriceType] = useState<'daily' | 'weekly' | 'monthly' | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

    const priceTypes = [
        { key: 'daily', label: 'Цена за день', placeholder: 'руб./день' },
        { key: 'weekly', label: 'Цена за неделю', placeholder: 'руб./неделя' },
        { key: 'monthly', label: 'Цена за месяц', placeholder: 'руб./месяц' },
    ];

    // Генерация календаря на ближайшие 12 месяцев
    const generateCalendar = () => {
        const today = new Date();
        const months = [];

        for (let m = 0; m < 12; m++) {
            const month = new Date(today.getFullYear(), today.getMonth() + m, 1);
            const monthData = {
                name: month.toLocaleString('ru', { month: 'long' }),
                year: month.getFullYear(),
                weeks: [] as Date[][]
            };

            // Первый день месяца
            const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
            // Последний день месяца
            const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            // Начало с понедельника
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

    const handlePriceTypeSelect = (priceType: 'daily' | 'weekly' | 'monthly') => {
        setSelectedPriceType(priceType);
    };

    const handlePriceInputChange = (value: string) => {
        if (selectedPriceType) {
            const newPrice = { ...price, [selectedPriceType]: value };
            onPriceChange(newPrice);
        }
    };

    const handleDateSelect = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Нельзя выбрать прошедшие даты
        if (date < today) return;

        if (!selectedStartDate) {
            // Первый клик - устанавливаем начало
            setSelectedStartDate(date);
            setSelectedEndDate(null);
        } else if (!selectedEndDate) {
            // Второй клик - устанавливаем конец
            if (date > selectedStartDate) {
                setSelectedEndDate(date);
            } else {
                // Если выбрана дата раньше начала, меняем местами
                setSelectedEndDate(selectedStartDate);
                setSelectedStartDate(date);
            }
        } else {
            // Сброс и новый выбор
            setSelectedStartDate(date);
            setSelectedEndDate(null);
        }
    };

    const handleSaveAvailability = () => {
        if (selectedStartDate && selectedEndDate) {
            const availabilityData = {
                startDate: selectedStartDate.toISOString().split('T')[0],
                endDate: selectedEndDate.toISOString().split('T')[0]
            };
            onAvailabilityChange(availabilityData);
            setShowCalendar(false);
        }
    };

    const clearSelection = () => {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
    };

    const isDateInRange = (date: Date) => {
        if (!selectedStartDate || !selectedEndDate) return false;
        return date >= selectedStartDate && date <= selectedEndDate;
    };

    const isDateSelected = (date: Date) => {
        return date.getTime() === selectedStartDate?.getTime() ||
            date.getTime() === selectedEndDate?.getTime();
    };

    const isDatePast = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const formatDateRange = () => {
        if (availability) {
            const start = new Date(availability.startDate);
            const end = new Date(availability.endDate);
            return `${start.toLocaleDateString('ru')} - ${end.toLocaleDateString('ru')}`;
        }
        return null;
    };

    const getCurrentPriceValue = () => {
        return selectedPriceType ? price[selectedPriceType] || '' : '';
    };

    const calendarMonths = generateCalendar();
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Установите цену и доступность</Text>

                <View style={styles.priceOptions}>
                    {priceTypes.map((priceType) => (
                        <View key={priceType.key} style={styles.priceOption}>
                            <TouchableOpacity
                                style={styles.radioContainer}
                                onPress={() => handlePriceTypeSelect(priceType.key as any)}
                            >
                                <View style={styles.radio}>
                                    {selectedPriceType === priceType.key && <View style={styles.radioSelected} />}
                                </View>
                                <Text style={styles.radioLabel}>{priceType.label}</Text>
                            </TouchableOpacity>

                            {selectedPriceType === priceType.key && (
                                <View style={styles.priceInputContainer}>
                                    <TextInput
                                        style={styles.priceInput}
                                        value={getCurrentPriceValue()}
                                        onChangeText={handlePriceInputChange}
                                        placeholder={priceType.placeholder}
                                        placeholderTextColor={COLORS.gray[400]}
                                        keyboardType="numeric"
                                        autoFocus
                                    />
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Доступность</Text>
                <Text style={styles.sectionText}>Период аренды</Text>
                <Text style={styles.sectionSubtext}>Выберите начальную и конечную даты</Text>

                <TouchableOpacity
                    style={styles.availabilityButton}
                    onPress={() => setShowCalendar(true)}
                >
                    <Text style={styles.availabilityButtonText}>Выбрать даты</Text>
                </TouchableOpacity>

                {formatDateRange() && (
                    <Text style={styles.selectedAvailability}>
                        Выбран период: {formatDateRange()}
                    </Text>
                )}
            </View>

            {/* Модальное окно календаря */}
            <Modal
                visible={showCalendar}
                animationType="slide"
                transparent={true}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Выберите период аренды</Text>
                            <TouchableOpacity onPress={() => setShowCalendar(false)}>
                                <Ionicons name="close" size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.calendarInstructions}>
                            <Text style={styles.instructionsText}>
                                • Нажмите на дату начала аренды{'\n'}
                                • Нажмите на дату окончания аренды{'\n'}
                                • Промежуточные дни выделятся автоматически
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

                                                return (
                                                    <TouchableOpacity
                                                        key={dayIndex}
                                                        style={[
                                                            styles.dateCell,
                                                            !isCurrentMonth && styles.otherMonthDate,
                                                            isToday && styles.todayDate,
                                                            isInRange && styles.inRangeDate,
                                                            isSelected && styles.selectedDate,
                                                            isPast && styles.pastDate,
                                                        ]}
                                                        onPress={() => handleDateSelect(date)}
                                                        disabled={isPast || !isCurrentMonth}
                                                    >
                                                        <Text style={[
                                                            styles.dateText,
                                                            (!isCurrentMonth || isPast) && styles.otherMonthText,
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
                                onPress={handleSaveAvailability}
                                disabled={!selectedStartDate || !selectedEndDate}
                            >
                                <Text style={styles.saveButtonText}>Сохранить</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    sectionText: {
        fontSize: 16,
        color: COLORS.text,
        marginBottom: 4,
    },
    sectionSubtext: {
        fontSize: 14,
        color: COLORS.gray[500],
        marginBottom: 16,
    },
    priceOptions: {
        gap: 16,
    },
    priceOption: {
        gap: 12,
    },
    radioContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.primary,
    },
    radioLabel: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '500',
    },
    priceInputContainer: {
        marginLeft: 32,
    },
    priceInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray[300],
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        width: '80%',
    },
    availabilityButton: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    availabilityButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    selectedAvailability: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.gray[600],
        fontWeight: '500',
        textAlign: 'center',
    },
    // Стили для модального окна календаря
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
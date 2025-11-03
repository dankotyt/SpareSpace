import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import { COLORS } from '@/shared/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice } from '@/shared/utils/priceFormatter';

interface PriceStepProps {
    price: {
        hourly?: string;
        daily?: string;
        weekly?: string;
        monthly?: string;
    };
    availability?: {
        start: string;
        end: string;
    };
    onPriceChange: (price: any) => void;
    onAvailabilityChange: (availability: { start: string; end: string } | undefined) => void;
}

export const PriceStep: React.FC<PriceStepProps> = ({
                                                        price,
                                                        availability,
                                                        onPriceChange,
                                                        onAvailabilityChange,
                                                    }) => {
    const [formattedPrice, setFormattedPrice] = useState('');
    const [selectedPriceType, setSelectedPriceType] = useState<'hourly' | 'daily' | 'weekly' | 'monthly' | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
    const [showStartTimePicker, setShowStartTimePicker] = useState(false);
    const [showEndTimePicker, setShowEndTimePicker] = useState(false);
    const [startTime, setStartTime] = useState<Date>(() => {
        if (availability?.start) {
            return new Date(availability.start);
        }
        const defaultTime = new Date();
        defaultTime.setHours(12, 0, 0, 0);
        return defaultTime;
    });

    const [endTime, setEndTime] = useState<Date>(() => {
        if (availability?.end) {
            return new Date(availability.end);
        }
        const defaultTime = new Date();
        defaultTime.setHours(15, 0, 0, 0);
        return defaultTime;
    });

    const priceTypes = [
        { key: 'hourly', label: 'Цена в час', placeholder: 'руб./час' },
        { key: 'daily', label: 'Цена за день', placeholder: 'руб./день' },
        { key: 'weekly', label: 'Цена за неделю', placeholder: 'руб./неделя' },
        { key: 'monthly', label: 'Цена за месяц', placeholder: 'руб./месяц' },
    ];

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

    const handlePriceTypeSelect = (priceType: 'hourly' | 'daily' | 'weekly' | 'monthly') => {
        setSelectedPriceType(priceType);
        setFormattedPrice('');
    };

    const handlePriceInputChange = (value: string) => {
        const cleanedValue = value.replace(/[^\d.]/g, '');

        if (selectedPriceType) {
            const newPrice = {
                ...price,
                [selectedPriceType]: cleanedValue
            };
            onPriceChange(newPrice);
            setFormattedPrice(formatPrice(cleanedValue));
        }
    };

    const handleDateSelect = (date: Date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) return;

        if (!selectedStartDate) {
            setSelectedStartDate(date);
            setSelectedEndDate(null);
        } else if (!selectedEndDate) {
            if (date > selectedStartDate) {
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

    const handleSaveAvailability = () => {
        if (selectedStartDate && selectedEndDate) {
            const startDate = selectedStartDate < selectedEndDate ? selectedStartDate : selectedEndDate;
            const endDate = selectedStartDate < selectedEndDate ? selectedEndDate : selectedStartDate;

            const startDateTime = new Date(startDate);
            startDateTime.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);

            const endDateTime = new Date(endDate);
            endDateTime.setHours(endTime.getHours(), endTime.getMinutes(), 0, 0);

            if (endDateTime <= startDateTime) {
                alert('Время окончания должно быть после времени начала');
                return;
            }

            if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
                alert('Ошибка: неверный формат даты');
                return;
            }

            const availabilityData = {
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString()
            };

            console.log('Saving availability to parent:', availabilityData);
            onAvailabilityChange(availabilityData);
            setShowCalendar(false);
        }
    };

    const handleStartTimeChange = (event: any, selectedDate?: Date) => {
        setShowStartTimePicker(false);
        if (selectedDate) {
            setStartTime(selectedDate);
        }
    };

    const handleEndTimeChange = (event: any, selectedDate?: Date) => {
        setShowEndTimePicker(false);
        if (selectedDate) {
            setEndTime(selectedDate);
        }
    };

    const formatDateTimeRange = () => {
        if (availability && availability.start && availability.end) {
            try {
                const start = new Date(availability.start);
                const end = new Date(availability.end);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return null;
                }

                const startDate = start.toLocaleDateString('ru');
                const startTime = start.toLocaleTimeString('ru', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const endDate = end.toLocaleDateString('ru');
                const endTime = end.toLocaleTimeString('ru', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return `${startDate} ${startTime} - ${endDate} ${endTime}`;
            } catch (error) {
                console.error('Error formatting date range:', error);
                return null;
            }
        }
        return null;
    };

    const clearSelection = () => {
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        onAvailabilityChange(undefined);
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
            const start = new Date(availability.start);
            const end = new Date(availability.end);
            return `${start.toLocaleDateString('ru')} - ${end.toLocaleDateString('ru')}`;
        }
        return null;
    };

    const getCurrentPriceValue = () => {
        return selectedPriceType ? price[selectedPriceType] || '' : '';
    };

    // const renderCurrentPrices = () => {
    //     const filledPrices = Object.entries(price).filter(([_, value]) => value && value !== '');
    //
    //     if (filledPrices.length === 0) return null;
    //
    //     return (
    //         <View style={styles.currentPrices}>
    //             <Text style={styles.currentPricesTitle}>Установленные цены:</Text>
    //             {filledPrices.map(([key, value]) => {
    //                 const priceLabel = priceTypes.find(type => type.key === key)?.label || key;
    //                 return (
    //                     <View key={key} style={styles.priceItem}>
    //                         <Text style={styles.priceItemLabel}>{priceLabel}:</Text>
    //                         <Text style={styles.priceItemValue}>{formatPrice(value)} руб.</Text>
    //                     </View>
    //                 );
    //             })}
    //         </View>
    //     );
    // };

    const calendarMonths = generateCalendar();
    const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Установите цену и доступность</Text>

                {/*{renderCurrentPrices()}*/}

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
                                        keyboardType="decimal-pad"
                                        autoFocus
                                    />
                                    {formattedPrice ? (
                                        <Text style={styles.formattedPrice}>{formattedPrice} руб.</Text>
                                    ) : null}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Доступность</Text>
                <Text style={styles.sectionText}>Период аренды</Text>
                <Text style={styles.sectionSubtext}>
                    {selectedPriceType === 'hourly'
                        ? 'Для почасовой аренды укажите период, когда объект доступен'
                        : 'Выберите начальную и конечную даты'
                    }
                </Text>

                <TouchableOpacity
                    style={styles.availabilityButton}
                    onPress={() => setShowCalendar(true)}
                >
                    <Text style={styles.availabilityButtonText}>Выбрать даты</Text>
                </TouchableOpacity>
            </View>

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

                        <View style={styles.timeSelection}>
                            <Text style={styles.timeSectionTitle}>Время аренды</Text>

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
            {formatDateTimeRange() && (
                <View style={styles.availabilityInfo}>
                    <Text style={styles.selectedAvailability}>
                        Выбран период: {formatDateTimeRange()}
                    </Text>
                </View>
            )}
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
        gap: 8,
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
    formattedPrice: {
        fontSize: 14,
        color: COLORS.gray[600],
        fontStyle: 'italic',
    },
    currentPrices: {
        backgroundColor: COLORS.gray[500],
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    currentPricesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    priceItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    priceItemLabel: {
        fontSize: 12,
        color: COLORS.gray[600],
    },
    priceItemValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
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
    availabilityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 0,
        padding: 12,
        borderRadius: 8,
    },
    selectedAvailability: {
        fontSize: 14,
        color: COLORS.gray[600],
        fontWeight: '500',
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
    timeSelection: {
        marginBottom: 16,
    },
    timeSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    timeButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.primaryLight,
        borderWidth: 1,
        borderColor: COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
    },
    timeButtonLabel: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    timeButtonValue: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    timeSpacer: {
        height: 8,
    },
    timePicker: {
        flex: 1,
        marginLeft: 0,
        height: 40,
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
});
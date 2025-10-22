import React, { useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { COLORS } from '@/shared/constants/colors';
import {Ionicons} from "@expo/vector-icons";

interface PhotosStepProps {
    photos: string[];
    description: string;
    onPhotosChange: (photos: string[]) => void;
    onDescriptionChange: (description: string) => void;
}

export const PhotosStep: React.FC<PhotosStepProps> = ({
                                                          photos,
                                                          description,
                                                          onPhotosChange,
                                                          onDescriptionChange,
                                                      }) => {

    const scrollViewRef = useRef<ScrollView>(null);
    const descriptionInputRef = useRef<TextInput>(null);

    const focusOnDescription = () => {
        setTimeout(() => {
            descriptionInputRef.current?.focus();
            scrollViewRef.current?.scrollTo({ y: 300, animated: true });
        }, 100);
    };

    const pickImage = async () => {
        try {
            if (photos.length >= 10) {
                Alert.alert(
                    'Достигнут лимит',
                    'Можно загрузить не более 10 фото. Удалите некоторые фото чтобы добавить новые.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Доступ запрещен', 'Необходимо разрешение для доступа к галерее');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.8,
                allowsEditing: false,
                selectionLimit: 10 - photos.length,
            });

            console.log('ImagePicker result:', result);

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newPhotos = result.assets.map((asset) => asset.uri);
                const totalPhotos = photos.length + newPhotos.length;

                if (totalPhotos > 10) {
                    Alert.alert(
                        'Слишком много фото',
                        `Вы пытаетесь загрузить ${newPhotos.length} фото, но доступно только ${10 - photos.length} мест.`,
                        [{ text: 'OK' }]
                    );
                    return;
                }

                const updatedPhotos = [...photos, ...newPhotos];
                onPhotosChange(updatedPhotos);
                console.log(`[Фото] Загружено ${newPhotos.length} фото. Всего: ${updatedPhotos.length}`);

                if (newPhotos.length > (10 - photos.length)) {
                    const actuallyAdded = 10 - photos.length;
                    Alert.alert(
                        'Фото добавлены частично',
                        `Добавлено ${actuallyAdded} из ${newPhotos.length} выбранных фото. Достигнут лимит в 10 фото.`,
                        [{ text: 'OK' }]
                    );
                }
            } else {
                console.log('ImagePicker canceled or no assets');
            }
        } catch (error) {
            console.error('[Фото] Ошибка загрузки:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить фото');
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        onPhotosChange(newPhotos);
    };


    return (
        <KeyboardAwareScrollView
            style={styles.container}
            enableOnAndroid={true}
            extraScrollHeight={100}
            keyboardShouldPersistTaps="handled"
        >

            <View style={styles.section}>
                <Text style={styles.sectionText}>
                    Добавьте фото вашего помещения. Максимум 10 фото.
                </Text>

                {photos.length >= 10 && (
                    <View style={styles.warningContainer}>
                        <Ionicons name="warning" size={20} color={COLORS.red[500]} />
                        <Text style={styles.warningText}>Достигнут лимит в 10 фото</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.uploadContainer} onPress={pickImage}>
                    <Ionicons name="camera" size={48} color={COLORS.primary} style={styles.cameraIcon} />
                    <Text style={styles.uploadButtonText}>Загрузить фото</Text>
                </TouchableOpacity>

                {photos.length > 0 && (
                    <View style={styles.photosContainer}>
                        <Text style={styles.photosTitle}>Загруженные фото ({photos.length}/10):</Text>
                        <View style={styles.photosGrid}>
                            {photos.map((photo, index) => (
                                <View key={index} style={styles.photoItem}>
                                    <Image source={{ uri: photo }} style={styles.photo} />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removePhoto(index)}
                                    >
                                        <Ionicons name="close-circle" size={24} color={COLORS.red[500]} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.divider} />

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Описание</Text>

                <TextInput
                    style={styles.descriptionInput}
                    value={description}
                    onChangeText={onDescriptionChange}
                    placeholder="Расскажите подробнее о вашем объекте"
                    placeholderTextColor={COLORS.gray[400]}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                />
            </View>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: COLORS.white,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 14,
        color: COLORS.gray[600],
        marginBottom: 8,
        lineHeight: 20,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        padding: 12,
        borderRadius: 8,
        gap: 8,
    },
    warningText: {
        color: COLORS.red[50],
        fontSize: 14,
        fontWeight: '500',
    },
    uploadContainer: {
        height: 200,
        borderWidth: 4,
        borderColor: COLORS.primaryLight,
        borderStyle: 'dashed',
        borderRadius: 24,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 16,
    },
    cameraIcon: {
        marginBottom: 8,
        zIndex: 1,
    },
    uploadButtonText: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
        zIndex: 1,
    },
    photosContainer: {
        marginTop: 16,
    },
    photosTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 12,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    photoItem: {
        position: 'relative',
        width: 80,
        height: 80,
    },
    photo: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: COLORS.white,
        borderRadius: 12,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.gray[300],
        marginVertical: 16,
    },
    descriptionInput: {
        backgroundColor: COLORS.white,
        borderWidth: 1,
        borderColor: COLORS.gray[300],
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.text,
        minHeight: 100,
        textAlignVertical: 'top',
    },
});
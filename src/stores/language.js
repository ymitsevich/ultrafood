import { writable, derived } from 'svelte/store';

// Available languages
export const languages = {
    en: 'English',
    ru: 'Русский'
};

// Get browser language or use stored preference, fallback to English
function getBrowserLanguage() {
    try {
        // Try to get from localStorage if available
        const storedLang = localStorage.getItem('preferred_language');
        if (storedLang && languages[storedLang]) {
            return storedLang;
        }
        
        // Try to get from browser settings
        const browserLang = navigator.language.split('-')[0];
        return languages[browserLang] ? browserLang : 'en';
    } catch (error) {
        return 'en'; // Default to English on any error
    }
}

// Create the language store
const { subscribe, set, update } = writable(getBrowserLanguage());

// Dictionary of translations
export const translations = {
    en: {
        // Categories
        recent: 'Recent',
        addCategory: 'Add Category',
        
        // Food grid
        addNew: 'Add New',
        
        // Basket sidebar
        emptyBasket: 'Your basket is empty',
        submitNow: 'Submit Now',
        chooseTime: 'Choose Time',
        
        // Amount modal
        amount: 'Amount',
        save: 'Save',
        cancel: 'Cancel',
        customAmount: 'Custom amount...',
        add: 'Add',
        piece: 'pc',
        
        // Add food modal
        addFood: 'Add Food Item',
        foodName: 'Food Name',
        category: 'Category',
        tags: 'Tags', // New: for tags feature
        addNewTag: 'Add new tag...', // New: for tags feature
        selectCategory: 'Select Category',
        image: 'Image',
        uploadImage: 'Upload Image',
        searchImage: 'Search Image',
        defaultAmount: 'Default Amount',
        
        // Edit food modal
        editFood: 'Edit Food Item',
        deleteFood: 'Delete',
        calories: 'Calories (per 100g)',
        enterCalories: 'Enter calories per 100g',
        currentImage: 'Current Image',
        newCustomImage: 'New Custom Image',
        saving: 'Saving...',
        
        // Time modal
        logMeal: 'Log Meal',
        now: 'Now',
        twentyMinAgo: '20 minutes ago',
        oneHourAgo: '1 hour ago',
        custom: 'Custom time',
        chooseDate: 'Choose date',
        chooseTime: 'Choose time',
        submit: 'Submit',
        submitting: 'Submitting...',
        whenDidYouEat: 'When did you eat this?',
        selectDateError: 'Please select a date',
        errorSaving: 'Failed to save meal. Please try again.',
        errorUnexpected: 'An unexpected error occurred.',
        mealLoggedTime: 'Meal logged for {time}',
        
        // Edit meal modal
        editMeal: 'Edit Meal',
        deleteMeal: 'Delete Meal',
        confirmDelete: 'Confirm Delete',
        saveChanges: 'Save Changes',
        noMealItems: 'This meal has no items. Add at least one food item or delete the meal.',
        
        // Submitted meals
        loggedMeals: 'Your Logged Meals',
        loadMore: 'Load More',
        loading: 'Loading...',
        noMeals: 'You haven\'t logged any meals yet. Add items to your basket and submit them to log a meal.',
        
        // Categories modal
        categoryName: 'Category Name',
        enterCategoryName: 'Enter category name',
        
        // Language modal
        languageSettings: 'Language Settings',
        selectLanguage: 'Select language:',
        applyLanguage: 'Apply',
        
        // Messages
        mealLogged: 'Logged {count} items to your meal!',
        confirmDeleteMeal: 'Are you sure you want to delete this meal?',
        errorLoadingMeals: 'Failed to load submitted meals.',
        errorSaving: 'Failed to save.',
        errorDeleting: 'Failed to delete.',
        localModeActive: 'Local Mode: Changes will not be saved to the cloud.',
        cloudStorageHint: 'To enable cloud storage: create a Firestore database and set LOCAL_ONLY_MODE=false in firebase.js',
        
        // Backup modal
        dataBackup: 'Data Backup',
        creatingBackup: 'Creating backup...',
        backupCompleted: 'Backup Completed!',
        backupPrefix: 'Backup prefix:',
        foodItems: 'Food Items:',
        meals: 'Meals:',
        backupFailed: 'Backup Failed',
        
        // Export/import
        exportData: 'Export Data',
        exportingData: 'Exporting data...',
        importData: 'Import Data',
        importSuccessful: 'Import successful! Added:',
        foodItemsImported: 'food items',
        mealsImported: 'meals',
        importFailed: 'Import failed',
        errorExporting: 'Error exporting data',
        
        // Menu
        menu: 'Menu'
    },
    ru: {
        // Categories
        recent: 'Недавнее',
        addCategory: 'Добавить категорию',
        
        // Food grid
        addNew: 'Добавить',
        
        // Basket sidebar
        emptyBasket: 'Ваша корзина пуста',
        submitNow: 'Сохранить сейчас',
        chooseTime: 'Выбрать время',
        
        // Amount modal
        amount: 'Количество',
        save: 'Сохранить',
        cancel: 'Отмена',
        customAmount: 'Своё количество...',
        add: 'Добавить',
        piece: 'шт.',
        
        // Add food modal
        addFood: 'Добавить продукт',
        foodName: 'Название продукта',
        category: 'Категория',
        tags: 'Теги', // New: for tags feature
        addNewTag: 'Добавить новый тег...', // New: for tags feature
        selectCategory: 'Выберите категорию',
        image: 'Изображение',
        uploadImage: 'Загрузить изображение',
        searchImage: 'Поиск изображения',
        defaultAmount: 'Количество по умолчанию',
        
        // Edit food modal
        editFood: 'Редактировать продукт',
        deleteFood: 'Удалить',
        calories: 'Калории (на 100г)',
        enterCalories: 'Введите калории на 100г',
        currentImage: 'Текущее изображение',
        newCustomImage: 'Новое изображение',
        saving: 'Сохранение...',
        
        // Time modal
        logMeal: 'Записать прием пищи',
        now: 'Сейчас',
        twentyMinAgo: '20 минут назад',
        oneHourAgo: '1 час назад',
        custom: 'Другое время',
        chooseDate: 'Выберите дату',
        chooseTime: 'Выберите время',
        submit: 'Сохранить',
        submitting: 'Сохранение...',
        whenDidYouEat: 'Когда вы ели это?',
        selectDateError: 'Пожалуйста, выберите дату',
        errorSaving: 'Не удалось сохранить прием пищи. Попробуйте еще раз.',
        errorUnexpected: 'Произошла неожиданная ошибка.',
        mealLoggedTime: 'Прием пищи записан для {time}',
        
        // Edit meal modal
        editMeal: 'Редактировать прием пищи',
        deleteMeal: 'Удалить прием пищи',
        confirmDelete: 'Подтвердить удаление',
        saveChanges: 'Сохранить изменения',
        noMealItems: 'В этом приеме пищи нет элементов. Добавьте хотя бы один продукт или удалите прием пищи.',
        
        // Submitted meals
        loggedMeals: 'Ваши приемы пищи',
        loadMore: 'Загрузить ещё',
        loading: 'Загрузка...',
        noMeals: 'У вас еще нет записанных приемов пищи. Добавьте продукты в корзину и отправьте их, чтобы записать прием пищи.',
        
        // Categories modal
        categoryName: 'Название категории',
        enterCategoryName: 'Введите название категории',
        
        // Language modal
        languageSettings: 'Настройки языка',
        selectLanguage: 'Выберите язык:',
        applyLanguage: 'Применить',
        
        // Messages
        mealLogged: 'Записано {count} продуктов в ваш прием пищи!',
        confirmDeleteMeal: 'Вы уверены, что хотите удалить этот прием пищи?',
        errorLoadingMeals: 'Ошибка загрузки приемов пищи.',
        errorSaving: 'Ошибка сохранения.',
        errorDeleting: 'Ошибка удаления.',
        localModeActive: 'Локальный режим: изменения не будут сохранены в облаке.',
        cloudStorageHint: 'Для включения облачного хранилища: создайте базу данных Firestore и установите LOCAL_ONLY_MODE=false в firebase.js',
        
        // Backup modal
        dataBackup: 'Резервное копирование',
        creatingBackup: 'Создание резервной копии...',
        backupCompleted: 'Резервное копирование завершено!',
        backupPrefix: 'Префикс резервной копии:',
        foodItems: 'Продукты:',
        meals: 'Приемы пищи:',
        backupFailed: 'Ошибка резервного копирования',
        
        // Export/import
        exportData: 'Экспорт данных',
        exportingData: 'Экспорт данных...',
        importData: 'Импорт данных',
        importSuccessful: 'Импорт успешно выполнен! Добавлено:',
        foodItemsImported: 'продуктов',
        mealsImported: 'приемов пищи',
        importFailed: 'Ошибка импорта',
        errorExporting: 'Ошибка экспорта данных',
        
        // Menu
        menu: 'Меню'
    }
};

// Export the language store with custom methods
export const language = {
    subscribe,
    
    // Set language and save to localStorage
    set: (newLang) => {
        if (languages[newLang]) {
            try {
                localStorage.setItem('preferred_language', newLang);
            } catch (e) {
                console.warn("Could not save language preference to localStorage");
            }
            set(newLang);
        }
    },
    
    // Get the current translation for a key
    t: (key, currentLang, replacements = {}) => {
        if (!currentLang || !translations[currentLang]) {
            currentLang = 'en'; // Default fallback
        }
        
        const translation = translations[currentLang][key] || translations['en'][key] || key;
        
        // Handle replacements like {count}
        if (Object.keys(replacements).length) {
            return Object.entries(replacements).reduce((text, [key, value]) => {
                return text.replace(`{${key}}`, value);
            }, translation);
        }
        
        return translation;
    }
};

// Create a derived translation function that can be used directly
export function t(key, replacements = {}) {
    let currentLang;
    language.subscribe(value => {
        currentLang = value;
    })();
    
    return language.t(key, currentLang, replacements);
}

// Create a derived store that automatically returns translated text based on the current language
export const i18n = derived(language, $language => {
    return (key, replacements = {}) => language.t(key, $language, replacements);
});
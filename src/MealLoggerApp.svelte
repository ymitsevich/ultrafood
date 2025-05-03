<script>
    import './styles/main.css';
    import { getFoodData } from './foodData.js';
    import { foodDefaults } from './stores/foodDefaults.js';
    import { basket } from './stores/basket.js';
    
    // Import our components
    import BasketSidebar from './BasketSidebar.svelte';
    import FoodGrid from './components/FoodGrid.svelte';
    import AmountModal from './components/AmountModal.svelte';
    import TimeModal from './components/TimeModal.svelte';
    import AddFoodModal from './components/AddFoodModal.svelte';
    
    // Food data and category state
    let foodData = getFoodData();
    let currentCategory = Object.keys(foodData)[0] || '';
    
    // Add custom category if it doesn't exist
    if (!foodData.custom) {
        foodData.custom = [];
    }
    
    // Modal states
    let showAmountModal = false;
    let showTimeModal = false;
    let showAddFoodModal = false;
    let selectedFood = null;
    
    function openAmountModal(food) {
        selectedFood = food;
        showAmountModal = true;
    }
    
    function openTimeModal() {
        showTimeModal = true;
    }
    
    function openAddFoodModal() {
        showAddFoodModal = true;
    }
    
    function handleAddNewFood(newFood) {
        // Add the new food to the current category instead of always using custom
        if (!foodData[currentCategory]) {
            foodData[currentCategory] = [];
        }
        
        // Add new food to the current category
        foodData[currentCategory] = [...foodData[currentCategory], newFood];
        
        // Create a new reference for the entire foodData object to trigger reactivity
        foodData = { ...foodData };
        
        // No need to switch categories - user stays in the current category
    }
</script>

<div class="meal-logger">
    <BasketSidebar onSubmitBasket={openTimeModal} />

    <div class="main-content">
        <!-- Categories -->
        <div class="categories">
            {#each Object.keys(foodData) as category}
                <button
                    class="category-btn {currentCategory === category ? 'active' : ''}"
                    on:click={() => currentCategory = category}
                >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
            {/each}
        </div>

        <!-- Food Grid Component -->
        <FoodGrid 
            category={currentCategory} 
            foodItems={foodData[currentCategory] || []} 
            onConfigClick={openAmountModal}
            onAddNewFood={openAddFoodModal}
        />
    </div>

    <!-- Modals -->
    <AmountModal bind:showModal={showAmountModal} bind:selectedFood={selectedFood} />
    <TimeModal bind:showModal={showTimeModal} />
    <AddFoodModal bind:showModal={showAddFoodModal} onAddFood={handleAddNewFood} />
</div>

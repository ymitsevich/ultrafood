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
    
    // Food data and category state
    let foodData = getFoodData();
    let currentCategory = Object.keys(foodData)[0] || '';
    
    // Modal states
    let showAmountModal = false;
    let showTimeModal = false;
    let selectedFood = null;
    
    function openAmountModal(food) {
        selectedFood = food;
        showAmountModal = true;
    }
    
    function openTimeModal() {
        showTimeModal = true;
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
            foodItems={foodData[currentCategory]} 
            onConfigClick={openAmountModal} 
        />
    </div>

    <!-- Modals -->
    <AmountModal bind:showModal={showAmountModal} bind:selectedFood={selectedFood} />
    <TimeModal bind:showModal={showTimeModal} />
</div>

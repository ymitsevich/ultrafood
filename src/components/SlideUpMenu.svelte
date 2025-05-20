<script>
    import { fly } from 'svelte/transition';
    
    export let showMenu = false;
    export let menuItems = [];
    
    // Find the index of logged meals button for special treatment
    $: loggedMealsIndex = menuItems.findIndex(item => 
        item.icon === '📋' || 
        (item.label && typeof item.label === 'string' && item.label.includes('Logged Meals')) ||
        (item.label && typeof item.label === 'string' && item.label.includes('loggedMeals'))
    );
    
    function closeMenu() {
        showMenu = false;
    }
</script>

<div class="menu-overlay" class:visible={showMenu} on:click={closeMenu}></div>

{#if showMenu}
    <div class="slide-up-menu" transition:fly={{ y: 20, duration: 200 }}>
        {#if loggedMealsIndex !== -1}
            <!-- Put logged meals button at the top -->
            <button 
                class="menu-item logged-meals-button"
                on:click={() => {
                    if (menuItems[loggedMealsIndex].action) menuItems[loggedMealsIndex].action();
                    closeMenu();
                }}
                title={menuItems[loggedMealsIndex].label}
            >
                <div class="menu-icon">{@html menuItems[loggedMealsIndex].icon}</div>
            </button>
            <div class="menu-divider"></div>
        {/if}
        
        {#each menuItems as item, i}
            {#if i !== loggedMealsIndex}
                {#if item.type === 'divider'}
                    <!-- Skip rendering dividers -->
                {:else}
                    <button 
                        class="menu-item other-button"
                        on:click={() => {
                            if (item.action) item.action();
                            closeMenu();
                        }}
                        title={item.label}
                    >
                        <div class="menu-icon">{@html item.icon}</div>
                    </button>
                {/if}
            {/if}
        {/each}
    </div>
{/if}

<style>
    .menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.3);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s;
        z-index: 98;
    }
    
    .menu-overlay.visible {
        opacity: 1;
        pointer-events: auto;
    }
    
    .slide-up-menu {
        position: fixed;
        right: 15px;
        bottom: 70px;
        background-color: white;
        border-radius: 12px;
        padding: 6px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 99;
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    
    .menu-divider {
        height: 1px;
        background-color: #e0e0e0;
        margin: 4px 6px;
    }
    
    .menu-item {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        width: 40px;
        height: 40px;
        border: none;
        background: none;
        cursor: pointer;
        transition: all 0.2s;
        border-radius: 50%;
        text-align: center;
    }
    
    .menu-item:hover {
        background-color: #f5f5f5;
    }
    
    .menu-icon {
        font-size: 20px;
    }
    
    /* New styles for logged meals button and other buttons */
    .logged-meals-button {
        /* Make the logged meals button stand out */
        background-color: #f8f8f8;
    }
    
    .other-button {
        /* Make other buttons semi-transparent */
        opacity: 0.6;
    }
    
    .other-button:hover {
        /* Return to full opacity on hover */
        opacity: 1;
    }
</style>
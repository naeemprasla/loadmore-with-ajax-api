(function($) {
    $.fn.loadMore = function(options) {
        // Default settings
        const settings = $.extend({
            data: [],              // Array of data to load
            itemsPerPage: 10,      // Number of items to load at once
            direction: 'next',    // 'next' or 'previous'
            template: function(item) { 
                // Default template - override this with your custom template
                return `<div class="item">${JSON.stringify(item)}</div>`; 
            },
            container: null,       // Container selector for items
            loadMoreBtn: null,     // Load more button selector
            loadPrevBtn: null,     // Load previous button selector
            loadingText: 'Loading...',
            noMoreText: 'No more items',
            initialLoad: true,     // Load initial items on init
            scrollToAfterLoad: true,
            optimizeDOM: true,     // Remove far items from DOM
            maxDOMItems: 50,       // Max items to keep in DOM
            onLoad: null           // Callback after load
        }, options);

        // Private variables
        let currentIndex = 0;
        let $container = settings.container ? $(settings.container) : this;

        // Initialize the plugin
        const init = function() {
            // Set up buttons
            if (settings.loadMoreBtn) {
                $(settings.loadMoreBtn).on('click', loadNext);
            }
            
            if (settings.loadPrevBtn) {
                $(settings.loadPrevBtn).on('click', loadPrevious);
            }

            // Initial load
            if (settings.initialLoad && settings.data.length > 0) {
                loadItems(settings.direction);
            }
        };

        // Load next items from data array
        const loadNext = function() {
            loadItems('next');
        };

        // Load previous items from data array
        const loadPrevious = function() {
            loadItems('previous');
        };

        // Core function to load items from data array
        const loadItems = function(direction) {
            // Calculate indexes based on direction
            let startIndex, endIndex;
            
            if (direction === 'next') {
                startIndex = currentIndex;
                endIndex = Math.min(startIndex + settings.itemsPerPage, settings.data.length);
                currentIndex = endIndex;
            } else { // previous
                endIndex = currentIndex;
                startIndex = Math.max(0, endIndex - settings.itemsPerPage);
                currentIndex = startIndex;
            }

            // Check if we have data to load
            if ((direction === 'next' && startIndex >= settings.data.length) || 
                (direction === 'previous' && startIndex <= 0 && currentIndex <= 0)) {
                updateButtonStates();
                return;
            }

            // Get items from data array
            const itemsToLoad = settings.data.slice(startIndex, endIndex);
            
            // Show loading state
            setButtonLoading(true, direction);

            // Simulate async loading
            setTimeout(() => {
                // Render items from data
                renderItems(itemsToLoad, direction);

                // Optimize DOM if enabled
                if (settings.optimizeDOM) {
                    optimizeDOM(direction);
                }

                // Update button states
                updateButtonStates();

                // Scroll to new items if enabled
                if (settings.scrollToAfterLoad) {
                    scrollToNewItems(direction);
                }

                // Reset loading state
                setButtonLoading(false, direction);

                // Callback
                if (settings.onLoad) {
                    settings.onLoad({
                        direction: direction,
                        loadedItems: itemsToLoad,
                        startIndex: startIndex,
                        endIndex: endIndex,
                        totalLoaded: currentIndex
                    });
                }
            }, 100); // Small delay for better UX
        };

        // Render items from data array to DOM
        const renderItems = function(items, direction) {
            const html = items.map(item => settings.template(item)).join('');
            
            if (direction === 'next') {
                $container.append(html);
            } else {
                $container.prepend(html);
            }
        };

        // Optimize DOM by removing far items
        const optimizeDOM = function(direction) {
            const $allItems = $container.children();
            const totalItems = $allItems.length;
            
            if (totalItems <= settings.maxDOMItems) return;

            if (direction === 'next') {
                // Remove items from beginning when loading next
                const itemsToRemove = totalItems - settings.maxDOMItems;
                $allItems.slice(0, itemsToRemove).remove();
            } else {
                // Remove items from end when loading previous
                const itemsToRemove = totalItems - settings.maxDOMItems;
                $allItems.slice(-itemsToRemove).remove();
            }
        };

        // Update button states based on data availability
        const updateButtonStates = function() {
            // Next button state
            if (settings.loadMoreBtn) {
                const $btn = $(settings.loadMoreBtn);
                if (currentIndex >= settings.data.length) {
                    $btn.prop('disabled', true).text(settings.noMoreText);
                } else {
                    $btn.prop('disabled', false).text('Load More');
                }
            }
            
            // Previous button state
            if (settings.loadPrevBtn) {
                const $btn = $(settings.loadPrevBtn);
                if (currentIndex <= 0) {
                    $btn.prop('disabled', true).text(settings.noMoreText);
                } else {
                    $btn.prop('disabled', false).text('Load Previous');
                }
            }
        };

        // Set loading state for buttons
        const setButtonLoading = function(isLoading, direction) {
            const $btn = direction === 'next' 
                ? $(settings.loadMoreBtn) 
                : $(settings.loadPrevBtn);
            
            if ($btn.length) {
                if (isLoading) {
                    $btn.data('original-text', $btn.text())
                       .prop('disabled', true)
                       .text(settings.loadingText);
                } else {
                    $btn.prop('disabled', false)
                       .text($btn.data('original-text'));
                }
            }
        };

        // Scroll to newly loaded items
        const scrollToNewItems = function(direction) {
            const $items = $container.children();
            if ($items.length === 0) return;

            let scrollToItem;
            if (direction === 'next') {
                scrollToItem = $items.last();
            } else {
                scrollToItem = $items.first();
            }

            $('html, body').animate({
                scrollTop: scrollToItem.offset().top - 100
            }, 300);
        };

        // Public methods
        const methods = {
            loadNext: loadNext,
            loadPrevious: loadPrevious,
            reset: function() {
                currentIndex = 0;
                $container.empty();
                updateButtonStates();
                if (settings.initialLoad && settings.data.length > 0) {
                    loadItems(settings.direction);
                }
            },
            updateData: function(newData) {
                settings.data = newData;
                this.reset();
            },
            getCurrentIndex: function() {
                return currentIndex;
            },
            getLoadedCount: function() {
                return currentIndex;
            }
        };

        // Initialize the plugin
        init();

        // Return public methods
        return methods;
    };
}(jQuery));
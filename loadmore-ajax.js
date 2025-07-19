(function($) {
    $.fn.loadMore = function(options) {
        // Default settings
        const settings = $.extend({
            // Local data options
            data: [],              // Array of data to load
            useLocalData: true,    // Set false to use AJAX
            
            // AJAX options
            ajaxUrl: null,         // URL for AJAX requests
            ajaxParams: {},        // Additional parameters for AJAX
            ajaxMethod: 'GET',     // AJAX method
            ajaxDataKey: 'data',   // Key in response where data is stored
            ajaxTotalKey: 'total', // Key in response for total items count
            ajaxPageParam: 'page', // Page parameter name
            ajaxPerPageParam: 'per_page', // Items per page parameter name
            
            // Common options
            itemsPerPage: 10,
            direction: 'next',
            template: function(item) { 
                return `<div class="item">${JSON.stringify(item)}</div>`; 
            },
            container: null,
            loadMoreBtn: null,
            loadPrevBtn: null,
            loadingText: 'Loading...',
            noMoreText: 'No more items',
            initialLoad: true,
            scrollToAfterLoad: true,
            optimizeDOM: true,
            maxDOMItems: 50,
            onLoad: null,
            onError: null
        }, options);

        // Private variables
        let currentIndex = 0;
        let totalItems = 0;
        let currentPage = 1;
        let isLoading = false;
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
            if (settings.initialLoad) {
                if (settings.useLocalData && settings.data.length > 0) {
                    loadItems(settings.direction);
                } else if (!settings.useLocalData && settings.ajaxUrl) {
                    loadItems(settings.direction);
                }
            }
        };

        // Load next items
        const loadNext = function() {
            if (isLoading) return;
            settings.direction = 'next';
            loadItems('next');
        };

        // Load previous items
        const loadPrevious = function() {
            if (isLoading) return;
            settings.direction = 'previous';
            loadItems('previous');
        };

        // Core function to load items
        const loadItems = function(direction) {
            if (isLoading) return;
            isLoading = true;

            if (settings.useLocalData) {
                loadLocalItems(direction);
            } else {
                loadAjaxItems(direction);
            }
        };

        // Load items from local data array
        const loadLocalItems = function(direction) {
            // Calculate indexes
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
                isLoading = false;
                return;
            }

            // Get items from data array
            const itemsToLoad = settings.data.slice(startIndex, endIndex);
            
            // Show loading state
            setButtonLoading(true, direction);

            // Simulate async for consistency
            setTimeout(() => {
                processLoadedItems(itemsToLoad, direction, settings.data.length);
            }, 100);
        };

        // Load items via AJAX
        const loadAjaxItems = function(direction) {
            // Calculate page for AJAX request
            if (direction === 'next') {
                currentPage++;
            } else { // previous
                currentPage = Math.max(1, currentPage - 1);
            }

            // Prepare AJAX params
            const ajaxParams = $.extend({}, settings.ajaxParams, {
                [settings.ajaxPageParam]: currentPage,
                [settings.ajaxPerPageParam]: settings.itemsPerPage
            });

            // Show loading state
            setButtonLoading(true, direction);

            // Make AJAX request
            $.ajax({
                url: settings.ajaxUrl,
                type: settings.ajaxMethod,
                data: ajaxParams,
                dataType: 'json',
                success: function(response) {
                    const items = response[settings.ajaxDataKey] || [];
                    totalItems = response[settings.ajaxTotalKey] || 0;
                    processLoadedItems(items, direction, totalItems);
                },
                error: function(xhr, status, error) {
                    isLoading = false;
                    setButtonLoading(false, direction);
                    if (settings.onError) {
                        settings.onError({
                            direction: direction,
                            error: error,
                            xhr: xhr
                        });
                    }
                }
            });
        };

        // Process loaded items (common for both local and AJAX)
        const processLoadedItems = function(items, direction, total) {
            // Render items
            renderItems(items, direction);

            // Optimize DOM if enabled
            if (settings.optimizeDOM) {
                optimizeDOM(direction);
            }

            // Update button states
            updateButtonStates(total);

            // Scroll to new items if enabled
            if (settings.scrollToAfterLoad && items.length > 0) {
                scrollToNewItems(direction);
            }

            // Reset loading state
            isLoading = false;
            setButtonLoading(false, direction);

            // Callback
            if (settings.onLoad) {
                settings.onLoad({
                    direction: direction,
                    loadedItems: items,
                    currentPage: currentPage,
                    totalItems: total,
                    isLocal: settings.useLocalData
                });
            }
        };

        // Render items to the DOM
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

        // Update button states
        const updateButtonStates = function(total) {
            total = total || (settings.useLocalData ? settings.data.length : totalItems);

            // Next button state
            if (settings.loadMoreBtn) {
                const $btn = $(settings.loadMoreBtn);
                if (settings.useLocalData) {
                    if (currentIndex >= total) {
                        $btn.prop('disabled', true).text(settings.noMoreText);
                    } else {
                        $btn.prop('disabled', false).text('Load More');
                    }
                } else {
                    if (currentIndex >= total) {
                        $btn.prop('disabled', true).text(settings.noMoreText);
                    } else {
                        $btn.prop('disabled', false).text('Load More');
                    }
                }
            }
            
            // Previous button state
            if (settings.loadPrevBtn) {
                const $btn = $(settings.loadPrevBtn);
                if (currentPage <= 1) {
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
                currentPage = 1;
                $container.empty();
                updateButtonStates();
                if (settings.initialLoad) {
                    if (settings.useLocalData && settings.data.length > 0) {
                        loadItems(settings.direction);
                    } else if (!settings.useLocalData && settings.ajaxUrl) {
                        loadItems(settings.direction);
                    }
                }
            },
            updateData: function(newData) {
                if (settings.useLocalData) {
                    settings.data = newData;
                    this.reset();
                }
            },
            setAjaxUrl: function(newUrl) {
                if (!settings.useLocalData) {
                    settings.ajaxUrl = newUrl;
                    this.reset();
                }
            },
            getCurrentPage: function() {
                return currentPage;
            },
            getCurrentIndex: function() {
                return currentIndex;
            },
            getTotalItems: function() {
                return settings.useLocalData ? settings.data.length : totalItems;
            }
        };

        // Initialize the plugin
        init();

        // Return public methods
        return methods;
    };
}(jQuery));
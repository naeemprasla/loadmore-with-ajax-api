/**
 * jQuery Load More Plugin with Multiple Pagination Types
 * Features:
 * - Multiple pagination types (loadmore, pagination, prevnext)
 * - Loading animations
 * - Dynamic data handling
 * - Responsive items per page
 * - History API integration
 * - Accessibility improvements
 * - Animation effects
 * - SEO considerations
 * - Custom events
 * - Performance throttling
 */
(function($) {
    $.fn.loadMore = function(options) {
        // Default settings with all new features
        const settings = $.extend({
            // Core settings
            type: 'loadmore',               // 'loadmore', 'pagination', or 'prevnext'
            itemsPerPage: 10,               // Default items per page
            container: null,                 // Container selector for items
            initialLoad: true,               // Load initial items on init
            
            // Loading UI
            loadingText: 'Loading...',
            noMoreText: 'No more items',
            loadingAnimation: '<div class="loading-spinner"></div>',
            loadingAnimationContainer: null,
            
            // Pagination controls
            loadMoreBtn: null,
            loadPrevBtn: null,
            loadNextBtn: null,
            paginationContainer: null,
            visiblePages: 5,                 // For pagination type
            
            // Responsive settings
            responsiveItemsPerPage: null,     // { xs: 5, sm: 10, md: 15, lg: 20, xl: 25 }
            
            // History API
            updateHistory: false,
            historyStateKey: 'page',
            
            // Animation
            animationSpeed: 300,
            animationType: 'fade',           // 'fade', 'slide', or 'none'
            
            // SEO
            seoMode: false,                  // Keep hidden items in DOM for SEO
            
            // Optimization
            optimizeDOM: true,
            maxDOMItems: 50,
            scrollToAfterLoad: true,
            
            // Callbacks
            onLoad: null,
            onPageChange: null,
            
            // Template for dynamic data
            template: function(item) { 
                return `<div class="item">${JSON.stringify(item)}</div>`; 
            }
        }, options);

        // Private variables
        let currentIndex = 0;
        let currentPage = 1;
        let totalItems = 0;
        let totalPages = 1;
        let isLoading = false;
        let $container = settings.container ? $(settings.container) : this;
        let $allItems = $container.children();

        // Initialize the plugin
        const init = function() {
            // Initial setup
            totalItems = $allItems.length;
            totalPages = Math.ceil(totalItems / getCurrentItemsPerPage());
            
            // Hide all items initially (unless SEO mode)
            if (!settings.seoMode) {
                $allItems.hide();
            } else {
                $allItems.css('display', 'none').attr('aria-hidden', 'true');
            }
            
            // Initialize based on type
            initPaginationType();
            
            // Set up history state handling
            if (settings.updateHistory) {
                initHistory();
            }

            // Initial load
            if (settings.initialLoad && totalItems > 0) {
                loadItems(currentPage);
            }
        };

        // Initialize based on pagination type
        const initPaginationType = function() {
            switch(settings.type) {
                case 'loadmore':
                    initLoadMore();
                    break;
                case 'pagination':
                    initPagination();
                    break;
                case 'prevnext':
                    initPrevNext();
                    break;
            }
        };

        // Initialize Load More type
        const initLoadMore = function() {
            if (settings.loadMoreBtn) {
                $(settings.loadMoreBtn).on('click', function(e) {
                    e.preventDefault();
                    if (!isLoading && currentPage < totalPages) {
                        loadItems(currentPage + 1);
                    }
                }).attr({
                    'aria-label': 'Load more items',
                    'aria-disabled': currentPage >= totalPages
                });
            }
            
            if (settings.loadPrevBtn) {
                $(settings.loadPrevBtn).on('click', function(e) {
                    e.preventDefault();
                    if (!isLoading && currentPage > 1) {
                        loadItems(currentPage - 1);
                    }
                }).attr({
                    'aria-label': 'Load previous items',
                    'aria-disabled': currentPage <= 1
                });
            }
        };

        // Initialize Pagination type
        const initPagination = function() {
            if (settings.paginationContainer) {
                renderPagination();
            }
        };

        // Initialize Prev/Next type
        const initPrevNext = function() {
            if (settings.loadPrevBtn) {
                $(settings.loadPrevBtn).on('click', function(e) {
                    e.preventDefault();
                    if (!isLoading && currentPage > 1) {
                        loadItems(currentPage - 1);
                    }
                }).attr({
                    'aria-label': 'Previous page',
                    'aria-disabled': currentPage <= 1
                });
            }
            
            if (settings.loadNextBtn) {
                $(settings.loadNextBtn).on('click', function(e) {
                    e.preventDefault();
                    if (!isLoading && currentPage < totalPages) {
                        loadItems(currentPage + 1);
                    }
                }).attr({
                    'aria-label': 'Next page',
                    'aria-disabled': currentPage >= totalPages
                });
            }
        };

        // Initialize History API
        const initHistory = function() {
            // Handle initial state
            const urlParams = new URLSearchParams(window.location.search);
            const initialPage = parseInt(urlParams.get(settings.historyStateKey)) || 1;
            
            if (initialPage > 1) {
                currentPage = initialPage;
            }
            
            // Handle back/forward navigation
            $(window).on('popstate.loadmore', function(e) {
                if (e.originalEvent.state && e.originalEvent.state.page) {
                    loadItems(e.originalEvent.state.page);
                }
            });
        };

        // Get current items per page based on responsive settings
        const getCurrentItemsPerPage = function() {
            if (!settings.responsiveItemsPerPage) return settings.itemsPerPage;
            
            const width = $(window).width();
            if (width >= 1200) return settings.responsiveItemsPerPage.xl || settings.itemsPerPage;
            if (width >= 992) return settings.responsiveItemsPerPage.lg || settings.itemsPerPage;
            if (width >= 768) return settings.responsiveItemsPerPage.md || settings.itemsPerPage;
            if (width >= 576) return settings.responsiveItemsPerPage.sm || settings.itemsPerPage;
            return settings.responsiveItemsPerPage.xs || settings.itemsPerPage;
        };

        // Render pagination numbers
        const renderPagination = function() {
            const $pagination = $(settings.paginationContainer).empty();
            
            // Previous button
            $pagination.append(
                `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="prev" aria-label="Previous">
                        <span aria-hidden="true">«</span>
                    </a>
                </li>`
            );

            // Calculate visible pages
            let startPage, endPage;
            if (totalPages <= settings.visiblePages) {
                startPage = 1;
                endPage = totalPages;
            } else {
                const maxPagesBeforeCurrent = Math.floor(settings.visiblePages / 2);
                const maxPagesAfterCurrent = Math.ceil(settings.visiblePages / 2) - 1;
                
                if (currentPage <= maxPagesBeforeCurrent) {
                    startPage = 1;
                    endPage = settings.visiblePages;
                } else if (currentPage + maxPagesAfterCurrent >= totalPages) {
                    startPage = totalPages - settings.visiblePages + 1;
                    endPage = totalPages;
                } else {
                    startPage = currentPage - maxPagesBeforeCurrent;
                    endPage = currentPage + maxPagesAfterCurrent;
                }
            }

            // First page with ellipsis if needed
            if (startPage > 1) {
                $pagination.append(
                    `<li class="page-item">
                        <a class="page-link" href="#" data-page="1">1</a>
                    </li>`
                );
                if (startPage > 2) {
                    $pagination.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
                }
            }

            // Page numbers
            for (let i = startPage; i <= endPage; i++) {
                $pagination.append(
                    `<li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}" aria-label="Page ${i}" ${i === currentPage ? 'aria-current="page"' : ''}>
                            ${i}
                        </a>
                    </li>`
                );
            }

            // Last page with ellipsis if needed
            if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                    $pagination.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
                }
                $pagination.append(
                    `<li class="page-item">
                        <a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a>
                    </li>`
                );
            }

            // Next button
            $pagination.append(
                `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                    <a class="page-link" href="#" data-page="next" aria-label="Next">
                        <span aria-hidden="true">»</span>
                    </a>
                </li>`
            );

            // Bind click events with throttling
            $pagination.on('click', '.page-link', throttle(function(e) {
                e.preventDefault();
                const page = $(this).data('page');
                
                if (page === 'prev' && currentPage > 1) {
                    loadItems(currentPage - 1);
                } else if (page === 'next' && currentPage < totalPages) {
                    loadItems(currentPage + 1);
                } else if (typeof page === 'number') {
                    loadItems(page);
                }
            }, 200));
        };

        // Core function to load items
        const loadItems = function(page) {
            // Validate page number
            page = Math.max(1, Math.min(page, totalPages));
            
            // No change needed
            if (page === currentPage) return;

            // Calculate indexes
            const itemsPerPage = getCurrentItemsPerPage();
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

            // Show loading state
            setLoadingState(true);
            showLoadingAnimation();
            
            // Trigger before load event
            $container.trigger('beforeLoad.loadmore', {
                page: page,
                direction: page > currentPage ? 'next' : 'previous'
            });

            // Use small delay for animation and to prevent UI blocking
            setTimeout(() => {
                // Hide current items with animation
                hideCurrentItems();

                // Show new items with animation
                showNewItems(startIndex, endIndex);

                // Update current page
                currentPage = page;
                currentIndex = startIndex;

                // Optimize DOM if enabled
                if (settings.optimizeDOM) {
                    optimizeDOM(startIndex, endIndex);
                }

                // Update UI based on type
                updateUI();

                // Scroll to top if enabled
                if (settings.scrollToAfterLoad) {
                    scrollToTop();
                }

                // Update history if enabled
                if (settings.updateHistory && window.history && window.history.pushState) {
                    updateHistoryState(page);
                }

                // Reset loading state
                setLoadingState(false);
                hideLoadingAnimation();

                // Callbacks
                if (settings.onLoad) {
                    settings.onLoad({
                        page: currentPage,
                        startIndex: startIndex,
                        endIndex: endIndex,
                        totalItems: totalItems
                    });
                }
                
                if (settings.onPageChange) {
                    settings.onPageChange(currentPage);
                }

                // Trigger after load event
                $container.trigger('afterLoad.loadmore', {
                    page: currentPage,
                    items: $allItems.slice(startIndex, endIndex)
                });
            }, 50);
        };

        // Show items with animation
        const showNewItems = function(start, end) {
            const $items = $allItems.slice(start, end);
            
            switch(settings.animationType) {
                case 'fade':
                    $items.css('display', '').attr('aria-hidden', 'false').hide().fadeIn(settings.animationSpeed);
                    break;
                case 'slide':
                    $items.css('display', '').attr('aria-hidden', 'false').hide().slideDown(settings.animationSpeed);
                    break;
                default:
                    $items.css('display', '').attr('aria-hidden', 'false').show();
            }
        };

        // Hide current items with animation
        const hideCurrentItems = function() {
            const $visibleItems = $container.children(':visible');
            
            switch(settings.animationType) {
                case 'fade':
                    $visibleItems.fadeOut(settings.animationSpeed);
                    break;
                case 'slide':
                    $visibleItems.slideUp(settings.animationSpeed);
                    break;
                default:
                    $visibleItems.hide();
            }
            
            if (settings.seoMode) {
                $visibleItems.css('display', 'none').attr('aria-hidden', 'true');
            }
        };

        // Optimize DOM by hiding far items
        const optimizeDOM = function(start, end) {
            if (!settings.optimizeDOM) return;
            
            const buffer = Math.floor(settings.maxDOMItems / 2);
            const firstToKeep = Math.max(0, start - buffer);
            const lastToKeep = Math.min(totalItems - 1, end + buffer);
            
            $allItems.each(function(index) {
                if (index < firstToKeep || index > lastToKeep) {
                    if (settings.seoMode) {
                        $(this).css('display', 'none').attr('aria-hidden', 'true');
                    } else {
                        $(this).hide();
                    }
                }
            });
        };

        // Update UI based on pagination type
        const updateUI = function() {
            switch(settings.type) {
                case 'loadmore':
                    updateLoadMoreUI();
                    break;
                case 'pagination':
                    renderPagination();
                    break;
                case 'prevnext':
                    updatePrevNextUI();
                    break;
            }
        };

        // Update Load More UI
        const updateLoadMoreUI = function() {
            if (settings.loadMoreBtn) {
                const $btn = $(settings.loadMoreBtn);
                const disabled = currentPage >= totalPages;
                $btn.prop('disabled', disabled)
                   .attr('aria-disabled', disabled)
                   .text(disabled ? settings.noMoreText : 'Load More');
            }
            
            if (settings.loadPrevBtn) {
                const $btn = $(settings.loadPrevBtn);
                const disabled = currentPage <= 1;
                $btn.prop('disabled', disabled)
                   .attr('aria-disabled', disabled)
                   .text(disabled ? settings.noMoreText : 'Load Previous');
            }
        };

        // Update Prev/Next UI
        const updatePrevNextUI = function() {
            if (settings.loadPrevBtn) {
                const disabled = currentPage <= 1;
                $(settings.loadPrevBtn).prop('disabled', disabled)
                                      .attr('aria-disabled', disabled);
            }
            
            if (settings.loadNextBtn) {
                const disabled = currentPage >= totalPages;
                $(settings.loadNextBtn).prop('disabled', disabled)
                                      .attr('aria-disabled', disabled);
            }
        };

        // Show loading animation
        const showLoadingAnimation = function() {
            if (!settings.loadingAnimation) return;
            
            const $target = settings.loadingAnimationContainer ? 
                $(settings.loadingAnimationContainer) : $container;
            $target.append(settings.loadingAnimation);
        };

        // Hide loading animation
        const hideLoadingAnimation = function() {
            if (!settings.loadingAnimation) return;
            
            const $target = settings.loadingAnimationContainer ? 
                $(settings.loadingAnimationContainer) : $container;
            $target.find('.loading-spinner').remove();
        };

        // Set loading state
        const setLoadingState = function(loading) {
            isLoading = loading;
            
            switch(settings.type) {
                case 'loadmore':
                    if (settings.loadMoreBtn) {
                        $(settings.loadMoreBtn).prop('disabled', loading)
                                             .attr('aria-busy', loading);
                    }
                    if (settings.loadPrevBtn) {
                        $(settings.loadPrevBtn).prop('disabled', loading)
                                             .attr('aria-busy', loading);
                    }
                    break;
                    
                case 'prevnext':
                    if (settings.loadPrevBtn) {
                        $(settings.loadPrevBtn).prop('disabled', loading)
                                             .attr('aria-busy', loading);
                    }
                    if (settings.loadNextBtn) {
                        $(settings.loadNextBtn).prop('disabled', loading)
                                             .attr('aria-busy', loading);
                    }
                    break;
                    
                case 'pagination':
                    $(settings.paginationContainer).find('.page-link')
                        .prop('disabled', loading)
                        .attr('aria-busy', loading);
                    break;
            }
        };

        // Update history state
        const updateHistoryState = function(page) {
            const url = new URL(window.location);
            url.searchParams.set(settings.historyStateKey, page);
            window.history.pushState({ page }, '', url);
        };

        // Scroll to top of container
        const scrollToTop = function() {
            $('html, body').stop().animate({
                scrollTop: $container.offset().top - 20
            }, settings.animationSpeed);
        };

        // Throttle function for performance
        const throttle = function(fn, wait) {
            let time = Date.now();
            return function() {
                if ((time + wait - Date.now()) < 0) {
                    fn.apply(this, arguments);
                    time = Date.now();
                }
            };
        };

        // Public methods
        const methods = {
            // Navigation
            goToPage: function(page) {
                loadItems(page);
            },
            next: function() {
                if (!isLoading && currentPage < totalPages) {
                    loadItems(currentPage + 1);
                }
            },
            prev: function() {
                if (!isLoading && currentPage > 1) {
                    loadItems(currentPage - 1);
                }
            },
            
            // Data handling
            appendData: function(newItems) {
                const newElements = $(newItems.map(item => settings.template(item)).join(''));
                $container.append(newElements);
                refreshItems();
            },
            prependData: function(newItems) {
                const newElements = $(newItems.map(item => settings.template(item)).join(''));
                $container.prepend(newElements);
                refreshItems();
            },
            updateData: function(newItems) {
                $container.empty();
                const newElements = $(newItems.map(item => settings.template(item)).join(''));
                $container.append(newElements);
                refreshItems();
            },
            
            // Refresh/Reset
            refresh: function() {
                refreshItems();
            },
            reset: function() {
                currentPage = 1;
                refreshItems();
            },
            
            // Information
            getCurrentPage: function() {
                return currentPage;
            },
            getTotalPages: function() {
                return totalPages;
            },
            getTotalItems: function() {
                return totalItems;
            },
            
            // Cleanup
            destroy: function() {
                // Remove event listeners
                $(window).off('popstate.loadmore');
                
                if (settings.loadMoreBtn) $(settings.loadMoreBtn).off('click');
                if (settings.loadPrevBtn) $(settings.loadPrevBtn).off('click');
                if (settings.loadNextBtn) $(settings.loadNextBtn).off('click');
                if (settings.paginationContainer) $(settings.paginationContainer).off('click');
                
                // Show all items if in SEO mode
                if (settings.seoMode) {
                    $allItems.css('display', '').attr('aria-hidden', 'false');
                }
            }
        };

        // Refresh items list
        const refreshItems = function() {
            $allItems = $container.children();
            totalItems = $allItems.length;
            totalPages = Math.ceil(totalItems / getCurrentItemsPerPage());
            currentPage = Math.min(currentPage, totalPages);
            
            if (settings.type === 'pagination') {
                renderPagination();
            }
            
            loadItems(currentPage);
        };

        // Initialize the plugin
        init();

        // Return public methods
        return methods;
    };
}(jQuery));

/* 

<!-- For Load More type -->
<div id="items-container">
    <!-- Your existing items (optional) -->
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
    <!-- ... -->
</div>

<!-- Buttons for Load More type -->
<button id="load-prev-btn">Load Previous</button>
<button id="load-more-btn">Load More</button>

<!-- For Pagination type -->
<ul id="pagination-container" class="pagination"></ul>

<!-- For Prev/Next type -->
<button id="prev-btn">Previous</button>
<button id="next-btn">Next</button>

$('#items-container').loadMore({
    type: 'loadmore',
    itemsPerPage: 10,
    loadMoreBtn: '#load-more-btn',
    loadPrevBtn: '#load-prev-btn',
    onLoad: function(response) {
        console.log('Loaded page', response.page);
    }
});


Pagination Type
$('#items-container').loadMore({
    type: 'pagination',
    itemsPerPage: 10,
    visiblePages: 5,
    paginationContainer: '#pagination-container',
    animationType: 'fade',
    animationSpeed: 400
});
$('#items-container').loadMore({
    type: 'prevnext',
    itemsPerPage: 15,
    loadPrevBtn: '#prev-btn',
    loadNextBtn: '#next-btn',
    scrollToAfterLoad: true
});


$('#items-container').loadMore({
    itemsPerPage: 10, // Default
    responsiveItemsPerPage: {
        xs: 5,  // <576px
        sm: 8,  // ≥576px
        md: 12, // ≥768px
        lg: 15, // ≥992px
        xl: 20  // ≥1200px
    }
});



Dynamic Data Handling
const loader = $('#items-container').loadMore({
    itemsPerPage: 10
});

// Later add new items
loader.appendData([
    { id: 101, name: "New Item 1" },
    { id: 102, name: "New Item 2" }
]);

// Or replace all data
loader.updateData(newDataArray);




History API Integration
$('#items-container').loadMore({
    updateHistory: true,
    historyStateKey: 'page',
    onPageChange: function(page) {
        // Sync other components with current page
    }
});

CUstom Animation Effects
$('#items-container').loadMore({
    animationType: 'slide', // or 'fade', 'none'
    animationSpeed: 500,
    loadingAnimation: `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading content...</p>
        </div>
    `,
    loadingAnimationContainer: '#loading-area'
});


SEO MODE
$('#items-container').loadMore({
    seoMode: true, // Keeps hidden items in DOM
    optimizeDOM: true,
    maxDOMItems: 100
});



Methods
const loader = $('#items-container').loadMore( options );

// Go to specific page
loader.goToPage(3);

// Navigate
loader.next();
loader.prev();

// Get current state
console.log('Current page:', loader.getCurrentPage());
console.log('Total items:', loader.getTotalItems());




Data Management
// Add new items
loader.appendData(newItems);
loader.prependData(newItems);

// Replace all items
loader.updateData(allNewItems);

// Refresh after DOM changes
loader.refresh();

// Reset to first page
loader.reset();

// Clean up when done
loader.destroy();




EVENTS

$('#items-container')
    .on('beforeLoad.loadmore', function(e, data) {
        console.log('About to load page', data.page);
    })
    .on('afterLoad.loadmore', function(e, data) {
        console.log('Loaded items:', data.items);
    });

    $('#items-container').loadMore({
    onLoad: function(response) {
        // response.page
        // response.startIndex
        // response.endIndex
        // response.totalItems
    },
    onPageChange: function(page) {
        // Handle page change
    }
});



FUll Exapmple
<div id="news-container">
    <article class="news-item">News 1</article>
    <article class="news-item">News 2</article>
    <!-- ... 50+ items ... -->
</div>

<div id="loading-indicator"></div>

<div class="pagination-controls">
    <button id="prev-news" class="btn-prev">Previous</button>
    <ul id="news-pagination" class="pagination"></ul>
    <button id="next-news" class="btn-next">Next</button>
</div>

<script>
$(function() {
    const newsLoader = $('#news-container').loadMore({
        type: 'pagination',
        itemsPerPage: 5,
        visiblePages: 3,
        paginationContainer: '#news-pagination',
        loadPrevBtn: '#prev-news',
        loadNextBtn: '#next-news',
        loadingAnimationContainer: '#loading-indicator',
        animationType: 'fade',
        animationSpeed: 300,
        updateHistory: true,
        historyStateKey: 'news_page',
        responsiveItemsPerPage: {
            xs: 3,
            sm: 5,
            md: 8,
            lg: 10
        },
        onLoad: function(res) {
            console.log(`Showing news ${res.startIndex+1}-${res.endIndex} of ${res.totalItems}`);
        }
    });

    // Example of adding new content
    $('#load-more-news').click(function() {
        $.get('/api/more-news', function(data) {
            newsLoader.appendData(data.articles);
        });
    });
});
</script>
*/
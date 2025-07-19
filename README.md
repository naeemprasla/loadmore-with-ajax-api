# jQuery Load More & Pagination Plugin


## Features

- **Multiple Pagination Types**: Choose between Load More buttons, numbered pagination, or Prev/Next navigation
- **Responsive Design**: Adjusts items per page based on screen size
- **SEO Friendly**: Optional mode to keep all items in DOM for search engines
- **Smooth Animations**: Fade and slide transitions with customizable speeds
- **Dynamic Data Support**: Add/update content without page reload
- **History API Integration**: URL updates for bookmarkable pages
- **Accessibility Ready**: ARIA attributes and keyboard navigation support
- **Lightweight**: Only 8KB minified (3KB gzipped)
- **Customizable**: Extensive options for styling and behavior

## Installation

### Via npm
```bash
npm install jquery-loadmore-pagination
```

### Via CDN
```html
<script src="https://cdn.jsdelivr.net/gh/naeemprasla/loadmore-with-ajax-api@main/loadmore-noajax.js"></script>
```

### Manual Installation
1. Include jQuery:
```html
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
```
2. Include plugin:
```html
<script src="loadmore-noajax.js""></script>
```

## Basic Usage

### HTML Structure
```html
<div id="items-container">
    <!-- Existing items (optional) -->
    <div class="item">Item 1</div>
    <div class="item">Item 2</div>
    <!-- ... -->
</div>

<!-- For Load More type -->
<button id="load-more-btn">Load More</button>

<!-- For Pagination type -->
<ul id="pagination-container" class="pagination"></ul>

<!-- For Prev/Next type -->
<button id="prev-btn">Previous</button>
<button id="next-btn">Next</button>
```

### JavaScript Initialization
```javascript
// Load More type
$('#items-container').loadMore({
    type: 'loadmore',
    itemsPerPage: 10,
    loadMoreBtn: '#load-more-btn'
});

// Pagination type
$('#items-container').loadMore({
    type: 'pagination',
    itemsPerPage: 8,
    paginationContainer: '#pagination-container'
});

// Prev/Next type
$('#items-container').loadMore({
    type: 'prevnext',
    itemsPerPage: 12,
    loadPrevBtn: '#prev-btn',
    loadNextBtn: '#next-btn'
});
```

## Advanced Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `type` | string | `'loadmore'` | Pagination type (`'loadmore'`, `'pagination'`, `'prevnext'`) |
| `itemsPerPage` | number | `10` | Items to show per page |
| `responsiveItemsPerPage` | object | `null` | Responsive breakpoints: `{ xs: 5, sm: 8, md: 10, lg: 12, xl: 15 }` |
| `visiblePages` | number | `5` | Visible page numbers (pagination type) |
| `animationType` | string | `'fade'` | Animation type (`'fade'`, `'slide'`, `'none'`) |
| `animationSpeed` | number | `300` | Animation duration in ms |
| `loadingAnimation` | string | `'<div class="loading-spinner"></div>'` | Custom loading HTML |
| `seoMode` | boolean | `false` | Keep hidden items in DOM |
| `optimizeDOM` | boolean | `true` | Hide far items for performance |
| `maxDOMItems` | number | `50` | Max items to keep visible in DOM |
| `updateHistory` | boolean | `false` | Update browser history |
| `historyStateKey` | string | `'page'` | URL parameter name for history |
| `scrollToAfterLoad` | boolean | `true` | Scroll to top after loading |

## API Methods

```javascript
const loader = $('#items-container').loadMore(options);

// Navigation
loader.goToPage(3);  // Jump to specific page
loader.next();       // Next page
loader.prev();       // Previous page

// Data Management
loader.appendData(newItems);   // Add items to end
loader.prependData(newItems);  // Add items to beginning
loader.updateData(allItems);   // Replace all items

// Control
loader.refresh();    // Refresh after DOM changes
loader.reset();      // Reset to first page
loader.destroy();    // Clean up plugin

// Getters
const currentPage = loader.getCurrentPage();
const totalPages = loader.getTotalPages();
const totalItems = loader.getTotalItems();
```

## Events

```javascript
// Before load event
$('#items-container').on('beforeLoad.loadmore', function(e, data) {
    console.log('Loading page:', data.page);
});

// After load event
$('#items-container').on('afterLoad.loadmore', function(e, data) {
    console.log('Loaded items:', data.items);
});

// Callbacks
$('#items-container').loadMore({
    onLoad: function(response) {
        // Handle after load
    },
    onPageChange: function(page) {
        // Handle page change
    }
});
```

## Styling

Basic CSS for pagination:
```css
.pagination {
    display: flex;
    list-style: none;
    padding: 0;
    gap: 5px;
}

.pagination .page-item {
    margin: 0;
}

.pagination .page-link {
    padding: 5px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
    text-decoration: none;
}

.pagination .page-item.active .page-link {
    background: #007bff;
    color: white;
    border-color: #007bff;
}

.pagination .page-item.disabled .page-link {
    opacity: 0.5;
    pointer-events: none;
}

/* Loading animation */
.loading-spinner {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    border: 3px solid rgba(0,0,0,.1);
    border-radius: 50%;
    border-top-color: #007bff;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE 11 (with polyfills)

## License

MIT License

## Changelog

### 1.0.0 (2023-07-20)
- Initial release with all core features

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## Support

For issues and feature requests, please [open an issue](https://github.com/your-repo/issues) on GitHub.

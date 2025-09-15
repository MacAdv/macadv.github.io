
/* COPY OF advising.js for all Bootstrap portals */

/**
 * Handles timeout detection by checking for redirects or unauthorized access.
 * Redirects to the login page if detected.
 * @param {string} response - The server response HTML.
 * @param {object} xhr - The XMLHttpRequest object.
 * @returns {boolean} - True if timeout detected and handled, false otherwise.
 */
const handleTimeout = (response, xhr) => {
    // Check for 302 redirect or 401 unauthorized status
    if (xhr.status === 302 || xhr.status === 401) {
        const loginUrl = xhr.getResponseHeader("Location") || "/account/login";
        window.location.href = loginUrl;
        return true;
    }

    // Check for specific login page content in the HTML response
    if (xhr.status === 200 && $(response).find("body#login-page").length > 0) {
        const loginUrl = xhr.responseURL || "/account/login";
        window.location.href = loginUrl;
        return true;
    }

    return false;
};

/**
 * Updates the navigation state by managing active links and collapsed submenus.
 * @param {string} tabID - The tab URL to activate.
 */
const updateNavState = (tabUID) => {
    // Remove active state from all nav links
    $("#navbar-sidebar a").removeClass("active");

    // Add active class to the correct link by matching data-tab
    const activeLink = $(`#navbar-sidebar a[data-uid='${tabUID}']`);
    if (activeLink.length) {
        activeLink.addClass("active");

        // Collapse all submenus
        $("#navbar-sidebar .collapse").removeClass("show");

        // Expand the submenu containing the active link
        const activeSubmenu = activeLink.closest(".collapse");
        if (activeSubmenu.length) {
            activeSubmenu.addClass("show");
        }
    } else {
        console.warn(`No navigation link found for tabUID: ${tabUID}`);
    }
};

/**
 * Function to dynamically load content into a specific tab and manage browser history.
 * Handles query string manipulation, active state updates, and dynamic content loading.
 * @param {string} tab - The identifier or URL for the tab to load.
 * @param {string} queryString - The full query string from the URL.
 * @param {boolean} isBack - Indicates if the navigation is triggered by a browser back/forward action.
 */
const loadTab = (tab, queryString, isBack) => {
    const decodeQueryString = (query) => {
        return query.split('&').reduce((acc, pair) => {
            const [key, value] = pair.split('=');
            acc[decodeURIComponent(key)] = decodeURIComponent(value || '');
            return acc;
        }, {});
    };

    const encodeQueryString = (obj) => {
        return $.param(obj);
    };

    const qs = queryString ? decodeQueryString(queryString) : {};
    delete qs["tab"];

    
    const newQueryString = Object.keys(qs).length > 0 ? "&" + encodeQueryString(qs) : "";
    
    if (!isBack) {
        history.pushState({ tab, queryString: newQueryString }, null, `?tab=${tab}${newQueryString}`);
    }
    
    // Get the TabID element from the data-id
    const tabUID = qs["uid"];
    // Update the navigation state
    updateNavState(tabUID);

    // Load content dynamically into the content area using loadSlatePortalContent
    loadSlatePortalContent(`?cmd=${tab}${newQueryString}`, "#mainContentDiv");
};

/**
 * Loads content from a Slate Portal View page into a specified div.
 * This function fetches the HTML content of a Slate Portal View page, extracts the content 
 * within a div with the class 'dynamic-page-wrapper', and replaces the content of a 
 * specified div with the extracted content.
 * @param {string} pageUrl - The URL of the Slate Portal View page to load.
 * @param {string} targetDivId - The ID of the div where the content should be displayed.
 */
// Override loadSlatePortalContent to ensure active tab restoration after dynamic loading
function loadSlatePortalContent(pageUrl, targetDivId, callback) {
    $(targetDivId).html("<div>loading...</div>");

    $.ajax({
        url: pageUrl,
        dataType: 'html',
        success: function (data, status, xhr) {
            if (handleTimeout(data, xhr)) return;

            // Extract the content from .dynamic-page-wrapper
            const content = $(data).find('.dynamic-page-wrapper').html();
            $(targetDivId).html(content);

            // Ensure the active tab is restored after the content is inserted
            restoreActiveTab();
            setupTabListeners(); // Re-bind event listeners for the dynamically injected tabs

             // Run the callback AFTER content is loaded
            if (typeof callback === 'function') callback();
        },
        error: function (xhr, textStatus, errorThrown) {
            if (xhr.status === 302 || xhr.status === 401) {
                const loginUrl = xhr.getResponseHeader("Location") || "/account/login";
                window.location.href = loginUrl;
                return;
            }
            $(targetDivId).html('<p>Error loading content.</p>');
        }
    });
}

function initializeDefaultTabIfNeeded() {
    const qs = new URLSearchParams(window.location.search);
    if (!qs.has("tab")) {
        const $firstLink = $("#navbar-sidebar a.load-content").first();
        const tab = $firstLink.data("tab");
        const dataAttributes = $firstLink.data();
        const queryString = $.param(dataAttributes);

        if (tab) {
            loadTab(tab, queryString);
        }
    }
}



// Function to restore the last active tab
function restoreActiveTab() {
    let activeTabId = localStorage.getItem("activeTab");

    if (activeTabId) {
        let storedTab = document.querySelector(`button.nav-link[id="${activeTabId}"]`);
        if (storedTab) {
            new bootstrap.Tab(storedTab).show();
        }
    }
}

// Function to set up event listeners on tabs (for dynamically loaded content)
function setupTabListeners() {
    document.querySelectorAll('.nav-link[data-bs-toggle="pill"]').forEach(tab => {
        tab.addEventListener("shown.bs.tab", function (event) {
            let selectedTabId = event.target.id;
            localStorage.setItem("activeTab", selectedTabId);
        });
    });
}

// Listen for browser back/forward events and reload the state
$(window).on("popstate", (e) => {
    if (e.originalEvent.state) {
        const state = e.originalEvent.state;
        loadTab(state.tab, location.search.substring(1), true);
    }
});

// // Attach click event listeners to nav links, including dynamically loaded ones
// $(document).on("click", "#navbar-sidebar a", function (e) {
//     e.preventDefault();
//     const href = $(this).attr("href");
//     loadTab(href, location.search.substring(1));
// });

// // Prevent collapse toggle for submenu links
// $(document).on("click", "#navbar-sidebar .collapse .load-content", function (e) {
//     e.stopPropagation(); // Prevent Bootstrap's collapse behavior
// });

// Handle clicks on dynamically loaded elements and pass data attributes as query string parameters
$(document).on("click", ".load-content", function (e) {
    e.preventDefault();

    // Extract the tab or URL to load
    const tab = $(this).data("tab") || $(this).attr("href");

    // Collect all data attributes into a query string
    const dataAttributes = $(this).data();
    const queryString = $.param(dataAttributes);

    // Load the specified tab with the data attributes as query string parameters
    loadTab(tab, queryString, false);
});


/**
 * Initializes lazy loading for images with the class 'lazy-img'.
 * This function uses the IntersectionObserver API to load images only when they are about to enter the viewport.
 * If the IntersectionObserver API is not supported, it falls back to immediately loading all images.
 *
 * @param {HTMLElement} [context=document] - The context within which to search for lazy images. Defaults to the entire document.
 * @example
 * // Initialize lazy loading for images within a specific table
 * initLazyImages(document.querySelector('#studentSearchTable'));
 */
function initLazyImages(context = document) {
    const lazyImages = context.querySelectorAll('img.lazy-img');

    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const realSrc = img.getAttribute('data-src');
                    if (realSrc) {
                        img.src = realSrc;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: "100px 0px",
            threshold: 0.01
        });

        lazyImages.forEach(img => observer.observe(img));
    } else {
        lazyImages.forEach(img => {
            const realSrc = img.getAttribute('data-src');
            if (realSrc) {
                img.src = realSrc;
                img.removeAttribute('data-src');
            }
        });
    }
}


// Initialize the first tab based on the URL or default to the first tab
$(() => {
    const decodeQueryString = (query) => {
        return query.split('&').reduce((acc, pair) => {
            const [key, value] = pair.split('=');
            acc[decodeURIComponent(key)] = decodeURIComponent(value || '');
            return acc;
        }, {});
    };

    const qs = decodeQueryString(location.search.substring(1));
    if (qs["tab"]) {
        loadTab(qs["tab"], location.search.substring(1));
    } else {
        // Set the default tab to the first link in the sidebar if no tab is specified in the URL.
        const defaultTab = $("#navbar-sidebar a").first().data("tab")
        console.log(defaultTab);
        if (defaultTab) {
            loadTab(defaultTab, location.search.substring(1));
        }
    }
});


/**
 * Global Bootstrap modal show handler for #siteModal
 * Automatically injects content via AJAX if trigger element has `data-url`.
 */
$('#siteModal').on('show.bs.modal', function (event) {
    const trigger = $(event.relatedTarget);
    const url = trigger.data('url');
    const formguid = trigger.data('formguid');
    const uid = trigger.data('uid');
    const title = trigger.data('title') || "Details";
    const target = trigger.data('target') || "#form_div";

    // Set modal title
    $('#siteModalLabel').text(title);

    // Load content
    $(target).html("Loading...");
    
    if (url) {
        // Handle URL-based loading
        loadSlatePortalContent(url, target);
    } else if (formguid) {
        // Handle formguid-based loading (your existing pattern)
        $.ajax({
            url: '/register/',
            dataType: "script",
            data: {
                id: formguid,
                output: 'embed',
                div: 'form_div',
                person: uid,
            }
        });
    } else {
        $(target).html("<p>No content URL or form GUID provided.</p>");
    }
});
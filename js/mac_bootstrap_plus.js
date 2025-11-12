
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

    $('#siteModalLabel').text(title);
    $(target).html("Loading...");

    if (url) {
        loadSlatePortalContent(url, target);
        return;
    }

    if (formguid) {
        // 1) Start with the required params
        const payload = {
            id: formguid,
            output: 'embed',
            div: 'form_div',
            person: uid
        };

        // 2) Merge JSON blob if present
        const rawParams = trigger.attr('data-form-params');
        if (rawParams) {
            try {
                const extra = JSON.parse(rawParams);
                Object.assign(payload, extra);
            } catch (e) {
                console.warn('Invalid JSON in data-form-params:', e);
            }
        }

        // 3) Also merge any data-param-* attributes (Option B, below)
        Object.assign(payload, collectParamAttributes(trigger[0]));

        $.ajax({
            url: '/register/',
            dataType: "script",
            data: payload
        });

        return;
    }

    $(target).html("<p>No content URL or form GUID provided.</p>");
});

/**
 * Collect data-param-* attributes and turn them into key/value pairs.
 * Example: data-param-sys-entity-value="123"  -> { "sys:entity:value": "123" }
 * Use double hyphen (“--”) to encode a literal hyphen in a segment if needed.
 */
function collectParamAttributes(el) {
    const params = {};
    if (!el || !el.attributes) return params;

    for (let i = 0; i < el.attributes.length; i++) {
        const a = el.attributes[i];
        if (!a.name.startsWith('data-param-')) continue;

        // Strip prefix
        let key = a.name.slice('data-param-'.length);

        // Decode: segments are separated by single hyphens; join with colons for Slate keys
        // Allow “--” to mean a literal hyphen inside a segment.
        key = key
            .split(/-(?!-)/)              // split on single hyphens
            .map(s => s.replace(/--/g, '-'))
            .join(':');

        params[key] = a.value;
    }
    return params;
}


/**
 * getPortalContextFromUrl
 *
 * Parse the current window location and extract a lightweight "portal" context.
 * Uses the URL API and the pathname segments to derive a portal name, page name,
 * and an optional record identifier.
 *
 * Behavior summary:
 * - Reads the URL from window.location.href.
 * - Splits the pathname into segments, filtering out empty segments.
 * - portalName:
 *     1. Uses the "portal" query parameter if present.
 *     2. Otherwise uses the second path segment (pathParts[1]) when available.
 *     3. Falls back to the string "Unknown".
 * - pageName:
 *     1. Uses the "tab" query parameter if present.
 *     2. Otherwise uses the "cmd" query parameter.
 *     3. Otherwise uses the last path segment.
 *     4. Falls back to the string "_unknown".
 * - recordId:
 *     1. Uses the "guid" query parameter if present.
 *     2. Otherwise uses "id" or "record" query parameters.
 *     3. Falls back to null when none are present.
 *
 * @returns {{portalName: string, pageName: string, recordId: (string|null)}}
 *   An object containing:
 *   - portalName: the resolved portal name (string).
 *   - pageName: the resolved page name or command (string).
 *   - recordId: a record identifier if present, otherwise null.
 *
 * @example
 * // URL: /portal/advising?tab=location_detail&guid=abc123
 * // returns: { portalName: "advising", pageName: "location_detail", recordId: "abc123" }
 */
function getPortalContextFromUrl() {
  // Use the built-in URL API for nice parsing
  const url = new URL(window.location.href);

  // Example: /portal/advising?tab=location_detail&guid=...
  const pathParts = url.pathname.split('/').filter(Boolean);
  // ["portal", "advising"]

  const portalName =
    url.searchParams.get('portal') ||  // if you ever use ?portal=
    (pathParts[1] || 'Unknown');       // "advising" from /portal/advising

  // Page name: prefer tab/cmd, fallback to last path segment
  const pageName =
    url.searchParams.get('tab') ||
    url.searchParams.get('cmd') ||
    (pathParts[pathParts.length - 1] || '_unknown');

  // Common record ID patterns
  const recordId =
    url.searchParams.get('guid') ||
    url.searchParams.get('id') ||
    url.searchParams.get('record') ||
    null;

  return { portalName, pageName, recordId };
}

/**
 * Log portal page activity
 * @param {string} portalName - Name of the portal (e.g., 'Student Portal')
 * @param {string} pageName - Name of the page being viewed
 * @param {string} recordId - Optional record ID if viewing a specific record
 * @param {object} additionalData - Optional object with additional tracking data
 * 
 * Example usage in a portal page:
 * logPortalActivity('Student Portal', 'Academic Records', null, {timestamp: new Date().toISOString()});
 */

function logPortalActivity(portalName, pageName, recordId, additionalData) {
    // Build the data object
    var activityData = {
        portal: portalName || '',
        page: pageName || '',
        record: recordId || '',
        data: additionalData ? JSON.stringify(additionalData) : ''
    };
    
    // Make AJAX call to your logging query
    $.ajax({
        url: 'https://student.macalester.edu/portal/api_person?cmd=portal_activity',
        type: 'GET',
        data: activityData,
        dataType: 'text',
        success: function(response) {
            // Silent success - no user notification needed
            if (window.console) {
                console.log('Portal activity logged successfully');
            }
        },
        error: function(xhr, status, error) {
            // Silent failure - don't interrupt user experience
            if (window.console) {
                console.error('Failed to log portal activity:', error);
            }
        }
    });
}


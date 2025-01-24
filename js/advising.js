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
function loadSlatePortalContent(pageUrl, targetDivId) {
    $(targetDivId).html("<div>loading...</div");
    
    $.ajax({
        url: pageUrl,
        dataType: 'html',
        success: function (data, status, xhr) {
            if (handleTimeout(data, xhr)) return;

            // Find the content within the dynamic-page-wrapper div
            const content = $(data).find('.dynamic-page-wrapper').html();

            // Replace the content of the target div
            $(targetDivId).html(content);
        },
        error: function (xhr, textStatus, errorThrown) {
             // Check for 302 redirect or 401 unauthorized status
            if (xhr.status === 302 || xhr.status === 401) {
                const loginUrl = xhr.getResponseHeader("Location") || "/account/login";
                window.location.href = loginUrl;
                return ;
            }
            // Handle errors (e.g., display an error message)
            $(targetDivId).html('<p>Error loading content.</p>');
        }
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
        if (defaultTab) {
            loadTab(defaultTab, location.search.substring(1));
        }
    }
});

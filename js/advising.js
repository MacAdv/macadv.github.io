/**
 * Handles timeout detection by checking for a login page in the response.
 * Redirects to the login page if detected.
 * @param {string} response - The server response HTML.
 * @param {object} xhr - The XMLHttpRequest object.
 * @returns {boolean} - True if timeout detected and handled, false otherwise.
 */
const handleTimeout = (response, xhr) => {
    if (xhr.status === 200 && response.includes("/account/login")) {
        const loginUrl = $(response).find("a").attr("href") || "/account/login";
        window.location.href = loginUrl;
        return true;
    }
    return false;
};

/**
 * Function to dynamically load content into a specific tab and manage browser history.
 * Handles query string manipulation, active state updates, and dynamic content loading.
 * @param {string} tab - The identifier or URL for the tab to load.
 * @param {string} queryString - The full query string from the URL.
 * @param {boolean} isBack - Indicates if the navigation is triggered by a browser back/forward action.
 */
const loadTab = (tab, queryString, isBack) => {
    // Decode query string into an object using jQuery
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

    // Remove 'tab' parameter to avoid duplication
    delete qs["tab"];

    // Reconstruct query string with additional parameters
    const newQueryString = Object.keys(qs).length > 0 ? "&" + encodeQueryString(qs) : "";

    // Update browser history if not triggered by back/forward navigation
    if (!isBack) {
        history.pushState({ tab, queryString: newQueryString }, null, `?tab=${tab}${newQueryString}`);
    }

    // Update active tab UI
    $("#navbar-sidebar a").removeClass("active");
    $(`#navbar-sidebar a[href='${tab}']`).addClass("active");

    // Expand parent menus for the active tab
    $("#navbar-sidebar .collapse").removeClass("show");
    $(`#navbar-sidebar a[href='${tab}']`).closest(".collapse").addClass("show");

    // Load content dynamically into the content area
    $("#content_body").load(`?cmd=${tab}${newQueryString}`, function (response, status, xhr) {
        if (handleTimeout(response, xhr)) return;
    });
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
        error: function () {
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

// Attach click event listeners to nav links
$("#navbar-sidebar a").on("click", function (e) {
    e.preventDefault();
    const href = $(this).attr("href");
    loadTab(href, location.search.substring(1));
});

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
        const defaultTab = $("#navbar-sidebar a").eq(0).attr("href");
        if (defaultTab) {
            loadTab(defaultTab, location.search.substring(1));
        }
    }
});

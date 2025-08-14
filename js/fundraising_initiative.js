
function updateCountdown() {
    let now = new Date().getTime();
    let timeLeft = countdownLaunchDate - now;

    if (timeLeft < 0) {
        document.getElementById('countdown_days').textContent = "00";
        document.getElementById('countdown_hours').textContent = "00";
        document.getElementById('countdown_minutes').textContent = "00";
        document.getElementById('countdown_seconds').textContent = "00";
        return;
    }

    let days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    let hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    document.getElementById('countdown_days').textContent = String(days).padStart(2, '0');
    document.getElementById('countdown_hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('countdown_minutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('countdown_seconds').textContent = String(seconds).padStart(2, '0');
}

function countdownTimer(targetDate) {
    const target = new Date(targetDate).getTime();

    const updateTimer = () => {
        const now = new Date().getTime();
        const distance = target - now;

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('countdown_days').innerText = days;
        document.getElementById('countdown_hours').innerText = hours;
        document.getElementById('countdown_minutes').innerText = minutes;
        document.getElementById('countdown_seconds').innerText = seconds;

        if (distance < 0) {
            clearInterval(interval);
            document.getElementById('countdown_days').innerText = '0';
            document.getElementById('countdown_hours').innerText = '0';
            document.getElementById('countdown_minutes').innerText = '0';
            document.getElementById('countdown_seconds').innerText = '0';
        }
    };

    // Call updateTimer immediately to avoid delay
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
}




$(document).ready(function() {
    // Iterate over each div with class "super-lazy-load"
    $('.super-lazy-load').each(function() {
        var $div = $(this);
        var record = $div.data('record');

        // Construct the endpoint URL with the data-record value
        var endpoint = "?cmd=get_field&record=" + record + "&field=fita_html";

        // Make an AJAX request to fetch the data
        $.ajax({
            url: endpoint,
            type: 'GET',
            success: function(response) {
                if (!response.trim()) { // Check if response is empty
                    console.warn("No data found for record: " + record);
                    $div.html(`<div id="main_banner_placeholder" style="min-height: 200px; display: flex; align-items: center; justify-content: center;">no content...</div>`);
                } else {
                    $div.html(response);
                }
            },
            error: function(xhr, status, error) {
                console.error("Error fetching data for record: " + record, error);
            }
        });
    });
});
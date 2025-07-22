const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
const daysInYear = year => (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) ? 366 : 365;

function updateClock() {

    const now = new Date();

    var currentTime = String(now).slice(16,24) + ":" + String(now.getMilliseconds());
    if (now.getMilliseconds() < 10) {
        currentTime += "00";
    } else if (now.getMilliseconds() < 100) {
        currentTime += "0";
    };

    var currentDay = now.getDate();
    var currentMonth = now.getMonth() + 1;
    var currentYear = now.getFullYear();

    var secondsPassedToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    var secondsPassedThisMonth = (((currentDay - 1) * 86400) + secondsPassedToday);
    var secondsPassedThisYear = () => {
        let secondsSum = secondsPassedThisMonth;
        for (var i = currentMonth-1; i > 0; i--) {
            secondsSum += 86400 * daysInMonth(currentYear, i);
        };
        return secondsSum;
    };

    // basic clocks

    document.getElementById("time").textContent = currentTime;
    document.getElementById("date").textContent = daysOfWeek[now.getDay()] + ", " + String(currentMonth) + "-" + String(currentDay);
    document.getElementById("year").textContent = now.getFullYear();

    if (window.location.pathname != "/" && window.location.pathname != "/index" && window.location.pathname != "/index.html") {
        console.log("not index");
    
        // second progress
        var progressSecondBar = document.getElementById("progress-second-bar");
        var progressSecondLabel = document.getElementById("progress-second-label");
        var progressSecond = (now.getMilliseconds() / 1000);
        progressSecondBar.value = progressSecond;
        progressSecondLabel.textContent = String((progressSecond * 100).toFixed(2)) + "%";

        // minute progress
        var progressMinuteBar = document.getElementById("progress-minute-bar");
        var progressMinuteLabel = document.getElementById("progress-minute-label");
        var progressMinute = ((now.getSeconds() * 1000 + now.getMilliseconds()) / 60000);
        console.log(progressMinute);
        progressMinuteBar.value = progressMinute;
        progressMinuteLabel.textContent = String((progressMinute * 100).toFixed(2)) + "%";

        // hour progress
        var progressHourBar = document.getElementById("progress-hour-bar");
        var progressHourLabel = document.getElementById("progress-hour-label");
        var progressHour = ((now.getMinutes() * 60000 + now.getSeconds() * 1000 + now.getMilliseconds()) / 3600000);
        progressHourBar.value = progressHour;
        progressHourLabel.textContent = String((progressHour * 100).toFixed(2)) + "%";

        // day progress
        var progressDayBar = document.getElementById("progress-day-bar");
        var progressDayLabel = document.getElementById("progress-day-label");
        var progressDay = (secondsPassedToday/86400);
        progressDayBar.value = progressDay;
        progressDayLabel.textContent = String((progressDay * 100).toFixed(2)) + "%";

        // month progress
        var progressMonthBar = document.getElementById("progress-month-bar");
        var progressMonthLabel = document.getElementById("progress-month-label");
        var progressMonth = (secondsPassedThisMonth / (86400 * daysInMonth(currentYear, currentMonth)));
        progressMonthBar.value = progressMonth;
        progressMonthLabel.textContent = String((progressMonth * 100).toFixed(2)) + "%";

        // year progress
        var progressYearBar = document.getElementById("progress-year-bar");
        var progressYearLabel = document.getElementById("progress-year-label");
        var progressYear = secondsPassedThisYear() / (daysInYear(currentYear) * 86400);
        progressYearBar.value = progressYear;
        progressYearLabel.textContent = String((progressYear * 100).toFixed(2)) + "%";

    };

    setTimeout(updateClock, 10);
}

document.addEventListener("DOMContentLoaded", (e) => {
    updateClock();
});
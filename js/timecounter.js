const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
const daysInYear = year => (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)) ? 366 : 365;

var Time = {
    year: 0, 
    month: 0, 
    day: 0, 
    hour: 0, 
    minute: 0, 
    second: 0, 
    millisecond: 0,
    date: 0,
    time: 0,
    now: 0,
}

function updateClock() {

    const now = new Date();
    Time.now = now;
    Time.year = now.getFullYear();
    Time.month = now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : now.getMonth() + 1;
    Time.day = now.getDate() < 10 ? "0" + now.getDate() : now.getDate();
    Time.hour = now.getHours() < 10 ? "0" + now.getHours() : now.getHours();
    Time.minute = now.getMinutes() < 10 ? "0" + now.getMinutes() : now.getMinutes();
    Time.second = now.getSeconds() < 10 ? "0" + now.getSeconds() : now.getSeconds();
    Time.date = `${Time.year}-${Time.month}-${Time.day}`
    Time.time = `${Time.hour}:${Time.minute}:${Time.second}`

    if (now.getMilliseconds() < 10) {
        Time.millisecond = "00" + String(now.getMilliseconds());
    } else if (now.getMilliseconds() < 100) {
        Time.millisecond = "0" + String(now.getMilliseconds());
    } else {
        Time.millisecond = String(now.getMilliseconds());
    }

    // basic clocks
    document.getElementById("time").textContent = `${Time.hour}:${Time.minute}:${Time.second}:${Time.millisecond}`;
    document.getElementById("date").textContent = daysOfWeek[now.getDay() - 1] + ", " + String(Time.month) + "-" + String(Time.day);
    document.getElementById("year").textContent = Time.year;

    timeCounters.forEach((counter) => {
        
    });

    setTimeout(updateClock, 10);
}

document.addEventListener("DOMContentLoaded", (e) => {
    updateClock();
    globalThis.counterContainer = document.getElementById("timecounter-container");

    createCounter("First Git Commit", "2025-07-09", "08:18"); // 2025-7-9T08:18:07
    createCounter("2026 HS Graduation", "2026-06-05", "17:00"); // 2026-6-5T17:00:00
    createCounter("Birthday", "2008-02-13", "05:00");
    createCounter("Next Birthday", "2026-02-13", "05:00");
});

var timeCounters = [];

class Counter {
    constructor(labelText, placeholderDate=0, placeholderTime=0) {
        this.counter = document.createElement("div");

        this.deleteButton = document.createElement("button");
        this.deleteButton.classList.add("timecounter-counter-deletebutton");
        this.deleteButton.textContent = "X";
        this.counter.appendChild(this.deleteButton);

        this.label = document.createElement("h1");
        this.labelText = labelText;
        this.label.textContent = this.labelText;
        this.label.classList.add("timecounter-counter-label")
        this.label.setAttribute("contenteditable", "true");

        if (placeholderDate === 0) {
            this.date = `${Time.year}-${Time.month}-${Time.day}`;
        } else {
            this.date = placeholderDate;
        }

        if (placeholderTime === 0) {
            this.time = `${Time.hour}:${Time.minute}`;
        } else {
            this.time = placeholderTime;
        }

        this.inputDate = document.createElement("input");
        this.inputDate.type = "date";
        this.inputDate.value = this.date;
        this.inputDate.classList.add("timecounter-counter-input")

        this.inputTime = document.createElement("input");
        this.inputTime.type = "time";
        this.inputTime.value = this.time; 
        this.inputTime.classList.add("timecounter-counter-input")

        this.timer = document.createElement("p");
        this.timer.classList.add("timecounter-counter-timer")
        this.past = (Date.now() > new Date(`${this.date}T${this.time}`));
        this.timerLabel = document.createElement("h1");
        this.timerLabel.textContent = (this.past === true) ? "Time Since" : "Time Until";
        this.timerLabel.classList.add("timercounter-counter-timerlabel");

        this.counter.appendChild(this.timerLabel);
        this.counter.appendChild(this.label);
        this.counter.appendChild(this.inputDate);
        this.counter.appendChild(this.inputTime);
        this.counter.appendChild(this.timer);

        this.counter.classList.add("timecounter-counter");
    }


}

function updateCounters() {
    timeCounters.forEach((counter) => {
        counter.date = counter.inputDate.value;
        counter.time = counter.inputTime.value + ":00";
        var currentDate = `${Time.date}T${Time.time}`;
        var compareDate = `${counter.date}T${counter.time}`;
        counter.past = (new Date(currentDate) > new Date(compareDate));

        let secondDiff = (counter.past === true) ? (new Date(currentDate) - new Date (compareDate))/1000 : (new Date(compareDate) - new Date(currentDate))/1000;
        let minuteDiff = Math.floor(secondDiff / 60);
        secondDiff -= minuteDiff * 60;
        let hourDiff = Math.floor(minuteDiff / 60);
        minuteDiff -= hourDiff * 60;
        let dayDiff = Math.floor(hourDiff / 24);
        hourDiff -= dayDiff * 24;
        let yearDiff = Math.floor(dayDiff / 365.25);
        dayDiff -= Math.floor(yearDiff * 365.25);
        let monthDiff = 0;

        // console.log(currentDate);
        // console.log(compareDate);
        // console.log(Time.millisecond);

        counter.timerLabel.textContent = (counter.past === true) ? "Time Since" : "Time Until";
        counter.timer.textContent = `${yearDiff} Years, ${monthDiff} Months, ${dayDiff} Days, ${hourDiff} Hours, ${minuteDiff} Minutes, ${secondDiff} Seconds`;  
    });

    setTimeout(updateCounters, 10);
}

function createCounter(textLabel, placeholderDate, placeholderTime) {
    let newCounter = new Counter(textLabel, placeholderDate, placeholderTime);
    timeCounters.push(newCounter);
    counterContainer.appendChild(newCounter.counter);
    newCounter.deleteButton.onclick = function () {
        newCounter.counter.classList.add("timecounter-shrink");
        setTimeout(() => {
            counterContainer.removeChild(newCounter.counter);
            timeCounters.splice(newCounter.index, 1);
            newCounter.counter.remove();
        }, 1000);
    };

    newCounter.label.onchange = function () {
        newCounter.labelText = newCounter.label.textContent;
    }

    newCounter.label.onclick = function () {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(newCounter.label);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    updateCounters();

};
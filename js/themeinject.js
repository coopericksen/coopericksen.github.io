async function loadHTML(id, file) {
    const res = await fetch(file);
    const html = await res.text();
    document.getElementById(id).innerHTML = html;
}

// Wait for both HTML loads to finish
Promise.all([
    loadHTML("nav-placeholder", "/html/nav.html"),
    loadHTML("footer-placeholder", "/html/footer.html")
]).then(() => {
    setupThemeListeners();
    fetchTheme(); 
});

function setupThemeListeners() {
    const colorThemes = document.querySelectorAll(".theme");

    colorThemes.forEach((theme) => {
        theme.addEventListener("change", () => {
            storeTheme(theme.id);
        });
    });
}

const storeTheme = function(theme) {
    localStorage.setItem("theme", theme);
};

const fetchTheme = function() {
    const activeTheme = localStorage.getItem("theme");
    const colorThemes = document.querySelectorAll(".theme");
    colorThemes.forEach((theme) => {
        if (theme.id === activeTheme) {
            theme.checked = true;
        };
    });

    document.body.setAttribute('data-theme', activeTheme);
    console.log(activeTheme);
};
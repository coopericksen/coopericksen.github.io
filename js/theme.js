const colorThemes = document.querySelectorAll('input');
console.log(colorThemes);

// store theme
const storeTheme = function(theme) {
    localStorage.setItem("theme", theme);
};

const fetchTheme = function() {
    const activeTheme = localStorage.getItem("theme");
    colorThemes.forEach((theme) => {
        if (theme.id === activeTheme) {
            theme.checked = true;
        };
    });

    // fallback for no :has() support
    // document.documentElement.className = "theme";
};

colorThemes.forEach((theme) => {
    theme.addEventListener("input", () => {
        storeTheme(theme.id);
    });
});

document.addEventListener("DOMContentLoaded", (e) => {
     fetchTheme();
});
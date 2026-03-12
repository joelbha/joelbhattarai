window.addEventListener("scroll", function() {
    const nav = document.querySelector("nav");
    
    
    if (window.scrollY > 50) {
        nav.classList.add("shrunk");
    } else {
        nav.classList.remove("shrunk");
    }
});

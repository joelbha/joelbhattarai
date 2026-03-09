window.addEventListener("scroll", function() {
    const nav = document.querySelector("nav");
    
    // If we scroll down more than 50px, add the 'shrunk' class
    if (window.scrollY > 50) {
        nav.classList.add("shrunk");
    } else {
        nav.classList.remove("shrunk");
    }
});

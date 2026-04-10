window.addEventListener("scroll", function() {
    const nav = document.querySelector("nav");
    
    
    if (window.scrollY > 50) {
        nav.classList.add("shrunk");
    } else {
        nav.classList.remove("shrunk");
    }
});

const hamburger = document.querySelector(".hamburger");
const navUl = document.querySelector("nav ul");

hamburger.addEventListener("click", function() {
    hamburger.classList.toggle("open");
    navUl.classList.toggle("nav-open");
});

navUl.querySelectorAll("a").forEach(function(link) {
    link.addEventListener("click", function() {
        hamburger.classList.remove("open");
        navUl.classList.remove("nav-open");
    });
});

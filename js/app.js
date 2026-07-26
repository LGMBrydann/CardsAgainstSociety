console.log("Cards Against Society loaded 🚀");

const stars = document.querySelector(".stars");

if (stars) {
    document.addEventListener("mousemove", (event) => {
        const x = event.clientX / 100;
        const y = event.clientY / 100;
        stars.style.transform = `translate(${x}px, ${y}px)`;
    });
}

const fadeSections = document.querySelectorAll(".fade-section");

if (fadeSections.length) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            } else {
                entry.target.classList.remove("visible");
            }
        });
    }, {
        threshold: 0.2
    });

    fadeSections.forEach((section) => observer.observe(section));
}
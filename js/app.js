console.log("Cards Against Society loaded 🚀");


document.addEventListener(
    "mousemove",
    (event)=>{

        const stars =
        document.querySelector(".stars");


        let x =
        event.clientX / 100;


        let y =
        event.clientY / 100;


        stars.style.transform =
        `translate(${x}px, ${y}px)`;

    }
);
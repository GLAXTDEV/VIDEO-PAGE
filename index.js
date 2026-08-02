async function template() {
    const eglise = await fetch('index.json');
    const fil = await eglise.json();
    const Affichage = document.querySelector('#zoneMesses'); // Sorti de la boucle

    fil.forEach(element => {
        const urlIframe = `https://www.youtube.com/embed/${element.videoID}?rel=0&modestbranding=1`;
        const cree = document.createElement('div');
        cree.className = "carte";
        
        cree.innerHTML = `
            <iframe src="${urlIframe}" allow="autoplay; encrypted-media; picture-in-picture; gyroscope; accelerometer" allowfullscreen></iframe>
            <div class="point"><span>${element.number}</span></div>

            <div class="grid-generale">
                <div class="grid-id">
                    <p class="P1">${element.nom}</p> 
                    <p>${element.date}</p>
                </div>
                <div class="grid-id2">
                    <p>By ${element.par}</p>
                    <p class="adresse">${element.son_adresse}</p>
                </div>
            </div>
        `;
        Affichage.appendChild(cree);
    });
}

template();

const btn = document.querySelector('#modeBouton');
btn.addEventListener('click', ()=>{
    const bodi = document.body;
    bodi.classList.toggle('mode');
});
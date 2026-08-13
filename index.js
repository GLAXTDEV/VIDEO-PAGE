async function template() {
    const eglise = await fetch('index.json');
    const fil = await eglise.json();
    const Affichage = document.querySelector('#zoneMesses'); // Sorti de la boucle
    
    fil.forEach(element => {
        const urlIframe = `https://www.youtube.com/embed/${element.videoID}?rel=0&modestbranding=1`;
        const cree = document.createElement('div');
        cree.className = "carte";
        cree.innerHTML = `
            <iframe src="${urlIframe}" allow="autoplay; encrypted-media; picture-in-picture; gyroscope; accelerometer" allowfullscreen>
                ${element.titre}
            </iframe>
            <div class="point"><span>${element.number}</span></div>
            <div class="GRID_GEN">
                    <h2 class="titre">${element.titre}</h2> 
                    <p class="date">${element.date}</p>
                    <p class="auteur">${element.par}</p>
                    <a href="mailto:${element.son_adresse}">${element.son_adresse}</a>
            </div>
        `;
        Affichage.appendChild(cree);
    });
}
template();
const MENU = document.querySelector('.menu');
const SOUS_MENU = document.querySelector('.sous_menu');
MENU.addEventListener('click', ()=>{
    SOUS_MENU.classList.toggle('active');
});
SOUS_MENU.addEventListener('click', (e)=>{
    e.stopPropagation();
})


const btn = document.querySelector('#modeBouton');
btn.addEventListener('click', ()=>{
    const bodi = document.body;
    bodi.classList.toggle('sombre');
});

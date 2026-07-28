

async function template() {
    const eglise = await fetch('index.json');
    const fil = await eglise.json();

    fil.forEach(element => {
        const urlIframe = `https://drive.google.com/file/d/${element.videoID}/preview`;
        const urlTelechargement = `https://drive.google.com/uc?export=download&id=${element.videoID}`;
        const cree = document.createElement('div');
        const Affichage = document.querySelector('#zoneMesses');
        cree.classList = "carte";
        cree.innerHTML = `
        <iframe src="${urlIframe}" allow="autoplay" allowfullscreen>
        </iframe>
        <div class="grid-generale">
            <div class="grid-id">
                <h2>${element.nom}</h2> 
                <p>${element.date}</p> 
                <a href="${urlTelechargement}">telecharge</a>
            </div>
            <div class= "grid-id2">
                <p>by: ${element.par}</p>
                <p class="adresse">line: ${element.son_adresse}</p>
            </div>
        </div>
        `;
        Affichage.appendChild(cree);

    });
};

template()

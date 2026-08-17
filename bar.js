const searchBar = document.querySelector('.os-search-bar');
const searchInput = searchBar.querySelector('input');

searchBar.addEventListener('click', () => {
    searchBar.classList.add('active');
    searchInput.focus();
});

document.addEventListener('click', (e) => {
    if (!searchBar.contains(e.target)) {
        searchBar.classList.remove('active');
    }
});

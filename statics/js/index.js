document.addEventListener('DOMContentLoaded', () => {

    // Select #delta div
    var delta = document.querySelector('#delta');

    window.addEventListener('message', event => {
        switch (event.data.command) {
            case 'delta_update':
               delta.innerHTML = event.data.content;
               break;
        }
    });
});

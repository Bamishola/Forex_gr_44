let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let width = canvas.width;
let height = canvas.height;

let centerX = width / 2;
let centerY = height / 2;

let maxRadius = Math.min(centerX, centerY);

function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let radius = maxRadius; radius > 0; radius -= 10) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

        // Changer la couleur en fonction du rayon pour simuler les franges d'interférence
        let color = (radius / 10) % 2 === 0 ? '#000000' : '#FFFFFF';
        ctx.strokeStyle = color;

        ctx.stroke();
    }
}

draw();

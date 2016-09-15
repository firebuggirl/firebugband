(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

$( window ).resize(function() {
  ParticleCanvas.width = ($(window).width() - 20);
  ParticleCanvas.height = ($(window).height() - 10);
});

window.onload = function() {

      var ParticleCanvas = document.getElementById("ParticleCanvas");
      var context = ParticleCanvas.getContext("2d");
      ParticleCanvas.width = ($(window).width() - 20);
      ParticleCanvas.height = ($(window).height() - 10);
      document.body.appendChild(ParticleCanvas);
      //var para = document.createElement("P");                       // Create a <p> element
      //var t = document.createTextNode("This is a paragraph");
        // Create a text node
    //  para.appendChild(t);
    // para.innerHTML = "test";                                         // Append the text to <p>
    //  ParticleCanvas.appendChild(para);
    //  para.style.color = "red" ;
      // All the info stored into an array for the particles
      var particles = {},
          particleIndex = 0,
          settings = {
            density: 30,
            particleSize: 2.5,
            //particleSize: 3,
            //startingX: ParticleCanvas.width / 2,
            startingX: ParticleCanvas.width/4 ,
            startingY: ParticleCanvas.height,
            gravity: -0.02
          };

      // Set up a function to create multiple particles
      function Particle() {
              // Establish starting positions and velocities from the settings array, the math random introduces the particles being pointed out from a random x coordinate
        this.x = settings.startingX * (Math.random() * 10);
        this.y = settings.startingY;

        // Determine original X-axis speed based on setting limitation
        this.vx = (Math.random() * 2 / 3) - (Math.random() * 3 / 3);
        this.vy = -(Math.random() * 5 / 3);

        // Add new particle to the index
        // Object used as it's simpler to manage that an array
        particleIndex ++;
        particles[particleIndex] = this;
        this.id = particleIndex;
        this.life = 0;
        this.maxLife = 200;
        this.alpha = 1;
        this.red = 255;
        this.green = 255;
        this.blue = 255;
      }

      // Some prototype methods for the particle's "draw" function
      Particle.prototype.draw = function() {
        this.x += this.vx;
        this.y += this.vy;

        // Adjust for gravity
        this.vy += settings.gravity;



        // Age the particle
        this.life++;

        this.red += 2;

        this.alpha -= 0.005;


        // If Particle is old, it goes in the chamber for renewal
        if (this.life >= this.maxLife) {
          delete particles[this.id];
        }



        // Create the shapes
        context.clearRect(settings.leftWall, settings.groundLevel, ParticleCanvas.width, ParticleCanvas.height);
        context.beginPath();
        context.fillStyle="rgba("+ this.red +", "+ this.green +", "+ this.blue +", " + this.alpha + ")";
        // Draws a circle of radius 20 at the coordinates 100,100 on the ParticleCanvas
        context.arc(this.x, this.y, settings.particleSize, 0, Math.PI*2, true);
        context.closePath();
        context.fill();

      }

      function animateDust() {
        context.clearRect(0, 0, ParticleCanvas.width, ParticleCanvas.height);

        // Draw the particles
        for (var i = 0; i < settings.density; i++) {
          if (Math.random() > 0.97) {
            // Introducing a random chance of creating a particle
            // corresponding to an chance of 1 per second,
            // per "density" value
            new Particle();
          }
        }

        for (var i in particles) {
          particles[i].draw();
        }
        window.requestAnimationFrame(animateDust);
    }

    animateDust();
};

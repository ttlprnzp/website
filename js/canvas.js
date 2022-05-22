const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
    function initialize() {
      window.addEventListener('resize', resizeCanvas, false);
      resizeCanvas();
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function initialize() {
      window.addEventListener('resize', resizeCanvas, false);
      resizeCanvas();
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      let x = ctx.canvas.width/2;
      let y = ctx.canvas.height/2;
      ctx.translate(x, y);
    }

    initialize();

    function getRan(min,max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.random() * (max - min +1) + min;
    }

    function fading(fade) {
      ctx.fillStyle = 'rgba(0, 0, 0,'+fade+')';
      ctx.fillRect(-ctx.canvas.width/2,-ctx.canvas.height/2, ctx.canvas.width, ctx.canvas.height);
    }
    let Aold = 0
    let Bold = 0
    let JongA = getRan(2,3)
    let JongB = getRan(1.5,2.5)
    let JongC = getRan(-3,-2)
    let JongD = getRan(-2.5,-1.5)
    console.log(JongA, JongB, JongC, JongD)

    function dejong (a,b,c,d) {
        Anew = (Math.sin(a*Bold)-Math.cos(b*Aold)),
        Bnew = (Math.sin(c*Aold)-Math.cos(d*Bold))
    }
    
    //function attract(a,b,c,d,e) {
    //    Anew = a + b*Aold  + c*Aold^2 + d*Aold*Bold+ e*Bold + f*Bold^2,
  //      Bnew = b0 + b1 xn + b2 xn2 + b3 xn yn + b4 yn + b5 yn
//    }


    function line() {
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Aold, Bold);
      ctx.lineTo((Anew*(canvas.width/4)), (Bnew*(canvas.height/4)));
      ctx.strokeStyle = '#ff9b9b';
      ctx.stroke();
    } 

    function pixel() {
        ctx.fillRect(Anew*(canvas.width/4), Bnew*(canvas.width/4),1,1)
        ctx.fillStyle = '#ffffff';
    }

    function reset() {
        Aold = Anew*(canvas.width/4);
        Bold = Bnew*(canvas.height/4); 
    }

    function drawLoop() {
      fading(0.03);
      dejong(JongA, JongB, JongC, JongD);
      line();
      pixel();
      reset();
      setTimeout(drawLoop,66);
    }
   
    drawLoop();

    $(document).ready(function() {
        $('#main').load('/landing.html');
    
        $('#nav a').click(function(e) {
          e.preventDefault();
          $("#main").load(e.target.href);
        })
      });       
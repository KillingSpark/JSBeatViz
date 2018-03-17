//create rgb string for canvas from rgb values
function makeRGB(r,g,b){
    return 'rgb('+Math.floor(r)+","+Math.floor(g)+","+Math.floor(b)+")";
}

var blackWhitePalette = [
    makeRGB(0,0,0),
    makeRGB(10,10,10),
    makeRGB(20,20,20),
    makeRGB(30,30,30),
    makeRGB(40,40,40),
    makeRGB(50,50,50),
    makeRGB(60,60,60),
    makeRGB(70,70,70),
    makeRGB(80,80,80),
    makeRGB(90,90,90),
    makeRGB(100,100,100),
    makeRGB(110,110,110),
    makeRGB(120,120,120),
    makeRGB(130,130,130),
    makeRGB(140,140,140),
    makeRGB(150,150,150),
    makeRGB(160,160,160),
    makeRGB(170,170,170),
    makeRGB(180,180,180),
    makeRGB(190,190,190),
    makeRGB(200,200,200),
    makeRGB(210,210,210),
    makeRGB(220,220,220),
    makeRGB(230,230,230),
    makeRGB(240,240,240),
    makeRGB(250,250,250)
]

var redShadePalette = [
   makeRGB(170, 57, 57),
   makeRGB(255,170,170),
   makeRGB(212,106,106),
   makeRGB(128, 21, 21),
   makeRGB( 85,  0,  0)
]

var deepColorPalette = [
    makeRGB( 70, 10,  3),
    makeRGB(168, 84,  0),
    makeRGB(  2, 85,104),
    makeRGB(115, 57,  0),
    makeRGB(  0,146, 23),
    makeRGB(  2, 85,104),
]

paletteArray = [blackWhitePalette, redShadePalette, deepColorPalette];


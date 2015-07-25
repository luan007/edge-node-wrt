var PDFImagePack = require("pdf-image-pack");

var imgs = [
    "./soldier.jpg"
];

var output = "./out.pdf";
var slide = new PDFImagePack();
slide.output(imgs, output, function(err, doc){
    console.log("finish output")
});
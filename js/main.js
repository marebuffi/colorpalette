$(document).ready(function() {   
	
	//Generate palette button
	$("#generateRandom").click(function(event) {
		event.preventDefault();
		$("#loader").show();
		toggleImgUrlField();
		//destroy old data
		$(".canvasImg").remove();
		$("#swatches").children().remove();
		$("#tt-color-combinations").hide();
		$("#demo").hide();
		
		//get flikr jsonp
 
		$.ajax({
			url: "http://api.flickr.com/services/rest/?format=json&sort=random&method=flickr.photos.search&tags=animals,architecture,art,asia,color,music,beach,berlin,bike,bird&tag_mode=all&api_key=a114ec79080830ba6b3f6b16d253a144",
			type: "GET",
			crossDomain: true,
			dataType: "jsonp",
			timeout: 10000,
			//success: function(response){ alert(response); },
			error: function(x, t, m) {
				if(t==="timeout"){
					alert ('Flikr is not responding, press OK to reload and try again.');
					window.location.reload(); 
				}
			}
		});

	});

	//Show Url address bar
	$(".useUrl").click(function(event) {
		event.preventDefault();
		$(".urlError").hide();
		if ( $(".useUrl").hasClass("open") ){
			t_url = $("#imgUrl").val();
			if (checkURL(t_url)){
				//destroy old data
				$(".canvasImg").remove();
				$("#swatches").children().remove();
				$(".urlError").hide();
				
				buildImg(t_url);
				printImg(t_url);
				checkImg(t_url);
				
				$("#tt-color-combinations").hide();
				$("#demo").hide();

				toggleImgUrlField();
			}else{
				//error
			}
		}else{
			$(this).text("Go!").next().slideToggle();
			$("#imgUrl").val("");
			$(this).addClass("open");
		}
	});
});//Doc ready

$(window).load(function() {

	//Display hex value on click
	$(".swatch").live('click',(function() {
		if ($(this).children().hasClass("visible")){
				$(this).children().fadeOut(300);
				$(this).children().toggleClass("visible");
			}else{
				$(this).children().fadeIn(300);
				$(this).children().toggleClass("visible");
		}//end if
	}));

	//Submit URL on "enter" keypress
	$("#imgUrl").keydown(function(event) {
		if (event.keyCode == 13) {
			event.preventDefault();
			$(".useUrl").click();
		}
	});

	//Allow user to copy text without making the tooltip dissapear
	$(".swatch span").live("click", (function(event){
		event.stopPropagation();
		event.preventDefault();
	}));

	//Click errors to close them
	 $(".error").live("click", (function(event){
		event.stopPropagation();
		event.preventDefault();
		$(this).fadeOut(300);
	}));

	//Resize to fit
	var docHeight = $(document).height();
	$("#page1").css("min-height" , docHeight);

	//show color relations
	$(".moreInfo").live("click", function(){
		var theColor = $(this).prev().val();
		$(".swatch").removeClass("selected");        
		$(this).parent().parent().addClass("selected");
		//alert (theColor);
		buildColorRelations(theColor);
	});


});//Win load

/*___PROGRAM______________________________________________________________________________*/

//check if entered url has valid format
function checkURL(opts){
	var urlToValidate = opts; 
	//console.log (urlToValidate);
	var re = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
	if (!re.test(urlToValidate)) { 
		$(".urlError").fadeIn(300);
		return false;
	}else{
		return true;
	}
}

function buildImg(url){

	//Build canvas
	var canvas = document.getElementById('canvas');        
	var ctx = canvas.getContext('2d');
	var img = new Image();   // Create new img element  
	var info = document.getElementById('info');
	var colors = new Array();
	var imageExists = true;

	//ahora el src es local
	var makeItLocal = 'getImage.php?' + t_url ;
	img.src = makeItLocal;
	
	img.onload = function(){  
		// execute drawImage statements here  This is essential as it waits till image is loaded before drawing it.
		ctx.webkitImageSmoothingEnabled = true;
		ctx.drawImage(img, 0, 0, 400, 400);

		// ctx.drawImage(img , 0, 0, 200, 200);
		// load the image data into an array of pixel data (R, G, B, a)
		var imgd = ctx.getImageData( 0, 0, 400, 400 );
		var pix = imgd.data;

		// build an array of each color value and respective number of pixels using it
		for( var i = 0; i < pix.length; i+=4 ){
			var colorString = pix[i] + ',' + pix[i+1] + ',' + pix[i+2] + ',' + pix[i+3];
			if( colors[colorString] ){
				colors[colorString]++;
			}else{
				colors[colorString] = 1;
			}
		}//for

		// sort the array with greatest count at top
		var sortedColors = sortAssoc(colors);
		var ctr = 0;
		var devVal = 30;
		var usedColors = []; // used to see if close color is already seen
		var isValid = false;

		// create palette of the 5 most used colors
		for( var clr in sortedColors ){
			//info.innerHTML += clr + ": " + sortedColors[clr] + "<br />";
			//ptx.fillStyle = "rgba(" + clr + ")";  
			//ptx.fillRect (ctr * 25, 0, 25, 25);
			//ptx.strokeRect (ctr * 25, 0, 25, 25);
		   
			//weed out colors close to those already seen
			var colorValues = clr.split(',');
			var hexVal = '';
			
			for( var i = 0; i < 3; i++ ){
				hexVal += decimalToHex(colorValues[i], 2);
			}
			isValid = true;
			
			for(var usedColor in usedColors ){
				var colorDevTtl = 0;
				var rgbaVals = usedColors[usedColor].split(',');
				for( var i = 0; i <= 3; i++ ){
					colorDevTtl += Math.abs( colorValues[i] - rgbaVals[i] );
				}
				//info.innerHTML += usedColors[usedColor] + " |" + clr + ": " + colorDevTtl + "<br />";
				if( colorDevTtl / 4 < devVal ){
					isValid = false;
					break;
				}
			}
			
			if( isValid ){
			//info.innerHTML += clr + ": " + sortedColors[clr] + "<br />";
				var whtTxtStyle = '';
				if( hexVal == 'ffffff' ){ whtTxtStyle = '; color: #666'; }
				$('#swatches').append('<li class="swatch" style="background: #' + hexVal + whtTxtStyle + ';"><span class="colorhex visible"><input type="text" value="#' + hexVal + '" readonly/><span class="moreInfo"><i class="icon-caret-down"></i></span></span></li>');
				usedColors.push( clr );
				ctr++;
			}
			if( ctr > 10 ){
				break;
			}
		}//for

	}//img.onload

}//buildImg

function sortAssoc(aInput){
	var aTemp = [];
	for (var sKey in aInput)
	aTemp.push([sKey, aInput[sKey]]);
	aTemp.sort(function () {return arguments[1][1] - arguments[0][1]}
	);

	var aOutput = [];
	for (var nIndex = 0; nIndex < aTemp.length; nIndex++){
	aOutput[aTemp[nIndex][0]] = aTemp[nIndex][1];
	}
	return aOutput;
}//sortAssoc

function decimalToHex(d, padding) {
	var hex = Number(d).toString(16);
	padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

	while (hex.length < padding) {
		hex = "0" + hex;
	}
	return hex;
}//decimalToHex

function jsonFlickrApi(rsp) {
	//alert("caller is " + arguments.callee.caller.name.toString());

	var s = "";
	var i = Math.random();
	i = i * 100;
	i = Math.ceil(i);

	photo = rsp.photos.photo[ i ];

	if(typeof photo == 'undefined'){
		alert ('Flikr is not responding, press OK to reload and try again.');
		//window.location.reload(); 
		} else {

			//get img & build img
			t_url = "http://farm" + photo.farm + ".static.flickr.com/" + photo.server + "/" + photo.id + "_" + photo.secret + "_" + "d.jpg"; 
			p_url = "http://www.flickr.com/photos/" + photo.owner + "/" + photo.id;
			buildImg();
			//print img instead of canvas, just for less processing
			printImg(t_url);
			checkImg();
			$("#loader").hide();
		}//end else
}

//Check img integrity before displaying result
function checkImg(){
	var img = document.getElementById("pic");
	img.onerror=function(){
		//console.log("false");
		$("#pic").hide();
		$(".urlError").fadeIn(300);
		return false;
	}
	img.onload=function(){
		//console.log("true");
		//alert ("omg!");
		$("#imgUrl").val("");
		$("#pic").show();
		return true;
	}
}

function toggleImgUrlField(){
	if ($(".useUrl").hasClass("open")){
		$(".urlError").fadeOut(300);
		$(".imgUrlWrap").slideToggle();
		$(".useUrl").text("Extract from URL").removeClass("open");
	}    
}

function printImg(optUrl){
	makeItLocal = optUrl;
	$(".imgWrap").append("<img src='" + makeItLocal + "' class='canvasImg bevel' id='pic' />");
}

function select(elem) {
	var sel = window.getSelection();
	var range = sel.getRangeAt(0);
	range.selectNode(elem);
	sel.addRange(range);
} 

function buildColorRelations(theColor){
	myColor = theColor;
	colorChange(myColor);
	$("#tt-color-combinations").show();
	$("#demo").show();
}

function colorChange(color) {
	var tiny = tinycolor(color);

	var output = [
	"Hex: " + tiny.toHexString(),
	"RGB: " + tiny.toRgbString(),
	"HSL: " + tiny.toHslString(),
	"HSV: " + tiny.toHsvString(),
	"Name: " + (tiny.toName() || "none"),
	"Format: " + (tiny.format),
	"Format string: " + tiny.toString(),
	].join("\n");

	$("#code-output").text(output);
	$("#yourColor").css("background-color", tiny.toHexString());

	var filters = $("#filter-output").toggleClass("invisible", !tiny.ok);

	filters.find(".lighten").css("background-color", tinycolor.lighten(tiny, 20).toHexString());
	filters.find(".darken").css("background-color", tinycolor.darken(tiny, 20).toHexString());
	filters.find(".saturate").css("background-color", tinycolor.saturate(tiny, 20).toHexString());
	filters.find(".desaturate").css("background-color", tinycolor.desaturate(tiny, 20).toHexString());
	filters.find(".greyscale").css("background-color", tinycolor.greyscale(tiny).toHexString());

	var allColors = [];
	for (var i in tinycolor.names) {
		allColors.push(i);
	}
	var mostReadable = tinycolor.mostReadable(color, allColors);

	$(".mostReadable").css("background-color", mostReadable.toHexString());

	var combines = $("#combine-output").toggleClass("invisible", !tiny.ok);

	var triad = tinycolor.triad(tiny);
	combines.find(".triad").html($.map(triad, function(e) {
		return '<li class="swatch" style="background:'+e.toHexString()+'"><span class="visible">'+e.toHexString()+'</span></li>'
	}).join(''));

	var tetrad = tinycolor.tetrad(tiny);
	combines.find(".tetrad").html($.map(tetrad, function(e) {
		return '<li class="swatch" style="background:'+e.toHexString()+'"><span class="visible">'+e.toHexString()+'</span></li>'
	}).join(''));

	var mono = tinycolor.monochromatic(tiny);
	combines.find(".mono").html($.map(mono, function(e) {
		return '<li class="swatch" style="background:'+e.toHexString()+'"><span class="visible">'+e.toHexString()+'</span></li>'
	}).join(''));

	var analogous = tinycolor.analogous(tiny);
	combines.find(".analogous").html($.map(analogous, function(e) {
		return '<li class="swatch" style="background:'+e.toHexString()+'"><span class="visible">'+e.toHexString()+'</span></li>'
	}).join(''));

	var sc = tinycolor.splitcomplement(tiny);
	combines.find(".sc").html($.map(sc, function(e) {
		return '<li class="swatch" style="background:'+e.toHexString()+'"><span class="visible">'+e.toHexString()+'</span></li>'
	}).join(''));
}

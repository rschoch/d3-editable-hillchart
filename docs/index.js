import HillChart from '../'
import { select } from 'd3-selection'

let hillChart = new HillChart();
let myStorage = window.localStorage;

// At the start and after saving, refresh the list of localstorage saves
let refreshSavesList = function () {
	let keys = Object.keys(myStorage);
	document.getElementById('saves').innerText = null;
	let optionList = document.getElementById('saves').options;
	keys.filter(key => key !== 'loglevel:webpack-dev-server').forEach(key =>
		optionList.add(
			new Option(key)
		)
	)
};
refreshSavesList();

// Add Item
document.getElementById("addItem").onclick = function () {
	let inputfield = document.getElementById("itemName");
	let colorpicker = document.getElementById("colorPicker");
	let itemName = inputfield.value;
	let colorName = colorpicker.options[colorpicker.selectedIndex].value;
	hillChart.renderDot({ color: colorName, desc: itemName, x: 10, y: hillChart.fn(10) });
};

// Load from saves
document.getElementById("load").onclick = function () {
	hillChart.resetChart();
	const optionList = document.getElementById('saves').options;
	const selectedOption = optionList[optionList.selectedIndex].value;
	const itemAsString = myStorage.getItem(selectedOption);
	const items = JSON.parse(itemAsString);
	hillChart.items = items;
	hillChart.renderDots(items, true);
};

// Save to localstorage
document.getElementById("save").onclick = function () {
	let snapShotItems = [];
	Array.from(document.getElementsByClassName('group')).forEach(group => {
		const newItem = { color: group.getElementsByTagName('circle')[0].getAttribute('fill'), desc: group.getElementsByTagName('text')[0].innerHTML, x: group.getAttribute('xValue'), y: group.getAttribute('yValue') };
		snapShotItems.push(newItem);
	})
	let save = JSON.stringify(snapShotItems);
	let saveName = document.getElementById('saveName').value;
	if (!saveName) {
		saveName = "save-" + formatDate(new Date());
	}
	myStorage.setItem(saveName, save);
	refreshSavesList();
};

// Reset chart
document.getElementById("reset").onclick = function () {
	hillChart.items = [];
	hillChart.resetChart();
};

// Download chart as png
document.getElementById("download").onclick = function () {
	let svgString = getSVGString(select('svg').node());
	svgString2Image(svgString, 1000, 300, 'png', save); // passes Blob and filesize String to the callback
	function save(dataBlob, filesize) {
		saveAs(dataBlob, 'hillchart-' + formatDate(new Date()) + '.png'); // FileSaver.js function
	}
};

let formatDate = function (d) {
	return d.toLocaleString("en-US", { month: "long" }) + "-" + d.getDate() + "-" + d.getFullYear() + "_" +
		("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

// credit to http://bl.ocks.org/Rokotyan/0556f8facbaf344507cdc45dc3622177
// Below are the functions that handle actual exporting:
// getSVGString ( svgNode ) and svgString2Image( svgString, width, height, format, callback )
let getSVGString = function (svgNode) {
	svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
	let cssStyleText = getCSSStyles(svgNode);
	appendCSS(cssStyleText, svgNode);
	let serializer = new XMLSerializer();
	let svgString = serializer.serializeToString(svgNode);
	svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
	svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix
	return svgString;
	function getCSSStyles(parentElement) {
		var selectorTextArr = [];
		// Add Parent element Id and Classes to the list
		selectorTextArr.push('#' + parentElement.id);
		for (var c = 0; c < parentElement.classList.length; c++)
			if (!contains('.' + parentElement.classList[c], selectorTextArr))
				selectorTextArr.push('.' + parentElement.classList[c]);
		// Add Children element Ids and Classes to the list
		var nodes = parentElement.getElementsByTagName("*");
		for (var i = 0; i < nodes.length; i++) {
			var id = nodes[i].id;
			if (!contains('#' + id, selectorTextArr))
				selectorTextArr.push('#' + id);
			var classes = nodes[i].classList;
			for (var c = 0; c < classes.length; c++)
				if (!contains('.' + classes[c], selectorTextArr))
					selectorTextArr.push('.' + classes[c]);
		}
		// Extract CSS Rules
		var extractedCSSText = "";
		for (var i = 0; i < document.styleSheets.length; i++) {
			var s = document.styleSheets[i];
			try {
				if (!s.cssRules) continue;
			} catch (e) {
				if (e.name !== 'SecurityError') throw e; // for Firefox
				continue;
			}
			var cssRules = s.cssRules;
			for (var r = 0; r < cssRules.length; r++) {
				if (contains(cssRules[r].selectorText, selectorTextArr))
					extractedCSSText += cssRules[r].cssText;
			}
		}
		return extractedCSSText;
		function contains(str, arr) {
			return arr.indexOf(str) === -1 ? false : true;
		}
	};

	function appendCSS(cssText, element) {
		var styleElement = document.createElement("style");
		styleElement.setAttribute("type", "text/css");
		styleElement.innerHTML = cssText;
		var refNode = element.hasChildNodes() ? element.children[0] : null;
		element.insertBefore(styleElement, refNode);
	};
};

let svgString2Image = function (svgString, width, height, format, callback) {
	var format = format ? format : 'png';
	var imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))); // Convert SVG string to data URL
	var canvas = document.createElement("canvas");
	var context = canvas.getContext("2d");
	canvas.width = width;
	canvas.height = height;
	var image = new Image();
	image.onload = function () {
		context.clearRect(0, 0, width, height);
		context.drawImage(image, 0, 0, width, height);
		canvas.toBlob(function (blob) {
			var filesize = Math.round(blob.length / 1024) + ' KB';
			if (callback) callback(blob, filesize);
		});
	};
	image.src = imgsrc;
};
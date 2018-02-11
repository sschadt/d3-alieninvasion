// Get references to the tbody element (where we'll load our data)
var $tbody = d3.select("tbody");
var $thead = $tbody.select('thead');
var $spinnerContainer = document.getElementById("spinnerContainer");

// References to search filter elements
var $dateInput = document.querySelector("#datetime");
var $stateInput = document.querySelector("#state");
var $searchBtn = document.querySelector("#search");
var $resetBtn = document.querySelector("#reset");

// Add an event listener to the searchButton, call handleSearchButtonClick when clicked
$searchBtn.addEventListener("click", handleSearchButtonClick);

// Add an event listener to the reset button, rebuild the table from scratch when clicked
$resetBtn.addEventListener("click", handleResetButtonClick);

// *** Spin.js settings ***
// config references
var dataConfig = {
    data_url : 'http://localhost:5000/data',
    width: 900,
    height: 450,
    val: 90
};
var opts = {
    color: "blue",
    fadeColor: "gainsboro",
    lines: 9, // The number of lines to draw
    length: 9, // The length of each line
    width: 5, // The line thickness
    radius: 14, // The radius of the inner circle
    color: '#3366ff', // #rgb or #rrggbb or array of colors 
    speed: 1.9, // Rounds per second
    trail: 40, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
    top: '50%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    position: 'absolute' // Element positioning
};

var sightings;

//
// *** Begin page lifecycle ***
//
function getData(filter) {

    // slow the json load intentionally, so we can see it every load
    //setTimeout(function() {
    var spinner = { "opts": opts};
    spinner = Spin(spinner, $spinnerContainer);

    // Trigger spinner icon
    //$spinnerContainer.appendChild(spinner.el);

    // Define columns for table
    var columns = ["datetime", "city", "state", "country", "shape", "durationMinutes", "comments"];
    
    // Load data 
    d3.json(dataConfig.data_url, function(error, data) {
        if (error) return console.warn(error);

        // Build Data set
        sightings = filterDataset(data, filter);

        // Build dropdowns
        buildDropdowns(sightings);

        // Render table
        renderTable(sightings, columns);
    });

    // Stop spinner
    //Stopspin(spinner);

    //}
}

// Initialize data (initially without a filter)
getData(null);

//
// **** Functions ****
//

function filterDataset(data, filter) {
    // Filtering logic (if applicable)
    if (filter) {  // We have a filter object, let's parse it
        if (filter.datetime != "")
            data = data.filter((s) => s.datetime.indexOf(filter.datetime) >= 0);

        // Set filteredSightings to an array of all sightings whose "state" matches the filter
        if (filter.state != "") 
            data = data.filter((s) => s.state === filter.state);
    }
    return data;
}

// Dropdowns
function buildDropdowns(filteredSightings) {
    // Output city dropdown values
    d3.select("#city").selectAll("option")
        .data(d3.map(filteredSightings, function(d){return d.city;}).keys())
        .enter()
        .append("option")
        .text((d => d))
        .attr("value", (d => d));
}

// Table generation
function renderTable(filteredSightings, cols) {
    // Clear the table 
    $tbody.node().innerHTML = "";

    // Header row
	$thead.append('tr')
        .selectAll('th')
        .data(cols).enter()
        .append('th')
          .text(function (c) { return c; });

    // Data rows
    var $tr = $tbody
        .selectAll("tr")
        .data(filteredSightings)
        .enter().append("tr");

    // Data columns
    // var sightingFields = Object.keys(filteredSightings[0]);  orders columns wrong
    var $td = $tr
        .selectAll("td")
        .data(cols, (d => d))
        .enter().append("td")
        .text(function(d) { return this.parentNode.__data__[d]; });
}  

// Progress bar function
function buildProgressBar(data) {
    num_sightings = data.length;
    var progressDuration = num_sightings * .6;
    var progressLength = num_sightings / 50;

    d3.select('#progressbar').transition()
        .duration(5000).attr('width', 250);
}

function handleSearchButtonClick() {
    // Format the user's search by removing leading and trailing whitespace, lowercase the string
    var filterDate = $dateInput.value.trim();
    var filterState = $stateInput.value.trim().toLowerCase();

    // Clean out form intpu values
    $dateInput.value = "";
    $stateInput.value = "";
        
    // Build filter object
    var objFilter = {
                        "datetime": filterDate, 
                        "city": null, 
                        "state": filterState,
                        "country": null, 
                        "shape": null
                    };

    // Filter data
    getData(objFilter)
}

function handleResetButtonClick() {
    // Clean out form input values
    $dateInput.value = "";
    $stateInput.value = "";

    // Render our new table
    loadData();
}
  
var defaults = {
    lines: 12,
    length: 7,
    width: 5,
    radius: 10,
    scale: 1.0,
    corners: 1,
    color: '#000',
    fadeColor: 'transparent',
    opacity: 0.25,
    rotate: 0,
    direction: 1,
    speed: 1,
    trail: 100,
    fps: 20,
    zIndex: 2e9,
    className: 'spinner',
    top: '50%',
    left: '50%',
    shadow: 'none',
    position: 'absolute',
};

/**
 * Adds the spinner to the given target element. If this instance is already
 * spinning, it is automatically removed from its previous target by calling
 * stop() internally.
 */
function Spin(spinner, target) {
    var _this = spinner;
    Stopspin(spinner);
    spinner.el = document.createElement('div');
    spinner.el.className = spinner.opts.className;
    spinner.el.setAttribute('role', 'progressbar');
    css(spinner.el, {
        position: spinner.opts.position,
        width: 0,
        zIndex: spinner.opts.zIndex,
        left: spinner.opts.left,
        top: spinner.opts.top,
        transform: "scale(" + spinner.opts.scale + ")",
    });
    if (target) {
        target.insertBefore(spinner.el, target.firstChild || null);
    }
    var animator;
    var getNow;
    if (typeof requestAnimationFrame !== 'undefined') {
        animator = requestAnimationFrame;
        getNow = function () { return performance.now(); };
    }
    else {
        // fallback for IE 9
        animator = function (callback) { return setTimeout(callback, 1000 / _this.opts.fps); };
        getNow = function () { return Date.now(); };
    }
    var lastFrameTime;
    var state = 0; // state is rotation percentage (between 0 and 1)
    var animate = function () {
        var time = getNow();
        if (lastFrameTime === undefined) {
            lastFrameTime = time - 1;
        }
        state += getAdvancePercentage(time - lastFrameTime, _this.opts.speed);
        lastFrameTime = time;
        if (state > 1) {
            state -= Math.floor(state);
        }
        if (_this.el.childNodes.length === _this.opts.lines) {
            for (var line = 0; line < _this.opts.lines; line++) {
                var opacity = getLineOpacity(line, state, _this.opts);
                _this.el.childNodes[line].childNodes[0].style.opacity = opacity.toString();
            }
        }
        _this.animateId = _this.el ? animator(animate) : undefined;
    };
    drawLines(spinner.el, spinner.opts);
    animate();

    return spinner;
};
/**
 * Stops and removes the Spinner.
 * Stopped spinners may be reused by calling spin() again.
 */
function Stopspin (spinner) {
    if (spinner.el) {
        if (typeof requestAnimationFrame !== 'undefined') {
            cancelAnimationFrame(spinner.animateId);
        }
        else {
            clearTimeout(spinner.animateId);
        }
        if (spinner.el.parentNode) {
            spinner.el.parentNode.removeChild(spinner.el);
        }
        spinner.el = undefined;
    }
};

function getAdvancePercentage(msSinceLastFrame, roundsPerSecond) {
    return msSinceLastFrame / 1000 * roundsPerSecond;
}
function getLineOpacity(line, state, opts) {
    var linePercent = (line + 1) / opts.lines;
    var diff = state - (linePercent * opts.direction);
    if (diff < 0 || diff > 1) {
        diff += opts.direction;
    }
    // opacity should start at 1, and approach opacity option as diff reaches trail percentage
    var trailPercent = opts.trail / 100;
    var opacityPercent = 1 - diff / trailPercent;
    if (opacityPercent < 0) {
        return opts.opacity;
    }
    var opacityDiff = 1 - opts.opacity;
    return opacityPercent * opacityDiff + opts.opacity;
}
/**
 * Tries various vendor prefixes and returns the first supported property.
 */
function vendor(el, prop) {
    if (el.style[prop] !== undefined) {
        return prop;
    }
    // needed for transform properties in IE 9
    var prefixed = 'ms' + prop.charAt(0).toUpperCase() + prop.slice(1);
    if (el.style[prefixed] !== undefined) {
        return prefixed;
    }
    return '';
}
/**
 * Sets multiple style properties at once.
 */
function css(el, props) {
    for (var prop in props) {
        el.style[vendor(el, prop) || prop] = props[prop];
    }
    return el;
}
/**
 * Returns the line color from the given string or array.
 */
function getColor(color, idx) {
    return typeof color == 'string' ? color : color[idx % color.length];
}
/**
 * Internal method that draws the individual lines.
 */
function drawLines(el, opts) {
    var borderRadius = (Math.round(opts.corners * opts.width * 500) / 1000) + 'px';
    var shadow = 'none';
    if (opts.shadow === true) {
        shadow = '0 2px 4px #000'; // default shadow
    }
    else if (typeof opts.shadow === 'string') {
        shadow = opts.shadow;
    }
    var shadows = parseBoxShadow(shadow);
    for (var i = 0; i < opts.lines; i++) {
        var degrees = ~~(360 / opts.lines * i + opts.rotate);
        var backgroundLine = css(document.createElement('div'), {
            position: 'absolute',
            top: -opts.width / 2 + "px",
            width: (opts.length + opts.width) + 'px',
            height: opts.width + 'px',
            background: getColor(opts.fadeColor, i),
            borderRadius: borderRadius,
            transformOrigin: 'left',
            transform: "rotate(" + degrees + "deg) translateX(" + opts.radius + "px)",
        });
        var line = css(document.createElement('div'), {
            width: '100%',
            height: '100%',
            background: getColor(opts.color, i),
            borderRadius: borderRadius,
            boxShadow: normalizeShadow(shadows, degrees),
            opacity: opts.opacity,
        });
        backgroundLine.appendChild(line);
        el.appendChild(backgroundLine);
    }
}
function parseBoxShadow(boxShadow) {
    var regex = /^\s*([a-zA-Z]+\s+)?(-?\d+(\.\d+)?)([a-zA-Z]*)\s+(-?\d+(\.\d+)?)([a-zA-Z]*)(.*)$/;
    var shadows = [];
    for (var _i = 0, _a = boxShadow.split(','); _i < _a.length; _i++) {
        var shadow = _a[_i];
        var matches = shadow.match(regex);
        if (matches === null) {
            continue; // invalid syntax
        }
        var x = +matches[2];
        var y = +matches[5];
        var xUnits = matches[4];
        var yUnits = matches[7];
        if (x === 0 && !xUnits) {
            xUnits = yUnits;
        }
        if (y === 0 && !yUnits) {
            yUnits = xUnits;
        }
        if (xUnits !== yUnits) {
            continue; // units must match to use as coordinates
        }
        shadows.push({
            prefix: matches[1] || '',
            x: x,
            y: y,
            xUnits: xUnits,
            yUnits: yUnits,
            end: matches[8],
        });
    }
    return shadows;
}
/**
 * Modify box-shadow x/y offsets to counteract rotation
 */
function normalizeShadow(shadows, degrees) {
    var normalized = [];
    for (var _i = 0, shadows_1 = shadows; _i < shadows_1.length; _i++) {
        var shadow = shadows_1[_i];
        var xy = convertOffset(shadow.x, shadow.y, degrees);
        normalized.push(shadow.prefix + xy[0] + shadow.xUnits + ' ' + xy[1] + shadow.yUnits + shadow.end);
    }
    return normalized.join(', ');
}
function convertOffset(x, y, degrees) {
    var radians = degrees * Math.PI / 180;
    var sin = Math.sin(radians);
    var cos = Math.cos(radians);
    return [
        Math.round((x * cos + y * sin) * 1000) / 1000,
        Math.round((-x * sin + y * cos) * 1000) / 1000,
    ];
}
// Get references to the tbody element (where we'll load our data)
var $tbody = d3.select("tbody");
var $thead = $tbody.select('thead');
//var $spinnerContainer = document.getElementById("spinnerContainer");

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
    // Trigger 'progress bar'
    //num_sightings = data_set.length;
    //var progressDuration = num_sightings * .75;
    //var progressLength = num_sightings / 30;

    // Define columns for table
    var columns = ["datetime", "city", "state", "country", "shape", "durationMinutes", "comments"];
    
    // Load data 
    d3.json(dataConfig.data_url, function(error, data) {
        if (error) return console.warn(error);

        var width = 960,
        height = 500,
        twoPi = 2 * Math.PI; 
    
        var dataset = {
                        progress: 35,
                        total: 46
                    };
                    
                    
        var tau = 2 * Math.PI; // http://tauday.com/tau-manifesto
        var arc = d3.arc()
            .innerRadius(170)
            .outerRadius(220)
            .startAngle(0);

       // Get the SVG container, and apply a transform such that the origin is the
        // center of the canvas. This way, we don’t need to position arcs individually.
        var svg = d3.select("#progressbar").append("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height"),
        g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

        // Add the background arc, from 0 to 100% (tau).
        var background = g.append("path")
        .datum({endAngle: tau})
        .style("fill", "#ddd")
        .attr("d", arc);

        // Add the foreground arc in orange, currently showing 12.7%.
        var foreground = g.append("path")
        .datum({endAngle: 0.127 * tau})
        .style("fill", "orange")
        .attr("d", arc);
    
        var text =  g.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .attr("font-size", "24")
        .text(dataset["progress"]);

        // Run the transition
        foreground.transition()
            .duration(5000)
            .attrTween("d", arcTween(Math.random() * tau));



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

      //
      //  .transition()
      //  .styleTween("background-color", function() { return d3.interpolate("red", "green");});

    // Data columns
    // var sightingFields = Object.keys(filteredSightings[0]);  orders columns wrong
    var $td = $tr
       .selectAll("td")
        .data(cols, (d => d))
        .enter().append("td")
        .text(function(d) { return this.parentNode.__data__[d]; });

    // Finish transition
    //$tr.exit().transition().remove();
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
  
// Returns a tween for a transition’s "d" attribute, transitioning any selected
// arcs from their current angle to the specified new angle.
function arcTween(newAngle) {

    // The function passed to attrTween is invoked for each selected element when
    // the transition starts, and for each element returns the interpolator to use
    // over the course of transition. This function is thus responsible for
    // determining the starting angle of the transition (which is pulled from the
    // element’s bound datum, d.endAngle), and the ending angle (simply the
    // newAngle argument to the enclosing function).
    return function(d) {

    // To interpolate between the two angles, we use the default d3.interpolate.
    // (Internally, this maps to d3.interpolateNumber, since both of the
    // arguments to d3.interpolate are numbers.) The returned function takes a
    // single argument t and returns a number between the starting angle and the
    // ending angle. When t = 0, it returns d.endAngle; when t = 1, it returns
    // newAngle; and for 0 < t < 1 it returns an angle in-between.
    var interpolate = d3.interpolate(d.endAngle, newAngle);

    // The return value of the attrTween is also a function: the function that
    // we want to run for each tick of the transition. Because we used
    // attrTween("d"), the return value of this last function will be set to the
    // "d" attribute at every tick. (It’s also possible to use transition.tween
    // to run arbitrary code for every tick, say if you want to set multiple
    // attributes from a single function.) The argument t ranges from 0, at the
    // start of the transition, to 1, at the end.
    return function(t) {

        // Calculate the current arc angle based on the transition time, t. Since
        // the t for the transition and the t for the interpolate both range from
        // 0 to 1, we can pass t directly to the interpolator.
        //
        // Note that the interpolated angle is written into the element’s bound
        // data object! This is important: it means that if the transition were
        // interrupted, the data bound to the element would still be consistent
        // with its appearance. Whenever we start a new arc transition, the
        // correct starting angle can be inferred from the data.
        d.endAngle = interpolate(t);

        // Lastly, compute the arc path given the updated data! In effect, this
        // transition uses data-space interpolation: the data is interpolated
        // (that is, the end angle) rather than the path string itself.
        // Interpolating the angles in polar coordinates, rather than the raw path
        // string, produces valid intermediate arcs during the transition.
        return arc(d);
    };
    };
}
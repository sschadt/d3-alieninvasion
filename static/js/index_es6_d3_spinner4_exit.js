// Get references to the tbody element (where we'll load our data)
var $tbody = d3.select("tbody");
var $spinnerContainer = document.getElementById("#spinnerContainer");

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
var opts = {
    lines: 9, // The number of lines to draw
    length: 9, // The length of each line
    width: 5, // The line thickness
    radius: 14, // The radius of the inner circle
    color: '#3366ff', // #rgb or #rrggbb or array of colors 
    speed: 1.9, // Rounds per second
    trail: 40, // Afterglow percentage
    className: 'spinner', // The CSS class to assign to the spinner
};

// config references
var dataConfig = {
    data_url : 'http://localhost:5000/data',
    width: 900,
    height: 450,
    val: 90
};

var sightings;

//
// *** Begin page lifecycle ***
//
function getData(filter) {
    // Trigger spinner icon
    var spinner = new Spinner(opts).spin($spinnerContainer);

    // slow the json load intentionally, so we can see it every load
    //setTimeout(function() {
    
    // Load data 
    d3.json(dataConfig.data_url, function(error, data) {
        if (error) return console.warn(error);

        // Render table
        renderTable(data, filter);

        // Stop spinner
        // DO STUFF
    });
}

// Initialize data (initially without a filter)
getData(null);

//
// **** Functions ****
//
// Table generation
function renderTable(filteredSightings, filter) {
    // Get total count of all rows
    var $tr = $tbody.selectAll("tr")
    var row_count = $tr.nodes().length;

    // Filtering logic
    if (filter) {  // We have a filter object, let's parse it
        if (filter.datetime != "")
            filteredSightings = filteredSightings.filter((s) => s.datetime.indexOf(filter.datetime) >= 0);
        // Set filteredSightings to an array of all sightings whose "state" matches the filter
        if (filter.state != "") 
            filteredSightings = filteredSightings.filter((s) => s.state === filter.state);
    }

    // Get the count of filtered records
    var row_count_filtered = filteredSightings.length; 

    // Output city dropdown values
    d3.select("#city").selectAll("option")
        .data(d3.map(filteredSightings, function(d){return d.city;}).keys())
        .enter()
        .append("option")
        .text((d => d))
        .attr("value", (d => d));

    // Output rows
    // If the filtered amount is less than the previous row count, add rows
    if (row_count < row_count_filtered) {
        $tr = $tr.data(filteredSightings).enter().append("tr");
    } else { // Otherwise, remove the extraneous rows
        $tr = $tr.data(filteredSightings).exit().remove();
    }

    // Output columns
    // var sightingFields = Object.keys(filteredSightings[0]);  order columns wrong
    var sightingFields = ["datetime", "city", "state", "country", "shape", "durationMinutes", "comments"];
    var $td = $tr
        .selectAll("td")
        .data(sightingFields, (d => d))
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
    getData(null);
}
  
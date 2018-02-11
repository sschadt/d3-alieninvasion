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

// config references
var dataConfig = {
    data_url: 'http://localhost:5000/data',
    width: 900,
    height: 450,
    val: 90
};
var data_set;
var filteredSightings;

//
// *** Begin page lifecycle ***
//
function init() {
    // Build our asynchronous queue
//var q = d3.queue();
//q.defer(loadData);
//q.defer(buildProgressBar)
    loadData(callBack);
    buildProgressBar(callBack);

//q.await(function(error) {
//if (error) throw error;
//console.log("Peace!");
//    });
}

// Initialize page actions (spinner icon, and loading table)
init();

//
// **** Functions ****
//
function callBack (err, res) { console.log(res); }

function loadData(cb) {
    // Load table data via asynchronous JSON request
    d3.json(dataConfig.data_url, function(error, data) {
        if (error) return console.warn(error);
    });

    // Clear all records, if they exist
    $tbody.node().innerHTML = "";

    // Output rows
    var tr = $tbody
    .selectAll("tr")
    .data(data)
    .enter().append("tr");

    // Output columns
    var sightingFields = ["datetime", "city", "state", "country", "shape",  "durationMinutes", "comments"]; // Define fields array
    var td = tr
    .selectAll("td")
    .data(sightingFields, function(d) { return d; })
    .enter().append("td")
    .text(function(d) { return this.parentNode.__data__[d]; }); 
    
    cb(null);
}

function buildProgressBar(cb) {
    num_sightings = data_set.length;
    var progressDuration = num_sightings * .75;
    var progressLength = num_sightings / 30;

    d3.select('#progressbar').transition()
    .duration(5000).attr('width', 250);
  
    cb(null);
}

function handleSearchButtonClick() {
  // Format the user's search by removing leading and trailing whitespace, lowercase the string
  var filterDate = $dateInput.value.trim();
  var filterState = $stateInput.value.trim().toLowerCase();

  // Clean out form intpu values
  $dateInput.value = "";
  $stateInput.value = "";
    
  // Set filteredSightings to an array of all sightings whose "datetime" matches the filter
  if (filterDate != "")
    filteredSightings = data_set.filter((s) => s.datetime.indexOf(filterDate) >= 0);

  // Set filteredSightings to an array of all sightings whose "state" matches the filter
  if (filterState != "") 
    filteredSightings = filteredSightings.filter((s) => s.state === filterState);

  // Render our new table
  init();

}

function handleResetButtonClick() {
    // Clean out form input values
    $dateInput.value = "";
    $stateInput.value = "";
  
    // Reset data
    filteredSightings = data_set;

    // Render our new table
    init();
}
  
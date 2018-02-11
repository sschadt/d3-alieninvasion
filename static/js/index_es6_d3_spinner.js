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

//
// *** Begin page lifecycle ***
//
function init() {
    // Trigger spinner icon
    var spinner = new Spinner(opts).spin($spinnerContainer);

    // slow the json load intentionally, so we can see it every load
    //setTimeout(function() {
        // Load table data via asynchronous JSON request
        d3.json(dataConfig.data_url, function(error, data) {
            if (error) return console.warn(error);

            // Render table
            renderTable(data);

            // Stop the loader when finished
            //spinner.stop();

            // Show table
        });
   // }, 1500);
}

// Initialize page actions (spinner icon, and loading table)
init();

//
// **** Page lifecycle methods ****
//

function renderTable(filteredSightings) {
    $tbody.node().innerHTML = "";

    // Output rows
    var tr = $tbody
    .selectAll("tr")
    .data(filteredSightings)
    .enter().append("tr");

    // Fields array
    var sightingFields = ["datetime", "city", "state", "country", "shape",  "durationMinutes", "comments"];

    // Output columns
    var td = tr
    .selectAll("td")
    .data(sightingFields, function(d) { return d; })
    .enter().append("td")
    .text(function(d) { return this.parentNode.__data__[d]; });  
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
    filteredSightings = dataSet.filter((s) => s.datetime.indexOf(filterDate) >= 0);

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
    filteredSightings = dataSet;

    // Render our new table
    init();
}
  
// Get references to the tbody element (where we'll load our data)
var $tbody = d3.select("tbody");
var $thead = $tbody.select('thead');

// References to search filter elements
var $dateInput = document.querySelector("#datetime");
var $stateInput = document.querySelector("#state");
var $cityInput = document.querySelector("#city");
var $countryInput = document.querySelector("#country");
var $shapeInput = document.querySelector("#shape");
var $searchBtn = document.querySelector("#search");
var $resetBtn = document.querySelector("#reset");

// Add an event listener to the searchButton, call handleSearchButtonClick when clicked
$searchBtn.addEventListener("click", handleSearchButtonClick);

// Add an event listener to the reset button, rebuild the table from scratch when clicked
$resetBtn.addEventListener("click", handleResetButtonClick);

var sightings;

// Data endpoint configuration
var dataConfig = {
    data_url : 'http://localhost:5000/data',
};

//
// *** Begin page lifecycle ***
//
function getData(filter) {
    // Define columns for table
    var columns = ["datetime", "city", "state", "country", "shape", "durationMinutes", "comments"];
    
    // Load data 
    d3.json(dataConfig.data_url, function(error, data) {

        if (error) return console.warn(error);

        // Build Data set
        sightings = filterDataset(data, filter);

        // Render table
        renderTable(sightings, columns);

        // Build filtered dropdowns
        buildDropdowns(sightings, filter);

        // Hide spinner
        d3.select("#spinner").style("display", "none");
    });
}

// Initialize data (initially without a filter)
getData(null);

//
// **** Functions ****
//
/*  
function filterDataset
     args: data, filter
     returns: data set
*/
function filterDataset(data, filter) {
    if (filter) {  // We have a filter object, parse it
        // Loop through each filter property
        for (var key in filter) {
            console.log(key + " -> " + filter[key]);
            elem = "#" + key;

            // If the filter in question has been applied, filter dataset on it.
            if (filter[key] != "") {
                if (key == "datetime") { // If this is datetime, do a partial search
                    data = data.filter((s) => s.datetime.indexOf(filter.datetime) >= 0);
                } else {
                    // Filter the master dataset by the filter in question
                    data = data.filter((s) => s[key] === filter[key]);
                }

           // Select the element in the respective dropdown that was filtered
            d3.select(elem).selectAll("option").filter(
                    (function(d, i) { return d === filter[key]; })
                ).attr("selected", true);
           }
        }
    }
    return data;
}

function updateDropdown(col, data, f) {
    elem = "#" + col;
    var select = d3.select(elem);
    var seldata = d3.select(elem).selectAll("option").data(
        d3.map(data, function(d){return d[col]; }).keys()
    );

    // Add elements that are needed
    seldata.enter().append("option")
            .merge(seldata)
            .text((d => d))
            .attr("value", (d => d));

    // Remove any elements no longer applicable
    seldata.exit().remove(); 

    // Add a blank option at the top, if no filtering on field in question
    var $ddBlank = select.insert("option", ":first-child")
            .text("Select...")
            .attr("value", "");
    if (f == null || f[col] == "") 
        $ddBlank.attr("selected", true);
    
    // Sort alphabetically
    seldata.sort(compareFunction);
}

// Filter dropdowns
function buildDropdowns(filteredSightings, filter) {
    // City
    updateDropdown("city", filteredSightings, filter);

    // Country
    updateDropdown("country", filteredSightings, filter);

    // Shape
    updateDropdown("shape", filteredSightings, filter);
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
    var $td = $tr
       .selectAll("td")
        .data(cols, (d => d))
        .enter().append("td")
        .text(function(d) { return this.parentNode.__data__[d]; });
}

function handleSearchButtonClick() {
    // Reset spinner
    d3.select("#spinner").style("display", "block");

    // Format the user's search by removing leading and trailing whitespace, lowercase the string
    var filterDate = $dateInput.value.trim();
    var filterState = $stateInput.value.trim().toLowerCase();
    var filterCity = $cityInput.value.trim().toLowerCase();
    var filterCountry = $countryInput.value.trim().toLowerCase();
    var filterShape = $shapeInput.value.trim().toLowerCase();
        
    // Build filter object
    var objFilter = {
                        "datetime": filterDate, 
                        "city": filterCity, 
                        "state": filterState,
                        "country": filterCountry, 
                        "shape": filterShape
                    };

    // Filter data
    getData(objFilter)
}

function handleResetButtonClick() {
    // Reset spinner
    d3.select("#spinner").style("display", "block");

    // Clean out form input values
    $dateInput.value = "";
    $stateInput.value = "";

    // Render table with no filters
    getData(null)
}

// Used for sorting dropdowns
function compareFunction(a, b) {
    if (a < b)
        return -1
    if (a > b)
        return 1
    return 0
}
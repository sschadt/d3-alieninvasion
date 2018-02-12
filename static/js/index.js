/** Variables for page elements and constants */
// Get references to the tbody element (where we'll load our data)
var $tbody = d3.select("tbody");
var $thead = d3.select('thead');

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
// *** Page lifecycle ***
//

/**
 * Get JSON data and if applicable, apply filter 
 * @param {Object} filter - An object representing the filter form field selections.
 * @fires filterDataset()
 * @fires getResults()
 * @fires filterDropdowns()
 */
function getData(filter) {
    // Load data 
    d3.json(dataConfig.data_url, function(error, data) {
        if (error) return console.warn(error);

        // Build Data set
        sightings = filterDataset(data, filter);

        // Render table, if it exists
        getResults(sightings);

        // Build filtered dropdowns
        filterDropdowns(sightings, filter);

        // Hide spinner
        d3.select("#spinner").style("display", "none");
    });
}

// Initialize data (initially without a filter)
getData(null);

//
// *** Functions ***
//

/**
 * Filter the dataset.
 * @param {Object[]} data - Dataset to filter.
 * @param {Object} filter - An object representing the filter form field selections.
 * @returns {Object[]} data - Filtered dataset. 
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

/**
 * Based on result set, either build paged table or display a 'no results' message.
 * @param {Object[]} data - Dataset for which to show results. 
 */
function getResults(data) {
    // Show table (or show 'no results' message, depending on the dataset)
    if (data.length > 0) {
        // Define columns for table
        var columns = ["datetime", "city", "state", "country", "shape", "durationMinutes", "comments"];
        var headings = ["Date", "City", "State", "Country", "Shape", "Duration", "Comments"];

        // Build table of results
        buildTable(data, columns, headings); 
    } else {
        // Display no results message
        showNoresults();
    }

    // Set up pager (50 per page)
    setupPaging(data, 50);
}

/**
 * Filter dropdown lists based on refined dataset.
 * @param {Object[]} data - Dataset for which to show results.
 * @param {Object} filter - Filter object which with to update dropdown data. 
 */
function filterDropdowns(data, filter) {
    // City
    updateDropdown("city", data, filter);

    // Country
    updateDropdown("country", data, filter);

    // Shape
    updateDropdown("shape", data, filter);
}

//
// *** Page events ***
//

/**
 * Search button event
 * @fires getData() [with filter object built from form values]
 */
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

/**
 * Reset button event.
 *
 * @fires getData() [with NULL filter argument] 
 */
function handleResetButtonClick() {
    // Reset spinner
    d3.select("#spinner").style("display", "block");

    // Clean out form input values
    $dateInput.value = "";
    $stateInput.value = "";

    // Render table with no filters
    getData(null)
}

//
// *** Utility functions ***
//

/**
 * Build HTML table of search results.
 * @param {Object[]} data - Dataset of results.
 * @param {string[]} cols - Dataset column names.
 * @param {string[]} headings - Human-readable column names.
 */
function buildTable(data, cols, headings) {
    // Clear table
    $thead.node().innerHTML = "";
    $tbody.node().innerHTML = "";

    // Header row
	$thead.append('tr')
        .selectAll('th')
        .data(headings).enter()
        .append('th')
          .text(function (c) { return c; });

    // Data rows
    var $tr = $tbody
      .selectAll("tr")
      .data(data)
      .enter().append("tr");

    // Data columns
    var $td = $tr
       .selectAll("td")
        .data(cols, (d => d))
        .enter().append("td")
        .text(function(d) { return this.parentNode.__data__[d]; });
}

/**
 * Show a 'no results' message, if no results were found.
 */
function showNoresults() {
    $thead.node().innerHTML = "";
    $tbody.node().innerHTML = "";
    $tbody.append("tr")
        .append("td")
        .attr("colspan", 7)
        .text("There are no results for your search query. Please try again.");
}

/**
 * Build paging functionalty.
 * @param {Object[]} d - Dataset of results.
 * @param {number} intPageSize - Page size.
 */
function setupPaging(d, intPageSize) {
    // Initialize button states based on length of current dataset
    if (d.length < intPageSize) {
        disableButton("#next");
        disableButton("#prev"); 
    } else {
        enableButton("#next");
    }

    // Add 'chunk' attribute to data object, to bookmark place in dataset
    d3.select("#buttons").datum({chunk: 0});

    // Previous and Next actions: Chain select pushes datum 
    //  into prev and next buttons
    d3.select("#buttons").select("#prev") // Previous button
        .on("click", function(d) { 
            if (d.chunk > 0) {
                d.chunk -= intPageSize;
                setPage(d.chunk, intPageSize);  
            }
        });
    d3.select("#buttons").select("#next").on("click", function(d) { // Next button
        d.chunk += intPageSize;
        setPage(d.chunk, intPageSize); 
    });

    // Initialize first page of data
    setPage(0, intPageSize);
}

/**
 * Filter dropdown list based on refined dataset
 * @param {string} col - Dropdown field to update.
 * @param {Object[]} data - Filtered dataset.
 * @param {Object} f - Object of filter field values.
 */
function updateDropdown(col, data, f) {
    // Use the 'keys' function to obtain all unique values from the dataset column 
    //  corresponding to the dropdown in question
    elem = "#" + col;
    var select = d3.select(elem);
    var seldata = d3.select(elem).selectAll("option").data(
        d3.map(data, function(d){return d[col]; }).keys()
    );

    // Add elements that are needed from above dataset
    seldata.enter().append("option")
            .merge(seldata)
            .text((d => d))
            .attr("value", (d => d));

    // Remove any elements no longer applicable
    seldata.exit().remove(); 

    // Sort alphabetically
    d3.select(elem).selectAll("option").sort(compareFunction);

    // Add a blank option at the top.
    var $ddBlank = select.insert("option", ":first-child")
            .text("Select...")
            .attr("value", "");
    // If the field in question didn't just have a value selected, select the blank option we just added.
    if (f == null || f[col] == "") 
        $ddBlank.attr("selected", true);
}

/**
 * Paging 'click' handling: Enable/disable buttons based on position in dataset.
 * @param {number} start - Page iteration.
 * @param {number} intPageSize - Page size.
 */
function setPage (start, intPageSize) {
    // We're at the last page, disable next button
    if (start >= (sightings.length-intPageSize)) {
        disableButton("#next"); 
    } else if (start > 0) {
        // We're in the middle, enable both
        enableButton("#next");
        enableButton("#prev");
    } else {
        // We're on the first page, disable previous
        disableButton("#prev");
    }

    // Hide all table rows except those applicable to current page iteration.
    $tbody.selectAll("tr")
        .style("display", function(d,i) {
            return i >= start && 
                    i < start + intPageSize ? null : "none";
        });
}
 
/**
 * Disable paging button
 * @param {string} el - Page element (#next or #prev)
 */
function disableButton(el) {
    d3.select("#buttons").select(el) // Disable the previous button
    .attr("disabled", "true")
    .classed("buttonDisabled", true)
    .classed("buttonEnabled", false);
}

/**
 * Enable paging button
 * @param {string} el - Page element (#next or #prev)
 */
function enableButton(el) {
    d3.select("#buttons").select(el) // Enable the previous button
    .attr("disabled", null)
    .classed("buttonEnabled", true)
    .classed("buttonDisabled", false);
}

/**
 * Sort dropdowns alphabetically
 * @param {string} a - Dropdown field value
 * @param {string} b - Dropdown field value
 */
function compareFunction(a, b) {
    if (a < b)
        return -1
    if (a > b)
        return 1
    return 0
}
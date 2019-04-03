// require("./lib/pym");


var data_url = require("./interactiveData");
var url = "https://cdn.jsdelivr.net/npm/us-atlas@2/us/states-10m.json";

var width = window.innerWidth;


// create area for map
var svg = d3.select("#map").append("svg").append("g").attr("transform","scale(" + width/1000 + ")");
var projection = d3.geoAlbersUsa().scale(1280).translate([480, 300]);
var path = d3.geoPath();

d3.select("#map").attr("style","height:" + (width*0.67) + "px")



// select area for table
var table = d3.select("#table tbody");



// get the data
Promise.all([d3.json(url)]).then(function(data) {



  // map data
  var us = data[0]; 

  // shootings data
  var shootings = data_url.records;

  // only use the shootings data that we need instead of the entire dataset
  shootings = shootings.map(function(d) {
    return {
      lat: d.lat,
      long: d.long,
      date: d.date,
      city: d.city,
      state: d.state,
      killed: d.killed,
    }
  });

  // draw map
  svg.append("g")
      .attr("class", "states")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("d", path)
      .attr("fill", "lightgray");

  svg.append("path")
      .attr("class", "state-borders")
      .attr("d", path(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; })));
  
  svg.selectAll("circle")
    .data(shootings)
  .enter()
    .append("circle")
    .attr("class", function(d) {
      return d.state;
    })
    .attr("r", function(d) {
      return 10;
    })
    .attr("cx", function(d) {
      return 0;
    })
    .attr("cy", function(d) {
      return 0;
    })
    .attr("transform", function(d) {
      return "translate(" + projection([+d.long, +d.lat]) + ")";
    })
    .attr("fill", "black")
    .attr("opacity", 0.3);







  // organize shootings by state to create dropdown
  var shootingsByState = d3.nest()
  .key(function(d) { return d.state; })
  .rollup(function(v) { return {
    count: v.length
  }; })
  .entries(shootings);

  shootingsByState.sort(function(a, b) {
      var x = a.key; var y = b.key;
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });


  // create function for the dropdown filtering
  var filterData = function() {
      var selectedState = d3.select(this).property('value');
      d3.selectAll("tbody tr:nth-child(odd)").style("background-color", "white");
      d3.selectAll("table tbody tr").style("display", "none");
      d3.selectAll("tbody tr." + selectedState).style("display", "table-row");
      d3.selectAll("tbody tr." + selectedState).style("background-color", function(d,i) {
        if (i % 2 == 0) {
          return "#f0f0f0";
        }
      });
  };

  // draw table filter dropdown
  var dropdown = d3.select("#filter")
      .insert("select")
      .on("change", filterData);

  dropdown.selectAll("option")
                .data(shootingsByState)
              .enter().append("option")
                .attr("value", function (d) { return d.key; })
                .text(function (d) {
                    return d.key;
                });

  // filter data to what we need for table 
  var shootingsTable = shootings.map(function(d) {
    return {
      date: d.date,
      city: d.city,
      state: d.state,
      killed: d.killed,
    }
  });

  // draw table
  var tr = table
   .selectAll("tr")
   .data(shootingsTable)
   .enter().append("tr")
   .attr("class",function(d) { return d.state; });

   d3.selectAll("tbody tr:nth-child(odd)").style("background-color", "#f0f0f0");

  var td = tr.selectAll("td")
   .data(function(d, i) { return Object.values(d); })
   .enter().append("td")
     .text(function(d) { return d; });
});
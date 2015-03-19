'use strict';
(function($){
    /*
    // **Item class**: The atomic part of our Model. A model is basically a Javascript object, i.e. key-value pairs, with some helper functions to handle event triggering, persistence, etc.
    var Ticker = Backbone.Model.extend({
	defaults: {
	    part1: 'hello',
	    part2: 'world'
	}
    });

    // **List class**: A collection of `Item`s. Basically an array of Model objects with some helper functions.
    var = Backbone.Collection.extend({
	model: Ticker
    });
    */
    var CandleStickChart = Backbone.View.extend({
	el: $('#candlestick'),
	initialize: function(){
	    // create container element
	    _.bindAll(this, "render", "frame");
	    this.collection.bind("reset", this.frame);
	    this.collection.bind("change", this.render);
	    this.chart = d3.select("#candlestick")
		.append("svg:svg")
		.attr("class", "candlestick")
		.attr("width", width)
		.attr("height", height);
	    var y = d3.scale.linear()
		.domain([d3.min(data.map(function(x) {return x["Low"];})), d3.max(data.map(function(x){return x["High"];}))])
		.range([height-margin, margin]);
	    var x = d3.scale.linear()
		.domain([d3.min(data.map(function(d){return dateFormat.parse(d.Date).getTime();})),
			 d3.max(data.map(function(d){return dateFormat.parse(d.Date).getTime();}))])
		.range([margin,width-margin]);

	    chart.selectAll("line.x")
		.data(x.ticks(10))
		.enter().append("svg:line")
		.attr("class", "x")
		.attr("x1", x)
		.attr("x2", x)
		.attr("y1", margin)
		.attr("y2", height - margin)
		.attr("stroke", "#ccc");

	    chart.selectAll("line.y")
		.data(y.ticks(10))
		.enter().append("svg:line")
		.attr("class", "y")
		.attr("x1", margin)
		.attr("x2", width - margin)
		.attr("y1", y)
		.attr("y2", y)
		.attr("stroke", "#ccc");

	    chart.selectAll("text.xrule")
		.data(x.ticks(10))
		.enter().append("svg:text")
		.attr("class", "xrule")
		.attr("x", x)
		.attr("y", height - margin)
		.attr("dy", 20)
		.attr("text-anchor", "middle")
		.text(function(d){ var date = new Date(d * 1000);  return (date.getMonth() + 1)+"/"+date.getDate(); });
	    
	    chart.selectAll("text.yrule")
		.data(y.ticks(10))
		.enter().append("svg:text")
		.attr("class", "yrule")
		.attr("x", width - margin)
		.attr("y", y)
		.attr("dy", 0)
		.attr("dx", 20)		 
		.attr("text-anchor", "middle")
		.text(String);

	    chart.selectAll("rect")
		.data(data)
		.enter().append("svg:rect")
		.attr("x", function(d) { return x(dateFormat.parse(d.Date).getTime()); })
		.attr("y", function(d) {return y(max(d.Open, d.Close));})		  
		.attr("height", function(d) { return y(min(d.Open, d.Close))-y(max(d.Open, d.Close));})
		.attr("width", function(d) { return 0.5 * (width - 2*margin)/data.length; })
		.attr("fill",function(d) { return d.Open > d.Close ? "red" : "green" ;});

	    chart.selectAll("line.stem")
		.data(data)
		.enter().append("svg:line")
		.attr("class", "stem")
		.attr("x1", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (width - 2 * margin)/ data.length;})
		.attr("x2", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (width - 2 * margin)/ data.length;})		    
		.attr("y1", function(d) { return y(d.High);})
		.attr("y2", function(d) { return y(d.Low); })
		.attr("stroke", function(d){ return d.Open > d.Close ? "red" : "green"; })
	},

	render: function() {
	    // on changes in collection, render changes
	},

	frame: function() {
	    // on time draw -- axes, title, etc
	},
    });
    var chart = new CandleStickChart();
})(jQuery);
/*
  var width = 900;
  var height = 500;
  String.prototype.format = function() {
  var formatted = this;
  for (var i = 0; i < arguments.length; i++) {
  var regexp = new RegExp('\\{'+i+'\\}', 'gi');
  formatted = formatted.replace(regexp, arguments[i]);
  }
  return formatted;
  };

  var dateFormat = d3.time.format("%Y-%m-%d");
  var end = new Date();
  var start = new Date(end.getTime() - 1000 * 60 * 60 * 24 * 60);
  var data = [];

  function min(a, b){ return a < b ? a : b ; }

  function max(a, b){ return a > b ? a : b; }    

  function buildChart(data) {
  var margin = 50;
  var chart = d3.select("#candlestick")
  .append("svg:svg")
  .attr("class", "candlestick")
  .attr("width", width)
  .attr("height", height);
  var y = d3.scale.linear()
  .domain([d3.min(data.map(function(x) {return x["Low"];})), d3.max(data.map(function(x){return x["High"];}))])
  .range([height-margin, margin]);
  var x = d3.scale.linear()
  .domain([d3.min(data.map(function(d){return dateFormat.parse(d.Date).getTime();})),
  d3.max(data.map(function(d){return dateFormat.parse(d.Date).getTime();}))])
  .range([margin,width-margin]);

  chart.selectAll("line.x")
  .data(x.ticks(10))
  .enter().append("svg:line")
  .attr("class", "x")
  .attr("x1", x)
  .attr("x2", x)
  .attr("y1", margin)
  .attr("y2", height - margin)
  .attr("stroke", "#ccc");

  chart.selectAll("line.y")
  .data(y.ticks(10))
  .enter().append("svg:line")
  .attr("class", "y")
  .attr("x1", margin)
  .attr("x2", width - margin)
  .attr("y1", y)
  .attr("y2", y)
  .attr("stroke", "#ccc");

  chart.selectAll("text.xrule")
  .data(x.ticks(10))
  .enter().append("svg:text")
  .attr("class", "xrule")
  .attr("x", x)
  .attr("y", height - margin)
  .attr("dy", 20)
  .attr("text-anchor", "middle")
  .text(function(d){ var date = new Date(d * 1000);  return (date.getMonth() + 1)+"/"+date.getDate(); });
  
  chart.selectAll("text.yrule")
  .data(y.ticks(10))
  .enter().append("svg:text")
  .attr("class", "yrule")
  .attr("x", width - margin)
  .attr("y", y)
  .attr("dy", 0)
  .attr("dx", 20)		 
  .attr("text-anchor", "middle")
  .text(String);

  chart.selectAll("rect")
  .data(data)
  .enter().append("svg:rect")
  .attr("x", function(d) { return x(dateFormat.parse(d.Date).getTime()); })
  .attr("y", function(d) {return y(max(d.Open, d.Close));})		  
  .attr("height", function(d) { return y(min(d.Open, d.Close))-y(max(d.Open, d.Close));})
  .attr("width", function(d) { return 0.5 * (width - 2*margin)/data.length; })
  .attr("fill",function(d) { return d.Open > d.Close ? "red" : "green" ;});

  chart.selectAll("line.stem")
  .data(data)
  .enter().append("svg:line")
  .attr("class", "stem")
  .attr("x1", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (width - 2 * margin)/ data.length;})
  .attr("x2", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (width - 2 * margin)/ data.length;})		    
  .attr("y1", function(d) { return y(d.High);})
  .attr("y2", function(d) { return y(d.Low); })
  .attr("stroke", function(d){ return d.Open > d.Close ? "red" : "green"; })
  }

  function appendToData(x) {
  if(data.length > 0) return;
  data = x.query.results.quote;
  for(var i = 0 ; i < data.length; i++)
  data[i].timestamp = (new Date(data[i].date).getTime() / 1000);
  data = data.sort(function(x, y){ return dateFormat.parse(x.Date).getTime() - dateFormat.parse(y.Date).getTime(); });		
  buildChart(data);
  }

  function buildQuery(name) {
  var base = "select * from yahoo.finance.historicaldata where symbol = \"{0}\" and startDate = \"{1}\" and endDate = \"{2}\"";
  var getDateString = d3.time.format("%Y-%m-%d");
  var symbol = window.location.hash;
  if(symbol === ""){
  symbol = name;
  }
  symbol = symbol.replace("#", "");		  
  var query = base.format(symbol, getDateString(start), getDateString(end));
  query = encodeURIComponent(query);
  var url = "http://query.yahooapis.com/v1/public/yql?q={0}&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=appendToData".format(query);
  return url;
  }

  function fetchData(name) {	  
  var url = buildQuery(name);	  
  var scriptElement = document.createElement("SCRIPT");
  scriptElement.type = "text/javascript";
  scriptElement.src = url;
  document.getElementsByTagName("HEAD")[0].appendChild(scriptElement);
  }

  $('#build').click(function() {
  fetchData($('#tickerValueId').val());
  });
*/

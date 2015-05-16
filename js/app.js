'use strict';

$(function() {
    function collectData(symbol, startDate, endDate) {
	var url = "http://query.yahooapis.com/v1/public/yql";
	var data = encodeURIComponent("select * from yahoo.finance.historicaldata where symbol in ('"
				      + symbol + "') and startDate = \""
				      + startDate + "\" and endDate = \""
				      + endDate + "\"");
	$.getJSON(url, "q=" + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env")
	    .done(function (data) {
		console.log("url: " + this.url + "q=" + this.data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env");

		// create model (data.query.results gives use the data we want for stockData)
		var newModel = new CandleModel({ symbol: symbol, startDate: startDate, endDate: endDate, stockData: data.query.results.quote });
		// create collection (store data to LocalStorage)
		candleCollection.create(newModel);

		// create default view object
		var newView = new CandleView({ el: $("#candleView"), model: newModel });
		newView.render();
	    })
	    .fail(function (jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log('Request failed: ' + err);
	    });
	return;
    };

    var CandleModel = Backbone.Model.extend({
	defaults: {
	    symbol: "",
	    startDate: "",
	    endDate: "",
	    stockData: []
	}
    });

    var CandleCollection = Backbone.Collection.extend({
	model: CandleModel,
	localStorage: new Store("stock_data")
    });

    var candleCollection = new CandleCollection();

    var CandleView = Backbone.View.extend({
	el: '#candleView',
	constructor: function(options) {
	    this.default_options = {
		margin: {
		    top: 20,
		    right: 20,
		    bottom: 30,
		    left: 40
		}
	    };
	    this.options = $.extend(true, this.default_options, options);
	    Backbone.View.apply(this, arguments);
	},
	render: function(options) {
	    var data = JSON.parse(JSON.stringify(this.model.toJSON())).stockData;
	    console.log(data[0]);
            var margin = this.options.margin;
            this.width = this.$el.width() - margin.left - margin.right;
            this.height = this.$el.height() - margin.top - margin.bottom;
            var chart = d3.select("#candlestick")
		.append("svg:svg")
		.attr("class", "chart")
		.attr("width", this.width)
		.attr("height", this.height);
            var y = d3.scale.linear()
		.domain([d3.min(data.map(function(x) {return x["Low"];})), d3.max(data.map(function(x){return x["High"];}))])
		.range([this.height-margin, margin]);
            var x = d3.scale.linear()
		.domain([d3.min(data.map(function(d){return dateFormat.parse(d.Date).getTime();})),
			 d3.max(data.map(function(d){return dateFormat.parse(d.Date).getTime();}))])
		.range([margin,this.width-margin]);

            chart.selectAll("line.x")
		.data(x.ticks(10))
		.enter().append("svg:line")
		.attr("class", "x")
		.attr("x1", x)
		.attr("x2", x)
		.attr("y1", margin)
		.attr("y2", this.height - margin)
		.attr("stroke", "#ccc");

            chart.selectAll("line.y")
		.data(y.ticks(10))
		.enter().append("svg:line")
		.attr("class", "y")
		.attr("x1", margin)
		.attr("x2", this.width - margin)
		.attr("y1", y)
		.attr("y2", y)
		.attr("stroke", "#ccc");

            chart.selectAll("text.xrule")
		.data(x.ticks(10))
		.enter().append("svg:text")
		.attr("class", "xrule")
		.attr("x", x)
		.attr("y", this.height - margin)
		.attr("dy", 20)
		.attr("text-anchor", "middle")
		.text(function(d){ var date = new Date(d * 1000);  return (date.getMonth() + 1)+"/"+date.getDate(); });

            chart.selectAll("text.yrule")
		.data(y.ticks(10))
		.enter().append("svg:text")
		.attr("class", "yrule")
		.attr("x", this.width - margin)
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
		.attr("this.height", function(d) { return y(min(d.Open, d.Close))-y(max(d.Open, d.Close));})
		.attr("this.width", function(d) { return 0.5 * (this.width - 2*margin)/data.length; })
		.attr("fill",function(d) { return d.Open > d.Close ? "red" : "green" ;});

            chart.selectAll("line.stem")
		.data(data)
		.enter().append("svg:line")
		.attr("class", "stem")
		.attr("x1", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (this.width - 2 * margin)/ data.length;})
		.attr("x2", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (this.width - 2 * margin)/ data.length;})
		.attr("y1", function(d) { return y(d.High);})
		.attr("y2", function(d) { return y(d.Low); })
		.attr("stroke", function(d){ return d.Open > d.Close ? "red" : "green"; })
            return this;
	}
    });

    var ChartView = Backbone.View.extend({
	el: '.app',
	events: {
	    "click .buildBtn":  "build",
	    "click .resetBtn":  "reset"
	},
	initialize: function() {
	    // Compile the template using underscore
	    var template = _.template( $("#chartTemplate").html());
	    this.$el.html( template );

	    // set up datepicker (for ui coolness)
	    $("#startDatePicker").datepicker({
		autoclose: true,
		changeMonth: true,
		changeYear: true,
		dateFormat: "yy-mm-dd",
		maxDate: new Date(),
		onClose: function( selectedDate ) {
		    $( "#endDatePicker" ).datepicker( "option", "minDate", selectedDate );
		    $( "#endDatePicker" ).datepicker( "option", "maxDate", new Date());
		}
	    });
	    $('#endDatePicker').datepicker({
		autoclose: true,
		changeMonth: true,
		changeYear: true,
		maxDate: new Date(),
		dateFormat: "yy-mm-dd",
		onClose: function( selectedDate ) {
		    $( "#startDatePicker" ).datepicker( "option", "maxDate", selectedDate );
		}
	    });

	    // default fields
	    var startField = "2014-01-01";
	    var endField = "2015-01-01";
	    var symbolField =  "AAPL";

	    // collect data
	    collectData(symbolField, startField, endField);
	},
	build: function() {
	    // read form data
	    var startField = this.$( "#startDatePicker" ).val();
	    var endField = this.$( "#endDatePicker" ).val();
	    var symbolField =  this.$( "#symbolField" ).val();

	    // form entry validator
	    if (symbolField != "" && startField != "" && endField != "") {
		// collect data
		collectData(symbolField, startField, endField);
	    } else {
		$("#symbolField").removeAttr('placeholder');
		$("#symbolField").attr('placeholder','Please enter a valid ticker symbol!');
	    }
	},
	reset: function() {
	    // clear form
	    $("#myForm")[0].reset();

	    // clear candlestick charts
	    d3.select("svg").remove();

	    // clear local storage
	    localStorage.clear();

	    // check console type
	    if (typeof console._commandLineAPI !== 'undefined') {
		console.API = console._commandLineAPI;
	    } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
		console.API = console._inspectorCommandLineAPI;
	    } else if (typeof console.clear !== 'undefined') {
		console.API = console;
	    }

	    // clear console
	    console.API.clear();

	    return;
	}
    });
    var app = new ChartView({ el: $("#chartContainer") });
});

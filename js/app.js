'use strict';

$(function() {
    /*
      Collect Data
    */
    function collectData(symbol, startDate, endDate) {
	var url = "https://query.yahooapis.com/v1/public/yql";
	var data = encodeURIComponent("select * from yahoo.finance.historicaldata where symbol in ('"
				      + symbol + "') and startDate = \""
				      + startDate + "\" and endDate = \""
				      + endDate + "\"");
        data += "&format=json&diagnostics=true&env=http://datatables.org/alltables.env";
	$.getJSON(url, "q=" + data)
	    .done(function(data) {
		var stockData = data.query.results.quote;

		// add timestamp to stockData object
		for(var i = 0; i < stockData.length; i++)
		    stockData[i].timestamp = (new Date(stockData[i].Date).getTime() / 10000);

		var sortedStockData = stockData.sort(function(x,y){ 
                    return d3.time.format("%Y-%m-%d").parse(x.Date).getTime() - d3.time.format("%Y-%m-%d").parse(y.Date).getTime();
                });

		// create model (data.query.results gives use the data we want for stockData)
		var newModel = new CandleModel({ 
                    symbol: symbol,                       
                    startDate: startDate,
                    endDate: endDate,
                    stockData: stockData
                });

		// create collection
		candleCollection.create(newModel);

		// create default view object
		var newCandleStickView = new CandleView({ el: $("#candleView"), model: newModel });
		newCandleStickView.render();
	    })
	    .fail(function (jqxhr, textStatus, error) {
		var err = textStatus + ", " + error;
		console.log('Request failed: ' + err);
	    });
    };

    // helper functions
    function min(a, b){ return a < b ? a : b; }
    function max(a, b){ return a > b ? a : b; }
    var chartNameArray = new Array();

    /*
      Model: CandleModel
    */
    var CandleModel = Backbone.Model.extend({
	defaults: {
	    symbol: "",
	    startDate: "",
	    endDate: "",
	    stockData: []
	}
    });

    /*
      Collection of Stocks Queried
    */
    var CandleCollection = Backbone.Collection.extend({
	model: CandleModel,
	localStorage: new Store("stock")
    });

    /*
      View: CandleView
    */
    var CandleView = Backbone.View.extend({
	el: '#candleView',
	render: function(options) {
	    // helper variables
	    var uniqueChartName = this.model.get("symbol") + "_" + this.model.get("startDate") + "_" + this.model.get("endDate");
	    chartNameArray.push("." + uniqueChartName);
	    var format = d3.format();

	    // get stock data from current model
	    var data = this.model.get("stockData");

	    // default margin, width, height values
            var margin = 40;
	    var width = 550;
	    var height = 300;

            var chart = d3.select(this.el)
		.append("svg:svg")
		.attr("class", uniqueChartName)
		.attr("width", width)
		.attr("height", height);
	    var y = d3.scale.linear()
		.domain([d3.min(data.map(function(x) {return x["Low"];})), d3.max(data.map(function(x) {return x["High"];}))])
		.range([height - margin, margin]);
	    var x = d3.scale.linear()
		.domain([d3.min(data.map(function(x) {return x.timestamp;})), d3.max(data.map(function(x) { return x.timestamp;}))])
		.range([margin, width - margin]);

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
		.text(function(d) { var date = new Date(d * 1000);  return (date.getMonth() + 1) + "/" + date.getDate(); });
            chart.selectAll("text.yrule")
		.data(y.ticks(10))
		.enter().append("svg:text")
		.attr("class", "yrule")
		.attr("x", width - margin)
		.attr("y", y)
		.attr("dy", 0)
		.attr("dx", 20)
		.attr("text-anchor", "middle")
		.text(function(d) { return "$" + format(d); });
	    chart.selectAll("rect")
		.data(data)
		.enter().append("svg:rect")
		.attr("x", function(d) { return x(d.timestamp); })
		.attr("y", function(d) { return y(max(d.Open, d.Close)); })
		.attr("height", function(d) {
		    var temp = y(min(d.Open, d.Close)) - y(max(d.Open, d.Close));
		    if (temp < 0){
			temp = y(max(d.Open, d.Close)) - y(min(d.Open, d.Close));
		    } return temp;
		})
		.attr("width", function(d) { return 0.5 * (width - 2 * margin)/data.length; })
		.attr("fill", function(d) { return d.Open > d.Close ? "red" : "green"; });
	    chart.selectAll("line.stem")
		.data(data)
		.enter().append("svg:line")
		.attr("class", "stem")
		.attr("x1", function(d) { return x(d.timestamp) + 0.25 * (width - 2 * margin)/data.length; })
		.attr("x2", function(d) { return x(d.timestamp) + 0.25 * (width - 2 * margin)/data.length; })
		.attr("y1", function(d) { return y(d.High); })
		.attr("y2", function(d) { return y(d.Low); })
		.attr("stroke", function(d) { return d.Open > d.Close ? "red" : "green"; })

            return;
	}
    });

    /*
      View: AppView
    */
    var AppView = Backbone.View.extend({
	el: '#app',
	events: {
	    "click .buildBtn":  "build",
	    "click .resetBtn":  "reset"
	},
	initialize: function() {
	    var template = _.template( $("#chartTemplate").html());
	    this.$el.html( template );

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
	    var startField = "2015-01-01";
	    var endField = "2015-03-17";
	    var symbolField =  "AAPL";

	    collectData(symbolField, startField, endField);
	},
	build: function() {
	    var startField = this.$( "#startDatePicker" ).val();
	    var endField = this.$( "#endDatePicker" ).val();
	    var symbolField =  this.$( "#symbolField" ).val();

	    // form entry validator
	    if (symbolField != "" && startField != "" && endField != "") {
		collectData(symbolField, startField, endField);
	    } else if (symbolField === "") {
		$("#symbolField").removeAttr('placeholder');
		$("#symbolField").attr('placeholder','Please enter a valid ticker symbol!');
	    } else if (startField === "") {
		$("#startDatePicker").removeAttr('placeholder');
		$("#startDatePicker").attr('placeholder','Please enter a valid start date!');
	    } else if (endField === "") {
		$("#endDatePicker").removeAttr('placeholder');
		$("#endDatePicker").attr('placeholder','Please enter a valid end date!');
	    }
	},
	reset: function() {
	    $("#myForm")[0].reset();

	    localStorage.clear();

	    if (typeof console._commandLineAPI !== 'undefined') {
		console.API = console._commandLineAPI;
	    } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
		console.API = console._inspectorCommandLineAPI;
	    } else if (typeof console.clear !== 'undefined') {
		console.API = console;
	    }

	    console.API.clear();

	    for (var i = 0; i < chartNameArray.length; i++)
		d3.select(chartNameArray[i]).remove();

	    return;
	}
    });

    var candleCollection = new CandleCollection();
    var app = new AppView({ el: $("#app") });
});

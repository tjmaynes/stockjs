'use strict';

$(function() {
    var CandleModel = Backbone.Model.extend({
	url: "http://query.yahooapis.com/v1/public/yql",
	defaults: {
	    symbol: "AAPL",
	    startDate: "2014-01-01",
	    endDate: "2015-01-01",
	    stockData: []
	},
	initialize: function() {
            _.bindAll(this, "getData");
            this.getData();
	},
	getData: function() {
	    console.log(this.get("symbol"));
	    var self = this;
	    var data = encodeURIComponent("select * from yahoo.finance.historicaldata where symbol in ('"
					  + this.get("symbol") + "') and startDate = \""
					  + this.get("startDate") + "\" and endDate = \""
					  + this.get("endDate") + "\"");
	    $.getJSON(this.url, "q=" + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env")
		.done(function (data) {
		    console.log("url: " + this.url + "q=" + this.data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env");
		    self.set({ stockData: data.query.results.quote });
		})
		.fail(function (jqxhr, textStatus, error) {
		    var err = textStatus + ", " + error;
		    console.log('Request failed: ' + err);
		});
	},
	destroy: function() {
	    this.model.destroy();
	}
    });

    var CandleCollection = Backbone.Collection.extend({
	model: CandleModel,
	localStorage: new Store("stock_data")
    });

    var candleCollection = new CandleCollection();

    var CandleView = Backbone.View.extend({
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
	initialize: function(options) {
	    _.bindAll(this, "render");
	    candleCollection.bind('change', this.render);
	},
	render: function(options) {
	    console.log(JSON.stringify(candleCollection));
            var margin = this.options.margin;
            this.width = this.$el.width() - margin.left - margin.right;
            this.height = this.$el.height() - margin.top - margin.bottom;
            var data =  candleCollection.toJSON(); //JSON.stringify(candleCollection);
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

	    // create model and collection
	    candleCollection.create(new CandleModel());

	    // create new view objects
	    new CandleView({ el: $("#candleView") });
	},
	build: function() {
	    var startField = this.$( "#startDatePicker" ).val();
	    var endField = this.$( "#endDatePicker" ).val();
	    var symbolField =  this.$( "#symbolField" ).val();

	    if (symbolField != "" && startField != "" && endField != "") {
		candleCollection.create(new CandleModel({ symbol: symbolField, startDate: startField, endDate: endField }));
		new CandleView({ el: $("#candleView") });
	    } else {
		$("#symbolField").removeAttr('placeholder');
		$("#symbolField").attr('placeholder','Please enter a valid ticker symbol!');
	    }
	},
	reset: function() {
	    $("#myForm")[0].reset();
	    d3.select("svg").remove();
	    localStorage.clear();
	    return;
	}
    });
    var app = new ChartView({ el: $("#chartContainer") });
});

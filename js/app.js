'use strict';

$(function(){
    var CandleModel = Backbone.Model.extend({
	url: "http://query.yahooapis.com/v1/public/yql",
	defaults: {
	    symbol: "AAPL",
	    startDate: "2012-01-01",
	    endDate: "2012-12-31",
	    period: "d"
	},
	initialize: function(){
	    var data = encodeURIComponent("select * from yahoo.finance.historicaldata where symbol in ('" + this.get("symbol") + "') and startDate = \"" + this.get("startDate") + "\" and endDate = \"" + this.get("endDate") + "\"");
	    $.getJSON(this.url, "q=" + data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env")
		.done(function (data) {
		    console.log("url: " + this.url + "q=" + this.data + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env");
		    //$('#result').text("Price: " + data.query.results.quote[0][0]);
		    return data;
		})
		.fail(function (jqxhr, textStatus, error) {
		    var err = textStatus + ", " + error;
		    console.log('Request failed: ' + err);
		});
        },
	destroy: function(){
	    this.model.destroy();
	}
    });

    var CandleCollection = Backbone.Collection.extend({
	model: CandleModel,
	localStorage: new Store("stock-data") //Backbone.LocalStorage
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
	    // create container element
	    //_.bindAll(this, "render");
	    this.render();
	},
	render: function() {
	    console.log("render chart");
	    return;
	    /*
              var margin = this.options.margin;
              this.width = this.$el.width() - margin.left - margin.right;
              this.height = this.$el.height() - margin.top - margin.bottom;
              var data = [];
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
	    */
	}
    });

    var ListView = Backbone.View.extend({
	initialize: function() {
	    //this.model.bind('click', this.render); // test this later --> may effect new on line 184
	    this.render();
	},
	render: function() {
	    //this.model.fetch();
	    this.$el.html(JSON.stringify(candleCollection));
	    console.log(candleCollection.toJSON());
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
	    $("#endDatePicker").datepicker({
		dateFormat: "yy-mm-dd",
		minDate: 0,
		onSelect: function (date) {
		    var startDate = $('#startDatePicker');
		    var endDate = $(this).datepicker('getDate');
		    var minDate = $(this).datepicker('getDate');
		    startDate.datepicker('setDate', minDate);
		    endDate.setDate(endDate.getDate());
		    startDate.datepicker('option', 'maxDate', endDate);
		    startDate.datepicker('option', 'minDate', minDate);
		    $(this).datepicker('option', 'minDate', minDate);
		}
	    });
	    $('#startDatePicker').datepicker({
		dateFormat: "yy-mm-dd"
	    });

	    // get data from fields
	    var symbolField =  "AAPL";
	    var periodField = $('input[name="periodBtn"]:checked').val();

	    // create model and add to collection
	    var defaultModel = new CandleModel({ symbol: symbolField, period: periodField });
	    candleCollection.create(defaultModel);

	    // create new view objects
	    var candleView = new CandleView({ el: $("#candleView") });
	    var listView = new ListView({ el: $("#listView") });
	},
	build: function() {
	    var startField = $( "#startDatePicker" ).val();
	    var endField = $( "#endDatePicker" ).val();
	    var symbolField =  this.$("#tickerField").val();
	    var periodField = $('input[name="periodBtn"]:checked').val();
	    if (symbolField != '' && periodField != '' && startField != '' && endField != '') {
		// create model and add to collection
		var buildNewModel = new CandleModel({ symbol: symbolField, startDate: startField, endDate: endField, period: periodField });
		candleCollection.create(buildNewModel);
		var candleView = new CandleView({ el: $("#candleView") });
		var listView = new ListView({ el: $("#listView") });
	    } else {
		$(".symbolField").removeAttr('placeholder');
		$(".symbolField").attr('placeholder','Please enter a valid ticker symbol!');
	    }
	},
	reset: function() {
	    $("#myForm")[0].reset(); 	    // reset the form
	    d3.select("svg").remove();      // reset candlestick chart
	    candleCollection.each(function(model) {
		this.model.destroy();
	    });
	    return;
	},
	modelAttributes: function() {
	    return {
		symbol: symbolField,
		startDate: startField,
		endDate: endField,
		period: periodField
	    }
	}
    });
    var app = new ChartView({ el: $("#chartContainer") });
});

'use strict';
(function($){
    var CandleModel = Backbone.Model.extend({
	defaults: {
	    ticker: "Not specified"
	},
	query: 'AAPL',
	url: 'http://query.yahooapis.com/v1/public/yql?q={0}&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys&callback=',
	format: 'json',
	timeout: 10000,
	dataType: 'jsonp',
	fetch: function (options) {
            options = options ? _.clone(options) : {};
            options.data = options.data ? _.clone(options.data) : {};
            if (!options.data.q) {
		options.data.q = _.result(this, 'query')
            }
            if (!options.data.format) {
		options.data.format = _.result(this, 'format');
            }
            return Backbone.Collection.prototype.fetch.call(this, options);
	},
	sync: function(method, model, options){
            options.timeout = _.result(this, 'timeout');
            options.dataType = _.result(this, 'dataType');
            return Backbone.sync(method, model, options);
	},
	parse: function(response) {
            return response.query.results.json.json;
	}
    });

    var CandleCollection = Backbone.Collection.extend({
	model: CandleModel,
    });
    
    var CandleView = Backbone.View.extend({
	el: $('.wrapper'),
	model: CandleModel,
	events: {
	    "click .buildBtn":  "getTickerValue"
	},
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
	    console.log("constructor");
	},
	initialize: function(options) {
	    // create container element
	    _.bindAll(this, "getTickerValue");
	    console.log("initialize");
	},
	getTickerValue: function() {
	    var input =  this.$(".tickerValueId").val();
	    if (input != '') {
		//this.collection.save({content: input});
		this.draw();
	    } else {
		$('input[type=text]').removeAttr('placeholder');
		$('input[type=text]').attr('placeholder','Please enter a valid ticker symbol!');
		return;
	    }
	},
	draw: function() {
	    var margin = this.options.margin;
	    this.width = this.$el.width() - margin.left - margin.right;
	    this.height = this.$el.height() - margin.top - margin.bottom;
	    /*
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
		*/
	    return this;
	}
    });
    var candle = new CandleView();
})(jQuery);

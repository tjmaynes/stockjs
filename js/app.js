'use strict';
(function($){
    var TickerModel = Backbone.Model.extend({
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

    var TickerCollection = Backbone.Collection.extend({
	model: TickerModel
    });
    
    var ChartView = Backbone.View.extend({
	el: $('#candlestick'),
	initialize: function(){
	    // create container element
	    _.bindAll(this, "render", "frame");
	    this.collection.bind("reset", this.frame);
	    this.collection.bind("change", this.render);
	    this.chart = d3.select(this.el);
	},

	render: function() {
	    this.chart = d3.select(this.el)
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

	    this.chart.selectAll("line.x")
		.data(x.ticks(10))
		.enter().append("svg:line")
		.attr("class", "x")
		.attr("x1", x)
		.attr("x2", x)
		.attr("y1", margin)
		.attr("y2", height - margin)
		.attr("stroke", "#ccc");

	    this.chart.selectAll("line.y")
		.data(y.ticks(10))
		.enter().append("svg:line")
		.attr("class", "y")
		.attr("x1", margin)
		.attr("x2", width - margin)
		.attr("y1", y)
		.attr("y2", y)
		.attr("stroke", "#ccc");

	    this.chart.selectAll("text.xrule")
		.data(x.ticks(10))
		.enter().append("svg:text")
		.attr("class", "xrule")
		.attr("x", x)
		.attr("y", height - margin)
		.attr("dy", 20)
		.attr("text-anchor", "middle")
		.text(function(d){ var date = new Date(d * 1000);  return (date.getMonth() + 1)+"/"+date.getDate(); });
	    
	    this.chart.selectAll("text.yrule")
		.data(y.ticks(10))
		.enter().append("svg:text")
		.attr("class", "yrule")
		.attr("x", width - margin)
		.attr("y", y)
		.attr("dy", 0)
		.attr("dx", 20)		 
		.attr("text-anchor", "middle")
		.text(String);

	    this.chart.selectAll("rect")
		.data(data)
		.enter().append("svg:rect")
		.attr("x", function(d) { return x(dateFormat.parse(d.Date).getTime()); })
		.attr("y", function(d) {return y(max(d.Open, d.Close));})		  
		.attr("height", function(d) { return y(min(d.Open, d.Close))-y(max(d.Open, d.Close));})
		.attr("width", function(d) { return 0.5 * (width - 2*margin)/data.length; })
		.attr("fill",function(d) { return d.Open > d.Close ? "red" : "green" ;});

	    this.chart.selectAll("line.stem")
		.data(data)
		.enter().append("svg:line")
		.attr("class", "stem")
		.attr("x1", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (width - 2 * margin)/ data.length;})
		.attr("x2", function(d) { return x(dateFormat.parse(d.Date).getTime()) + 0.25 * (width - 2 * margin)/ data.length;})		    
		.attr("y1", function(d) { return y(d.High);})
		.attr("y2", function(d) { return y(d.Low); })
		.attr("stroke", function(d){ return d.Open > d.Close ? "red" : "green"; })
	},

	frame: function() {
	    // on time draw -- axes, title, etc
	    console.log("hello from frame!");
	},
    });
    var candle = new ChartView();
})(jQuery);

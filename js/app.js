'use strict';

$(function() {
  const chartWidth = $(document).width() - 100;
  const chartHeight = 430;

  var chartNameArray = new Array();
  var candleCollection = new CandleCollection();
  var app = new AppView();

  /*
  * Model: CandleModel
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
  * Collection of Stocks Queried
  */
  var CandleCollection = Backbone.Collection.extend({
    model: CandleModel,
    localStorage: new Store("stock")
  });

  /*
  * View: CandleChart
  */
  var CandleChart = Backbone.View.extend({
    el: '#candleChart',
    initialize: function(options) {
      var symbol = this.model.get("symbol");
      var startDate = this.model.get("startDate");
      var endDate = this.model.get("endDate");
      var info = symbol + " between " + startDate + " and " + endDate;
      var data = this.model.get("stockData");

      var chartName = symbol + "-" + startDate + "-" + endDate;
      chartNameArray.push("." + chartName);

      $( "#candleChart" ).width(chartWidth);

      buildChartView({ element: this.el, chartName: chartName, data: data });
      $( "#candleChart" ).append( "<p id=\"candleChartInfo\">" + info + "</p>" );

      return self;
    }
  });

  function buildChartView(options) {
    var element = options.element;
    var chartName = options.chartName;
    var data = options.data;

    var margin = 40;
    var width = chartWidth;
    var height = chartHeight;

    var chart = d3.select(element)
    .append("svg:svg")
    .attr("class", chartName)
    .attr("width", width)
    .attr("height", height);

    var minDate = getDate(data[0]),
        maxDate = getDate(data[data.length - 1]);

    var x = d3.time.scale()
    .domain([minDate, maxDate])
    .range([margin, width - margin]);

    var y = d3.scale.linear()
    .domain([d3.min(data.map(function(x) {return x["Low"];})), d3.max(data.map(function(x) {return x["High"];}))])
    .range([height - margin, margin]);

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
    .text(function(d) { return $.datepicker.formatDate('M dd yy', d); });

    var format = d3.format();

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
    .attr("x", function(d) { return x(getDate(d)); })
    .attr("y", function(d) { return y(max(d.Open, d.Close)); })
    .attr("height", function(d) {
      var temp = y(min(d.Open, d.Close)) - y(max(d.Open, d.Close));
      if (temp < 0) {
        temp = y(max(d.Open, d.Close)) - y(min(d.Open, d.Close));
      }
      return temp;
    })
    .attr("width", function(d) { return 0.5 * (width - 2 * margin)/data.length; })
    .attr("fill", function(d) { return d.Open > d.Close ? "red" : "green"; });

    chart.selectAll("line.stem")
    .data(data)
    .enter().append("svg:line")
    .attr("class", "stem")
    .attr("x1", function(d) { return x(getDate(d)) + 0.25 * (width - 2 * margin)/data.length; })
    .attr("x2", function(d) { return x(getDate(d)) + 0.25 * (width - 2 * margin)/data.length; })
    .attr("y1", function(d) { return y(d.High); })
    .attr("y2", function(d) { return y(d.Low); })
    .attr("stroke", function(d) { return d.Open > d.Close ? "red" : "green"; })
  }

  /*
  * View: AppView
  */
  var AppView = Backbone.View.extend({
    el: '#app',

    events: {
      "click .buildBtn":  "build",
      "click .resetBtn":  "reset"
    },

    initialize: function() {
      var chartTemplate = _.template( $("#chartTemplate").html());
      this.$el.html( chartTemplate );

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
      $("#chartForm")[0].reset();

      localStorage.clear();

      if (typeof console._commandLineAPI !== 'undefined') {
        console.API = console._commandLineAPI;
      } else if (typeof console._inspectorCommandLineAPI !== 'undefined') {
        console.API = console._inspectorCommandLineAPI;
      } else if (typeof console.clear !== 'undefined') {
        console.API = console;
      }

      console.API.clear();

      for (var i = 0; i < chartNameArray.length; i++) {
        d3.select(chartNameArray[i]).remove();
      }

      $("#candleChartInfo").text("");

      return;
    }
  });

  /*
  * Collect Data
  */
  function collectData(symbol, startDate, endDate) {
    var url = "https://query.yahooapis.com/v1/public/yql";
    var yqlStatement = "select * from yahoo.finance.historicaldata where symbol in ('" + symbol + "') and startDate = \"" + startDate + "\" and endDate = \"" + endDate + "\"";
    var queryComponent = encodeURIComponent(yqlStatement);
    var query  = queryComponent + "&format=json&diagnostics=true&env=http://datatables.org/alltables.env";

    $.getJSON(url, "q=" + query).done(function(data) {
      var stockData = data.query.results.quote;

      for (var i = 0; i < stockData.length; i++) {
          stockData[i].timestamp = (new Date(stockData[i].Date).getTime() / 10000);
      }

      var sortedStockData = stockData.sort(function(x,y) {
        return d3.time.format("%Y-%m-%d").parse(x.Date).getTime() - d3.time.format("%Y-%m-%d").parse(y.Date).getTime();
      });

      var model = new CandleModel({
        symbol: symbol,
        startDate: startDate,
        endDate: endDate,
        stockData: stockData
      });

      candleCollection.create(model);
      var candleChart = new CandleChart({ model: model });

    }).fail(function (jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
      console.log('Request failed: ' + err);
    });
  };

  function min(a, b){ return a < b ? a : b; }
  function max(a, b){ return a > b ? a : b; }

  function getDate(d) {
      return new Date(d.Date);
  }
});
